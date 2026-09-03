"use client";

import { useState, useTransition } from "react";
import { AVATAR_PALETTE } from "@/components/TeamBadge";
import { setAvatarColor } from "@/app/profil/actions";

// Lader brugeren selv vælge sin badge-farve blandt de 8 faste farver, i
// stedet for at få tildelt én automatisk - midlertidig løsning indtil
// rigtige klublogoer kan bruges (se avatar_farve.sql).
export function AvatarColorPicker({ currentColor }: { currentColor: string | null }) {
  const [selected, setSelected] = useState(currentColor);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePick(color: string) {
    // Klikker man på den allerede valgte farve igen, nulstiller vi til den
    // automatiske farve i stedet.
    const next = selected === color ? null : color;
    const previous = selected;
    setSelected(next);
    setError(null);
    startTransition(async () => {
      const result = await setAvatarColor(next);
      if (result.error) {
        setError(result.error);
        setSelected(previous);
      }
    });
  }

  return (
    <div className="card mx-5 mt-4 rounded-xl p-4">
      <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
        Vælg din farve
      </h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
        Din badge-farve bliver normalt tildelt automatisk. Utilfreds - fx med at have fået lilla?
        Vælg selv en af de 8 farver her.
      </p>
      <div className="mt-3 grid grid-cols-4 justify-items-center gap-y-3">
        {AVATAR_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePick(color)}
            disabled={pending}
            aria-label={`Vælg farven ${color}`}
            aria-pressed={selected === color}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition disabled:opacity-60 ${
              selected === color ? "ring-2 ring-offset-2 ring-navy" : ""
            }`}
            style={{ backgroundColor: color }}
          >
            {selected === color && <span className="text-[16px] font-bold text-white">✓</span>}
          </button>
        ))}
      </div>
      {selected && (
        <button
          type="button"
          onClick={() => handlePick(selected)}
          disabled={pending}
          className="mt-3 text-[12px] font-semibold text-text-muted underline underline-offset-2"
        >
          Nulstil til automatisk farve
        </button>
      )}
      {error && <p className="mt-2 text-[12px] font-semibold text-danger">{error}</p>}
    </div>
  );
}
