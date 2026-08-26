-- ============================================================
-- Ugenstipper - databaseskema til Supabase (Postgres)
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- ---------- PROFILER ----------
-- En profil-række pr. bruger. Oprettes automatisk ved signup (se trigger nedenfor).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Ny bruger',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Alle logget ind kan se profiler"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Man kan opdatere sin egen profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Opret automatisk en profil, når en bruger opretter sig (email/adgangskode eller Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- RUNDER ----------
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  number integer not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (season, number)
);

-- Kun én runde kan være "indeværende" ad gangen
create unique index if not exists one_current_round
  on public.rounds (is_current)
  where (is_current);

alter table public.rounds enable row level security;

create policy "Alle logget ind kan se runder"
  on public.rounds for select
  to authenticated
  using (true);

create policy "Kun admin kan oprette/redigere/slette runder"
  on public.rounds for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---------- KAMPE ----------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  result_home integer,
  result_away integer,
  created_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "Alle logget ind kan se kampe"
  on public.matches for select
  to authenticated
  using (true);

create policy "Kun admin kan oprette/redigere/slette kampe"
  on public.matches for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---------- TIPS ----------
create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  tip_home integer not null check (tip_home >= 0),
  tip_away integer not null check (tip_away >= 0),
  points integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.tips enable row level security;

-- Alle kan se alle tips (bruges til stilling og statistik)
create policy "Alle logget ind kan se alle tips"
  on public.tips for select
  to authenticated
  using (true);

-- Et tip må kun oprettes til sig selv, på en kamp i det tilladte rundevindue,
-- og kun før kampstart. Dette håndhæves i databasen, ikke kun i UI'et.
create policy "Man kan kun oprette egne tips inden for vindue og før kampstart"
  on public.tips for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      join public.rounds r on r.id = m.round_id
      where m.id = match_id
        and m.kickoff_at > now()
        and r.number between
          (select number from public.rounds where is_current limit 1)
          and (select number from public.rounds where is_current limit 1) + 2
    )
  );

create policy "Man kan kun redigere egne tips inden for vindue og før kampstart"
  on public.tips for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      join public.rounds r on r.id = m.round_id
      where m.id = match_id
        and m.kickoff_at > now()
        and r.number between
          (select number from public.rounds where is_current limit 1)
          and (select number from public.rounds where is_current limit 1) + 2
    )
  );

-- ---------- GRUNDLÆGGENDE TABEL-ADGANG ----------
-- RLS-reglerne ovenfor styrer HVILKE rækker en bruger må se/ændre, men
-- Postgres kræver derudover en grundlæggende tilladelse til overhovedet at
-- forsøge at læse/skrive i tabellen. Uden disse GRANT-linjer fejler alle
-- forespørgsler fra appen med "permission denied for table ...", selvom
-- RLS-reglerne er sat helt korrekt op.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.rounds to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.tips to authenticated;

-- ============================================================
-- Point beregnes af applikationskoden, når admin indtaster det
-- officielle resultat (se src/app/admin/kampe/actions.ts).
-- Reglerne er: 3 point for eksakt resultat, 1 point for korrekt
-- udfald (hjemme/uafgjort/ude), 0 point ellers.
-- ============================================================

-- ============================================================
-- Sådan gør du dig selv til admin (kør efter du har oprettet en bruger):
--
--   update public.profiles set role = 'admin' where id =
--     (select id from auth.users where email = 'din@email.dk');
-- ============================================================
