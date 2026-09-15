"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { danishLocalToUtcISOString } from "@/lib/time";
import { applyMatchResult } from "@/lib/applyMatchResult";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePoints } from "@/lib/points";
import type { Sport } from "@/lib/types";

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

  return supabase;
}

export async function createRound(sport: Sport, formData: FormData) {
  const supabase = await requireAdmin();
  const season = String(formData.get("season") ?? "").trim();
  const number = parseInt(String(formData.get("number") ?? ""), 10);
  const kind = formData.get("kind") === "bonus" ? "bonus" : "liga";
  if (!season || Number.isNaN(number)) return;

  await supabase.from("rounds").insert({ season, number, kind, sport });
  revalidatePath("/admin/kampe");
}

export async function setCurrentRound(roundId: string) {
  const supabase = await requireAdmin();

  // "Kun én indeværende runde ad gangen" gælder nu PR. SPORT (se
  // supabase/nfl.sql) - skal derfor kun fortrænge andre runder inden for
  // SAMME sport som den valgte runde, ikke alle runder globalt (ellers ville
  // det at sætte en NFL-runde som aktuel utilsigtet slukke for den
  // indeværende Superliga-runde, og omvendt).
  const { data: target } = await supabase
    .from("rounds")
    .select("sport")
    .eq("id", roundId)
    .maybeSingle();
  if (!target) return;

  await supabase
    .from("rounds")
    .update({ is_current: false })
    .eq("sport", target.sport)
    .neq("id", roundId);
  await supabase.from("rounds").update({ is_current: true }).eq("id", roundId);
  revalidatePath("/admin/kampe");
  revalidatePath("/tip");
  revalidatePath("/stilling");
}

export async function createMatch(roundId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const homeTeam = String(formData.get("home_team") ?? "").trim();
  const awayTeam = String(formData.get("away_team") ?? "").trim();
  const kickoff = String(formData.get("kickoff_at") ?? "");
  if (!homeTeam || !awayTeam || !kickoff) return;

  await supabase.from("matches").insert({
    round_id: roundId,
    home_team: homeTeam,
    away_team: awayTeam,
    kickoff_at: danishLocalToUtcISOString(kickoff),
  });
  revalidatePath("/admin/kampe");
}

export async function updateMatch(matchId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const homeTeam = String(formData.get("home_team") ?? "").trim();
  const awayTeam = String(formData.get("away_team") ?? "").trim();
  const kickoff = String(formData.get("kickoff_at") ?? "");
  if (!homeTeam || !awayTeam || !kickoff) return;

  await supabase
    .from("matches")
    .update({
      home_team: homeTeam,
      away_team: awayTeam,
      kickoff_at: danishLocalToUtcISOString(kickoff),
    })
    .eq("id", matchId);
  revalidatePath("/admin/kampe");
}

export async function submitResult(matchId: string, formData: FormData) {
  // Tjekker stadig at det rent faktisk er en admin, der er logget ind.
  await requireAdmin();
  const resultHome = parseInt(String(formData.get("result_home") ?? ""), 10);
  const resultAway = parseInt(String(formData.get("result_away") ?? ""), 10);
  if (Number.isNaN(resultHome) || Number.isNaN(resultAway)) return;

  // Selve skrivningen (resultat + genberegning af point) er delt med den
  // automatiske resultat-hentning - se src/lib/applyMatchResult.ts.
  await applyMatchResult(matchId, resultHome, resultAway);

  revalidatePath("/admin/kampe");
  revalidatePath("/tip");
  revalidatePath("/stilling");
  revalidatePath("/statistik");
}

export async function deleteMatch(matchId: string) {
  const supabase = await requireAdmin();
  await supabase.from("matches").delete().eq("id", matchId);
  revalidatePath("/admin/kampe");
}

/**
 * Regner ALLE afgjorte kampe i én sport om efter det gældende pointsystem.
 *
 * Point gemmes på hvert tip i det øjeblik, resultatet indtastes - så ændrer
 * man pointfordelingen i src/lib/points.ts, beholder gamle kampe de point,
 * de fik efter de GAMLE regler, og stillingen bliver en blanding af to
 * systemer. Denne knap retter det op i ét klik, så pointsystemet trygt kan
 * justeres, også midt i en sæson.
 */
export async function recalculatePoints(sport: Sport) {
  await requireAdmin();

  // Admin-klienten (uden RLS) - vi skriver point til ALLE brugeres tips,
  // ikke kun vores egne, og efter kampstart. Samme grund som i
  // src/lib/applyMatchResult.ts.
  const admin = createAdminClient();

  const { data: rounds } = await admin.from("rounds").select("id").eq("sport", sport);
  const roundIds = (rounds ?? []).map((r) => r.id);
  if (roundIds.length === 0) return { opdaterede: 0 };

  // Kun kampe med et indtastet resultat har point at regne om.
  const { data: matches } = await admin
    .from("matches")
    .select("id, result_home, result_away")
    .in("round_id", roundIds)
    .not("result_home", "is", null)
    .not("result_away", "is", null);

  const matchList = matches ?? [];
  if (matchList.length === 0) return { opdaterede: 0 };

  const { data: tips } = await admin
    .from("tips")
    .select("id, match_id, tip_home, tip_away")
    .in(
      "match_id",
      matchList.map((m) => m.id)
    );

  const resultByMatch = new Map(matchList.map((m) => [m.id, m]));

  // Grupper tips efter hvor mange point de SKAL have. Et pointsystem har kun
  // en håndfuld mulige værdier (NFL: 0, 2, 3, 5, 7), så vi kan nøjes med én
  // opdatering pr. værdi i stedet for én pr. tip - det er forskellen på en
  // håndfuld forespørgsler og flere tusinde.
  const idsByPoints = new Map<number, string[]>();
  for (const tip of tips ?? []) {
    const match = resultByMatch.get(tip.match_id);
    if (!match) continue;
    const points = calculatePoints(
      tip.tip_home,
      tip.tip_away,
      match.result_home as number,
      match.result_away as number,
      sport
    );
    const liste = idsByPoints.get(points) ?? [];
    liste.push(tip.id);
    idsByPoints.set(points, liste);
  }

  let opdaterede = 0;
  for (const [points, ids] of idsByPoints) {
    const { error } = await admin.from("tips").update({ points }).in("id", ids);
    if (error) {
      console.error("recalculatePoints: kunne ikke opdatere point", error);
      throw new Error(`Kunne ikke genberegne point: ${error.message}`);
    }
    opdaterede += ids.length;
  }

  revalidatePath("/admin/kampe");
  revalidatePath("/stilling");
  revalidatePath("/statistik");
  revalidatePath("/admin/statistik");
  return { opdaterede };
}

// Formular-udgave til knappen på /admin/kampe. En <form action={...}> må
// ikke returnere noget, så antallet logges i stedet (ses i Vercel-loggen).
export async function recalculatePointsAction(sport: Sport) {
  const { opdaterede } = await recalculatePoints(sport);
  console.log(`[admin/kampe] Genberegnede point for ${opdaterede} tips i ${sport}.`);
}

// Sletter en hel runde. Kampene i runden - og alle tips på dem - bliver
// automatisk slettet med (sat op i databasen med "on delete cascade").
export async function deleteRound(roundId: string) {
  const supabase = await requireAdmin();
  await supabase.from("rounds").delete().eq("id", roundId);
  revalidatePath("/admin/kampe");
  revalidatePath("/tip");
  revalidatePath("/stilling");
  revalidatePath("/statistik");
}
