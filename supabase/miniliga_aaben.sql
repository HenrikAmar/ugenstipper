-- ---------- MINILIGA: valgfri kode (åben miniliga) ----------
-- Kør i Supabase -> SQL Editor -> New query -> Run.
-- Gør det muligt at oprette en miniliga UDEN kode (fx en fast, åben "alle mod adminerne"-liga).

alter table public.mini_leagues alter column password_hash drop not null;

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

  if exists (select 1 from public.mini_league_members where user_id = v_user) then
    raise exception 'Du er allerede med i en miniliga. Forlad den først.';
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

  if exists (select 1 from public.mini_league_members where user_id = v_user) then
    raise exception 'Du er allerede med i en miniliga. Forlad den først.';
  end if;

  select * into v_league
  from public.mini_leagues
  where lower(name) = lower(trim(p_name));

  if v_league is null then
    raise exception 'Der findes ingen miniliga med det navn.';
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

create or replace function public.check_miniliga_password(p_league_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash from public.mini_leagues where id = p_league_id;
  if v_hash is null then
    return;
  end if;
  if p_password is null or v_hash <> crypt(p_password, v_hash) then
    raise exception 'Forkert kode.';
  end if;
end;
$$;
