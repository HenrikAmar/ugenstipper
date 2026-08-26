"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Forkert e-mail eller adgangskode.");
      else window.location.href = "/tip";
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || undefined } },
      });
      if (error) setError(error.message);
      else setInfo("Bruger oprettet! Tjek din e-mail for at bekræfte kontoen.");
    }

    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-bg">
      <div className="relative overflow-hidden bg-navy px-7 pb-10 pt-14">
        <h1 className="max-w-[260px] text-[26px] font-bold leading-tight text-white">
          Tip Superligaen med vennerne – helt gratis
        </h1>
        <p className="mt-2.5 max-w-[260px] text-sm text-[#AAB4C6]">
          Ingen indsats, ingen odds. Bare skarpe tips og en fælles stilling.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-6 py-7">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold">Navn</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dit navn"
              className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dig@eksempel.dk"
            className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold">Adgangskode</label>
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

        {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
        {info && <p className="text-[13px] font-medium text-accent">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1.5 h-[50px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {mode === "login" ? "Log ind" : "Opret bruger"}
        </button>

        <div className="my-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">eller</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="flex h-[50px] items-center justify-center gap-2.5 rounded-[10px] border border-border bg-surface text-sm font-semibold"
        >
          Fortsæt med Google
        </button>

        <div className="flex-1" />

        <p className="text-center text-[13px] text-text-muted">
          {mode === "login" ? (
            <>
              Ny hos Ugenstipper?{" "}
              <button
                type="button"
                className="font-bold text-accent"
                onClick={() => setMode("signup")}
              >
                Opret en gratis bruger
              </button>
            </>
          ) : (
            <>
              Har du allerede en bruger?{" "}
              <button
                type="button"
                className="font-bold text-accent"
                onClick={() => setMode("login")}
              >
                Log ind
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
