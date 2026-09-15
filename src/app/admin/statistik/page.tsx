import { createAdminClient } from "@/lib/supabase/admin";
import { roundLabel } from "@/lib/rounds";
import { SportTabs } from "@/components/SportTabs";
import { ALL_SPORTS } from "@/lib/participation";
import type { Sport } from "@/lib/types";

// Admin-statistik skal altid være frisk - må ikke caches.
export const dynamic = "force-dynamic";

interface ProfileRow {
  id: string;
  display_name: string;
  created_at: string;
  invited_by: string | null;
}

interface RoundRow {
  id: string;
  season: string;
  number: number;
  kind: "liga" | "bonus";
  // Styrer både hvilke runder der overhovedet tælles med på siden (se
  // sport-filtreringen længere nede) og roundLabel(), så Superliga- og
  // NFL-runder ikke ligner hinanden (fx begge "Runde 5").
  sport: Sport;
}

interface MatchRow {
  id: string;
  round_id: string;
  result_home: number | null;
  result_away: number | null;
}

interface TipRow {
  user_id: string;
  match_id: string;
  points: number | null;
}

interface InviteRow {
  user_id: string;
  display_name: string;
  qualified_invites: number;
}

interface VisitRow {
  created_at: string;
  path: string;
}

// Bruges til at vise "for X dage siden" i stedet for rå datoer.
const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminStatistikPage({
  searchParams,
}: {
  searchParams: { sport?: string };
}) {
  const admin = createAdminClient();
  const sport: Sport = searchParams.sport === "nfl" ? "nfl" : "superliga";
  const sportLabel = sport === "nfl" ? "NFL" : "Superliga";

  const [
    { data: profilesRaw, error: profilesError },
    { data: roundsRaw, error: roundsError },
    { data: matchesRaw, error: matchesError },
    { data: tipsRaw, error: tipsError },
    { data: miniLeaguesRaw, error: miniLeagueError },
    { data: miniLeagueMembersRaw, error: miniLeagueMemberError },
    { data: participantsRaw, error: participantsError },
    { data: inviteRowsRaw, error: inviteError },
    { count: pageviewsAllTime, error: pageviewsError },
    { data: visitsRaw, error: visitsError },
  ] = await Promise.all([
    admin.from("profiles").select("id, display_name, created_at, invited_by"),
    admin.from("rounds").select("id, season, number, kind, sport"),
    admin.from("matches").select("id, round_id, result_home, result_away"),
    admin.from("tips").select("user_id, match_id, points"),
    // Hentes som rigtige rækker (ikke bare et antal), fordi miniligaer nu
    // hører til hver sin sport og derfor skal tælles op pr. sport.
    admin.from("mini_leagues").select("id, sport"),
    admin.from("mini_league_members").select("league_id"),
    admin.from("sport_participants").select("user_id, sport").eq("status", "joined"),
    admin
      .from("invite_leaderboard")
      .select("user_id, display_name, qualified_invites")
      .order("qualified_invites", { ascending: false }),
    admin.from("page_visits").select("*", { count: "exact", head: true }),
    admin
      .from("page_visits")
      .select("created_at, path")
      .gte("created_at", new Date(Date.now() - 30 * DAY_MS).toISOString()),
  ]);

  // Saml eventuelle fejl fra de forespørgsler ovenfor. Uden dette ville en
  // fejlet forespørgsel bare stille og roligt blive vist som "0" (fx 0
  // mini-ligaer), som om der reelt ikke var nogen data - meget misvisende på
  // en statistikside. Her er det en admin-side, så vi kan trygt vise selve
  // fejlteksten direkte, i stedet for at gætte.
  const queryErrors = [
    { label: "Profiler", error: profilesError },
    { label: "Runder", error: roundsError },
    { label: "Kampe", error: matchesError },
    { label: "Tips", error: tipsError },
    { label: "Mini-ligaer", error: miniLeagueError },
    { label: "Mini-liga-medlemmer", error: miniLeagueMemberError },
    { label: "Tilmeldte til konkurrencer", error: participantsError },
    { label: "Invitationer", error: inviteError },
    { label: "Sidevisninger (total)", error: pageviewsError },
    { label: "Sidevisninger (30 dage)", error: visitsError },
  ].filter((e) => e.error);

  if (queryErrors.length > 0) {
    console.error(
      "[/admin/statistik] Fejl i en eller flere forespørgsler:",
      queryErrors.map((e) => ({ label: e.label, message: e.error?.message }))
    );
  }

  const profiles: ProfileRow[] = profilesRaw ?? [];
  const inviteRows: InviteRow[] = inviteRowsRaw ?? [];
  const visits: VisitRow[] = visitsRaw ?? [];

  // ---------- Opdeling pr. sport ----------
  // Superliga og NFL er to selvstændige konkurrencer og må aldrig lægges
  // sammen. Kun runder har en sport-kolonne - kampe og tips arver den via
  // henholdsvis round_id og match_id, så vi filtrerer i den rækkefølge:
  // runder -> kampe -> tips. Alt herunder, der handler om runder, point og
  // deltagelse, regner derfor kun på den valgte sport.
  //
  // Bemærk hvad der IKKE filtreres: brugertal, invitationer og besøg er
  // fælles for hele siden (man opretter sig på Ugenstipper, ikke på en
  // bestemt sport) og vises derfor ens uanset faneblad.
  const rounds: RoundRow[] = (roundsRaw ?? []).filter((r) => r.sport === sport);
  const roundIdsInSport = new Set(rounds.map((r) => r.id));

  const matches: MatchRow[] = (matchesRaw ?? []).filter((m) =>
    roundIdsInSport.has(m.round_id)
  );
  const matchIdsInSport = new Set(matches.map((m) => m.id));

  const tips: TipRow[] = (tipsRaw ?? []).filter((t) => matchIdsInSport.has(t.match_id));

  const now = Date.now();
  const nameById = new Map(profiles.map((p) => [p.id, p.display_name]));

  // ---------- Brugere ----------
  const totalUsers = profiles.length;
  const newThisWeek = profiles.filter(
    (p) => now - new Date(p.created_at).getTime() <= 7 * DAY_MS
  ).length;
  const newThisMonth = profiles.filter(
    (p) => now - new Date(p.created_at).getTime() <= 30 * DAY_MS
  ).length;

  // Tilmeldte til denne konkurrence. Begge sporte er nu et aktivt valg -
  // brugeren vælger selv Superliga og/eller NFL til på forsiden, så tallet
  // er en rigtig optælling for begge (se src/lib/participation.ts).
  const signedUpUsers = (participantsRaw ?? []).filter((r) => r.sport === sport).length;

  // "Aktiv" = har sat mindst ét tip i DENNE sport. Tallet siger altså, hvor
  // stor en del af brugerne der rent faktisk spiller med i den valgte
  // konkurrence - derfor kan "aktive" godt være lavt for NFL, selvom
  // brugertallet ovenfor er højt.
  const activeUserIds = new Set(tips.map((t) => t.user_id));
  const activeUsers = activeUserIds.size;
  const dormantUsers = Math.max(0, totalUsers - activeUsers);

  // ---------- Runder, kampe, point ----------
  const roundById = new Map(rounds.map((r) => [r.id, r]));
  const matchToRound = new Map(matches.map((m) => [m.id, m.round_id]));

  const matchesByRound = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const list = matchesByRound.get(m.round_id) ?? [];
    list.push(m);
    matchesByRound.set(m.round_id, list);
  }

  function isRoundFinished(roundId: string) {
    const roundMatches = matchesByRound.get(roundId);
    if (!roundMatches || roundMatches.length === 0) return false;
    return roundMatches.every((m) => m.result_home !== null && m.result_away !== null);
  }

  const pointsByRoundUser = new Map<string, Map<string, number>>();
  const participantsByRound = new Map<string, Set<string>>();

  for (const t of tips) {
    const roundId = matchToRound.get(t.match_id);
    if (!roundId) continue;

    const participants = participantsByRound.get(roundId) ?? new Set<string>();
    participants.add(t.user_id);
    participantsByRound.set(roundId, participants);

    if (isRoundFinished(roundId)) {
      const userPoints = pointsByRoundUser.get(roundId) ?? new Map<string, number>();
      userPoints.set(t.user_id, (userPoints.get(t.user_id) ?? 0) + (t.points ?? 0));
      pointsByRoundUser.set(roundId, userPoints);
    }
  }

  const finishedRoundIds = rounds
    .map((r) => r.id)
    .filter((id) => isRoundFinished(id) && pointsByRoundUser.has(id));

  interface RoundResult {
    round: RoundRow;
    winners: string[];
    points: number;
    participants: number;
  }

  const roundResults: RoundResult[] = finishedRoundIds
    .map((roundId) => {
      const round = roundById.get(roundId)!;
      const userPoints = pointsByRoundUser.get(roundId)!;
      let maxPoints = -1;
      for (const p of userPoints.values()) maxPoints = Math.max(maxPoints, p);
      const winners = Array.from(userPoints.entries())
        .filter(([, p]) => p === maxPoints)
        .map(([userId]) => nameById.get(userId) ?? "Ukendt bruger");
      return {
        round,
        winners,
        points: maxPoints,
        participants: participantsByRound.get(roundId)?.size ?? 0,
      };
    })
    .sort((a, b) => {
      if (a.round.season !== b.round.season) return b.round.season.localeCompare(a.round.season);
      return b.round.number - a.round.number;
    });

  // Flest rundesejre samlet (deler en sejr, hvis flere var tied om den runde)
  const winsByUser = new Map<string, number>();
  for (const r of roundResults) {
    for (const winnerName of r.winners) {
      winsByUser.set(winnerName, (winsByUser.get(winnerName) ?? 0) + 1);
    }
  }
  const winLeaderboard = Array.from(winsByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ---------- Deltagelse ----------
  const avgParticipants =
    roundResults.length === 0
      ? 0
      : Math.round(
          (roundResults.reduce((sum, r) => sum + r.participants, 0) / roundResults.length) * 10
        ) / 10;

  let lowestParticipation: RoundResult | null = null;
  for (const r of roundResults) {
    if (!lowestParticipation || r.participants < lowestParticipation.participants) {
      lowestParticipation = r;
    }
  }

  // ---------- Mini-ligaer ----------
  // Miniligaer hører til hver sin sport, så både antallet og den
  // gennemsnitlige størrelse opgøres kun for den valgte sport.
  const miniLeaguesInSport = (miniLeaguesRaw ?? []).filter((l) => l.sport === sport);
  const miniLeagueIdsInSport = new Set(miniLeaguesInSport.map((l) => l.id));
  const miniLeagueCount = miniLeaguesInSport.length;
  const miniLeagueMemberCount = (miniLeagueMembersRaw ?? []).filter((m) =>
    miniLeagueIdsInSport.has(m.league_id)
  ).length;

  const avgLeagueSize =
    miniLeagueCount === 0
      ? 0
      : Math.round((miniLeagueMemberCount / miniLeagueCount) * 10) / 10;

  // ---------- Inviter en ven ----------
  const topInviters = inviteRows.filter((r) => r.qualified_invites > 0).slice(0, 5);
  const totalQualifiedInvites = inviteRows.reduce((sum, r) => sum + r.qualified_invites, 0);
  const totalRawInvited = profiles.filter((p) => p.invited_by).length;

  // ---------- Besøg ----------
  // Vi gemmer bevidst intet besøgs-id (hverken cookie eller localStorage),
  // så "unikke besøgende" kan ikke opgøres - kun rene sidevisninger.
  const visits7d = visits.filter((v) => now - new Date(v.created_at).getTime() <= 7 * DAY_MS);

  const pathCounts = new Map<string, number>();
  for (const v of visits) {
    pathCounts.set(v.path, (pathCounts.get(v.path) ?? 0) + 1);
  }
  const topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-8 w-8" />
          <h1 className="text-2xl font-extrabold">Statistik</h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <a href="/admin/kampe" className="text-sm font-semibold text-accent">
            ← Tilbage til Kampe
          </a>
          <a href="/admin/bannere" className="text-sm font-semibold text-accent">
            Bannere →
          </a>
          <a href="/admin/nyhedsbrev" className="text-sm font-semibold text-accent">
            Nyhedsbrev →
          </a>
        </div>
      </div>
      <p className="mt-1 text-sm text-text-muted">
        Overblik over brugere, vindere og besøg på Ugenstipper.
      </p>

      <div className="mt-4 max-w-[280px]">
        {/* Admin ser ALTID begge sporte, uanset hvad han selv har valgt at
            spille - man skal kunne holde øje med en konkurrence uden at
            være deltager i den. */}
        <SportTabs activeSport={sport} userSports={ALL_SPORTS} basePath="/admin/statistik" />
      </div>
      <p className="mt-2 text-[12.5px] text-text-muted">
        Fanebladet gælder de afsnit, der er mærket med sporten (runder, point,
        deltagelse og miniligaer). Brugertal, invitationer og besøg er fælles for
        hele siden og ændrer sig ikke, når du skifter faneblad.
      </p>

      {queryErrors.length > 0 && (
        <div className="mt-4 rounded-xl border border-danger bg-red-50 p-3.5">
          <div className="text-[13px] font-bold text-danger">
            Nogle tal herunder kunne ikke hentes korrekt:
          </div>
          <ul className="mt-1 list-disc pl-5 text-[12.5px] text-danger">
            {queryErrors.map((e) => (
              <li key={e.label}>
                {e.label}: {e.error?.message ?? "ukendt fejl"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- Brugere ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">Brugere</h2>
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Brugere i alt</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{totalUsers}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Nye (7 dage)</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{newThisWeek}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Nye (30 dage)</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{newThisMonth}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">
            Aktive / sovende · {sportLabel}
          </div>
          <div className="mt-1 font-heading text-2xl font-extrabold">
            {activeUsers} / {dormantUsers}
          </div>
          <div className="text-[10.5px] text-text-muted">
            Har sat mindst ét tip i {sportLabel}
          </div>
        </div>
      </div>

      {/* ---------- Rundevindere ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">
        Rundevindere · {sportLabel}
      </h2>
      {winLeaderboard.length > 0 && (
        <div className="card mt-2 rounded-xl p-4">
          <div className="text-[13px] font-bold">Flest rundesejre</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {winLeaderboard.map(([name, wins]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{name}</span>
                <span className="font-bold text-accent">{wins}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2">
        {roundResults.slice(0, 10).map((r) => (
          <div key={r.round.id} className="card flex items-center justify-between rounded-[10px] p-3">
            <span className="text-[13px] font-semibold">{roundLabel(r.round)}</span>
            <span className="text-[13px]">
              {r.winners.join(", ")} <span className="font-bold text-accent">· {r.points} point</span>
            </span>
          </div>
        ))}
        {roundResults.length === 0 && (
          <p className="text-sm text-text-muted">
            Ingen afgjorte runder endnu i {sportLabel}.
          </p>
        )}
      </div>

      {/* ---------- Deltagelse ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">
        Deltagelse · {sportLabel}
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">
            Tilmeldt {sportLabel}
          </div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{signedUpUsers}</div>
          <div className="text-[10.5px] text-text-muted">
            Har valgt konkurrencen til
          </div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">
            Gns. deltagere pr. afgjort runde
          </div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{avgParticipants}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Laveste deltagelse</div>
          <div className="mt-1 font-heading text-lg font-extrabold">
            {lowestParticipation ? roundLabel(lowestParticipation.round) : "–"}
          </div>
          {lowestParticipation && (
            <div className="text-[11px] font-bold text-text-muted">
              {lowestParticipation.participants} deltagere
            </div>
          )}
        </div>
      </div>

      {/* ---------- Mini-ligaer (pr. sport) ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">
        Mini-ligaer · {sportLabel}
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Mini-ligaer</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{miniLeagueCount}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Gns. medlemmer</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{avgLeagueSize}</div>
        </div>
      </div>

      {/* ---------- Invitationer (fælles for hele siden) ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">
        Invitationer
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Inviteret i alt</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{totalRawInvited}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Godkendte invitationer</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{totalQualifiedInvites}</div>
          <div className="text-[10.5px] text-text-muted">Har spillet mindst 3 fulde runder</div>
        </div>
      </div>
      {topInviters.length > 0 && (
        <div className="card mt-2.5 rounded-xl p-4">
          <div className="text-[13px] font-bold">Flest venner inviteret</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {topInviters.map((r) => (
              <div key={r.user_id} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{r.display_name}</span>
                <span className="font-bold text-accent">{r.qualified_invites}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Besøg ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">Besøg</h2>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Sidevisninger i alt</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{pageviewsAllTime ?? 0}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Visninger (7 dage)</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{visits7d.length}</div>
        </div>
      </div>
      {topPaths.length > 0 && (
        <div className="card mt-2.5 rounded-xl p-4">
          <div className="text-[13px] font-bold">Mest besøgte sider (30 dage)</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {topPaths.map(([path, count]) => (
              <div key={path} className="flex items-center justify-between text-sm">
                <span className="font-mono text-[12.5px] text-text-muted">{path}</span>
                <span className="font-bold text-accent">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {visits.length === 0 && (
        <p className="mt-2.5 text-sm text-text-muted">
          Ingen besøg registreret endnu i de sidste 30 dage.
        </p>
      )}
    </div>
  );
}
