import { createClient } from "@/lib/supabase/server";
import { TeamBadge } from "@/components/TeamBadge";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { MiniligaStanding } from "@/components/MiniligaStanding";
import { StandingList } from "@/components/StandingList";
import { SeasonSelect } from "@/components/SeasonSelect";
import { type RankRow } from "@/lib/ranking";
import Link from "next/link";

// Stillingen ændrer sig når admin indtaster resultater - må ikke caches.
export const dynamic = "force-dynamic";

interface RoundLite {
  id: string;
  number: number;
  season: string;
  kind: "liga" | "bonus";
  is_current: boolean;
  created_at: string;
}

interface TipRow {
  user_id: string;
  points: number | null;
  matches: { round_id: string; rounds: { kind: "liga" | "bonus"; season: string } | null } | null;
}

interface InviteRow {
  user_id: string;
  display_name: string;
  qualified_invites: number;
}

// Sorterer sæsoner nyeste først, ud fra hvornår deres seneste runde blev
// oprettet - mere robust end alfabetisk, når sæsonnavne som "Testsæson 1" og
// "2026/27" blandes.
function seasonsNewestFirst(rounds: RoundLite[]): string[] {
  const latestBySeason = new Map<string, string>();
  for (const r of rounds) {
    const prev = latestBySeason.get(r.season);
    if (!prev || r.created_at > prev) latestBySeason.set(r.season, r.created_at);
  }
  return Array.from(latestBySeason.entries())
    .sort((a, b) => (a[1] < b[1] ? 1 : -1))
    .map(([season]) => season);
}

// Genforsøger én gang, hvis en forespørgsel fejler - fanger korte,
// forbigående forbindelsesglimt til Supabase, som ellers ville få stillingen
// til fejlagtigt at se tom ud, selvom der reelt er point.
async function withRetry<T>(
  run: () => PromiseLike<{ data: T; error: { message: string } | null }>
): Promise<{ data: T; error: { message: string } | null }> {
  const first = await run();
  if (!first.error) return first;
  return run();
}

