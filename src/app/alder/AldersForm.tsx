"use client";

import { useState } from "react";
import { saveBirthDate } from "./actions";

export function AldersForm() {
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await saveBirthDate(birthDate);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Fører videre til forsiden - middleware lukker automatisk brugeren
      // igennem nu, hvor fødselsdatoen er gemt.
      window.location.href = "/";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold">Din fødselsdato</label>
        <input
          type="date"
          required
          max={today}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
        />
      </div>

      {error && <p className="text-[13px] font-medium text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-1.5 h-[50px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
      >
        {loading ? "Et øjeblik …" : "Gem og fortsæt"}
      </button>
    </form>
  );
}
