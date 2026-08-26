type Outcome = "H" | "U" | "A";

function outcome(home: number, away: number): Outcome {
  if (home > away) return "H";
  if (home < away) return "A";
  return "U";
}

/**
 * Pointregler:
 * - 3 point for et eksakt korrekt resultat
 * - 1 point for korrekt udfald (hjemmesejr / uafgjort / udesejr), men forkert resultat
 * - 0 point for forkert udfald
 */
export function calculatePoints(
  tipHome: number,
  tipAway: number,
  resultHome: number,
  resultAway: number
): number {
  if (tipHome === resultHome && tipAway === resultAway) return 3;
  if (outcome(tipHome, tipAway) === outcome(resultHome, resultAway)) return 1;
  return 0;
}
