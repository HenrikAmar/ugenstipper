import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Giver lidt ekstra tid, hvis der en dag skal sendes mange mails.
export const maxDuration = 60;

// Køres automatisk én gang om dagen af Vercel (se vercel.json).
// Finder den runde, hvis første kamp starter inden for det næste døgns tid,
// og sender en "husk at tippe"-mail til alle, der mangler at tippe mindst
// én kamp i runden.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();

  const now = new Date();
  const windowStart = now.toISOString();
  const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();

  // Find kampe, der starter inden for det næste døgns tid (+ lidt margin),
  // og som hører til en runde, vi ikke allerede har sendt en påmindelse for.
  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("round_id, kickoff_at, rounds!inner(id, number, reminder_sent_at)")
    .gte("kickoff_at", windowStart)
    .lte("kickoff_at", windowEnd)
    .is("rounds.reminder_sent_at", null)
    .order("kickoff_at", { ascending: true })
    .limit(1);

  const target = upcomingMatches?.[0] as
    | { round_id: string; rounds: { id: string; number: number } }
    | undefined;

  if (!target) {
    return Response.json({ ok: true, message: "Ingen runde at minde om lige nu." });
  }

  const roundId = target.round_id;
  const roundNumber = target.rounds.number;

  const [{ data: roundMatches }, { data: profiles }, { data: tips }] = await Promise.all([
    supabase.from("matches").select("id").eq("round_id", roundId),
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("tips")
      .select("user_id, match_id, matches!inner(round_id)")
      .eq("matches.round_id", roundId),
  ]);

  const matchIds = (roundMatches ?? []).map((m) => m.id);
  if (matchIds.length === 0) {
    return Response.json({ ok: true, message: "Runden har ingen kampe endnu." });
  }

  // Byg et sæt af "user_id-match_id" for alle allerede indtastede tips i runden.
  const tippedSet = new Set((tips ?? []).map((t) => `${t.user_id}-${t.match_id}`));

  const missingUserIds = (profiles ?? [])
    .filter((p) => matchIds.some((matchId) => !tippedSet.has(`${p.id}-${matchId}`)))
    .map((p) => p.id);

  if (missingUserIds.length === 0) {
    await supabase.from("rounds").update({ reminder_sent_at: now.toISOString() }).eq("id", roundId);
    return Response.json({ ok: true, message: "Alle havde allerede tippet - ingen mails sendt." });
  }

  // Hent e-mailadresser via Supabase Auth admin-API (profiles-tabellen gemmer ikke e-mail).
  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((usersPage?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  let sent = 0;
  for (const userId of missingUserIds) {
    const email = emailById.get(userId);
    if (!email) continue;
    const name = nameById.get(userId) ?? "der";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ugenstipper <info@ugenstipper.dk>",
        to: [email],
        subject: `Husk at tippe runde ${roundNumber}, inden kampene går i gang!`,
        html: `
          <div style="font-family: sans-serif; font-size: 15px; color: #111; max-width: 420px;">
            <p>Hej ${name}!</p>
            <p>Runde ${roundNumber} starter snart, og du har endnu ikke tippet alle kampene. Skynd dig at få dine tips ind, inden den første kamp fløjtes i gang - så du ikke går glip af point.</p>
            <p>
              <a href="https://ugenstipper.dk/tip" style="display:inline-block;background:#0F62FE;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Tip nu
              </a>
            </p>
            <p>Held og lykke!<br />Ugenstipper</p>
          </div>
        `,
      }),
    });

    if (res.ok) sent += 1;
  }

  // Markér runden som "påmindet", så vi ikke sender igen i morgen.
  await supabase.from("rounds").update({ reminder_sent_at: now.toISOString() }).eq("id", roundId);

  return Response.json({ ok: true, round: roundNumber, sent, missing: missingUserIds.length });
}
