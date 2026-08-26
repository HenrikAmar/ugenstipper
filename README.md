# Ugenstipper

Gratis tipskonkurrence på Superligaen. Next.js + Supabase.

## Vigtigt at vide først

Jeg (Claude) har skrevet al koden i denne mappe, men **kunne ikke køre
`npm install` eller bygge projektet i denne session** — netværksadgangen her
tillader ikke opkobling til npm's pakke-register. Koden er skrevet omhyggeligt
og efter velkendte, veldokumenterede mønstre (Next.js App Router + Supabase),
men er altså ikke testkørt endnu. Kør `npm run build` lokalt hos dig selv (se
trin 3 nedenfor), og send mig eventuelle fejlbeskeder — så retter jeg dem med
det samme.

## 1. Installer Node.js

Hvis du ikke har det: hent LTS-versionen fra [nodejs.org](https://nodejs.org)
og installér den (næste, næste, næste).

## 2. Opret et gratis Supabase-projekt

1. Gå til [supabase.com](https://supabase.com) og opret en gratis konto.
2. Opret et nyt projekt (vælg selv navn og et databasekodeord — gem det et sikkert sted).
3. Gå til **SQL Editor** i venstremenuen → **New query**.
4. Åbn filen `supabase/schema.sql` fra denne mappe, kopiér hele indholdet ind, og tryk **Run**.
   Det opretter alle tabeller og adgangsregler.
5. Gå til **Project Settings → API**. Her finder du:
   - **Project URL**
   - **anon public key**

## 3. Sæt projektet op lokalt

Åbn en terminal i denne mappe og kør:

```bash
npm install
cp .env.example .env.local
```

Åbn `.env.local` og indsæt din Project URL og anon key fra trin 2.

Kør så:

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) — du bliver sendt til login-siden.

## 4. Opret dig selv som admin

1. Opret en bruger på login-siden (email + adgangskode, eller Google — se trin 6).
2. Gå tilbage til Supabase → **SQL Editor**, og kør (udskift med din egen email):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'din@email.dk');
```

3. Log ind igen. Under **Profil** kan du nu se et link til admin-panelet, hvor du
   kan oprette runder, kampe og indtaste resultater.

## 5. Sådan bruges det

- **Admin** (`/admin/kampe`): opret en runde, sæt den som "indeværende", opret kampe
  med hold og kampstart-tidspunkt. Når en kamp er spillet, indtaster du det officielle
  resultat — point til alle brugeres tips beregnes automatisk (3 point for eksakt
  resultat, 1 point for korrekt udfald, 0 point ellers).
- **Bruger** (`/tip`): kan kun se og tippe kampe i den indeværende runde + de næste 2
  runder, og kun indtil kampstart — det håndhæves i selve databasen, ikke kun i
  browseren.
- **Stilling** (`/stilling`) og **Statistik** (`/statistik`) opdateres automatisk ud fra
  de gemte tips og resultater.

## 6. (Valgfrit) Google-login

Email/adgangskode virker uden videre. Vil du også have "Fortsæt med Google":

1. Opret et OAuth-klient-ID i [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. I Supabase: **Authentication → Providers → Google**, indsæt Client ID og Client Secret derfra.
3. Tilføj din Supabase-projekts redirect-URL (vist på samme side i Supabase) som "Authorized redirect URI" i Google Cloud.

## 7. Gratis deploy (så alle kan bruge den fra en URL)

1. Læg projektet i et GitHub-repo (privat eller offentligt, ligegyldigt).
2. Gå til [vercel.com](https://vercel.com), opret en gratis konto, og importér repoet.
3. Under projektets **Settings → Environment Variables**, tilføj de samme to
   variabler som i `.env.local`.
4. Deploy. Vercels gratis Hobby-plan dækker fint til dette projekt, så længe det
   forbliver et gratis, ikke-kommercielt projekt.

## Kendte forenklinger i denne første version

Sammenlignet med designudkastet er et par ting simplificeret for at holde koden
enkel og robust — kan udvides senere:

- "Gem tips" gemmes pr. kamp (med det samme du trykker Gem), ikke som én samlet
  handling for hele runden.
- Stillingen viser ikke placerings-ændring (pil op/ned) endnu.
- Admin-panelet dækker kun "Kampe" (inkl. runder) — ikke separate sider for
  "Brugere" eller "Indstillinger" fra designudkastet.

## Mappestruktur

```
src/app/          Next.js-sider (App Router)
src/components/    Genbrugte UI-komponenter
src/lib/           Supabase-klienter, typer, pointberegning
supabase/schema.sql  Databaseskema og adgangsregler (RLS)
```
