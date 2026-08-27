"use client";

import { useTransition } from "react";

export function DeleteRoundButton({
  roundId,
  roundNumber,
  deleteRound,
}: {
  roundId: string;
  roundNumber: number;
  deleteRound: (roundId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ok = confirm(
      `Er du sikker på, at du vil slette Runde ${roundNumber}? Alle kampe og tips i runden bliver også slettet - det kan ikke fortrydes.`
    );
    if (!ok) return;
    startTransition(() => {
      void deleteRound(roundId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-danger px-3 py-1.5 text-xs font-bold text-danger"
    >
      {pending ? "Sletter …" : `Slet Runde ${roundNumber}`}
    </button>
  );
}
