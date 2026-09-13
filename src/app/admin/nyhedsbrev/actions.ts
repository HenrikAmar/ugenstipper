"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/tip");
}

// Undgår at brugerens egen tekst ved et uheld kan ødelægge mailens HTML
// (fx hvis nogen skriver "5 < 10" i teksten).
function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface NewsletterFormState {
  error: string | null;
  success: string | null;
}

export async function sendNewsletter(
  _prevState: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  await requireAdmin();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) {
    return { error: "Udfyld både emne og tekst.", success: null };
  }

  // Bruger admin-klienten herfra, da vi skal bruge auth.admin.listUsers til
  // at hente e-mailadresser (profiles-tabellen gemmer ikke selve e-mailen) -
  // se samme mønster i src/app/api/cron/tip-reminder.
  const admin = createAdminClient();

  const [{ data: profiles }, { data: usersPage }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, unsubscribe_token")
      .eq("newsletter_opt_out", false),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = new Map((usersPage?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const bodyHtml = escapeHtml(body).replace(/\n/g, "<br>");

  let sent = 0;
  for (const profile of profiles ?? []) {
    const email = emailById.get(profile.id);
    if (!email) continue;

    const unsubscribeUrl = `https://ugenstipper.dk/nyhedsbrev/afmeld?token=${profile.unsubscribe_token}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ugenstipper <info@ugenstipper.dk>",
        to: [email],
        subject,
        html: `
          <div style="font-family: sans-serif; font-size: 15px; color: #111; max-width: 480px;">
            <p>Hej ${profile.display_name}!</p>
            <div>${bodyHtml}</div>
            <p style="margin-top: 28px; font-size: 12px; color: #888;">
              Du får denne mail fordi du er oprettet på Ugenstipper.dk.
              <a href="${unsubscribeUrl}" style="color: #888;">Afmeld nyhedsbrevet</a>
            </p>
          </div>
        `,
      }),
    });

    if (res.ok) sent += 1;
  }

  return {
    error: null,
    success: `Nyhedsbrev sendt til ${sent} af ${profiles?.length ?? 0} tilmeldte brugere.`,
  };
}
