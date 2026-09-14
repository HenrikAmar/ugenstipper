-- ============================================================
-- Aldersverificering: alle brugere skal indtaste deres fødselsdato, så vi
-- kan undgå at vise aldersbegrænsede reklamer (fx betting) til brugere
-- under 18 år. Alle må stadig deltage i selve spillet, uanset alder.
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

-- ---------- Fødselsdato på profilen ----------
-- Nullable, fordi eksisterende brugere endnu ikke har udfyldt den - de
-- bliver mødt af /alder (se src/middleware.ts), indtil de gør.
alter table public.profiles add column if not exists birth_date date;

-- Opdater "opret automatisk profil ved signup"-triggeren, så den også
-- gemmer fødselsdatoen, som nye brugere nu skal taste ind ved oprettelse
-- (se src/app/login/page.tsx) - resten af funktionen er uændret fra
-- supabase/schema.sql.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date
  );
  return new;
end;
$$;

-- ---------- Aldersgrænse pr. banner ----------
-- Null = ingen aldersgrænse (vises til alle). Sættes fx til 18 på et
-- betting-banner, og vises da kun til brugere der (ifølge birth_date) er
-- fyldt 18 - se src/lib/banners.ts og src/app/tip/page.tsx.
alter table public.sponsor_banners
  add column if not exists min_age integer check (min_age is null or min_age > 0);

-- Retter sig selv, hvis de allerede findes fra tidligere migrationsfiler -
-- skrevet ind eksplicit her også, så denne fil er selvstændig.
grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select, insert, update, delete on public.sponsor_banners to authenticated, service_role;
