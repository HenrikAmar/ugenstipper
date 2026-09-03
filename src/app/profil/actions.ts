"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_PALETTE } from "@/components/TeamBadge";

// Gemmer (eller fjerner, ved color === null) brugerens selvvalgte
// badge-farve - se AvatarColorPicker.tsx på profilsiden.
export async function setAvatarColor(color: string | null) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du er ikke logget ind." };
  }

  if (color !== null && !AVATAR_PALETTE.includes(color)) {
    return { error: "Ugyldig farve." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_color: color })
    .eq("id", user.id);

  if (error) {
    return { error: "Kunne ikke gemme farven. Prøv igen." };
  }

  // /stilling skal også vise den nye farve med det samme.
  revalidatePath("/profil");
  revalidatePath("/stilling");
  return { error: null };
}
