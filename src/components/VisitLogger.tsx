"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "ugenstipper_visitor_id";

// Anonymt id pr. browser, så vi kan tælle "unikke besøgende" uden login.
// Gemmes i localStorage, så det er det samme, næste gang personen kommer
// tilbage i samme browser - men fortæller os intet om, hvem det er.
function getVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // Privat browsing e.l. kan blokere localStorage - så tæller besøget
    // bare som "ny besøgende" hver gang, i stedet for at fejle helt.
    return `v-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

// Logger én side-visning pr. sideskift til /api/log-visit, så admin kan se
// besøgstal i Supabase (tabellen public.page_visits). Sættes op én gang i
// src/app/layout.tsx, så den dækker hele appen. usePathname() fanger også
// client-side navigation mellem sider (Next.js skifter ikke hele siden).
export function VisitLogger() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    fetch("/api/log-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, visitor_id: getVisitorId() }),
      keepalive: true,
    }).catch(() => {
      // Kan ikke gøre mere ved det, hvis selve logningen fejler.
    });
  }, [pathname]);

  return null;
}
