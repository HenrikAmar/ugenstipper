-- ============================================================
-- Miniligaer: tillad flere ad gangen (fx én med familien, én med
-- kollegaerne) - i stedet for kun én ad gangen som før.
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

-- "Kun én ad gangen" var hårdkodet ved at user_id var selve primærnøglen på
-- mini_league_members (kan pr. definition kun stå i tabellen én gang).
-- Ombygges til en sammensat nøgle (user_id + league_id), så en bruger kan
-- have en række pr. miniliga i stedet for højst én række i alt.
alter table public.mini_league_members drop constraint if exists mini_league_members_pkey;
alter table public.mini_league_members add primary key (user_id, league_id);

-- ---------- Adgangsregler (RLS) ----------
-- my_miniliga_id() returnerede ét enkelt league_id - kan ikke bruges
-- længere, nu en bruger kan være med i flere. Erstattet af en udgave der
-- returnerer ALLE de miniligaer, brugeren er med i. Stadig security
-- definer, så den kan slå det op uden selvrefererende RLS-løkke (se
-- oprindelig kommentar i supabase/miniliga.sql).
create or replace function public.my_miniliga_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select league_id from public.mini_league_members where user_id = auth.uid();
$$;

grant execute on function public.my_miniliga_ids() to authenticated;

drop policy if exists "mini_leagues select own" on public.mini_leagues;
create policy "mini_leagues select own" on public.mini_leagues
  for select to authenticated
  using (id in (select public.my_miniliga_ids()));

drop policy if exists "mini_league_members select own league" on public.mini_league_members;
create policy "mini_league_members select own league" on public.mini_league_members
  for select to authenticated
  using (league_id in (select public.my_miniliga_ids()));

-- Den gamle enkelt-liga-udgave er ikke brugt af nogen policies længere -
-- ryddet op, så den ikke ved en fejl bliver kaldt et sted, den ikke burde.
drop function if exists public.my_miniliga_id();

-- ---------- Opret ----------
-- Samme som før, blot uden spærren "du er allerede med i en miniliga".
create or replace function public.create_miniliga(p_name text, p_password text)
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

  insert into public.mini_leagues (name, password_hash, created_by)
  values (trim(p_name), v_hash, v_user)
  returning id into v_id;

  insert into public.mini_league_members (user_id, league_id)
  values (v_user, v_id);

  return v_id;
end;
$$;

grant execute on function public.create_miniliga(text, text) to authenticated;

-- ---------- Deltag ----------
-- Samme som før, blot uden spærren "du er allerede med i en miniliga" -
-- erstattet af et tjek for om man allerede er med i PRÆCIS den miniliga
-- (så man ikke kan blive meldt ind i den samme to gange).
create or replace function public.join_miniliga(p_name text, p_password text)
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

  select * into v_league
  from public.mini_leagues
  where lower(name) = lower(trim(p_name));

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

grant execute on function public.join_miniliga(text, text) to authenticated;

-- ---------- Forlad ----------
-- Tager nu imod HVILKEN miniliga man vil forlade, i stedet for at antage
-- der kun er én at forlade. Dør stadig automatisk, hvis sidste medlem
-- forlader (se supabase/miniliga_slet_tom.sql).
drop function if exists public.leave_miniliga();

create or replace function public.leave_miniliga(p_league_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  delete from public.mini_league_members
  where user_id = v_user and league_id = p_league_id;

  if not exists (select 1 from public.mini_league_members where league_id = p_league_id) then
    delete from public.mini_leagues where id = p_league_id;
  end if;
end;
$$;

grant execute on function public.leave_miniliga(uuid) to authenticated;

-- Retter sig selv, hvis de allerede findes fra "alle_rettigheder.sql" -
-- skrevet ind eksplicit her også, så denne fil er selvstændig.
grant select, insert, update, delete on public.mini_leagues to authenticated, service_role;
grant select, insert, update, delete on public.mini_league_members to authenticated, service_role;
