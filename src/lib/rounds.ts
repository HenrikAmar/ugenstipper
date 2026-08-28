import type { SupabaseClient } from "@supabase/supabase-js";
import type { Round } from "@/lib/types";

// Fælles visningsnavn for en runde, brugt flere steder i appen.
export function roundLabel(r: Pick<Round, "kind" | "number">) {
  return r.kind === "bonus" ? `Bonus runde ${r.number}` : `Runde ${r.number}`;
}

/**
 * Henter de runder en almindelig bruger må se og tippe på:
 * den indeværende liga-runde samt de næste 2, PLUS alle bonusrunder (de følger
 * ikke rundeplanen - de er altid tippebare, indtil deres kampe starter).
 * (Håndhæves også i databasen via Row Level Security - se supabase/schema.sql.)
 */
export async function getTippableRounds(
  supabase: SupabaseClient
): Promise<Round[]> {
  const { data: current } = await supabase
    .from("rounds")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  const { data: bonusRounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("kind", "bonus")
    .order("number", { ascending: true });

  if (!current) return bonusRounds ?? [];

  const { data: ligaRounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("kind", "liga")
.eq("season", current.season)
    .gte("number", current.number)
    .lte("number", current.number + 2)
    .order("number", { ascending: true });

  return [...(ligaRounds ?? []), ...(bonusRounds ?? [])];
}
