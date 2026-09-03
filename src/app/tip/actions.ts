"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Gemmer tips for en hel runde på én gang (i stedet for ét databasekald pr.
// kamp) - bruges af den samlede "Gem runde"-knap nederst på /tip.
//
// deleteMatchIds: kampe hvor brugeren havde et gemt tip, men har ryddet
// felterne igen - her skal det gamle tip rent faktisk fjernes, ikke bare
// stå urørt i databasen.
export async function saveTips(
  entries: { matchId: string; tipHome: number; tipAway: number }[],
  deleteMatchIds: string[] = []
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du er ikke logget ind." };
  }

  if (entries.length === 0 && deleteMatchIds.length === 0) {
    return { error: "Udfyld mindst én kamp, eller ret et tip, før du gemmer." };
  }

  for (const entry of entries) {
    if (
      !Number.isInteger(entry.tipHome) ||
      !Number.isInteger(entry.tipAway) ||
      entry.tipHome < 0 ||
      entry.tipAway < 0
    ) {
      return { error: "Alle tips skal være to hele tal, 0 eller derover." };
    }
  }

  if (entries.length > 0) {
    const rows = entries.map((entry) => ({
      user_id: user.id,
      match_id: entry.matchId,
      tip_home: entry.tipHome,
      tip_away: entry.tipAway,
      updated_at: new Date().toISOString(),
    }));

    // Alle rækker gemmes i ét kald - hvis én kamp fx er startet i
    // mellemtiden, fejler det samlede kald (databasens regler afviser hele
    // kaldet, ikke kun den ene række), så brugeren bliver bedt om at prøve
    // igen.
    const { error } = await supabase
      .from("tips")
      .upsert(rows, { onConflict: "user_id,match_id" });

    if (error) {
      return {
        error:
          "Kunne ikke gemme runden. Én eller flere kampe er muligvis startet, eller uden for det tilladte rundevindue - prøv at genindlæse siden.",
      };
    }
  }

  if (deleteMatchIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("tips")
      .delete()
      .eq("user_id", user.id)
      .in("match_id", deleteMatchIds);

    if (deleteError) {
      return {
        error:
          "Kunne ikke fjerne det ryddede tip. Én af kampene er muligvis startet - prøv at genindlæse siden.",
      };
    }
  }

  revalidatePath("/tip");
  return { error: null };
}
