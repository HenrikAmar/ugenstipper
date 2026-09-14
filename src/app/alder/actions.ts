"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_REASONABLE_AGE_YEARS = 110;

// Gemmer fødselsdatoen for den indloggede bruger - se src/middleware.ts,
// der sender alle uden en udfyldt fødselsdato hertil, og
// supabase/alder.sql for selve kolonnen.
export async function saveBirthDate(birthDateStr: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du skal være logget ind." };
  }

  if (!birthDateStr) {
    return { error: "Indtast din fødselsdato." };
  }

  const birthDate = new Date(birthDateStr);
  if (Number.isNaN(birthDate.getTime())) {
    return { error: "Ugyldig dato." };
  }

  const today = new Date();
  if (birthDate > today) {
    return { error: "Fødselsdatoen kan ikke være i fremtiden." };
  }

  const ageYears =
    (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears > MAX_REASONABLE_AGE_YEARS) {
    return { error: "Den dato ser forkert ud - tjek lige at du har tastet rigtigt." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ birth_date: birthDateStr })
    .eq("id", user.id);

  if (error) {
    return { error: "Kunne ikke gemme - prøv igen om lidt." };
  }

  return { success: true };
}

// Så man kan logge ud herfra, hvis man ikke lige har lyst til at udfylde
// fødselsdatoen med det samme - i stedet for at sidde fast på siden.
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
