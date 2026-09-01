"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Forudhenter /tip i baggrunden, så snart en logget-ind bruger lander på
 * forsiden - de allerfleste klikker jo alligevel videre til "Tip her" med
 * det samme, så der er en god chance for at siden allerede er hentet, når
 * de klikker (se src/app/page.tsx). Renderer ikke noget selv.
 */
export function PrefetchTip() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/tip");
  }, [router]);

  return null;
}
