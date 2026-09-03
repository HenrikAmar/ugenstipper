"use client";

import { TeamBadge } from "@/components/TeamBadge";
import type { Match, Tip } from "@/lib/types";

// Viser altid dansk tid (Europe/Copenhagen), uanset hvor i verden man selv sidder,
// og uanset om siden først bliver tegnet op på serveren (som kører i UTC).
const TIME_ZONE = "Europe/Copenhagen";

function formatKickoff(iso: string) {
  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat("da-DK", {
    weekday: "short",
    timeZone: TIME_ZONE,
  }).format(date);
  const day = new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(date);
  const time = new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
  return `${weekday}. ${day} · ${time}`;
}

export function MatchCard({
  match,
  existingTip,
  value,
  onChange,
}: {
  match: Match;
  existingTip: Tip | undefined;
  // Styres af den samlede formular (TipRoundForm) - denne kortkomponent har
  // ikke længere sin egen "gem"-knap eller egen tilstand for tippet.
  value: { home: string; away: string };
  onChange: (home: string, away: string) => void;
}) {
  const locked = new Date(match.kickoff_at) <= new Date();
  const finished = match.result_home !== null && match.result_away !== null;

  if (locked) {
    // "Dit tip"-linjen og "kampen er i gang"-linjen skal fremstå lige så
    // tydelige som holdnavnene (text-sm) - kun "Du tippede ikke på denne
    // kamp" (ingen tip at fremhæve) beholder den mindre skriftstørrelse.
    const footerTextSize = finished && !existingTip ? "text-[11.5px]" : "text-sm";

    return (
      <div className="card flex flex-col gap-2.5 rounded-card border-border bg-surface-2 p-4 opacity-80">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamBadge team={match.home_team} />
            <span className="truncate text-sm font-semibold">{match.home_team}</span>
          </div>
          <div className="flex items-center gap-2 font-heading text-base font-bold text-text-muted">
            {/* Mens kampen er i gang (ikke længere kun "låst", men heller ikke
                afgjort endnu) skal felterne stå tomme - de må aldrig vise
                brugerens eget tip som om det var stillingen. */}
            <span>{finished ? match.result_home : "–"}</span>
            <span className="text-[#B7BEC9]">–</span>
            <span>{finished ? match.result_away : "–"}</span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2.5">
            <span className="truncate text-sm font-semibold">{match.away_team}</span>
            <TeamBadge team={match.away_team} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 font-semibold text-text-muted">
          <span className={footerTextSize}>
            {finished
              ? existingTip
                ? `Dit tip: ${existingTip.tip_home}-${existingTip.tip_away}`
                : "Du tippede ikke på denne kamp"
              : existingTip
                ? `Kampen er i gang · dit tip er låst (${existingTip.tip_home}-${existingTip.tip_away})`
                : "Kampen er i gang · dit tip er låst"}
          </span>
          {finished && existingTip?.points !== null && existingTip?.points !== undefined && (
            <span className="shrink-0 text-[11.5px] font-bold text-accent">
              +{existingTip.points} point
            </span>
          )}
        </div>
      </div>
    );
  }

  // Er det der står i felterne lige nu allerede gemt i databasen? Bruges kun
  // til det lille "✓ Gemt"-praj - selve gemningen sker samlet for hele
  // runden via "Gem runde"-knappen nederst på siden.
  const savedAsIs =
    Boolean(existingTip) &&
    value.home === (existingTip?.tip_home?.toString() ?? "") &&
    value.away === (existingTip?.tip_away?.toString() ?? "");

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
            value={value.home}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""), value.away)}
            className="h-[34px] w-[34px] rounded-lg border border-accent-2 bg-accent-tint text-center font-heading text-[15px] font-bold text-accent"
          />
          <span className="font-bold text-[#B7BEC9]">–</span>
          <input
            inputMode="numeric"
            value={value.away}
            onChange={(e) => onChange(value.home, e.target.value.replace(/[^0-9]/g, ""))}
            className="h-[34px] w-[34px] rounded-lg border border-accent-2 bg-accent-tint text-center font-heading text-[15px] font-bold text-accent"
          />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2.5">
          <span className="truncate text-sm font-semibold">{match.away_team}</span>
          <TeamBadge team={match.away_team} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-muted">
          {formatKickoff(match.kickoff_at)}
        </span>
        {savedAsIs && <span className="text-[11.5px] font-bold text-accent">✓ Gemt</span>}
      </div>
    </div>
  );
}
