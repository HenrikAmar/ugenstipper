-- ============================================================
-- Nyheder til forsiden ("Nyt fra Ugenstipper") - så admin kan
-- skrive nyheder (og evt. lægge et billede på, fx en trøje som
-- præmie) fra admin-panelet i stedet for at skulle ændre i koden.
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  -- Offentlig URL til et billede i "announcement-images"-bøtten nedenfor.
  -- Tomt/NULL hvis nyheden ikke har noget billede.
  image_url text,
  created_at timestamptz not null default now()
);

-- Lille billedetekst der vises under billedet (fx "Den flotte trøje, som er
-- denne rundes præmie"). Tilføjet efter tabellen oprindeligt blev lavet -
-- "if not exists" så det er sikkert at køre igen, selvom kolonnen allerede
-- findes.
alter table public.announcements add column if not exists image_caption text;

-- Selve lov til at læse/skrive i tabellen. RLS-policyerne herunder
-- bestemmer så PRÆCIS hvilke rækker man konkret må se/ændre - uden denne
-- linje bliver alting nægtet med "permission denied", uanset policyerne.
grant select, insert, update, delete on public.announcements to authenticated;

alter table public.announcements enable row level security;

-- "drop ... if exists" før hver policy, så filen altid kan køres igen uden
-- fejl (fx "already exists"), som ellers stopper hele køret undervejs.
drop policy if exists "Alle logget ind kan se nyheder" on public.announcements;
create policy "Alle logget ind kan se nyheder"
  on public.announcements for select
  to authenticated
  using (true);

drop policy if exists "Kun admin kan oprette/redigere/slette nyheder" on public.announcements;
create policy "Kun admin kan oprette/redigere/slette nyheder"
  on public.announcements for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---------- BILLEDER (Storage) ----------
-- Egen "bøtte" til nyhedsbilleder - offentligt læsbar (så billederne kan
-- vises på forsiden), men kun admin må lægge nye op eller slette.
insert into storage.buckets (id, name, public)
values ('announcement-images', 'announcement-images', true)
on conflict (id) do nothing;

drop policy if exists "Alle kan se nyhedsbilleder" on storage.objects;
create policy "Alle kan se nyhedsbilleder"
  on storage.objects for select
  using (bucket_id = 'announcement-images');

drop policy if exists "Kun admin kan uploade nyhedsbilleder" on storage.objects;
create policy "Kun admin kan uploade nyhedsbilleder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'announcement-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Kun admin kan slette nyhedsbilleder" on storage.objects;
create policy "Kun admin kan slette nyhedsbilleder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'announcement-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
