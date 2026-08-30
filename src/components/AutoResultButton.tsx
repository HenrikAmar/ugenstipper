"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Lille knap i admin/kampe, der lader admin trigge resultat-hentningen fra
// API-Football med det samme, i stedet for at vente på at det sker
// automatisk (ved næste sidebesøg eller det daglige cron-job) - se
// src/app/api/admin/auto-resultater og src/lib/autoResultater.ts.
export function AutoResultButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/auto-resultater", { method: "POST" });
      if (!res.ok) {
        setMessage("Kunne ikke hente resultater lige nu.");
        return;
      }
      const data = await res.json();
      if (data.updated > 0) {
        setMessage(`${data.updated} resultat${data.updated === 1 ? "" : "er"} hentet og gemt.`);
        router.refresh();
      } else if (data.checked > 0) {
        setMessage("Ingen af de ventende kampe er afgjort endnu.");
      } else {
        setMessage("Ingen kampe mangler resultat lige nu.");
      }
    } catch {
      setMessage("Kunne ikke hente resultater lige nu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-text-muted disabled:opacity-60"
      >
        {loading ? "Henter …" : "Hent resultater nu"}
      </button>
      {message && <span className="text-[11px] text-text-muted">{message}</span>}
    </div>
  );
}
