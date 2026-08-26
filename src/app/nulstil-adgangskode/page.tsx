"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NulstilAdgangskodePage() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Adgangskoden skal være mindst 6 tegn.");
      return;
    }
    if (password !== password2) {
      setError("De to adgangskoder er ikke ens.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(
        "Kunne ikke opdatere adgangskoden. Linket er muligvis udløbet - prøv 'Glemt adgangskode' igen fra login-siden."
      );
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/tip"), 2000);
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="text-lg font-bold text-accent">✓ Adgangskode opdateret</p>
        <p className="mt-2 text-sm text-text-muted">Du bliver sendt videre om et øjeblik …</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-bg px-6 py-10">
      <h1 className="text-2xl font-extrabold">Vælg ny adgangskode</h1>
      <p className="mt-2 text-sm text-text-muted">Indtast din nye adgangskode herunder.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold">Ny adgangskode</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold">Gentag adgangskode</label>
          <input
            type="password"
            required
            minLength={6}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
          />
        </div>

        {error && <p className="text-[13px] font-medium text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1.5 h-[50px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {loading ? "Gemmer …" : "Gem ny adgangskode"}
        </button>
      </form>
    </div>
  );
}
