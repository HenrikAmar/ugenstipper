import { createClient } from "@/lib/supabase/server";
import { fetchSuperligaFixtures } from "@/lib/apiFootball";

// MIDLERTIDIG DIAGNOSTIK-RUTE (31/8) - kun for at kunne se PRÆCIS hvad der
// sker når appen spørger API-Football, uden at det kræver en rigtig
// ventende kamp i databasen. Besøg selv i browseren mens du er logget ind
// som admin: https://www.ugenstipper.dk/api/admin/test-api-football
// Kan slettes igen når vi ved automatikken virker.
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

  const harNoegle = Boolean(process.env.API_FOOTBALL_KEY);

  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const fixtures = await fetchSuperligaFixtures(from, to);
    return Response.json({
      ok: true,
      harNoegle,
      antalFundneKampe: fixtures.length,
      eksempler: fixtures.slice(0, 5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, harNoegle, fejl: message }, { status: 500 });
  }
}
