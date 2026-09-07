-- Retter "permission denied" / tomme fejl på admin/statistik-siden.
--
-- Baggrund: admin/statistik bruger service role-nøglen (som ignorerer RLS
-- helt), men Postgres kræver stadig at rollen har almindelige GRANT-
-- rettigheder på selve tabellen/viewet, uanset RLS. mini_leagues,
-- mini_league_members og invite_leaderboard blev tilsyneladende oprettet
-- uden disse rettigheder til service_role (samme type fejl vi tidligere
-- rettede for "announcements" og "profiles").
--
-- Sikkert at køre flere gange.

grant select, insert, update, delete on public.mini_leagues to authenticated;
grant select, insert, update, delete on public.mini_league_members to authenticated;
grant select, insert, update, delete on public.mini_leagues to service_role;
grant select, insert, update, delete on public.mini_league_members to service_role;

grant select on public.invite_leaderboard to authenticated;
grant select on public.invite_leaderboard to service_role;

-- invite_leaderboard er bygget oven på dette view, som har samme problem.
grant select on public.user_completed_rounds to authenticated;
grant select on public.user_completed_rounds to service_role;
