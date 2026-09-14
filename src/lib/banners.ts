import type { SponsorBanner } from "@/lib/types";

/**
 * Vælger ét banner tilfældigt blandt de aktive, men vægtet efter deres
 * "weight" - et banner med vægt 50 bliver i gennemsnit valgt dobbelt så
 * ofte som et med vægt 25, uanset hvad de andre bannere har. Vægtene
 * behøver ikke summe til 100, det er kun forholdet mellem dem der tæller.
 *
 * Det er et gennemsnit over mange visninger, ikke en garanti for at
 * hver enkelt bruger ser præcis den fordeling hver gang - det er sådan
 * stort set alle sponsor-rotationer fungerer i praksis.
 */
export function pickWeightedBanner(banners: SponsorBanner[]): SponsorBanner | null {
  const active = banners.filter((b) => b.active && b.weight > 0);
  if (active.length === 0) return null;

  const totalWeight = active.reduce((sum, b) => sum + b.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const banner of active) {
    roll -= banner.weight;
    if (roll <= 0) return banner;
  }

  // Kan i teorien rammes ved afrundingsfejl med flydende tal - vælg da bare
  // det sidste banner i stedet for at returnere ingenting.
  return active[active.length - 1];
}

/**
 * Fjerner bannere med en aldersgrænse (min_age), som brugeren ikke
 * opfylder - fx et betting-banner sat til min_age 18 vises ikke til nogen
 * under 18. Kender vi ikke brugerens alder (age === null, fx en fejl ved
 * opslaget), er det sikrest at udelukke ALLE aldersbegrænsede bannere i
 * stedet for at vise dem - se src/app/tip/page.tsx.
 */
export function filterBannersForAge(
  banners: SponsorBanner[],
  age: number | null
): SponsorBanner[] {
  return banners.filter((b) => {
    if (b.min_age === null || b.min_age === undefined) return true;
    return age !== null && age >= b.min_age;
  });
}
