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
