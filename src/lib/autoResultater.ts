import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSuperligaFixtures, type FinishedFixture } from "@/lib/apiFootball";
import { resolveSuperligaTeamName } from "@/lib/clubColors";
import { applyMatchResult } from "@/lib/applyMatchResult";

// Kun almindelige Superliga-runder kan matches mod API-Football (bonusrunder
// har ofte hold uden for Superligaen, fx udenlandske modstandere i Europa,
// som API-Football's Superliga-opslag slet ikke kender noget til).
const MAX_LOOKBACK_DAYS = 10;
// Hvor tæt et API-Football-kicketidspunkt skal ligge på vores eget
// kickoff_at, for at vi tør sige det er samme kamp (timezone-margin).
const KICKOFF_TOLERANCE_MS = 20 * 60 * 60 * 1000; // 20 timer

interface PendingMatch {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  rounds: { kind: "liga" | "bonus" } | { kind: "liga" | "bonus" }[] | null;
}

export interface AutoResultaterSummary {
  checked: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function roundKind(m: PendingMatch): "liga" | "bonus" | null {
  const r = m.rounds;
  if (!r) return null;
  return Array.isArray(r) ? r[0]?.kind ?? null : r.kind;
}

function findMatchingFixture(
  match: PendingMatch,
  fixtures: FinishedFixture[]
): FinishedFixture | null {
  const kickoff = new Date(match.kickoff_at).getTime();

  let best: FinishedFixture | null = null;
  let bestDelta = Infinity;

  for (const fixture of fixtures) {
    const home = resolveSuperligaTeamName(fixture.homeTeamName);
    const away = resolveSuperligaTeamName(fixture.awayTeamName);
    if (home !== match.home_team || away !== match.away_team) continue;

    const delta = Math.abs(fixture.kickoffAt.getTime() - kickoff);
    if (delta <= KICKOFF_TOLERANCE_MS && delta < bestDelta) {
      best = fixture;
      bestDelta = delta;
    }
  }

  return best;
}

/**
 * Finder kampe uden resultat, hvis kamp burde være slut, henter officielle
 * resultater fra API-Football for den periode, og skriver dem ind - præcis
 * som når admin selv indtaster et resultat (se applyMatchResult). Kaldes
 * både fra admin/kampe-siden (hver gang admin besøger den) og fra det
 * daglige cron-job (src/app/api/cron/auto-resultater) - se
 * src/app/api/admin/auto-resultater for admins manuelle "Hent nu"-knap.
 */
export async function runAutoResultater(): Promise<AutoResultaterSummary> {
  const admin = createAdminClient();

  const lookbackStart = new Date(Date.now() - MAX_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const { data: pendingRaw, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, rounds!inner(kind)")
    .is("result_home", null)
    .lt("kickoff_at", new Date().toISOString())
    .gte("kickoff_at", lookbackStart.toISOString());

  if (error) {
    console.error("runAutoResultater: kunne ikke hente kampe uden resultat", error);
    return { checked: 0, updated: 0, skipped: 0, errors: [error.message] };
  }

  // Kun almindelige ligarunder - se kommentar ved MAX_LOOKBACK_DAYS ovenfor.
  const pending = ((pendingRaw ?? []) as PendingMatch[]).filter((m) => roundKind(m) === "liga");

  if (pending.length === 0) {
    return { checked: 0, updated: 0, skipped: 0, errors: [] };
  }

  const kickoffTimes = pending.map((m) => new Date(m.kickoff_at).getTime());
  const from = new Date(Math.min(...kickoffTimes) - 24 * 60 * 60 * 1000);
  const to = new Date(Math.max(...kickoffTimes) + 24 * 60 * 60 * 1000);

  let fixtures: FinishedFixture[];
  try {
    fixtures = await fetchSuperligaFixtures(from, to);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("runAutoResultater: kunne ikke hente fra API-Football", message);
    return { checked: pending.length, updated: 0, skipped: 0, errors: [message] };
  }

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const match of pending) {
    const fixture = findMatchingFixture(match, fixtures);
    if (!fixture) {
      // Helt normalt - kampen er formentlig bare ikke fløjtet færdig endnu.
      skipped += 1;
      continue;
    }

    try {
      await applyMatchResult(match.id, fixture.homeGoals, fixture.awayGoals);
      updated += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("runAutoResultater: kunne ikke gemme resultat for", match.id, message);
      errors.push(`${match.home_team} - ${match.away_team}: ${message}`);
    }
  }

  return { checked: pending.length, updated, skipped, errors };
}
