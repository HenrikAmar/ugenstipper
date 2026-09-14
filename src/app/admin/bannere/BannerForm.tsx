"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createBanner, type BannerFormState } from "./actions";

const initialState: BannerFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 h-10 self-start rounded-lg bg-accent-2 px-5 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "Opretter …" : "Opret banner"}
    </button>
  );
}

export function BannerForm() {
  const [state, formAction] = useFormState(createBanner, initialState);

  return (
    <form action={formAction} className="card mt-6 flex flex-col gap-3 rounded-xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">
          Navn (kun til dig - vises ikke til brugerne)
        </label>
        <input
          name="title"
          required
          placeholder="Fx: Tiny Mobile Robots"
          className="h-10 rounded-lg border border-border px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Link</label>
        <input
          name="link_url"
          type="url"
          required
          placeholder="https://…"
          className="h-10 rounded-lg border border-border px-3 text-sm"
        />
        <span className="text-[10px] text-text-muted">
          Åbner i et nyt faneblad, når nogen klikker på banneret.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Vægt</label>
        <input
          name="weight"
          type="number"
          min={1}
          required
          defaultValue={50}
          className="h-10 w-28 rounded-lg border border-border px-3 text-sm"
        />
        <span className="text-[10px] text-text-muted">
          Bestemmer hvor ofte banneret vises ift. de andre aktive bannere - behøver ikke summe
          til 100. Fx vægt 50, 25 og 25 på tre bannere giver præcis den fordeling.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Aldersgrænse (valgfrit)</label>
        <input
          name="min_age"
          type="number"
          min={1}
          placeholder="Fx 18"
          className="h-10 w-28 rounded-lg border border-border px-3 text-sm"
        />
        <span className="text-[10px] text-text-muted">
          Vises kun til brugere der (ifølge deres fødselsdato) er mindst så gamle - fx 18 til
          betting-reklamer. Lad stå tomt for ingen aldersgrænse.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Billede</label>
        <input name="image" type="file" accept="image/*" required className="text-sm" />
      </div>
      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
