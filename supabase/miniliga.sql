-- ---------- MINILIGA ----------
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create table if not exists public.mini_leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  password_hash text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.mini_league_members (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  league_id uuid not null references public.mini_leagues (id) on delete cascade,
  joined_at timestamptz not null default now()
);

alter table public.mini_leagues enable row level security;
alter table public.mini_league_members enable row level security;

-- Finder (sikkert) hvilken miniliga den nuværende bruger selv er med i, hvis nogen.
-- security definer, så den kan slå det op uden at gå i selvreferende RLS-løkke.
create or replace function public.my_miniliga_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select league_id from public.mini_league_members where user_id = auth.uid();
$$;

grant execute on function public.my_miniliga_id() to authenticated;

-- En bruger kan kun se sin egen miniligas navn/oplysninger - ikke andres.
create policy "mini_leagues select own" on public.mini_leagues
  for select to authenticated
  using (id = public.my_miniliga_id());

-- En bruger kan kun se medlemslisten for sin egen miniliga (bruges til stillingen).
create policy "mini_league_members select own league" on public.mini_league_members
  for select to authenticated
  using (league_id = public.my_miniliga_id());

-- Opret en ny miniliga (bliver selv automatisk medlem). Fejler hvis man allerede er med i en.
create or replace function public.create_miniliga(p_name text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
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

  if p_password is null or length(p_password) < 4 then
    raise exception 'Password skal være mindst 4 tegn.';
  end if;

  insert into public.mini_leagues (name, password_hash, created_by)
  values (trim(p_name), crypt(p_password, gen_salt('bf')), v_user)
  returning id into v_id;

  insert into public.mini_league_members (user_id, league_id)
  values (v_user, v_id);

  return v_id;
end;
$$;

grant execute on function public.create_miniliga(text, text) to authenticated;

-- Deltag i en eksisterende miniliga via navn + password.
create or replace function public.join_miniliga(p_name text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public
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

  if v_league.password_hash <> crypt(p_password, v_league.password_hash) then
    raise exception 'Forkert password.';
  end if;

  insert into public.mini_league_members (user_id, league_id)
  values (v_user, v_league.id);

  return v_league.id;
end;
$$;

grant execute on function public.join_miniliga(text, text) to authenticated;

-- Forlad sin nuværende miniliga.
create or replace function public.leave_miniliga()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.mini_league_members where user_id = auth.uid();
end;
$$;

grant execute on function public.leave_miniliga() to authenticated;

-- Bekræfter at et password er korrekt for en given miniliga (bruges når man sender en invitation,
-- så vi kan sende det rigtige password videre i invitations-mailen).
create or replace function public.check_miniliga_password(p_league_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash from public.mini_leagues where id = p_league_id;
  if v_hash is null or v_hash <> crypt(p_password, v_hash) then
    raise exception 'Forkert password.';
  end if;
end;
$$;

grant execute on function public.check_miniliga_password(uuid, text) to authenticated;
