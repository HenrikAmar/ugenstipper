"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Logger én side-visning pr. sideskift til /api/log-visit, så admin kan se
// besøgstal i Supabase (tabellen public.page_visits). Sættes op én gang i
// src/app/layout.tsx, så den dækker hele appen. usePathname() fanger også
// client-side navigation mellem sider (Next.js skifter ikke hele siden).
//
// Gemmer bevidst INTET i browseren (ingen cookie, intet localStorage-id) -
// kun et rent tælle-tal af sidevisninger, ingen "unikke besøgende". Det
// betyder, at vi ikke skal bede om samtykke efter cookie-reglerne, som
// ellers ville gælde for et persistent besøgs-id.
export function VisitLogger() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    fetch("/api/log-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      // Kan ikke gøre mere ved det, hvis selve logningen fejler.
    });
  }, [pathname]);

  return null;
}
