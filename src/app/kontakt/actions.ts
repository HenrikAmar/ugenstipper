"use server";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Sender en besked fra kontaktformularen til Henrik via Resend - ingen
// afhængighed af at info@ugenstipper.dk rent faktisk modtager mail nogen steder.
export async function sendContactMessage(input: {
  subject: string;
  fromEmail: string;
  message: string;
}): Promise<{ ok: boolean }> {
  const subject = input.subject.trim();
  const fromEmail = input.fromEmail.trim();
  const message = input.message.trim();

  if (!subject || !fromEmail || !message) {
    return { ok: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ugenstipper <info@ugenstipper.dk>",
        to: ["henrikwaarst+ut@gmail.com"],
        reply_to: fromEmail,
        subject: `Kontakt fra Ugenstipper: ${subject}`,
        html: `
          <div style="font-family: sans-serif; font-size: 15px; color: #111; max-width: 480px;">
            <p><strong>Fra:</strong> ${escapeHtml(fromEmail)}</p>
            <p><strong>Emne:</strong> ${escapeHtml(subject)}</p>
            <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
        `,
      }),
    });

    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}