-- ---------- FJERN VISITOR_ID (GDPR/ePrivacy) ----------
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Du har allerede kørt page_visits.sql tidligere, så tabellen har en
-- visitor_id-kolonne (et anonymt id gemt i besøgendes browser). Vi dropper
-- den nu, så vi ikke gemmer noget persistent i browseren og dermed undgår
-- at skulle bede om samtykke efter cookie-/ePrivacy-reglerne. Fremover
-- gemmes kun rene sidevisninger uden noget besøgs-id.

alter table public.page_visits drop column if exists visitor_id;
