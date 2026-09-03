"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createAnnouncement, type AnnouncementFormState } from "./actions";

const initialState: AnnouncementFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 h-10 self-start rounded-lg bg-accent-2 px-5 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "Opretter …" : "Opret nyhed"}
    </button>
  );
}

export function NyhedForm() {
  const [state, formAction] = useFormState(createAnnouncement, initialState);

  return (
    <form action={formAction} className="card mt-6 flex flex-col gap-3 rounded-xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Titel</label>
        <input
          name="title"
          required
          placeholder="Fx: Nu er der kommet præmier!"
          className="h-10 rounded-lg border border-border px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Tekst</label>
        <textarea
          name="body"
          required
          rows={4}
          placeholder="Selve nyheden - den tekst brugerne ser under titlen."
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Billede (valgfrit)</label>
        <input name="image" type="file" accept="image/*" className="text-sm" />
        <span className="text-[10px] text-text-muted">
          Fx et foto af en trøje, hvis den er præmie. Alle billedformater og -størrelser virker -
          det bliver automatisk beskåret pænt til på forsiden. Billedet vises under teksten.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">
          Billedetekst (valgfrit, vises under billedet)
        </label>
        <input
          name="image_caption"
          placeholder="Fx: Denne rundes præmie - hjemmebanetrøjen"
          className="h-10 rounded-lg border border-border px-3 text-sm"
        />
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
