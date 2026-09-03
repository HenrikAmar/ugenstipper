-- ============================================================
-- Selvvalgt avatar-farve - så en bruger, der er utilfreds med sin
-- automatisk tildelte farve (fx lilla), kan vælge en af de 8 faste farver
-- selv, under "Profil" -> "Vælg din farve". Midlertidig løsning indtil vi
-- får lov af klubberne til at bruge deres rigtige logoer.
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

alter table public.profiles add column if not exists avatar_color text;

-- Samme grundlæggende lov til at læse/skrive som resten af tabellen - uden
-- denne linje kan opdateringen fejle med "permission denied", selvom
-- RLS-policyen nedenfor tillader det (se samme erfaring fra nyheder.sql).
grant select, insert, update, delete on public.profiles to authenticated;
