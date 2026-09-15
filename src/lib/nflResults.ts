import { createAdminClient } from "@/lib/supabase/admin";
import { applyMatchResult } from "@/lib/applyMatchResult";

/**
 * Alt om NFL-data fra ESPN samlet ét sted. To formål:
 *
 *  1. hentNflResultater() - skriver FÆRDIGE resultater ind, så ingen behøver
 *     sidde og taste dem midt om natten. Kører automatisk (se vercel.json)
 *     og fra en knap i admin.
 *  2. hentNflLive() - læser stillingen i IGANGVÆRENDE kampe, så brugerne kan
 *     følge med. Gemmer ALDRIG noget i databasen - en igangværende stilling
 *     må aldrig kunne udløse point.
 *
 * ESPN's endpoint kræver hverken nøgle, konto eller betaling, og det er det
 * samme, deres egen hjemmeside bruger. Til gengæld er det udokumenteret, så
 * det kan i teorien ændre sig uden varsel - derfor er alt herunder skrevet
 * til at fejle stille og roligt (ingenting sker) frem for at vise eller
 * skrive noget forkert.
 */
const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

/**
 * ESPN sorterer kampe efter AMERIKANSK dato - ikke dansk.
 *
 * Det er en rigtig faldgrube: Thursday Night Football starter kl. 02.15
 * dansk tid fredag d. 18., men hos ESPN hører kampen til torsdag d. 17.
 * Spørger man om den 18., findes kampen ikke. Det samme gælder
 * søndagsaftenkampen, der er mandag i dansk tid, men stadig søndag i USA.
 * Derfor regnes kampstarten om til datoen i New York, før vi spørger.
 */
function amerikanskDato(kickoffIso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(kickoffIso))
    .replace(/-/g, "");
}