export default async function StillingPage({
  searchParams,
}: {
  searchParams: { visning?: string; saeson?: string; bonusSaeson?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const visning =
    searchParams.visning === "runde"
      ? "runde"
      : searchParams.visning === "forrige"
      ? "forrige"
      : "samlet";

  const [
    { data: profiles, error: profilesError },
    { data: roundsData, error: roundsError },
    { data: tips, error: tipsError },
    { data: inviteTop },
  ] = await Promise.all([
    withRetry(() => supabase.from("profiles").select("id, display_name, avatar_color")),
    withRetry(() =>
      supabase.from("rounds").select("id, number, season, kind, is_current, created_at")
    ),
    withRetry(() =>
      supabase.from("tips").select("user_id, points, matches(round_id, rounds(kind, season))")
    ),
    supabase
      .from("invite_leaderboard")
      .select("user_id, display_name, qualified_invites")
      .gt("qualified_invites", 0)
      .order("qualified_invites", { ascending: false })
      .limit(3),
  ]);

  // Hvis en af de centrale forespørgsler fejler (fx en midlertidig
  // forbindelsesfejl til Supabase), skal siden IKKE se ud som om der bare
  // ikke er nogen point endnu - det er misvisende og skjuler den reelle
  // fejl. Vi logger detaljerne (ses i Vercel-loggen) og viser i stedet en
  // tydelig fejlbesked.
  const loadError = profilesError ?? roundsError ?? tipsError ?? null;
  if (loadError) {
    console.error("[/stilling] Kunne ikke hente data:", {
      profilesError,
      roundsError,
      tipsError,
    });
  }

  const inviteRanking = (inviteTop ?? []) as InviteRow[];
  const tipRows = (tips ?? []) as unknown as TipRow[];
  const roundsList = (roundsData ?? []) as RoundLite[];

  const ligaRounds = roundsList.filter((r) => r.kind === "liga");
  const bonusRounds = roundsList.filter((r) => r.kind === "bonus");

  const ligaSeasons = seasonsNewestFirst(ligaRounds);
  const bonusSeasons = seasonsNewestFirst(bonusRounds);

  const currentRound = ligaRounds.find((r) => r.is_current) ?? null;
  const activeLigaSeason = currentRound?.season ?? ligaSeasons[0] ?? null;
  const defaultBonusSeason = bonusSeasons[0] ?? null;

  const selectedLigaSeason = searchParams.saeson ?? activeLigaSeason;
  const selectedBonusSeason = searchParams.bonusSaeson ?? defaultBonusSeason;
  const isViewingActiveSeason = selectedLigaSeason === activeLigaSeason;

  // Runden lige før den aktuelle - bruges til "Forrige runde"-fanen. Findes
  // kun, hvis der rent faktisk har været en runde før denne (fx ikke ved
  // Runde 1).
  const previousRound =
    currentRound
      ? ligaRounds.find(
          (r) => r.season === currentRound.season && r.number === currentRound.number - 1
        ) ?? null
      : null;

  // Point tælles adskilt: den rigtige stilling (liga, pr. valgt sæson) og
  // bonusrunde-stillingen (pr. valgt bonus-sæson) - de blandes aldrig sammen.
  const totals = new Map<string, number>();
  const bonusTotals = new Map<string, number>();
  for (const tip of tipRows) {
    if (tip.points === null) continue;
    const roundInfo = tip.matches?.rounds;
    if (!roundInfo) continue;

    if (roundInfo.kind === "bonus") {
      if (selectedBonusSeason !== null && roundInfo.season === selectedBonusSeason) {
        bonusTotals.set(tip.user_id, (bonusTotals.get(tip.user_id) ?? 0) + tip.points);
      }
      continue;
    }

    if (roundInfo.season !== selectedLigaSeason) continue;
    if (visning === "runde" && isViewingActiveSeason && tip.matches?.round_id !== currentRound?.id) {
      continue;
    }
    if (
      visning === "forrige" &&
      isViewingActiveSeason &&
      tip.matches?.round_id !== previousRound?.id
    ) {
      continue;
    }
    totals.set(tip.user_id, (totals.get(tip.user_id) ?? 0) + tip.points);
  }

  const ranking: RankRow[] = (profiles ?? [])
    .map((p) => ({ ...p, points: totals.get(p.id) ?? 0 }))
    .sort((a, b) => b.points - a.points);

  // "All time" er erstattet af pr. bonus-sæson - kun brugere med mindst ét
  // bonuspoint i den valgte bonus-sæson vises.
  const bonusRanking: RankRow[] = (profiles ?? [])
    .map((p) => ({ ...p, points: bonusTotals.get(p.id) ?? 0 }))
    .filter((p) => p.points > 0)
    .sort((a, b) => b.points - a.points);

  const { data: membership } = await supabase
    .from("mini_league_members")
    .select("league_id, mini_leagues(name)")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  let miniligaName: string | null = null;
  let miniligaRanking: RankRow[] = [];

  if (membership) {
    miniligaName =
      (membership as unknown as { mini_leagues: { name: string } | null }).mini_leagues?.name ??
      null;

    const { data: members } = await supabase
      .from("mini_league_members")
      .select("user_id")
      .eq("league_id", membership.league_id);

    const memberIds = new Set((members ?? []).map((m) => m.user_id));
    miniligaRanking = ranking.filter((r) => memberIds.has(r.id));
  }

  const currentParams = {
    visning: searchParams.visning,
    saeson: searchParams.saeson,
    bonusSaeson: searchParams.bonusSaeson,
  };

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader
        title="Stilling"
        subtitle={
          <p className="mt-0.5 text-[13px] text-text-muted">
            {isViewingActiveSeason
              ? currentRound
                ? `Efter runde ${currentRound.number}`
                : "Ingen aktiv runde"
              : `Sæson ${selectedLigaSeason}`}
          </p>
        }
      />

      {ligaSeasons.length > 1 && (
        <div className="px-5 pt-3">
          <SeasonSelect
            basePath="/stilling"
            paramName="saeson"
            value={selectedLigaSeason ?? ""}
            options={ligaSeasons}
            currentParams={currentParams}
          />
        </div>
      )}

      {isViewingActiveSeason && (
        <div className="flex gap-2 px-5 py-3.5">
          {previousRound && (
            <Link href="/stilling?visning=forrige"
              className={`pill ${
                visning === "forrige" ? "bg-navy text-white" : "border border-border text-text-muted"
              }`}
            >
              Forrige runde
            </Link>
          )}
          <Link href="/stilling?visning=samlet"
            className={`pill ${
              visning === "samlet" ? "bg-navy text-white" : "border border-border text-text-muted"
            }`}
          >
            Samlet
          </Link>
          <Link href="/stilling?visning=runde"
            className={`pill ${
              visning === "runde" ? "bg-navy text-white" : "border border-border text-text-muted"
            }`}
          >
            Denne runde
          </Link>
        </div>
      )}

      <div className={isViewingActiveSeason ? "px-5" : "px-5 pt-4"}>
        <StandingList ranking={ranking} userId={user?.id} expandLabel="Udvid stillingen" />
        {loadError && (
          <p className="py-8 text-center text-sm font-semibold text-danger">
            Kunne ikke hente stillingen lige nu. Prøv at genindlæse siden om lidt.
          </p>
        )}
        {!loadError && ranking.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">
            Ingen point endnu denne sæson.
          </p>
        )}
      </div>

      {bonusRanking.length > 0 && (
        <div className="mt-6 px-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-text-muted">Bonusrunde-stilling</h2>
            {bonusSeasons.length > 1 && (
              <SeasonSelect
                basePath="/stilling"
                paramName="bonusSaeson"
                value={selectedBonusSeason ?? ""}
                options={bonusSeasons}
                currentParams={currentParams}
              />
            )}
          </div>
          <StandingList ranking={bonusRanking} userId={user?.id} expandLabel="Udvid bonusstillingen" />
        </div>
      )}

      {miniligaName && (
        <MiniligaStanding leagueName={miniligaName} ranking={miniligaRanking} userId={user?.id} />
      )}

      {inviteRanking.length > 0 && (
        <div className="mt-6 px-5">
          <h2 className="mb-2 text-[13px] font-bold text-text-muted">Top 3 – Inviter en ven</h2>
          <div className="flex flex-col gap-2">
            {inviteRanking.map((row, i) => {
              const isMe = row.user_id === user?.id;
              return (
                <div
                  key={row.user_id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    isMe
                      ? "border-[1.5px] border-accent-2 bg-accent-tint"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="w-5 text-center font-heading text-sm font-bold text-text-muted">
                    {i + 1}
                  </div>
                  <TeamBadge team={row.display_name} size={34} />
                  <div className="flex-1 text-sm font-bold">
                    {row.display_name}
                    {isMe && (
                      <span className="ml-1.5 rounded-full bg-[#CFF0E1] px-1.5 py-0.5 text-[10px] font-bold text-accent">
                        DIG
                      </span>
                    )}
                  </div>
                  <div className="w-10 text-right font-heading text-base font-extrabold">
                    {row.qualified_invites}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
