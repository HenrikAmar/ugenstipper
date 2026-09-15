"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserSports, SPORT_NAMES, MIN_SPORTS } from "@/lib/participation";
import type { Sport } from "@/lib/types";

/**
 * Slår en konkurrence til eller fra for den bruger, der er logget ind.
 *
 * Den eneste regel er, at man ikke kan slå sin sidste konkurrence fra - så
 * ville der hverken være kampe at tippe eller en stilling at se. Det tjek
 * ligger HER på serveren og ikke kun i knapperne, så reglen holder, uanset
 * hvordan kaldet kommer ind.
 */
export async function setSportEnabled(sport: Sport, enabled: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du skal være logget ind." };

  if (!enabled) {
    const nuværende = await getUserSports(supabase, user.id);
    const tilbage = nuværende.filter((s) => s !== sport);
    if (tilbage.length < MIN_SPORTS) {
      return {
        error: `Du skal være med i mindst én konkurrence. Vælg ${
          sport === "superliga" ? SPORT_NAMES.nfl : SPORT_NAMES.superliga
        } til først, hvis du hellere vil spille den.`,
      };
    }
  }

  // upsert i stedet for insert: man skal kunne skifte mening frem og
  // tilbage, uden at det giver en fejl om dubletter.
  const { error } = await supabase.from("sport_participants").upsert(
    { user_id: user.id, sport, status: enabled ? "joined" : "declined" },
    { onConflict: "user_id,sport" }
  );

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/tip");
  revalidatePath("/stilling");
  revalidatePath("/statistik");
  revalidatePath("/profil");
  return { success: true };
}
