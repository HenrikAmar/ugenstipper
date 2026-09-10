-- ---------- Ret ALLE manglende adgangsrettigheder på én gang ----------
-- Kør i Supabase -> SQL Editor -> New query -> Run.
--
-- BAGGRUND (svar på "er Supabase overhovedet de rigtige til dette"):
-- Med kun 17 brugere er det stort set udelukket at det er Supabase's servere
-- der er for svage eller upålidelige - det er en forsvindende lille
-- belastning for enhver database. De gentagne "prøv igen senere"-fejl vi har
-- jagtet i dag (nyheder, mini-ligaer, invitationer, /tip) har ALLE haft
-- nøjagtig samme årsag: en tabel eller et view manglede en grundlæggende
-- Postgres-rettighed (GRANT) for den bruger-rolle, koden kører som - selvom
-- de rigtige adgangsregler (Row Level Security) var sat korrekt op.
--
-- Vi har rettet dem én for én, efterhånden som de er dukket op - denne fil
-- retter dem i stedet ALLE PÅ ÉN GANG, for alle nuværende tabeller/views, OG
-- sørger for at alle FREMTIDIGE tabeller/views automatisk får de samme
-- rettigheder fra fødslen. Det ændrer intet ved hvem der må se hvilke
-- rækker (det styres stadig 100% af Row Level Security-reglerne) - det
-- fjerner kun den underliggende, usynlige spærring der har vist sig igen og
-- igen i dag.
--
-- Sikkert at køre flere gange.

grant usage on schema public to authenticated, service_role;

-- Alle eksisterende tabeller og views i "public"-skemaet.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

-- Alle eksisterende sekvenser (bruges til auto-genererede id'er).
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Alle eksisterende funktioner (fx create_miniliga, leave_miniliga osv.).
grant execute on all functions in schema public to authenticated;
grant execute on all functions in schema public to service_role;

-- Samme rettigheder, men for alle NYE tabeller/views/funktioner der
-- oprettes herefter - så vi ikke skal huske at gøre dette igen næste gang
-- der laves en ny feature.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to authenticated;
alter default privileges in schema public
  grant execute on functions to service_role;
