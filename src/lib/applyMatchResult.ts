import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePoints } from "@/lib/points";

/**
 * Gemmer et officielt kampresultat og genberegner point for alle tips på
 * kampen med det samme. Bruges af admin's manuelle "Gem resultat"-knap
 * (se src/app/admin/kampe/actions.ts).
 */
export async function applyMatchResult(
  matchId: string,
  resultHome: number,
  resultAway: number
) {
  // Brug admin-klienten (uden RLS) her - vi skal skrive point til ALLE
  // brugeres tips, ikke kun én bruger, og efter kampstart. Tips' egne
  // RLS-regler (kun ejeren, kun før kampstart) ville ellers stille og
  // roligt have blokeret præcis denne opdatering uden nogen fejlbesked.
  const admin = createAdminClient();

  const { error: matchError } = await admin
    .from("matches")
    .update({ result_home: resultHome, result_away: resultAway })
    .eq("id", matchId);

  if (matchError) {
    console.error("applyMatchResult: kunne ikke opdatere kampens resultat", matchError);
    throw new Error(`Kunne ikke gemme resultatet: ${matchError.message}`);
  }

  const { data: tips, error: tipsFetchError } = await admin
    .from("tips")
    .select("id, tip_home, tip_away")
    .eq("match_id", matchId);

  if (tipsFetchError) {
    console.error("applyMatchResult: kunne ikke hente tips til point-beregning", tipsFetchError);
    throw new Error(`Kunne ikke hente tips: ${tipsFetchError.message}`);
  }

  for (const tip of tips ?? []) {
    const points = calculatePoints(tip.tip_home, tip.tip_away, resultHome, resultAway);
    const { error: tipUpdateError } = await admin
      .from("tips")
      .update({ points })
      .eq("id", tip.id);
    if (tipUpdateError) {
      console.error("applyMatchResult: kunne ikke opdatere point for tip", tip.id, tipUpdateError);
      throw new Error(`Kunne ikke opdatere point: ${tipUpdateError.message}`);
    }
  }
}
