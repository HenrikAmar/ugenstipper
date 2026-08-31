import { createClient } from "@/lib/supabase/server";

// MIDLERTIDIG DIAGNOSTIK-RUTE (31/8) - viser det RÅ svar direkte fra
// API-Football (i modsætning til autoResultater.ts's filtrerede udgave), så
// vi kan se præcis hvad API-Football rent faktisk svarer - inkl. en evt.
// "errors"-besked om abonnementsbegrænsninger, og hvilke kampstatusser den
// finder. Prøver både sæson 2026 og 2025, i tilfælde af at API-Football
// navngiver sæsonen anderledes end vi regner med. Besøg i browseren mens du
// er logget ind som admin: https://www.ugenstipper.dk/api/admin/test-api-football
// Kan slettes igen når vi ved automatikken virker.
const SUPERLIGA_LEAGUE_ID = 119;
const API_BASE_URL = "https://v3.football.api-sports.io";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface RawFixture {
  fixture: { id: number; date: string; status: { short: string; long: string } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return new Response("Forbidden", { status: 403 });

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, fejl: "API_FOOTBALL_KEY mangler i miljøvariablerne" }, { status: 500 });
  }

  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const perSaeson: Record<string, unknown> = {};

  for (const season of [2026, 2025]) {
    const url = `${API_BASE_URL}/fixtures?league=${SUPERLIGA_LEAGUE_ID}&season=${season}&from=${formatDate(
      from
    )}&to=${formatDate(to)}`;

    try {
      const res = await fetch(url, {
        headers: { "x-apisports-key": apiKey },
        cache: "no-store",
      });
      const data = (await res.json()) as {
        response?: RawFixture[];
        errors?: unknown;
        results?: number;
      };

      const fixtures = data.response ?? [];

      perSaeson[`saeson_${season}`] = {
        httpStatus: res.status,
        apiFootballFejl: data.errors,
        antalKampeIAlt: data.results ?? fixtures.length,
        statusserFundet: fixtures.map((f) => f.fixture?.status?.short),
        foersteToKampe: fixtures.slice(0, 2).map((f) => ({
          hjemme: f.teams?.home?.name,
          ude: f.teams?.away?.name,
          dato: f.fixture?.date,
          status: f.fixture?.status,
          maal: f.goals,
        })),
      };
    } catch (err) {
      perSaeson[`saeson_${season}`] = {
        fejl: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return Response.json({
    ok: true,
    periode: { fra: formatDate(from), til: formatDate(to) },
    perSaeson,
  });
}
