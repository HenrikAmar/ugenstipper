"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMiniliga,
  joinMiniliga,
  leaveMiniliga,
  inviteToMiniliga,
} from "@/app/actions/miniliga";

type Mode = "opret" | "deltag" | null;

export function MiniligaCard({
  leagueName,
  hasPassword,
}: {
  leagueName: string | null;
  hasPassword: boolean;
}) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  function resetForm() {
    setMode(null);
    setError(null);
    setName("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "opret"
        ? await createMiniliga(name, password)
        : await joinMiniliga(name, password);

    if (result?.error) {
      setError(result.error);
    } else {
      resetForm();
      router.refresh();
    }

    setLoading(false);
  }

  async function handleLeave() {
    setLoading(true);
    await leaveMiniliga();
    router.refresh();
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteStatus(null);
    setInviteSending(true);

    const result = await inviteToMiniliga(inviteEmail, invitePassword);

    if (result?.error) {
      setInviteStatus({ type: "error", text: result.error });
    } else {
      setInviteStatus({ type: "success", text: "Invitationen er sendt!" });
      setInviteEmail("");
      setInvitePassword("");
    }

    setInviteSending(false);
  }

  if (leagueName) {
    return (
      <div className="card mx-5 mt-3 flex flex-col gap-3 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold">Miniliga</span>
          <span className="rounded-full bg-[#CFF0E1] px-2 py-0.5 text-[12px] font-bold text-accent">
            {leagueName}
          </span>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col gap-2">
          <input
            type="email"
            name="miniliga-invite-email"
            autoComplete="off"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="vens@eksempel.dk"
            className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
          />
          {hasPassword && (
            <input
              type="password"
              name="miniliga-invite-kode"
              autoComplete="off"
              required
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="Miniligaens kode"
              className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
            />
          )}
          <button
            type="submit"
            disabled={inviteSending}
            className="h-[46px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {inviteSending ? "Sender …" : "Inviter til miniligaen"}
          </button>
        </form>

        {inviteStatus && (
          <p
            className={`text-[13px] font-medium ${
              inviteStatus.type === "success" ? "text-accent" : "text-danger"
            }`}
          >
            {inviteStatus.text}
          </p>
        )}

        <button
          type="button"
          onClick={handleLeave}
          disabled={loading}
          className="text-[12.5px] font-semibold text-danger underline disabled:opacity-60"
        >
          Forlad miniliga
        </button>
      </div>
    );
  }

  return (
    <div className="card mx-5 mt-3 flex flex-col gap-3 rounded-xl p-4">
      <span className="text-[13px] font-bold">Miniliga</span>

      {mode === null ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("opret")}
            className="h-[46px] flex-1 rounded-[10px] bg-accent-2 text-[15px] font-bold text-white"
          >
            Opret
          </button>
          <button
            type="button"
            onClick={() => setMode("deltag")}
            className="h-[46px] flex-1 rounded-[10px] border border-border text-[15px] font-bold"
          >
            Deltag
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            name="miniliga-navn"
            autoComplete="off"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navn på miniliga"
            className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
          />
          <input
            type="password"
            name="miniliga-kode"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "opret" ? "Kode (valgfrit)" : "Kode (hvis der er en)"}
            className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-[46px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {loading ? "Et øjeblik …" : mode === "opret" ? "Opret miniliga" : "Deltag i miniliga"}
          </button>
          <button type="button" onClick={resetForm} className="text-[12.5px] font-semibold text-text-muted underline">
            Annuller
          </button>
        </form>
      )}

      {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
    </div>
  );
}
