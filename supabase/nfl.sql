-- ============================================================
-- NFL som ny "sport" ved siden af Superliga - samme app, samme login,
-- adskilte runder/kampe/miniligaer pr. sport (valgt via faneblade).
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

-- ---------- RUNDER: tilføj sport ----------
alter table public.rounds
  add column if not exists sport text not null default 'superliga'
  check (sport in ('superliga', 'nfl'));

-- "Kun én runde ad gangen kan være indeværende" var globalt på tværs af
-- ALLE runder - skal nu være pr. sport (én indeværende Superliga-runde OG
-- én indeværende NFL-runde samtidig, uden at de kolliderer).
drop index if exists public.one_current_round;

create unique index if not exists one_current_round_per_sport
  on public.rounds (sport)
  where (is_current);

-- Rundenummerering ("runde 5") var unik pr. sæson+type - skal nu også
-- være unik pr. sport, så Superliga-runde 5 og NFL-runde 5 ikke kolliderer.
-- Postgres kan ikke "add constraint if not exists", så vi fjerner både den
-- gamle OG den nye (hvis filen allerede har været kørt) før vi opretter -
-- ellers ville en gentagen kørsel fejle med "already exists".
alter table public.rounds drop constraint if exists rounds_season_kind_number_key;
alter table public.rounds drop constraint if exists rounds_season_kind_number_sport_key;
alter table public.rounds
  add constraint rounds_season_kind_number_sport_key unique (season, kind, number, sport);

-- ---------- MINILIGAER: tilføj sport ----------
alter table public.mini_leagues
  add column if not exists sport text not null default 'superliga'
  check (sport in ('superliga', 'nfl'));

-- Navne på miniligaer var globalt unikke - skal nu kun være unikke inden
-- for samme sport (så "Familien" godt kan findes både som en Superliga-
-- og en NFL-miniliga, adskilt fra hinanden). Samme "drop før add"-trick som
-- ovenfor, så filen kan køres igen uden at fejle.
alter table public.mini_leagues drop constraint if exists mini_leagues_name_key;
alter table public.mini_leagues drop constraint if exists mini_leagues_name_sport_key;
alter table public.mini_leagues
  add constraint mini_leagues_name_sport_key unique (name, sport);

-- ---------- Opret miniliga (nu med sport) ----------
drop function if exists public.create_miniliga(text, text);

create or replace function public.create_miniliga(p_name text, p_password text, p_sport text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_hash text;
begin
  if v_user is null then
    raise exception 'Du skal være logget ind.';
  end if;

  if p_sport not in ('superliga', 'nfl') then
    raise exception 'Ugyldig sport.';
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Navnet skal være mindst 2 tegn.';
  end if;

  if p_password is not null and length(trim(p_password)) > 0 then
    if length(p_password) < 4 then
      raise exception 'Koden skal være mindst 4 tegn (eller lad feltet stå tomt for en åben miniliga).';
    end if;
    v_hash := crypt(p_password, gen_salt('bf'));
  else
    v_hash := null;
  end if;

  insert into public.mini_leagues (name, password_hash, created_by, sport)
  values (trim(p_name), v_hash, v_user, p_sport)
  returning id into v_id;

  insert into public.mini_league_members (user_id, league_id)
  values (v_user, v_id);

  return v_id;
end;
$$;

grant execute on function public.create_miniliga(text, text, text) to authenticated;

-- ---------- Deltag i miniliga (nu med sport) ----------
drop function if exists public.join_miniliga(text, text);

create or replace function public.join_miniliga(p_name text, p_password text, p_sport text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_league record;
begin
  if v_user is null then
    raise exception 'Du skal være logget ind.';
  end if;

  if p_sport not in ('superliga', 'nfl') then
    raise exception 'Ugyldig sport.';
  end if;

  select * into v_league
  from public.mini_leagues
  where lower(name) = lower(trim(p_name)) and sport = p_sport;

  if v_league is null then
    raise exception 'Der findes ingen miniliga med det navn.';
  end if;

  if exists (
    select 1 from public.mini_league_members
    where user_id = v_user and league_id = v_league.id
  ) then
    raise exception 'Du er allerede med i den miniliga.';
  end if;

  if v_league.password_hash is not null then
    if p_password is null or v_league.password_hash <> crypt(p_password, v_league.password_hash) then
      raise exception 'Forkert kode.';
    end if;
  end if;

  insert into public.mini_league_members (user_id, league_id)
  values (v_user, v_league.id);

  return v_league.id;
end;
$$;

grant execute on function public.join_miniliga(text, text, text) to authenticated;

-- Retter sig selv, hvis de allerede findes fra "alle_rettigheder.sql" -
-- skrevet ind eksplicit her også, så denne fil er selvstændig.
grant select, insert, update, delete on public.rounds to authenticated, service_role;
grant select, insert, update, delete on public.mini_leagues to authenticated, service_role;
