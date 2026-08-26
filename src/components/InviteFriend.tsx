"use client";

import { useState } from "react";
import { inviteFriend } from "@/app/actions/invite";

export function InviteFriend({ qualifiedInvites }: { qualifiedInvites: number }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setSending(true);

    const result = await inviteFriend(email);

    if (result?.error) {
      setStatus({ type: "error", text: result.error });
    } else {
      setStatus({ type: "success", text: "Invitationen er sendt!" });
      setEmail("");
    }

    setSending(false);
  }

  return (
    <div className="card mx-5 mt-3 flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold">Inviter en ven</span>
        <span className="rounded-full bg-[#CFF0E1] px-2 py-0.5 text-[12px] font-bold text-accent">
          {qualifiedInvites} {qualifiedInvites === 1 ? "ven" : "venner"}
        </span>
      </div>

      <form onSubmit={handleInvite} className="flex flex-col gap-2">
        <input
          type="email"
          name="ven-email"
          autoComplete="off"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vens@eksempel.dk"
          className="h-12 rounded-[10px] border border-border bg-surface px-3.5 text-[15px]"
        />
        <button
          type="submit"
          disabled={sending}
          className="h-[46px] rounded-[10px] bg-accent-2 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {sending ? "Sender …" : "Inviter ven"}
        </button>
      </form>

      {status && (
        <p
          className={`text-[13px] font-medium ${
            status.type === "success" ? "text-accent" : "text-danger"
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
