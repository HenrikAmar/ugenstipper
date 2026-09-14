-- ============================================================
-- Nyheder: mulighed for at "fastgøre" én nyhed som hovednyhed, så den
-- bliver stående øverst på forsiden, selvom der oprettes nyere nyheder
-- bagefter (i stedet for at det altid bare er den nyeste, der ligger øverst).
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

alter table public.announcements add column if not exists pinned boolean not null default false;

-- Kun én nyhed kan være fastgjort (hovednyhed) ad gangen - samme mønster som
-- "kun én runde kan være indeværende" i supabase/schema.sql. Selve
-- admin-handlingen (se src/app/admin/nyheder/actions.ts) fjerner altid
-- fastgørelsen fra den forrige hovednyhed, før den nye sættes, så dette
-- indeks aldrig burde kunne blive overtrådt i praksis - det er kun der som
-- en sidste sikkerhed.
create unique index if not exists one_pinned_announcement
  on public.announcements (pinned)
  where (pinned);

-- Retter sig selv, hvis den allerede findes fra tidligere migrationsfiler -
-- skrevet ind eksplicit her også, så denne fil er selvstændig.
grant select, insert, update, delete on public.announcements to authenticated, service_role;
