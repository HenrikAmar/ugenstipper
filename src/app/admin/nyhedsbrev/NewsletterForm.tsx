"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendNewsletter, type NewsletterFormState } from "./actions";

const initialState: NewsletterFormState = { error: null, success: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!pending && !confirm("Sender du nu nyhedsbrevet ud til alle tilmeldte brugere?")) {
          e.preventDefault();
        }
      }}
      className="mt-1 h-10 self-start rounded-lg bg-accent-2 px-5 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "Sender …" : "Send nyhedsbrev"}
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(sendNewsletter, initialState);

  return (
    <form action={formAction} className="card mt-6 flex flex-col gap-3 rounded-xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Emne</label>
        <input
          name="subject"
          required
          placeholder="Fx: Nyt fra Ugenstipper - præmier er i gang!"
          className="h-10 rounded-lg border border-border px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-muted">Tekst</label>
        <textarea
          name="body"
          required
          rows={8}
          placeholder="Selve nyhedsbrevet - almindelig tekst, ingen kode nødvendig."
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <span className="text-[10px] text-text-muted">
          Der bliver automatisk sat &bdquo;Hej [navn]!&ldquo; øverst og et afmeld-link nederst
          for hver modtager - du skal kun skrive selve indholdet.
        </span>
      </div>
      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-accent-tint px-3 py-2 text-xs font-semibold text-accent">
          {state.success}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
