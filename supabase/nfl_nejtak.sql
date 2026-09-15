-- ============================================================
-- "Nej tak" til NFL - så invitationen forsvinder.
--
-- Før kunne man kun sige JA til NFL. Sagde man ingenting, blev
-- invitationen ved med at stå der, hver gang man åbnede NFL-fanen. Nu kan
-- man aktivt sige nej tak, og så forsvinder boksen. Til- og framelding
-- flyttes samtidig til profilsiden, så man altid kan skifte mening ét fast
-- sted.
--
-- Teknikken: samme tabel som før, men rækken husker nu OM man sagde ja
-- eller nej - i stedet for at "ingen række" skulle betyde begge dele.
--   ingen række  = er aldrig blevet spurgt  -> vis invitationen
--   'joined'     = er med                   -> vis stilling og tippefelter
--   'declined'   = har sagt nej tak         -> vis ingenting, spørg ikke igen
--
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Kræver at supabase/nfl_tilmelding.sql er kørt først.
-- Sikkert at køre flere gange.
-- ============================================================

alter table public.sport_participants
  add column if not exists status text not null default 'joined'
  check (status in ('joined', 'declined'));

-- Alle rækker, der fandtes før denne ændring, er oprettet ved at nogen
-- trykkede "Vær med" - de er altså tilmeldte, og default'en ovenfor giver
-- dem helt korrekt 'joined'. Ingen efterfyldning nødvendig.

-- Man skal kunne skifte mening (ja -> nej -> ja igen), så en bruger skal nu
-- også kunne OPDATERE sin egen række - før kunne man kun oprette og slette.
drop policy if exists "sport_participants opdater sig selv" on public.sport_participants;
create policy "sport_participants opdater sig selv" on public.sport_participants
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.sport_participants to authenticated;
grant select, insert, update, delete on public.sport_participants to service_role;
