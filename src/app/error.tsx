"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";

// Next.js' indbyggede fejlgrænse - fanger fejl, der opstår under rendering
// (fx databasefejl på serversiden), og viser denne side i stedet for den
// grimme, tekniske "Application error"-besked. Logger samtidig fejlen til
// public.client_errors (se src/components/ErrorLogger.tsx og
// src/app/api/log-client-error), så den kan ses bagefter i Supabase.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "Ukendt fejl (server)",
        stack: error.stack,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <LogoMark size={30} />
      <h1 className="text-lg font-bold">Hovsa, noget gik galt</h1>
      <p className="text-sm text-text-muted">
        Siden stødte på en fejl. Prøv igen, eller kom tilbage om lidt.
      </p>
      <button
        onClick={() => reset()}
        className="mt-2 h-11 rounded-[10px] bg-accent-2 px-6 text-sm font-bold text-white"
      >
        Prøv igen
      </button>
    </div>
  );
}
