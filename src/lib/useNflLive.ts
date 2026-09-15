"use client";

import { useEffect, useState } from "react";
import type { LiveKamp } from "@/lib/nflResults";

// Hvor tit stillingen hentes, mens man har siden åben. 30 sekunder er rigeligt
// til en tipkonkurrence - man skal kunne følge med, ikke handle på sekunder.
// Serveren cacher desuden svaret i samme interval, så flere brugere deler det.
const INTERVAL_MS = 30_000;

/**
 * Henter løbende stillingen i igangværende NFL-kampe.
 *
 * Kører KUN, når der rent faktisk kan være en kamp i gang (aktiv=true). Er
 * der ingen - hvilket er det meste af ugen - spørges der overhovedet ikke,
 * og hook'en koster ingenting.
 *
 * Fejler et opslag, beholdes den seneste kendte stilling i stedet for at
 * blinke tomt. Så et enkelt dårligt svar undervejs ses slet ikke.
 */
export function useNflLive(aktiv: boolean): Record<string, LiveKamp> {
  const [live, setLive] = useState<Record<string, LiveKamp>>({});

  useEffect(() => {
    if (!aktiv) return;

    // Undgår at skrive til en komponent, der er forsvundet imens (fx hvis man
    // skifter runde eller sport, mens et opslag er undervejs).
    let afbrudt = false;

    async function hent() {
      try {
        const res = await fetch("/api/nfl-live");
        if (!res.ok) return;
        const data = (await res.json()) as { live?: Record<string, LiveKamp> };
        if (!afbrudt) setLive(data.live ?? {});
      } catch {
        // Stille og roligt: behold det, vi viste i forvejen.
      }
    }

    hent();
    const timer = setInterval(hent, INTERVAL_MS);

    return () => {
      afbrudt = true;
      clearInterval(timer);
    };
  }, [aktiv]);

  return live;
}
