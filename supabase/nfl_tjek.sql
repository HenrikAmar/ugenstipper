-- ============================================================
-- TJEK: er hele NFL-opsætningen på plads i databasen?
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Den ÆNDRER ingenting - den kigger kun efter og rapporterer.
--
-- Alle linjer skal vise "OK". Står der "MANGLER" ud for en linje, fortæller
-- kolonnen "kør denne fil", hvad du skal køre for at rette det.
-- Filerne er sikre at køre igen, også selvom de allerede er kørt.
-- ============================================================

select * from (

-- ---------- 1) supabase/nfl.sql ----------
select 1 as nr, 'sport-kolonne på runder' as tjek,
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'rounds' and column_name = 'sport'
  ) then 'OK' else 'MANGLER' end as status,
  'nfl.sql' as koer_denne_fil

union all
select 2, 'sport-kolonne på miniligaer',
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mini_leagues' and column_name = 'sport'
  ) then 'OK' else 'MANGLER' end, 'nfl.sql'

union all
select 3, 'én indeværende runde pr. sport',
  case when exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'one_current_round_per_sport'
  ) then 'OK' else 'MANGLER' end, 'nfl.sql'

union all
select 4, 'rundenumre unikke pr. sport',
  case when exists (
    select 1 from pg_constraint where conname = 'rounds_season_kind_number_sport_key'
  ) then 'OK' else 'MANGLER' end, 'nfl.sql'

union all
select 5, 'miniliga-navne unikke pr. sport',
  case when exists (
    select 1 from pg_constraint where conname = 'mini_leagues_name_sport_key'
  ) then 'OK' else 'MANGLER' end, 'nfl.sql'

union all
select 6, 'opret miniliga kender sport',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'create_miniliga' and p.pronargs = 3
  ) then 'OK' else 'MANGLER' end, 'nfl.sql'

union all
select 7, 'deltag i miniliga kender sport',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'join_miniliga' and p.pronargs = 3
  ) then 'OK' else 'MANGLER' end, 'nfl.sql'

-- ---------- 2) supabase/nfl_tilmelding.sql ----------
union all
select 8, 'tabel til tilmeldinger findes',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'sport_participants'
  ) then 'OK' else 'MANGLER' end, 'nfl_tilmelding.sql'

-- ---------- 3) supabase/nfl_nejtak.sql ----------
union all
select 9, 'man kan sige "nej tak" (status-kolonne)',
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sport_participants'
      and column_name = 'status'
  ) then 'OK' else 'MANGLER' end, 'nfl_nejtak.sql'

union all
select 10, 'man kan skifte mening (update-adgang)',
  case when exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sport_participants' and cmd = 'UPDATE'
  ) then 'OK' else 'MANGLER' end, 'nfl_nejtak.sql'

-- ---------- 4) supabase/vaelg_konkurrencer.sql ----------
union all
select 11, 'alle nuværende brugere er med i Superliga',
  case
    when not exists (select 1 from public.profiles) then 'OK'
    when not exists (
      select 1 from public.profiles pr
      where not exists (
        select 1 from public.sport_participants sp
        where sp.user_id = pr.id and sp.sport = 'superliga'
      )
    ) then 'OK' else 'MANGLER' end, 'vaelg_konkurrencer.sql'

union all
select 12, 'nye brugere får Superliga automatisk',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
      and pg_get_functiondef(p.oid) like '%sport_participants%'
  ) then 'OK' else 'MANGLER' end, 'vaelg_konkurrencer.sql'

-- ---------- 5) supabase/nfl_uge2.sql (kampene - kør efter push) ----------
union all
select 13, 'NFL-runde med kampe er oprettet',
  case when exists (
    select 1 from public.rounds r
    join public.matches m on m.round_id = r.id
    where r.sport = 'nfl'
  ) then 'OK' else 'MANGLER' end, 'nfl_uge2.sql (kør FØRST efter push)'

) as tjek_resultat
order by nr;
