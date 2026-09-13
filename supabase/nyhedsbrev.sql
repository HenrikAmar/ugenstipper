-- ============================================================
-- Nyhedsbrev - sendes til alle brugere fra admin-panelet
-- (/admin/nyhedsbrev). Tilføjer:
--  - newsletter_opt_out: om brugeren har frameldt nyhedsbrevet
--  - unsubscribe_token: et unikt, uigennemskueligt "kodeord" pr. bruger,
--    så afmeld-linket i selve mailen kan virke UDEN at være logget ind
--    (uden at afsløre eller kræve brugerens rigtige id).
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

alter table public.profiles add column if not exists newsletter_opt_out boolean not null default false;
alter table public.profiles add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists profiles_unsubscribe_token_idx
  on public.profiles (unsubscribe_token);

-- Retter sig selv, hvis den allerede findes fra "alle_rettigheder.sql" -
-- men skrevet ind eksplicit her også, så denne fil er selvstændig og ikke
-- er afhængig af, at den anden er kørt først.
grant select, insert, update, delete on public.profiles to authenticated, service_role;
