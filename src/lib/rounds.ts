import type { SupabaseClient } from "@supabase/supabase-js";
import type { Round } from "@/lib/types";

// Fælles visningsnavn for en runde, brugt flere steder i appen.
export function roundLabel(r: Pick<Round, "kind" | "number">) {
  return r.kind === "bonus" ? `Bonus runde ${r.number}` : `Runde ${r.number}`;
}

// Hvor længe en overstået runde stadig må ses/tippes på, efter dens sidste
// kamp - så den ikke forsvinder i samme sekund, den ikke længere er aktuel
// (for liga-runder) eller alle dens kampe er spillet (for bonusrunder).
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // et døgn

/**
 * Henter de runder en almindelig bruger må se og tippe på: den aktuelle
 * liga-runde og de næste 2 - men i den rækkefølge de rent faktisk finder
 * sted. Bonusrunder følger ikke den almindelige rundeplan (de kan dukke op
 * når som helst, fx når et dansk hold spiller i Europa), så de blandes ind
 * kronologisk imellem liga-runderne efter deres kampes kickoff-tidspunkt -
 * i stedet for altid at ligge sidst. Fx: Runde 3, Bonus runde 1, Runde 4.
 *
 * Den lige overståede liga-runde (fx Runde 1, i det øjeblik admin gør
 * Runde 2 til "aktuel") bliver ikke fjernet med det samme - den bliver
 * stående i et døgn efter dens sidste kamp, så brugerne lige når at se den,
 * før den forsvinder. Det samme gælder bonusrunder: de forsvinder først et
 * døgn efter deres sidste kamp, i stedet for i samme sekund den er spillet.
 * (Håndhæves også i databasen via Row Level Security - se supabase/schema.sql.)
 */
export async function getTippableRounds(
  supabase: SupabaseClient
): Promise<Round[]> {
  // De to opslag herunder er uafhængige af hinanden - kør dem samtidig i
  // stedet for efter hinanden, det gør siden mærkbart hurtigere at åbne.
  const [{ data: current }, { data: bonusRoundsRaw }] = await Promise.all([
    supabase.from("rounds").select("*").eq("is_current", true).maybeSingle(),
    supabase.from("rounds").select("*").eq("kind", "bonus"),
  ]);
  const bonusRounds: Round[] = bonusRoundsRaw ?? [];

  if (!current) {
    // Ingen aktiv liga-runde sat op endnu - vis kun åbne bonusrunder, i
    // kronologisk rækkefølge.
    return sortAndFilterChronologically(supabase, bonusRounds);
  }

  // Samme princip her: den kommende-runder-forespørgsel og
  // forrige-runde-forespørgslen er også uafhængige af hinanden.
  const [{ data: ligaRoundsRaw }, { data: previousRoundRaw }] = await Promise.all([
    // Generøs pulje af kommende liga-runder - flere af dem kan blive
    // skubbet uden for de 3 viste pladser, hvis der ligger bonusrunder
    // imellem dem.
    supabase
      .from("rounds")
      .select("*")
      .eq("kind", "liga")
      .eq("season", current.season)
      .gte("number", current.number)
      .lte("number", current.number + 6)
      .order("number", { ascending: true }),
    // Tjek om den forrige liga-runde stadig skal vises (inden for et døgn
    // efter dens sidste kamp) - den er ikke med i forespørgslen ovenfor,
    // da den er faldet under "current.number".
    supabase
      .from("rounds")
      .select("*")
      .eq("kind", "liga")
      .eq("season", current.season)
      .eq("number", current.number - 1)
      .maybeSingle(),
  ]);
  const ligaRounds: Round[] = ligaRoundsRaw ?? [];

  let includedPreviousRound = false;
  if (previousRoundRaw) {
    const { data: previousMatches } = await supabase
      .from("matches")
      .select("kickoff_at")
      .eq("round_id", previousRoundRaw.id);
    const lastKickoff = (previousMatches ?? []).reduce(
      (latest, m) => Math.max(latest, new Date(m.kickoff_at).getTime()),
      0
    );
    if (lastKickoff > 0 && Date.now() - lastKickoff <= GRACE_PERIOD_MS) {
      ligaRounds.unshift(previousRoundRaw as Round);
      includedPreviousRound = true;
    }
  }

  const sorted = await sortAndFilterChronologically(supabase, [
    ...ligaRounds,
    ...bonusRounds,
  ]);

  const currentIndex = sorted.findIndex((r) => r.id === current.id);
  const startIndex = currentIndex === -1 ? 0 : currentIndex;

  const previousIndex = includedPreviousRound
    ? sorted.findIndex((r) => r.id === previousRoundRaw!.id)
    : -1;
  const windowStart =
    previousIndex !== -1 ? Math.min(previousIndex, startIndex) : startIndex;

  // Altid præcis 3 faneblade i alt - hvis den forrige runde er taget med,
  // fortrænger den den fjerneste kommende runde, i stedet for at lægge sig
  // oveni og give 4 (det gav en grim sidelæns scrollbar på Tip-siden).
  return sorted.slice(windowStart, windowStart + 3);
}

/**
 * Sorterer runder efter, hvornår deres første kamp starter (en runde uden
 * kampe endnu lægges sidst, indtil der er en dato at gå efter). Fjerner
 * samtidig bonusrunder, hvor alle kampe er overstået for mere end et døgn
 * siden (se GRACE_PERIOD_MS) - liga-runder filtreres ikke fra her, de
 * styres af admins "aktuel runde"-markering (og det ekstra tjek af den
 * forrige runde i getTippableRounds ovenfor).
 */
async function sortAndFilterChronologically(
  supabase: SupabaseClient,
  rounds: Round[]
): Promise<Round[]> {
  if (rounds.length === 0) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("round_id, kickoff_at")
    .in(
      "round_id",
      rounds.map((r) => r.id)
    );

  const kickoffsByRound = new Map<string, number[]>();
  for (const m of matches ?? []) {
    const list = kickoffsByRound.get(m.round_id) ?? [];
    list.push(new Date(m.kickoff_at).getTime());
    kickoffsByRound.set(m.round_id, list);
  }

  const now = Date.now();
  const relevant = rounds.filter((r) => {
    if (r.kind !== "bonus") return true;
    const kickoffs = kickoffsByRound.get(r.id);
    if (!kickoffs || kickoffs.length === 0) return true; // ingen kampe endnu
    // Skjul først et døgn efter sidste kamp, i stedet for med det samme.
    return Math.max(...kickoffs) >= now - GRACE_PERIOD_MS;
  });

  return relevant.sort((a, b) => {
    const aKickoffs = kickoffsByRound.get(a.id);
    const bKickoffs = kickoffsByRound.get(b.id);
    const aFirst = aKickoffs?.length ? Math.min(...aKickoffs) : Infinity;
    const bFirst = bKickoffs?.length ? Math.min(...bKickoffs) : Infinity;
    if (aFirst !== bFirst) return aFirst - bFirst;
    return a.number - b.number;
  });
}
