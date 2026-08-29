-- ---------- BESØGSSTATISTIK ----------
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Gemmer ét "besøg" pr. side-visning fra browseren, så admin kan se hvor
-- mange der bruger sitet - se src/components/VisitLogger.tsx og
-- src/app/api/log-visit. Vi gemmer bevidst intet i browseren (ingen cookie,
-- intet localStorage-id) - kun et rent tælle-tal af sidevisninger, så vi
-- undgår at skulle bede om samtykke efter cookie-/ePrivacy-reglerne.

create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null,
  user_id uuid references auth.users (id) on delete set null
);

create index if not exists page_visits_created_at_idx on public.page_visits (created_at);

alter table public.page_visits enable row level security;

-- Kun admin kan se besøgsstatistikken - almindelige brugere skal ikke kunne læse den.
create policy "Kun admin kan se besøgsstatistik"
  on public.page_visits for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Grundlæggende tabel-adgang (adskilt fra RLS-reglen ovenfor, som styrer
-- HVILKE rækker man må se) - uden disse GRANT-linjer fejler forespørgsler
-- med "permission denied for table ...", uanset om nøglen er korrekt.
-- Kun service_role (admin-klienten i log-visit-routen) må INDSÆTTE besøg -
-- almindelige brugere/anon kan ikke skrive direkte til tabellen, så den
-- ikke kan manipuleres udefra.
grant usage on schema public to service_role;
grant select, insert on public.page_visits to service_role;
grant select on public.page_visits to authenticated;
