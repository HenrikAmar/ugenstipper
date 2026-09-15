-- ============================================================
-- NFL - vores RUNDE 1 (kampene fra NFL's uge 2, 2026).
-- Opretter runden og alle 16 kampe på én gang.
--
-- Konkurrencen starter midt i NFL-sæsonen, så vores runder tæller fra 1,
-- uanset hvor langt NFL selv er nået. Vores runde 1 = NFL's uge 2.
--
-- VIGTIGT: kør denne fil FØRST når NFL-koden er pushet og Vercel siger
-- "Ready". Filen gør til sidst runden til den indeværende, og den gamle
-- kode på ugenstipper.dk kan ikke håndtere to indeværende runder (én i
-- hver sport) - det ville give "Kunne ikke hente kampene" for alle.
--
-- Kampprogram krydstjekket mod NFL.com og Eurosport.dk. Tidspunkter er
-- skrevet i DANSK tid (+02 = sommertid), så de kan læses direkte igennem:
--   Thursday Night Football natten til fredag d. 18. kl. 02.15
--   Søndagskampene d. 20. kl. 19.00, 22.05 og 22.25
--   Sunday Night Football natten til mandag d. 21. kl. 02.20
--   Monday Night Football natten til tirsdag d. 22. kl. 02.15
--
-- Kør filen i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange: den opretter hverken runden eller kampene
-- to gange, og den rører ikke eksisterende tips.
-- ============================================================

do $$
declare
  -- ---------- ÆNDR HER, hvis I vil noget andet ----------
  -- Konkurrencen starter midt i NFL-sæsonen, så VORES runder tæller fra 1 -
  -- uafhængigt af, hvilken uge NFL selv er nået til. Denne runde indeholder
  -- altså kampene fra NFL's uge 2, men hedder "NFL Runde 1" hos os.
  --
  -- HUSK FREMOVER: næste runde bliver vores runde 2 (= NFL's uge 3), så
  -- vores nummer er hele denne sæson ét lavere end NFL's ugenummer.
  v_saeson text := '2026';
  v_nummer integer := 1;

  -- Skal runden sættes som den indeværende med det samme?
  -- Sæt til false, hvis koden IKKE er pushet endnu - så oprettes alt bare
  -- stille og roligt, uden at nogen kan se det.
  v_saet_aktuel boolean := true;
  -- ------------------------------------------------------

  v_round uuid;
begin
  -- ---------- Runden ----------
  select id into v_round
  from public.rounds
  where sport = 'nfl' and season = v_saeson and kind = 'liga' and number = v_nummer;

  if v_round is null then
    insert into public.rounds (season, number, kind, sport, is_current)
    values (v_saeson, v_nummer, 'liga', 'nfl', false)
    returning id into v_round;

    raise notice 'Oprettede NFL-runde % (sæson %).', v_nummer, v_saeson;
  else
    raise notice 'NFL-runde % (sæson %) fandtes allerede.', v_nummer, v_saeson;
  end if;

  -- ---------- Kampene ----------
  -- Kun hvis runden er tom. Sådan kan filen køres igen uden at lave
  -- dubletter - og uden at slette kampe, som folk allerede har tippet på.
  if exists (select 1 from public.matches where round_id = v_round) then
    raise notice 'Runden har allerede kampe - springer over.';
  else
    insert into public.matches (round_id, home_team, away_team, kickoff_at) values
      -- Thursday Night Football (natten til fredag d. 18.)
      (v_round, 'Buffalo Bills',        'Detroit Lions',         '2026-09-18 02:15:00+02'),

      -- Søndag d. 20. kl. 19.00
      (v_round, 'Atlanta Falcons',      'Carolina Panthers',     '2026-09-20 19:00:00+02'),
      (v_round, 'Baltimore Ravens',     'New Orleans Saints',    '2026-09-20 19:00:00+02'),
      (v_round, 'Chicago Bears',        'Minnesota Vikings',     '2026-09-20 19:00:00+02'),
      (v_round, 'Houston Texans',       'Cincinnati Bengals',    '2026-09-20 19:00:00+02'),
      (v_round, 'New England Patriots', 'Pittsburgh Steelers',   '2026-09-20 19:00:00+02'),
      (v_round, 'New York Jets',        'Green Bay Packers',     '2026-09-20 19:00:00+02'),
      (v_round, 'Tampa Bay Buccaneers', 'Cleveland Browns',      '2026-09-20 19:00:00+02'),
      (v_round, 'Tennessee Titans',     'Philadelphia Eagles',   '2026-09-20 19:00:00+02'),

      -- Søndag d. 20. kl. 22.05
      (v_round, 'Denver Broncos',       'Jacksonville Jaguars',  '2026-09-20 22:05:00+02'),
      (v_round, 'Los Angeles Chargers', 'Las Vegas Raiders',     '2026-09-20 22:05:00+02'),

      -- Søndag d. 20. kl. 22.25
      (v_round, 'Arizona Cardinals',    'Seattle Seahawks',      '2026-09-20 22:25:00+02'),
      (v_round, 'Dallas Cowboys',       'Washington Commanders', '2026-09-20 22:25:00+02'),
      (v_round, 'San Francisco 49ers',  'Miami Dolphins',        '2026-09-20 22:25:00+02'),

      -- Sunday Night Football (natten til mandag d. 21.)
      (v_round, 'Kansas City Chiefs',   'Indianapolis Colts',    '2026-09-21 02:20:00+02'),

      -- Monday Night Football (natten til tirsdag d. 22.)
      (v_round, 'Los Angeles Rams',     'New York Giants',       '2026-09-22 02:15:00+02');

    raise notice 'Oprettede 16 kampe.';
  end if;

  -- ---------- Gør runden aktuel ----------
  if v_saet_aktuel then
    -- Kun én indeværende runde PR. SPORT (se supabase/nfl.sql), så evt.
    -- tidligere NFL-runde skal slukkes først. Superliga-runden røres ikke.
    update public.rounds set is_current = false
     where sport = 'nfl' and id <> v_round;

    update public.rounds set is_current = true where id = v_round;

    raise notice 'NFL-runde % er nu den indeværende.', v_nummer;
  end if;
end $$;

-- ---------- Tjek ----------
-- Vises som resultat nedenfor, så du kan se at alt sidder, som det skal.
select
  r.number as runde,
  r.season as saeson,
  r.is_current as er_aktuel,
  count(m.id) as antal_kampe,
  min(m.kickoff_at at time zone 'Europe/Copenhagen') as foerste_kamp_dansk_tid,
  max(m.kickoff_at at time zone 'Europe/Copenhagen') as sidste_kamp_dansk_tid
from public.rounds r
left join public.matches m on m.round_id = r.id
where r.sport = 'nfl'
group by r.id, r.number, r.season, r.is_current
order by r.number;
