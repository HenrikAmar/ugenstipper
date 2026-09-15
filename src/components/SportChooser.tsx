"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSportEnabled } from "@/app/actions/sport";
import { ALL_SPORTS, SPORT_NAMES } from "@/lib/participation";
import type { Sport } from "@/lib/types";

const BESKRIVELSER: Record<Sport, string> = {
  superliga:
    "Tip alle kampe i Superligaen, runde for runde - plus bonusrunder, når danske hold spiller i Europa.",
  nfl: "Tip NFL-kampene i sin helt egen konkurrence, med egen stilling og egne miniligaer.",
};

/**
 * Her vælger brugeren sine konkurrencer. Står på forsiden (så man møder den
 * hver gang) og på profilen (så den kan findes igen som en indstilling).
 *
 * Resten af appen retter sig efter valget: er man kun med i én sport,
 * forsvinder faneblade-skifteren helt, og man ser aldrig den anden
 * konkurrences kampe, stilling eller påmindelses-mails.
 */
export function SportChooser({ userSports }: { userSports: Sport[] }) {
  const router = useRouter();
  const [venter, setVenter] = useState<Sport | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);

  async function toggle(sport: Sport, enabled: boolean) {
    setFejl(null);
    setVenter(sport);
    const result = await setSportEnabled(sport, enabled);
    if (result?.error) setFejl(result.error);
    else router.refresh();
    setVenter(null);
  }

  return (
    <div className="card mx-5 mt-5 flex flex-col gap-3 rounded-xl p-4">
      <div>
        <h2 className="text-[15px] font-bold">Dine konkurrencer</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
          Vælg, hvad du vil være med i. Du ser kun det, du har valgt til - og du
          kan altid skifte her.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {ALL_SPORTS.map((sport) => {
          const erMed = userSports.includes(sport);
          const erSidste = erMed && userSports.length === 1;

          return (
            <div
              key={sport}
              className={`rounded-xl border p-3 ${
                erMed ? "border-[1.5px] border-accent-2 bg-accent-tint" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[14px] font-bold">{SPORT_NAMES[sport]}</div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-text-muted">
                    {BESKRIVELSER[sport]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(sport, !erMed)}
                  disabled={venter !== null || erSidste}
                  className={`h-[38px] flex-shrink-0 rounded-[10px] px-3.5 text-[13px] font-bold disabled:opacity-60 ${
                    erMed
                      ? "border border-border bg-surface text-text-muted"
                      : "bg-accent-2 text-white"
                  }`}
                >
                  {venter === sport ? "…" : erMed ? "Fravælg" : "Vælg til"}
                </button>
              </div>
              {erSidste && (
                <p className="mt-2 text-[11.5px] text-text-muted">
                  Du skal være med i mindst én konkurrence. Vælg den anden til,
                  hvis du hellere vil spille den.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {fejl && <p className="text-[13px] font-medium text-danger">{fejl}</p>}
    </div>
  );
}
