import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sport } from "@/lib/types";

// Rækkefølgen her bestemmer, hvad der vises først overalt i appen (faner,
// knapper på forsiden osv.) - Superliga er hovedkonkurrencen og står forrest.
export const ALL_SPORTS: Sport[] = ["superliga", "nfl"];

export const SPORT_NAMES: Record<Sport, string> = {
  superliga: "Superliga",
  nfl: "NFL",
};

/**
 * Brugeren vælger selv, hvilke konkurrencer han vil være med i - Superliga,
 * NFL eller begge. Den eneste faste regel er, at man skal have MINDST ÉN;
 * ellers ville appen være tom. Reglen håndhæves i
 * src/app/actions/sport.ts, når man forsøger at slå den sidste fra.
 *
 * Er man kun med i én sport, skjules faneblade-skifteren helt - så den,
 * der kun gider NFL, aldrig ser Superliga, og omvendt.
 */
export const MIN_SPORTS = 1;

/**
 * Hvilke konkurrencer er DENNE bruger med i?
 *
 * Returneres altid i ALL_SPORTS' rækkefølge, så visningen er forudsigelig.
 * Skulle en bruger mod forventning stå uden nogen (fx hvis en oprettelse er
 * gået skævt, før supabase/vaelg_konkurrencer.sql blev kørt), falder vi
 * tilbage til Superliga - det er bedre at vise hovedkonkurrencen end en helt
 * tom app.
 */
export async function getUserSports(
  supabase: SupabaseClient,
  userId: string | undefined
): Promise<Sport[]> {
  if (!userId) return ["superliga"];

  const { data } = await supabase
    .from("sport_participants")
    .select("sport")
    .eq("user_id", userId)
    .eq("status", "joined");

  const valgte = new Set((data ?? []).map((r) => r.sport as Sport));
  const sports = ALL_SPORTS.filter((s) => valgte.has(s));

  return sports.length > 0 ? sports : ["superliga"];
}

/**
 * Hvilken sport skal siden vise?
 *
 * Tager ?sport= fra adressen, men kun hvis brugeren rent faktisk er med i
 * den. Ellers falder vi tilbage til brugerens første konkurrence. Det
 * dækker fx et gammelt bogmærke til ?sport=superliga hos en, der siden er
 * gået over til kun NFL - han skal se sin egen konkurrence, ikke en tom
 * side eller en fane, han har valgt fra.
 */
export function resolveSport(
  param: string | undefined,
  userSports: Sport[]
): Sport {
  const ønsket = ALL_SPORTS.find((s) => s === param);
  if (ønsket && userSports.includes(ønsket)) return ønsket;
  return userSports[0] ?? "superliga";
}

/**
 * Hvem må stå på stillingen for denne sport? Kun dem, der er med i den -
 * så stillingen ikke fyldes op med 0-point-rækker fra folk, der har valgt
 * konkurrencen fra.
 */
export async function getParticipantIds(
  supabase: SupabaseClient,
  sport: Sport
): Promise<Set<string>> {
  const { data } = await supabase
    .from("sport_participants")
    .select("user_id")
    .eq("sport", sport)
    .eq("status", "joined");

  return new Set((data ?? []).map((r) => r.user_id as string));
}
