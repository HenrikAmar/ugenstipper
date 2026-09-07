-- ---------- MINILIGA: slet automatisk når sidste medlem forlader ----------
-- Kør i Supabase -> SQL Editor -> New query -> Run.
--
-- Før denne rettelse blev en miniliga aldrig slettet, selv om alle
-- medlemmer forlod den igen - den blev bare stående "tom" og talte forkert
-- med i admin-statistikken (fx "2 mini-ligaer, gns. 2 medlemmer").
-- Nu slettes selve miniligaen automatisk, når det sidste medlem forlader.

create or replace function public.leave_miniliga()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_league_id uuid;
begin
  select league_id into v_league_id from public.mini_league_members where user_id = v_user;

  delete from public.mini_league_members where user_id = v_user;

  -- Var det sidste medlem, dør miniligaen med.
  if v_league_id is not null
     and not exists (select 1 from public.mini_league_members where league_id = v_league_id) then
    delete from public.mini_leagues where id = v_league_id;
  end if;
end;
$$;

grant execute on function public.leave_miniliga() to authenticated;

-- Oprydning: fjerner de miniligaer der allerede er blevet tomme tidligere
-- (inden denne rettelse fandtes), så statistikken er korrekt med det samme.
delete from public.mini_leagues
where id not in (select distinct league_id from public.mini_league_members);
