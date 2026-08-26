import type { SupabaseClient } from "@supabase/supabase-js";
import type { Round } from "@/lib/types";

/**
 * Henter de runder en almindelig bruger må se og tippe på:
 * den indeværende runde samt de næste 2 runder.
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

  if (!current) return [];

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .gte("number", current.number)
    .lte("number", current.number + 2)
    .order("number", { ascending: true });

  return rounds ?? [];
}
