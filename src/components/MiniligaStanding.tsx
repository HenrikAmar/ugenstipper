"use client";

import { useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import { buildStickyRanking, type RankRow } from "@/lib/ranking";

export function MiniligaStanding({
  leagueName,
  ranking,
  userId,
}: {
  leagueName: string;
  ranking: RankRow[];
  userId: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);

  const display = expanded
    ? { rows: ranking.map((row, i) => ({ ...row, rank: i + 1 })), showGap: false }
    : buildStickyRanking(ranking, userId, 3);

  return (
    <div className="mt-6 px-5">
      <h2 className="mb-2 text-[13px] font-bold text-text-muted">Miniliga – {leagueName}</h2>

      <div className="flex flex-col gap-2">
        {display.rows.map((row, i) => {
          const isMe = row.id === userId;
          const isPinned = display.showGap && i === display.rows.length - 1;
          return (
            <div key={row.id} className="flex flex-col gap-2">
              {isPinned && <div className="text-center text-sm text-text-muted">⋯</div>}
              <div
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isMe
                    ? "border-[1.5px] border-accent-2 bg-accent-tint"
                    : "border-border bg-surface"
                }`}
              >
                <div className="w-5 text-center font-heading text-sm font-bold text-text-muted">
                  {row.rank}
                </div>
                <TeamBadge team={row.display_name} size={34} colorOverride={row.avatar_color} />
                <div className="flex-1 text-sm font-bold">
                  {row.display_name}
                  {isMe && (
                    <span className="ml-1.5 rounded-full bg-[#CFF0E1] px-1.5 py-0.5 text-[10px] font-bold text-accent">
                      DIG
                    </span>
                  )}
                </div>
                <div className="w-10 text-right font-heading text-base font-extrabold">
                  {row.points}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full text-center text-[12.5px] font-semibold text-accent underline"
        >
          {expanded ? "Vis kun top 3" : "Udvid liga"}
        </button>
      )}
    </div>
  );
}
