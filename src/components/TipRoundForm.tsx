"use client";

import { useState, useTransition } from "react";
import { MatchCard } from "@/components/MatchCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { saveTips } from "@/app/tip/actions";
import type { Match, Tip } from "@/lib/types";

type TipValue = { home: string; away: string };
type PendingSave = {
  entries: { matchId: string; tipHome: number; tipAway: number }[];
  deletions: string[];
  missingCount: number;
};

// Al logik for at udfylde og gemme en hel rundes tips samlet - i stedet for
// at hver kamp har sin egen "gem"-knap, samler denne komponent alle
// felterne i sin egen tilstand og gemmer det hele med ét databasekald, når
// man trykker "Gem runde" nederst på siden.
export function TipRoundForm({
  matches,
  tipsByMatch,
}: {
  matches: Match[];
  tipsByMatch: Record<string, Tip>;
}) {
  const [values, setValues] = useState<Record<string, TipValue>>(() => {
    const initial: Record<string, TipValue> = {};
    for (const match of matches) {
      const tip = tipsByMatch[match.id];
      initial[match.id] = {
        home: tip ? String(tip.tip_home) : "",
        away: tip ? String(tip.tip_away) : "",
      };
    }
    return initial;
  });

  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  // Sat, mens vi venter på svar fra den brandede "er du sikker"-boks -
  // rummer det, der skal gemmes/fjernes, hvis brugeren bekræfter.
  const [pendingDeleteConfirm, setPendingDeleteConfirm] = useState<PendingSave | null>(null);

  const editableMatches = matches.filter((match) => new Date(match.kickoff_at) > new Date());

  function handleChange(matchId: string, home: string, away: string) {
    setValues((prev) => ({ ...prev, [matchId]: { home, away } }));
    setStatus(null);
  }

  function handleSubmit() {
    const entries: { matchId: string; tipHome: number; tipAway: number }[] = [];
    // Kampe hvor der allerede lå et gemt tip, men felterne nu er ryddet - det
    // skal rent faktisk fjerne tippet, ikke bare stå urørt i databasen.
    const deletions: string[] = [];

    for (const match of editableMatches) {
      const value = values[match.id];
      const isEmpty = !value || (value.home === "" && value.away === "");

      if (isEmpty) {
        if (tipsByMatch[match.id]) deletions.push(match.id);
        continue;
      }

      const home = parseInt(value.home, 10);
      const away = parseInt(value.away, 10);
      if (Number.isNaN(home) || Number.isNaN(away)) {
        setStatus({
          type: "error",
          message: `Udfyld begge felter for ${match.home_team} - ${match.away_team}.`,
        });
        return;
      }
      entries.push({ matchId: match.id, tipHome: home, tipAway: away });
    }

    if (entries.length === 0 && deletions.length === 0) {
      setStatus({ type: "error", message: "Udfyld mindst én kamp, før du gemmer." });
      return;
    }

    // Kun kampe der stadig var åbne for tips (ikke låste) tæller med her -
    // mangler man en kamp fordi den nåede at låse, før man kom til den, skal
    // det IKKE udløse en advarsel, kun hvis man reelt sprang en åben kamp over
    // (eller aktivt fjernede sit tip).
    const missingCount = editableMatches.length - entries.length;

    // Ekstra sikkerhed: at fjerne et allerede gemt tip er en definitiv
    // handling, så be om et sidste "er du sikker" - især vigtigt hvis flere
    // kampe rammes på én gang, det bør normalt aldrig ske ved et uheld.
    if (deletions.length > 0) {
      setPendingDeleteConfirm({ entries, deletions, missingCount });
      return;
    }

    runSave({ entries, deletions, missingCount });
  }

  function runSave({ entries, deletions, missingCount }: PendingSave) {
    startTransition(async () => {
      const result = await saveTips(entries, deletions);
      if (result.error) {
        setStatus({ type: "error", message: result.error });
      } else if (missingCount > 0) {
        setStatus({
          type: "warning",
          message: `Tip er gemt. VIGTIGT - du mangler at tippe ${missingCount} kamp${
            missingCount === 1 ? "" : "e"
          }!`,
        });
      } else if (entries.length === 0 && deletions.length > 0) {
        setStatus({ type: "success", message: "Dit tip er fjernet." });
      } else {
        setStatus({ type: "success", message: "Rundens tips er gemt!" });
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-5">
        {matches.length === 0 && (
          <p className="text-sm text-text-muted">Ingen kampe oprettet i denne runde endnu.</p>
        )}
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            existingTip={tipsByMatch[match.id]}
            value={values[match.id] ?? { home: "", away: "" }}
            onChange={(home, away) => handleChange(match.id, home, away)}
          />
        ))}
      </div>

      {editableMatches.length > 0 && (
        <div className="px-5 pt-4">
          {status && (
            <p
              className={`mb-2.5 text-center text-[13px] font-semibold ${
                status.type === "error"
                  ? "text-danger"
                  : status.type === "warning"
                    ? "text-amber-600"
                    : "text-accent"
              }`}
            >
              {status.message}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex h-14 w-full items-center justify-center rounded-[14px] bg-accent-2 text-[16px] font-extrabold text-white disabled:opacity-60"
          >
            {pending ? "Gemmer …" : "Gem runde"}
          </button>
        </div>
      )}

      {pendingDeleteConfirm && (
        <ConfirmDialog
          title="Fjern gemt tip?"
          message={
            pendingDeleteConfirm.deletions.length === 1
              ? "Du har ryddet et allerede gemt tip. Er du sikker på, at det skal fjernes?"
              : `Du har ryddet ${pendingDeleteConfirm.deletions.length} allerede gemte tips. Er du sikker på, at de skal fjernes?`
          }
          confirmLabel="Ja, fjern"
          cancelLabel="Annuller"
          onCancel={() => setPendingDeleteConfirm(null)}
          onConfirm={() => {
            const toSave = pendingDeleteConfirm;
            setPendingDeleteConfirm(null);
            runSave(toSave);
          }}
        />
      )}
    </>
  );
}
