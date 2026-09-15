import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Giver lidt ekstra tid, hvis der en dag skal sendes mange mails.
export const maxDuration = 60;

// Køres automatisk én gang om dagen af Vercel (se vercel.json).
// Finder ALLE runder (Superliga og NFL - se supabase/nfl.sql), hvis første
// kamp starter inden for det næste døgns tid, og sender en "husk at
// tippe"-mail til alle, der mangler at tippe mindst én kamp i runden.
// Håndterer flere runder pr. dag (ikke kun én ad gangen), så begge sporte
// kan have en runde, der starter samme dag, uden at den ene overses.
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
    .select("round_id, kickoff_at, rounds!inner(id, number, sport, reminder_sent_at)")
    .gte("kickoff_at", windowStart)
    .lte("kickoff_at", windowEnd)
    .is("rounds.reminder_sent_at", null)
    .order("kickoff_at", { ascending: true });

  type TargetRound = { id: string; number: number; sport: "superliga" | "nfl" };

  // Flere kampe kan pege på samme runde - reducér til én forekomst pr. runde
  // (den tidligste kickoff bestemmer rækkefølgen, ligesom før).
  const roundsSeen = new Set<string>();
  const targets: TargetRound[] = [];
  for (const m of (upcomingMatches ?? []) as unknown as {
    round_id: string;
    rounds: TargetRound;
  }[]) {
    if (roundsSeen.has(m.round_id)) continue;
    roundsSeen.add(m.round_id);
    targets.push(m.rounds);
  }

  if (targets.length === 0) {
    return Response.json({ ok: true, message: "Ingen runde at minde om lige nu." });
  }

  // Hent e-mailadresser, navne og tilmeldinger én gang - bruges på tværs af
  // alle runder.
  const [{ data: profiles }, { data: usersPage }, { data: participantRows }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("sport_participants").select("user_id, sport").eq("status", "joined"),
  ]);
  const emailById = new Map((usersPage?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  // Hvem må mindes om hvilken sport? Brugeren vælger selv sine konkurrencer
  // på forsiden, og påmindelser skal følge det valg - ellers ville den, der
  // kun spiller NFL, få "husk at tippe Superliga"-mails, og omvendt. Samme
  // regel som i selve appen, se src/lib/participation.ts.
  const deltagere = new Set(
    (participantRows ?? []).map((r) => `${r.user_id}-${r.sport}`)
  );
  function mayBeRemindedAbout(sport: "superliga" | "nfl", userId: string) {
    return deltagere.has(`${userId}-${sport}`);
  }

  const results: { round: number; sport: string; sent: number; missing: number; message?: string }[] = [];

  for (const target of targets) {
    const roundId = target.id;
    const roundNumber = target.number;
    const sport = target.sport;
    const sportLabel = sport === "nfl" ? "NFL " : "";

    const [{ data: roundMatches }, { data: tips }] = await Promise.all([
      supabase.from("matches").select("id").eq("round_id", roundId),
      supabase
        .from("tips")
        .select("user_id, match_id, matches!inner(round_id)")
        .eq("matches.round_id", roundId),
    ]);

    const matchIds = (roundMatches ?? []).map((m) => m.id);
    if (matchIds.length === 0) {
      results.push({ round: roundNumber, sport, sent: 0, missing: 0, message: "Ingen kampe endnu." });
      continue;
    }

    // Byg et sæt af "user_id-match_id" for alle allerede indtastede tips i runden.
    const tippedSet = new Set((tips ?? []).map((t) => `${t.user_id}-${t.match_id}`));

    const missingUserIds = (profiles ?? [])
      .filter((p) => mayBeRemindedAbout(sport, p.id))
      .filter((p) => matchIds.some((matchId) => !tippedSet.has(`${p.id}-${matchId}`)))
      .map((p) => p.id);

    if (missingUserIds.length === 0) {
      await supabase.from("rounds").update({ reminder_sent_at: now.toISOString() }).eq("id", roundId);
      results.push({ round: roundNumber, sport, sent: 0, missing: 0, message: "Alle havde allerede tippet." });
      continue;
    }

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
          subject: `Husk at tippe ${sportLabel}runde ${roundNumber}, inden kampene går i gang!`,
          html: `
            <div style="font-family: sans-serif; font-size: 15px; color: #111; max-width: 420px;">
              <p>Hej ${name}!</p>
              <p>${sportLabel}Runde ${roundNumber} starter snart, og du har endnu ikke tippet alle kampene. Skynd dig at få dine tips ind, inden den første kamp fløjtes i gang - så du ikke går glip af point.</p>
              <p>
                <a href="https://ugenstipper.dk/tip?sport=${sport}" style="display:inline-block;background:#0F62FE;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
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

    results.push({ round: roundNumber, sport, sent, missing: missingUserIds.length });
  }

  return Response.json({ ok: true, rounds: results });
}
