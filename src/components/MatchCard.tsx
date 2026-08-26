"use client";

import { useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import { saveTip } from "@/app/tip/actions";
import type { Match, Tip } from "@/lib/types";

function formatKickoff(iso: string) {
  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat("da-DK", { weekday: "short" }).format(date);
  const day = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short" }).format(
    date
  );
  const time = new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${weekday}. ${day} · ${time}`;
}

export function MatchCard({
  match,
  existingTip,
}: {
  match: Match;
  existingTip: Tip | undefined;
}) {
  const locked = new Date(match.kickoff_at) <= new Date();
  const finished = match.result_home !== null && match.result_away !== null;

  const [tipHome, setTipHome] = useState(existingTip?.tip_home?.toString() ?? "");
  const [tipAway, setTipAway] = useState(existingTip?.tip_away?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(existingTip));
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const h = parseInt(tipHome, 10);
    const a = parseInt(tipAway, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) {
      setError("Udfyld begge felter.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await saveTip(match.id, h, a);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  if (locked) {
    return (
      <div className="card flex flex-col gap-2.5 rounded-card border-border bg-surface-2 p-4 opacity-80">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamBadge team={match.home_team} />
            <span className="truncate text-sm font-semibold">{match.home_team}</span>
          </div>
          <div className="flex items-center gap-2 font-heading text-base font-bold text-text-muted">
            <span>{finished ? match.result_home : existingTip?.tip_home ?? "–"}</span>
            <span className="text-[#B7BEC9]">–</span>
            <span>{finished ? match.result_away : existingTip?.tip_away ?? "–"}</span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2.5">
            <span className="truncate text-sm font-semibold">{match.away_team}</span>
            <TeamBadge team={match.away_team} />
          </div>
        </div>
        <div className="flex items-center justify-between text-[11.5px] font-semibold text-text-muted">
          <span>
            {finished
              ? existingTip
                ? `Din tip: ${existingTip.tip_home}-${existingTip.tip_away}`
                : "Du tippede ikke på denne kamp"
              : "Kampen er i gang · dit tip er låst"}
          </span>
          {finished && existingTip?.points !== null && existingTip?.points !== undefined && (
            <span className="font-bold text-accent">+{existingTip.points} point</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-2.5 rounded-card p-4 shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamBadge team={match.home_team} />
          <span className="truncate text-sm font-semibold">{match.home_team}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            inputMode="numeric"
            value={tipHome}
            onChange={(e) => {
              setTipHome(e.target.value.replace(/[^0-9]/g, ""));
              setSaved(false);
            }}
            className="h-[34px] w-[34px] rounded-lg border border-accent-2 bg-accent-tint text-center font-heading text-[15px] font-bold text-accent"
          />
          <span className="font-bold text-[#B7BEC9]">–</span>
          <input
            inputMode="numeric"
            value={tipAway}
            onChange={(e) => {
              setTipAway(e.target.value.replace(/[^0-9]/g, ""));
              setSaved(false);
            }}
            className="h-[34px] w-[34px] rounded-lg border border-accent-2 bg-accent-tint text-center font-heading text-[15px] font-bold text-accent"
          />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2.5">
          <span className="truncate text-sm font-semibold">{match.away_team}</span>
          <TeamBadge team={match.away_team} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-text-muted">
          {formatKickoff(match.kickoff_at)}
        </span>

        {error ? (
          <span className="text-[11.5px] font-semibold text-danger">{error}</span>
        ) : saved ? (
          <div className="flex items-center gap-2.5">
            <span className="text-[11.5px] font-bold text-accent">✓ Gemt</span>
            <button
              onClick={() => setSaved(false)}
              className="text-[11.5px] font-semibold text-text-muted underline underline-offset-2"
            >
              Ret tip
            </button>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-accent-2 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
          >
            {saving ? "Gemmer …" : "Gem tip"}
          </button>
        )}
      </div>
    </div>
  );
}