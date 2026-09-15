"use client";

import Link from "next/link";
import type { Round, Sport } from "@/lib/types";
import { roundLabel } from "@/lib/rounds";

export function RoundTabs({
  rounds,
  activeRoundId,
  basePath,
  sport,
}: {
  rounds: Round[];
  activeRoundId: string;
  basePath: string;
  // Skal med i linket, så et rundeskift ikke utilsigtet skifter tilbage til
  // Superliga (default), hvis brugeren står på NFL - se src/lib/types.ts.
  sport: Sport;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-1">
      {rounds.map((round) => {
        const active = round.id === activeRoundId;
        return (
          <Link
            key={round.id}
            href={`${basePath}?sport=${sport}&runde=${round.id}`}
            className={`pill whitespace-nowrap ${
              active
                ? "bg-navy text-white"
                : "border border-border bg-surface text-text-muted"
            }`}
          >
            {roundLabel(round)}
            {round.is_current ? " · Aktuel" : ""}
          </Link>
        );
      })}
    </div>
  );
}
