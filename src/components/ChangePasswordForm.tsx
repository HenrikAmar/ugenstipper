"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

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
      setError("Kunne ikke opdatere adgangskoden. Prøv igen.");
      return;
    }

    setPassword("");
    setPassword2("");
    setInfo("✓ Adgangskoden er opdateret.");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-5 mt-3 flex w-[calc(100%-2.5rem)] items-center justify-center rounded-[10px] border border-border bg-surface py-3 text-sm font-bold"
      >
        Skift adgangskode
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card mx-5 mt-3 flex flex-col gap-3 rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold">Skift adgangskode</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setInfo(null);
          }}
          className="text-[12.5px] text-text-muted underline"
        >
          Luk
        </button>
      </div>

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
      {info && <p className="text-[13px] font-medium text-accent">{info}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-[46px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
      >
        {loading ? "Gemmer …" : "Gem ny adgangskode"}
      </button>
    </form>
  );
}
