-- ============================================================
-- Aktiv tilmelding til NFL-konkurrencen.
--
-- Problemet: alle brugere stod automatisk på BÅDE Superliga- og
-- NFL-stillingen. Det gav en NFL-stilling fuld af folk med 0 point, som
-- aldrig har haft tænkt sig at spille med - ren støj for dem, der rent
-- faktisk følger NFL.
--
-- Løsningen: Superliga er hovedkonkurrencen og fortsætter præcis som før
-- (alle er med fra de opretter sig). NFL kræver, at man aktivt trykker
-- "Vær med" - og man kan forlade igen.
--
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

create table if not exists public.sport_participants (
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Tabellen er bevidst lavet generel (med en sport-kolonne) i stedet for
  -- kun at handle om NFL, så en fremtidig sport - eller et krav om
  -- tilmelding til Superliga - ikke kræver en ny tabel.
  sport text not null check (sport in ('superliga', 'nfl')),
  joined_at timestamptz not null default now(),
  primary key (user_id, sport)
);

alter table public.sport_participants enable row level security;

-- Alle logget ind skal kunne SE hele listen: stillingen bygges i browseren
-- ud fra "hvem er tilmeldt", så uden læseadgang ville stillingen se tom ud.
drop policy if exists "sport_participants select alle" on public.sport_participants;
create policy "sport_participants select alle" on public.sport_participants
  for select to authenticated
  using (true);

-- Men man må kun melde SIG SELV til og fra - ikke andre.
drop policy if exists "sport_participants tilmeld sig selv" on public.sport_participants;
create policy "sport_participants tilmeld sig selv" on public.sport_participants
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "sport_participants frameld sig selv" on public.sport_participants;
create policy "sport_participants frameld sig selv" on public.sport_participants
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------- Efterfyld ----------
-- Har nogen allerede tippet en NFL-kamp (fx under test, før tilmelding
-- fandtes), regnes de naturligvis som tilmeldte - ellers ville de pludselig
-- forsvinde fra stillingen og miste deres point.
insert into public.sport_participants (user_id, sport)
select distinct t.user_id, 'nfl'
from public.tips t
join public.matches m on m.id = t.match_id
join public.rounds r on r.id = m.round_id
where r.sport = 'nfl'
on conflict (user_id, sport) do nothing;

grant select, insert, delete on public.sport_participants to authenticated;
grant select, insert, update, delete on public.sport_participants to service_role;
