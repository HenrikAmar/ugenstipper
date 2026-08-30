"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { danishLocalToUtcISOString } from "@/lib/time";
import { applyMatchResult } from "@/lib/applyMatchResult";

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
  const kind = formData.get("kind") === "bonus" ? "bonus" : "liga";
  if (!season || Number.isNaN(number)) return;

  await supabase.from("rounds").insert({ season, number, kind });
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
