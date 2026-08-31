"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tjekker om et brugernavn allerede er i brug (store/små bogstaver ignoreres),
 * så signup-formularen (src/app/login/page.tsx) kan vise en fejlbesked med
 * det samme i stedet for at man først opdager det efter et forsøg på at
 * oprette kontoen. Kører med admin-klienten, fordi en besøgende der endnu
 * ikke er logget ind ikke har lov til at læse profiles-tabellen (RLS).
 *
 * Selve garantien mod dubletter ligger i databasen (se
 * supabase/username_unique.sql) - dette tjek er kun for en god
 * brugeroplevelse, og fejler det (fx en midlertidig netværksfejl), lader vi
 * hellere signup-forsøget fortsætte end at blokere brugeren unødigt.
 */
export async function isUsernameTaken(name: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .ilike("display_name", trimmed)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("isUsernameTaken: kunne ikke tjekke brugernavn", error);
      return false;
    }

    return data !== null;
  } catch (err) {
    console.error("isUsernameTaken: uventet fejl", err);
    return false;
  }
}
