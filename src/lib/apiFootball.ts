// Wrapper omkring API-Football (v3.football.api-sports.io), som vi bruger til
// automatisk at hente officielle Superliga-resultater - se src/lib/autoResultater.ts
// for selve logikken, der bruger denne fil. Kræver miljøvariablen
// API_FOOTBALL_KEY (den gratis nøgle, oprettet på api-football.com).

// Superligaens liga-id i API-Football's system (slået op af Henrik i deres
// egen "IDs"-oversigt på dashboard.api-football.com/soccer/ids).
const SUPERLIGA_LEAGUE_ID = 119;

const API_BASE_URL = "https://v3.football.api-sports.io";

interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface ApiFootballFixturesResponse {
  response: ApiFootballFixture[];
  errors?: unknown;
}

// Kampstatus-koder fra API-Football, der betyder "kampen er slut, resultatet
// er endeligt" - se https://www.api-football.com/documentation-v3#tag/Fixtures
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export interface FinishedFixture {
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  kickoffAt: Date;
}

// Superliga-sæsonen navngives efter det år den STARTER i (fx sæson 2026 er
// 2026-07 til 2027-05). Almindelige danske fodboldsæsoner løber juli-maj, så
// jan-jun hører til sæsonen der startede året før.
function currentSeasonYear(now = new Date()): number {
  const month = now.getUTCMonth() + 1; // 1-12
  const year = now.getUTCFullYear();
  return month >= 7 ? year : year - 1;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Henter alle Superliga-kampe (uanset status) i et datointerval. Bruges til
 * at finde officielle resultater for kampe, vi endnu ikke har indtastet.
 * `from`/`to` gives lidt margin ift. de kampe vi rent faktisk leder efter,
 * så vi ikke risikerer at ramme forkert pga. tidszoner.
 */
export async function fetchSuperligaFixtures(
  from: Date,
  to: Date
): Promise<FinishedFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY mangler - kan ikke hente resultater automatisk.");
  }

  const season = currentSeasonYear(from);
  const url = `${API_BASE_URL}/fixtures?league=${SUPERLIGA_LEAGUE_ID}&season=${season}&from=${formatDate(
    from
  )}&to=${formatDate(to)}`;

  const res = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
    // Skal altid hente friskt - aldrig cache et kampresultat-opslag.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API-Football svarede med status ${res.status}`);
  }

  const data = (await res.json()) as ApiFootballFixturesResponse;

  return data.response
    .filter((f) => FINISHED_STATUSES.has(f.fixture.status.short))
    .filter((f) => f.goals.home !== null && f.goals.away !== null)
    .map((f) => ({
      homeTeamName: f.teams.home.name,
      awayTeamName: f.teams.away.name,
      homeGoals: f.goals.home as number,
      awayGoals: f.goals.away as number,
      kickoffAt: new Date(f.fixture.date),
    }));
}
