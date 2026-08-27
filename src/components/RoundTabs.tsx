"use client";

import Link from "next/link";
import type { Round } from "@/lib/types";
import { roundLabel } from "@/lib/rounds";

export function RoundTabs({
  rounds,
  activeRoundId,
  basePath,
}: {
  rounds: Round[];
  activeRoundId: string;
  basePath: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-1">
      {rounds.map((round) => {
        const active = round.id === activeRoundId;
        return (
          <Link
            key={round.id}
            href={`${basePath}?runde=${round.id}`}
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
