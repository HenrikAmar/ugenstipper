"use client";

import { useEffect } from "react";

// Fanger JavaScript-fejl og "unhandled promise rejections" i browseren, som
// ellers bare forsvinder stille, og sender dem til /api/log-client-error, så
// de kan ses bagefter i Supabase (tabellen public.client_errors). Sættes op
// én gang i src/app/layout.tsx, så den dækker hele appen.
export function ErrorLogger() {
  useEffect(() => {
    function send(message: string, stack?: string) {
      fetch("/api/log-client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, stack, path: window.location.pathname }),
        keepalive: true,
      }).catch(() => {
        // Kan ikke gøre mere ved det, hvis selve logningen fejler.
      });
    }

    function handleError(event: ErrorEvent) {
      send(event.message, event.error?.stack);
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason as unknown;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      send(message, stack);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
