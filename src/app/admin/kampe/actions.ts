"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Brug admin-klienten (uden RLS) her - vi skal skrive point til ALLE
  // brugeres tips, ikke kun adminens egne, og efter kampstart. Tips' egne
  // RLS-regler (kun ejeren, kun før kampstart) ville ellers stille og
  // roligt have blokeret præcis denne opdatering uden nogen fejlbesked.
  const admin = createAdminClient();

  const { error: matchError } = await admin
    .from("matches")
    .update({ result_home: resultHome, result_away: resultAway })
    .eq("id", matchId);

  if (matchError) {
    console.error("submitResult: kunne ikke opdatere kampens resultat", matchError);
    throw new Error(`Kunne ikke gemme resultatet: ${matchError.message}`);
  }

  // Beregn point for alle tips på denne kamp med det samme.
  const { data: tips, error: tipsFetchError } =
