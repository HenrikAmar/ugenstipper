import { hentNflLive } from "@/lib/nflResults";

/**
 * Leverer stillingen i de NFL-kampe, der er i gang lige nu.
 *
 * Tip-siden spørger her hvert 30. sekund, mens man har den åben, i stedet
 * for at gentegne hele siden - svaret her er nogle få hundrede tegn, så en
 * opdatering koster stort set ingenting.
 *
 * Svaret caches i 30 sekunder og deles mellem alle brugere. Det er hele
 * pointen: om der er 5 eller 500, der følger med søndag aften, rammer vi
 * ESPN nogenlunde to gange i minuttet.
 *
 * Her skrives ALDRIG noget i databasen. Ruten er derfor ufarlig at kalde
 * ofte, og en igangværende stilling kan ikke udløse point ved et uheld.
 */
export const revalidate = 30;

export async function GET() {
  try {
    const live = await hentNflLive();
    return Response.json({ live });
  } catch (err) {
    // Går noget galt hos ESPN, skal Tip-siden bare undvære live-stillingen -
    // ikke gå i stykker.
    console.error("[nfl-live] Kunne ikke hente live-stillinger:", err);
    return Response.json({ live: {} });
  }
}