function normaliser(navn: string): string {
  return navn.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

interface EspnKamp {
  hjemme: string;
  ude: string;
  hjemmeScore: number;
  udeScore: number;
  faerdig: boolean;
  igang: boolean;
  /** Fx "4:32 - 3rd" - ESPN leverer den færdigformateret. */
  status: string;
}

/**
 * Henter én dags kampe. Returnerer en tom liste, hvis noget går galt.
 *
 * cacheSekunder: 0 betyder altid friske data (bruges når resultater skal
 * skrives i databasen). Et tal over 0 lader Next.js dele svaret mellem alle
 * brugere i det antal sekunder - afgørende for live-visningen, hvor mange
 * kan kigge samtidig, uden at vi må banke på hos ESPN for hver enkelt.
 */
async function hentDag(dato: string, cacheSekunder: number): Promise<EspnKamp[]> {
  let data: unknown;
  try {
    const res = await fetch(
      `${SCOREBOARD}?dates=${dato}`,
      cacheSekunder > 0
        ? { next: { revalidate: cacheSekunder } }
        : { cache: "no-store" }
    );
    if (!res.ok) {
      console.error(`[nfl] ESPN svarede ${res.status} for ${dato}`);
      return [];
    }
    data = await res.json();
  } catch (err) {
    console.error(`[nfl] Kunne ikke hente ${dato}:`, err);
    return [];
  }

  const events = (data as { events?: unknown[] })?.events ?? [];
  const kampe: EspnKamp[] = [];

  for (const event of events) {
    const e = event as {
      status?: {
        type?: { completed?: boolean; state?: string; shortDetail?: string };
      };
      competitions?: {
        competitors?: {
          homeAway?: string;
          score?: string;
          team?: { displayName?: string };
        }[];
      }[];
    };

    const deltagere = e.competitions?.[0]?.competitors ?? [];
    const hjemme = deltagere.find((d) => d.homeAway === "home");
    const ude = deltagere.find((d) => d.homeAway === "away");
    if (!hjemme?.team?.displayName || !ude?.team?.displayName) continue;

    const hjemmeScore = Number.parseInt(hjemme.score ?? "", 10);
    const udeScore = Number.parseInt(ude.score ?? "", 10);
    if (Number.isNaN(hjemmeScore) || Number.isNaN(udeScore)) continue;

    kampe.push({
      hjemme: hjemme.team.displayName,
      ude: ude.team.displayName,
      hjemmeScore,
      udeScore,
      faerdig: e.status?.type?.completed === true,
      igang: e.status?.type?.state === "in",
      status: e.status?.type?.shortDetail ?? "",
    });
  }

  return kampe;
}

/** De af VORES NFL-kampe, der er sat i gang, men mangler et resultat. */
async function kampeDerVenter() {
  const admin = createAdminClient();

  const { data: rounds } = await admin.from("rounds").select("id").eq("sport", "nfl");
  const roundIds = (rounds ?? []).map((r) => r.id);
  if (roundIds.length === 0) return [];

  const { data: matches } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at")
    .in("round_id", roundIds)
    .is("result_home", null)
    .lte("kickoff_at", new Date().toISOString());

  return matches ?? [];
}

/** Slår vores kampe op i ESPN's svar ud fra holdnavnene. */
async function espnKampeFor(
  venter: { kickoff_at: string }[],
  cacheSekunder: number
): Promise<Map<string, EspnKamp>> {
  // Hent kun de dage, vi rent faktisk mangler noget fra - typisk én til tre.
  const datoer = Array.from(new Set(venter.map((m) => amerikanskDato(m.kickoff_at))));
  const fundne = new Map<string, EspnKamp>();

  for (const dato of datoer) {
    for (const k of await hentDag(dato, cacheSekunder)) {
      fundne.set(`${normaliser(k.hjemme)}|${normaliser(k.ude)}`, k);
    }
  }

  return fundne;
}

export interface HentRapport {
  indtastede: { kamp: string; resultat: string }[];
  mangler: string[];
  besked: string;
}

/**
 * Skriver færdigspillede resultater ind (inkl. genberegning af point, fordi
 * den bruger den samme applyMatchResult som admin-knappen).
 *
 * Rører ALDRIG en kamp, der allerede har et resultat - så et resultat, du
 * selv har rettet i hånden, kan ikke blive overskrevet af automatikken.
 */
export async function hentNflResultater(): Promise<HentRapport> {
  const venter = await kampeDerVenter();
  if (venter.length === 0) {
    return { indtastede: [], mangler: [], besked: "Ingen spillede kampe mangler et resultat." };
  }

  // Resultater skal skrives i databasen - her må vi ikke bruge et cachet svar.
  const fundne = await espnKampeFor(venter, 0);
  const rapport: HentRapport = { indtastede: [], mangler: [], besked: "" };

  for (const m of venter) {
    const navn = `${m.home_team} - ${m.away_team}`;
    const treffer = fundne.get(`${normaliser(m.home_team)}|${normaliser(m.away_team)}`);

    // Kun færdige kampe. En kamp i gang har også en score, og den må under
    // ingen omstændigheder skrives ind som slutresultat.
    if (!treffer || !treffer.faerdig) {
      rapport.mangler.push(navn);
      continue;
    }

    try {
      await applyMatchResult(m.id, treffer.hjemmeScore, treffer.udeScore);
      rapport.indtastede.push({
        kamp: navn,
        resultat: `${treffer.hjemmeScore}-${treffer.udeScore}`,
      });
    } catch (err) {
      console.error(`[nfl] Kunne ikke gemme resultat for ${navn}:`, err);
      rapport.mangler.push(navn);
    }
  }

  rapport.besked =
    rapport.indtastede.length > 0
      ? `Indtastede ${rapport.indtastede.length} resultat(er).`
      : "Fandt ingen færdigspillede kampe at indtaste.";

  return rapport;
}

export interface LiveKamp {
  hjemmeScore: number;
  udeScore: number;
  /** Fx "4:32 - 3rd". */
  status: string;
}

/**
 * Stillingen i de kampe, der er i gang lige nu - til visning, aldrig til
 * lagring. Nøglen er VORES kamp-id, så siden kan slå direkte op.
 *
 * Svaret deles mellem alle brugere i 30 sekunder (se cache-parameteren), så
 * ESPN rammes et par gange i minuttet, uanset om der er 5 eller 500, der
 * følger med.
 */
export async function hentNflLive(): Promise<Record<string, LiveKamp>> {
  const venter = await kampeDerVenter();
  if (venter.length === 0) return {};

  const fundne = await espnKampeFor(venter, 30);
  const live: Record<string, LiveKamp> = {};

  for (const m of venter) {
    const treffer = fundne.get(`${normaliser(m.home_team)}|${normaliser(m.away_team)}`);
    if (!treffer || !treffer.igang) continue;

    live[m.id] = {
      hjemmeScore: treffer.hjemmeScore,
      udeScore: treffer.udeScore,
      status: treffer.status,
    };
  }

  return live;
}
