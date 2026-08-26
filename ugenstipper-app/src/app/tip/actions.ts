"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveTip(matchId: string, tipHome: number, tipAway: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du er ikke logget ind." };
  }

  if (
    !Number.isInteger(tipHome) ||
    !Number.isInteger(tipAway) ||
    tipHome < 0 ||
    tipAway < 0
  ) {
    return { error: "Tippet skal være to hele tal, 0 eller derover." };
  }

  const { error } = await supabase.from("tips").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      tip_home: tipHome,
      tip_away: tipAway,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    // Rammer typisk databasens regler: kampen er startet, eller uden for
    // det tilladte rundevindue (indeværende runde + 2 runder frem).
    return {
      error:
        "Kunne ikke gemme tippet. Kampen er muligvis startet, eller uden for det tilladte rundevindue.",
    };
  }

  revalidatePath("/tip");
  return { error: null };
}
