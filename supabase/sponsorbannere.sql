-- ============================================================
-- Sponsorbannere med vægtet rotation (fx en hovedsponsor der skal have
-- 50% af visningerne, og to andre der hver skal have 25%) - vises
-- nederst på /tip, under kampene. Vægten er RELATIV, den behøver ikke
-- summe til 100: et banner med vægt 50 vises dobbelt så ofte som et med
-- vægt 25, uanset hvad de andre aktive bannere har.
-- Kør denne fil i Supabase -> SQL Editor -> New query -> Run.
-- Sikkert at køre flere gange.
-- ============================================================

create table if not exists public.sponsor_banners (
  id uuid primary key default gen_random_uuid(),
  -- Internt navn, vises kun i admin-oversigten - ikke til brugerne.
  title text not null,
  -- Offentlig URL til billedet i "sponsor-banner-images"-bøtten nedenfor.
  image_url text not null,
  link_url text not null,
  weight integer not null default 1 check (weight > 0),
  active boolean not null default true,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now()
);

-- Selve lov til at læse/skrive i tabellen - RLS-policyerne herunder
-- bestemmer så PRÆCIS hvilke rækker man konkret må se/ændre.
grant select, insert, update, delete on public.sponsor_banners to authenticated;

alter table public.sponsor_banners enable row level security;

drop policy if exists "Alle logget ind kan se bannere" on public.sponsor_banners;
create policy "Alle logget ind kan se bannere"
  on public.sponsor_banners for select
  to authenticated
  using (true);

drop policy if exists "Kun admin kan oprette/redigere/slette bannere" on public.sponsor_banners;
create policy "Kun admin kan oprette/redigere/slette bannere"
  on public.sponsor_banners for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Tælles op direkte i databasen med én samlet "update ... +1"-sætning, i
-- stedet for at hente tallet til koden, lægge 1 til, og gemme det igen -
-- så to samtidige visninger/klik ikke overskriver hinandens tælling.
create or replace function public.increment_banner_impression(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.sponsor_banners set impressions = impressions + 1 where id = p_id;
$$;

create or replace function public.increment_banner_click(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.sponsor_banners set clicks = clicks + 1 where id = p_id;
$$;

grant execute on function public.increment_banner_impression(uuid) to authenticated;
grant execute on function public.increment_banner_click(uuid) to authenticated;

-- ---------- BILLEDER (Storage) ----------
-- Egen "bøtte" til bannerbilleder - offentligt læsbar (så de kan vises på
-- /tip), men kun admin må lægge nye op eller slette.
insert into storage.buckets (id, name, public)
values ('sponsor-banner-images', 'sponsor-banner-images', true)
on conflict (id) do nothing;

drop policy if exists "Alle kan se sponsorbannerbilleder" on storage.objects;
create policy "Alle kan se sponsorbannerbilleder"
  on storage.objects for select
  using (bucket_id = 'sponsor-banner-images');

drop policy if exists "Kun admin kan uploade sponsorbannerbilleder" on storage.objects;
create policy "Kun admin kan uploade sponsorbannerbilleder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'sponsor-banner-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Kun admin kan slette sponsorbannerbilleder" on storage.objects;
create policy "Kun admin kan slette sponsorbannerbilleder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'sponsor-banner-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
