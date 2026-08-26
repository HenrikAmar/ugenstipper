"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculatePoints } from "@/lib/points";
import { danishLocalToUtcISOString } from "@/lib/time";

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

export async function createRound(formData: FormData) {
  const supabase = await requireAdmin();
  const season = String(formData.get("season") ?? "").trim();
  const number = parseInt(String(formData.get("number") ?? ""), 10);
  if (!season || Number.isNaN(number)) return;

  await supabase.from("rounds").insert({ season, number });
  revalidatePath("/admin/kampe");
}

export async function setCurrentRound(roundId: string) {
  const supabase = await requireAdmin();
  await supabase.from("rounds").update({ is_current: false }).neq("id", roundId);
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
  const supabase = await requireAdmin();
  const resultHome = parseInt(String(formData.get("result_home") ?? ""), 10);
  const resultAway = parseInt(String(formData.get("result_away") ?? ""), 10);
  if (Number.isNaN(resultHome) || Number.isNaN(resultAway)) return;

  await supabase
    .from("matches")
    .update({ result_home: resultHome, result_away: resultAway })
    .eq("id", matchId);

  // Beregn point for alle tips på denne kamp med det samme.
  const { data: tips } = await supabase
    .from("tips")
    .select("id, tip_home, tip_away")
    .eq("match_id", matchId);

  for (const tip of tips ?? []) {
    const points = calculatePoints(tip.tip_home, tip.tip_away, resultHome, resultAway);
    await supabase.from("tips").update({ points }).eq("id", tip.id);
  }

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
