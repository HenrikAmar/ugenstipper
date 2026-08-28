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
  -- "liga" = almindelig Superliga-runde. "bonus" = ekstra bonusrunde (fx
  -- danske hold i Europa) - tæller ikke med i den rigtige stilling, og
  -- nummereres for sig selv (se supabase/bonusrunder.sql).
  kind text not null default 'liga' check (kind in ('liga', 'bonus')),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  reminder_sent_at timestamptz,
  unique (season, kind, number)
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
