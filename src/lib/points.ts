import type { Sport } from "@/lib/types";

type Outcome = "H" | "U" | "A";

function outcome(home: number, away: number): Outcome {
  if (home > away) return "H";
  if (home < away) return "A";
  return "U";
}

/**
 * ============================================================
 * HER ÆNDRES POINTFORDELINGEN
 * ============================================================
 * Alle pointværdier står samlet herunder, så systemet kan justeres uden at
 * rode i selve udregningen længere nede. Ændrer man et tal her, gælder det
 * øjeblikkeligt for NYE resultater - gamle kampe beholder de point, de fik
 * dengang, indtil man trykker "Genberegn point" på /admin/kampe.
 */

// ---------- Superliga ----------
// Uændret siden starten: lave målscorer betyder, at et helt præcist
// resultat faktisk rammes jævnligt, så 5 point er en passende gevinst.
export const SUPERLIGA_POINTS = {
  udfald: 1, // hjemmesejr / uafgjort / udesejr
  maaltal: 1, // ét af de to måltal ramt præcist
  eksakt: 5, // hele resultatet ramt (i stedet for de to ovenfor)
};

// ---------- NFL ----------
// NFL-scorer er meget højere og mere spredte end fodbold (24-17, 31-20 ...),
// så et helt præcist resultat rammes sjældent - omkring én gang ud af
// hundrede. Derfor er der flere måder at score på undervejs, og den
// præcise gevinst er tilsvarende større.
//
// NFL er en højscoringssport, og det skal pointene være med til at afspejle -
// her lægges ALT sammen, i stedet for at den store gevinst erstatter resten
// (sådan som Superligaen gør det).
export const NFL_POINTS = {
  vinder: 3, // du ramte, hvem der vandt
  margin: 3, // du ramte sejrsmarginen (fx "vinder med 7")
  pointtal: 3, // PR. HOLD: du ramte det holds score præcist (altså op til 6)
  eksakt: 10, // touchdown-bonus OVENI alt det andet, når hele resultatet sidder
};

// Maksimum pr. kamp: 3 (vinder) + 3 (margin) + 3 + 3 (begge scorer) + 10
// (touchdown-bonus) = 22 point.

/**
 * Superliga: 0, 1, 2 eller 5 point.
 * - 5 for et eksakt resultat (ikke oveni de to nedenfor)
 * - ellers lagt sammen: 1 for rigtigt udfald + 1 for ét rigtigt måltal
 */
function superligaPoints(
  tipHome: number,
  tipAway: number,
  resultHome: number,
  resultAway: number
): number {
  if (tipHome === resultHome && tipAway === resultAway) return SUPERLIGA_POINTS.eksakt;

  let points = 0;
  if (outcome(tipHome, tipAway) === outcome(resultHome, resultAway)) {
    points += SUPERLIGA_POINTS.udfald;
  }
  if (tipHome === resultHome || tipAway === resultAway) {
    points += SUPERLIGA_POINTS.maaltal;
  }
  return points;
}

/**
 * NFL ("Touchdown-systemet"): 0, 3, 6 eller 22 point.
 *
 * Alt lægges sammen - der er ingen regel om, at noget erstatter noget andet:
 *     3 for den rigtige vinder
 *   + 3 for den rigtige sejrsmargin
 *   + 3 for hjemmeholdets score
 *   + 3 for udeholdets score
 *   + 10 i touchdown-bonus, hvis hele resultatet sidder
 *   = 22 point maksimalt
 *
 * I praksis kan en kamp kun give 0, 3, 6 eller 22 point, fordi flere af
 * reglerne hænger sammen:
 * - Marginen regnes med fortegn (hjemme minus ude), så rammer man den, har
 *   man altid også ramt vinderen. Margin alene findes derfor ikke.
 * - Rammer man BÅDE marginen og det ene holds score, er det andet tal givet
 *   på forhånd - så har man ramt hele resultatet og får alle 22.
 * - Rammer man begge holds scorer, ER det hele resultatet.
 *
 * Så: 3 = enten vinderen alene eller ét pointtal med forkert vinder.
 *     6 = vinderen plus enten marginen eller ét pointtal.
 *    22 = touchdown.
 */
function nflPoints(
  tipHome: number,
  tipAway: number,
  resultHome: number,
  resultAway: number
): number {
  let points = 0;

  if (outcome(tipHome, tipAway) === outcome(resultHome, resultAway)) {
    points += NFL_POINTS.vinder;
  }
  if (tipHome - tipAway === resultHome - resultAway) {
    points += NFL_POINTS.margin;
  }
  // Pr. hold, så et bud der rammer begge scorer får point for dem begge.
  if (tipHome === resultHome) points += NFL_POINTS.pointtal;
  if (tipAway === resultAway) points += NFL_POINTS.pointtal;

  // Bonussen lægges OVENI, så et perfekt bud altid slår et næsten-perfekt.
  if (tipHome === resultHome && tipAway === resultAway) {
    points += NFL_POINTS.eksakt;
  }

  return points;
}

/**
 * De to konkurrencer har hver sit pointsystem, fordi scorerne opfører sig
 * vidt forskelligt. Sporten kommer fra kampens runde - se
 * src/lib/applyMatchResult.ts, som slår den op og sender den med hertil.
 */
export function calculatePoints(
  tipHome: number,
  tipAway: number,
  resultHome: number,
  resultAway: number,
  sport: Sport = "superliga"
): number {
  return sport === "nfl"
    ? nflPoints(tipHome, tipAway, resultHome, resultAway)
    : superligaPoints(tipHome, tipAway, resultHome, resultAway);
}
