"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  const supabase = createClient();

  // Læs evt. "?ref=..." og "?mode=signup" fra et invite-link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) setRef(refParam);
    if (params.get("mode") === "signup") setMode("signup");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Forkert e-mail eller adgangskode.");
      else window.location.href = "/tip";
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || undefined, invited_by: ref || undefined } },
      });
      if (error) setError(error.message);
      else setInfo("Bruger oprettet! Tjek din e-mail for at bekræfte kontoen.");
    } else {
      // forgot
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/nulstil-adgangskode`,
      });
      // Bevidst samme besked uanset om e-mailen findes eller ej (sikkerhed).
      setInfo("Hvis e-mailen findes hos os, har vi sendt et link til at nulstille adgangskoden.");
    }

    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${ref ? `?ref=${ref}` : ""}`,
      },
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-bg">
      <div className="relative overflow-hidden bg-navy px-7 pb-10 pt-14">
        <Logo size={34} />
        <h1 className="mt-6 max-w-[260px] text-[26px] font-bold leading-tight text-white">
          Tip Superligaen med vennerne – helt gratis
        </h1>
        <p className="mt-2.5 max-w-[260px] text-sm text-[#AAB4C6]">
          Ingen indsats, ingen odds. Bare skarpe tips og en fælles stilling.
        </p>
        <p className="mt-2 max-w-[260px] text-[12.5px] text-[#AAB4C6]">
          Vi er i testfase, så der er ingen præmier endnu - det er på vej!
        </p>
        <Link
          href="/regler"
          className="mt-3 inline-block text-[12.5px] font-semibold text-white underline underline-offset-2"
        >
          Læs reglerne, før du opretter dig
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-6 py-7">
        {mode === "forgot" ? (
          <>
            <p className="text-sm text-text-muted">
              Indtast din e-mail, så sender vi dig et link til at vælge en ny adgangskode.
            </p>
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
          </>
        ) : (
          <>
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

            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode("forgot");
                }}
                className="-mt-2 self-end text-[12.5px] font-semibold text-text-muted underline"
              >
                Glemt adgangskode?
              </button>
            )}
          </>
        )}

        {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
        {info && <p className="text-[13px] font-medium text-accent">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1.5 h-[50px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {loading
            ? "Et øjeblik …"
            : mode === "login"
            ? "Log ind"
            : mode === "signup"
            ? "Opret bruger"
            : "Send nulstillingslink"}
        </button>

        {mode !== "forgot" && (
          <>
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
          </>
        )}

        <div className="flex-1" />

        <p className="text-center text-[13px] text-text-muted">
          {mode === "login" && (
            <>
              Ny hos Ugenstipper?{" "}
              <button
                type="button"
                className="font-bold text-accent"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode("signup");
                }}
              >
                Opret en gratis bruger
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Har du allerede en bruger?{" "}
              <button
                type="button"
                className="font-bold text-accent"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode("login");
                }}
              >
                Log ind
              </button>
            </>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              className="font-bold text-accent"
              onClick={() => {
                setError(null);
                setInfo(null);
                setMode("login");
              }}
            >
              Tilbage til login
            </button>
          )}
        </p>
      </form>
    </div>
  );
}
