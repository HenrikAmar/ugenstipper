type Outcome = "H" | "U" | "A";

function outcome(home: number, away: number): Outcome {
  if (home > away) return "H";
  if (home < away) return "A";
  return "U";
}

/**
 * Pointregler:
 * - 5 point i alt for et eksakt korrekt resultat (ikke oveni de to nedenfor)
 * - Ellers, lagt sammen:
 *   - 1 point hvis udfaldet er korrekt (hjemmesejr / uafgjort / udesejr)
 *   - 1 point hvis præcis ét af de to måltal (hjemme- eller udetal) er korrekt
 * - En kamp giver altså enten 0, 1, 2 eller 5 point.
 */
export function calculatePoints(
  tipHome: number,
  tipAway: number,
  resultHome: number,
  resultAway: number
): number {
  if (tipHome === resultHome && tipAway === resultAway) return 5;

  let points = 0;
  if (outcome(tipHome, tipAway) === outcome(resultHome, resultAway)) points += 1;
  if (tipHome === resultHome || tipAway === resultAway) points += 1;
  return points;
}
