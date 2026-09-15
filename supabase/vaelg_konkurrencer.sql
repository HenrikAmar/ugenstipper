-- ============================================================
-- Vælg selv dine konkurrencer (Superliga og/eller NFL).
--
-- Indtil nu var Superliga noget, alle var med i uden at kunne sige fra, og
-- kun NFL kunne vælges til og fra. Nu er begge dele et valg - man skal bare
-- have MINDST ÉN af dem (ellers ville appen være tom).
--
-- Formålet: den der kun gider NFL, skal slippe for at se Superliga-faner,
-- og omvendt. Kun nyhederne på forsiden er fælles.
--
-- Teknikken er den samme tabel som før - forskellen er, at Superliga nu
-- også får en række pr. bruger, i stedet for at "ingen række" underforstået
-- betød "med".
--
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Kræver at supabase/nfl_tilmelding.sql og supabase/nfl_nejtak.sql er kørt
-- først. Sikkert at køre flere gange.
-- ============================================================

-- ---------- Efterfyld Superliga ----------
-- Alle eksisterende brugere har hele tiden spillet Superliga, så de skal
-- naturligvis fortsætte med at være med. Uden denne linje ville alle
-- pludselig stå uden konkurrencer.
insert into public.sport_participants (user_id, sport, status)
select id, 'superliga', 'joined'
from public.profiles
on conflict (user_id, sport) do nothing;

-- ---------- Nye brugere ----------
-- Nye brugere skal starte med Superliga slået til og NFL slået fra (NFL
-- opdager de selv på forsiden). Det sker her i samme trigger, som allerede
-- opretter profilen ved oprettelse - så der ikke findes et øjeblik, hvor en
-- bruger er logget ind uden en eneste konkurrence.
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

  insert into public.sport_participants (user_id, sport, status)
  values (new.id, 'superliga', 'joined')
  on conflict (user_id, sport) do nothing;

  return new;
end;
$$;

grant select, insert, update, delete on public.sport_participants to authenticated;
grant select, insert, update, delete on public.sport_participants to service_role;
