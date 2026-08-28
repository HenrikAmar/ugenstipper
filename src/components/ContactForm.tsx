"use client";

import { useState } from "react";

export function ContactForm({
  sendContactMessage,
  defaultEmail,
}: {
  sendContactMessage: (input: {
    subject: string;
    fromEmail: string;
    message: string;
  }) => Promise<{ ok: boolean }>;
  defaultEmail?: string;
}) {
  const [subject, setSubject] = useState("");
  const [fromEmail, setFromEmail] = useState(defaultEmail ?? "");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result = await sendContactMessage({ subject, fromEmail, message });
    setStatus(result.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return (
      <div className="card mx-5 mt-4 flex flex-col items-center gap-1.5 rounded-xl p-6 text-center">
        <p className="text-[15px] font-bold">Tak! Din besked er sendt.</p>
        <p className="text-[13px] text-text-muted">Vi vender tilbage til dig hurtigst muligt.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-5 mt-4 flex flex-col gap-3 rounded-xl p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold">Emne</label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Hvad handler det om?"
          className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold">Din e-mail</label>
        <input
          type="email"
          required
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="din@mail.dk"
          className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold">Besked</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Skriv din besked her …"
          className="rounded-[10px] border border-border bg-surface px-3.5 py-3 text-[15px]"
        />
      </div>

      {status === "error" && (
        <p className="text-[13px] font-medium text-danger">
          Der gik noget galt. Prøv igen, eller send en mail direkte til info@ugenstipper.dk.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-[46px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
      >
        {status === "loading" ? "Sender …" : "Send"}
      </button>
    </form>
  );
}