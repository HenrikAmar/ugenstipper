"use server";

import { createClient } from "@/lib/supabase/server";

// Sender en invitations-mail på brugerens vegne via Resend.
export async function inviteFriend(email: string) {
  const trimmed = email.trim().toLowerCase();
  const gyldigEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

  if (!trimmed || !gyldigEmail) {
    return { error: "Indtast en gyldig e-mail." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du skal være logget ind for at invitere." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const afsenderNavn = profile?.display_name ?? "En ven";
  const inviteLink = `https://ugenstipper.dk/login?mode=signup&ref=${user.id}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Ugenstipper <info@ugenstipper.dk>",
      to: [trimmed],
      subject: `${afsenderNavn} har inviteret dig til Ugenstipper`,
      html: `
        <div style="font-family: sans-serif; font-size: 15px; color: #111; max-width: 420px;">
          <p>Hej!</p>
          <p><strong>${afsenderNavn}</strong> synes, du skulle være med til at tippe Superligaen på Ugenstipper - helt gratis, ingen odds, bare skarpe tips og en fælles stilling.</p>
          <p>
            <a href="${inviteLink}" style="display:inline-block;background:#0F62FE;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Opret din gratis bruger
            </a>
          </p>
          <p style="color:#888;font-size:13px;">
            Hvis knappen ikke virker, kan du kopiere dette link ind i din browser:<br />
            ${inviteLink}
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    return { error: "Kunne ikke sende invitationen. Prøv igen om lidt." };
  }

  return { success: true };
}
