import { createAdminClient } from "@/lib/supabase/admin";
import { LogoMark } from "@/components/Logo";
import { roundLabel } from "@/lib/rounds";

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
  visitor_id: string;
}

// Bruges til at vise "for X dage siden" i stedet for rå datoer.
const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminStatistikPage() {
  const admin = createAdminClient();

  const [
    { data: profilesRaw },
    { data: roundsRaw },
    { data: matchesRaw },
    { data: tipsRaw },
    { count: miniLeagueCount },
    { count: miniLeagueMemberCount },
    { data: inviteRowsRaw },
    { count: pageviewsAllTime },
    { data: visitsRaw },
  ] = await Promise.all([
    admin.from("profiles").select("id, display_name, created_at, invited_by"),
    admin.from("rounds").select("id, season, number, kind"),
    admin.from("matches").select("id, round_id, result_home, result_away"),
    admin.from("tips").select("user_id, match_id, points"),
    admin.from("mini_leagues").select("*", { count: "exact", head: true }),
    admin.from("mini_league_members").select("*", { count: "exact", head: true }),
    admin
      .from("invite_leaderboard")
      .select("user_id, display_name, qualified_invites")
      .order("qualified_invites", { ascending: false }),
    admin.from("page_visits").select("*", { count: "exact", head: true }),
    admin
      .from("page_visits")
      .select("created_at, path, visitor_id")
      .gte("created_at", new Date(Date.now() - 30 * DAY_MS).toISOString()),
  ]);

  const profiles: ProfileRow[] = profilesRaw ?? [];
  const rounds: RoundRow[] = roundsRaw ?? [];
  const matches: MatchRow[] = matchesRaw ?? [];
  const tips: TipRow[] = tipsRaw ?? [];
  const inviteRows: InviteRow[] = inviteRowsRaw ?? [];
  const visits: VisitRow[] = visitsRaw ?? [];

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

  // "Aktiv" = har sat mindst ét tip nogensinde.
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
  const avgLeagueSize =
    !miniLeagueCount || miniLeagueCount === 0
      ? 0
      : Math.round(((miniLeagueMemberCount ?? 0) / miniLeagueCount) * 10) / 10;

  // ---------- Inviter en ven ----------
  const topInviters = inviteRows.filter((r) => r.qualified_invites > 0).slice(0, 5);
  const totalQualifiedInvites = inviteRows.reduce((sum, r) => sum + r.qualified_invites, 0);
  const totalRawInvited = profiles.filter((p) => p.invited_by).length;

  // ---------- Besøg ----------
  const visits7d = visits.filter((v) => now - new Date(v.created_at).getTime() <= 7 * DAY_MS);
  const uniqueVisitors30d = new Set(visits.map((v) => v.visitor_id)).size;
  const uniqueVisitors7d = new Set(visits7d.map((v) => v.visitor_id)).size;

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
          <LogoMark size={26} />
          <h1 className="text-2xl font-extrabold">Statistik</h1>
        </div>
        <a href="/admin/kampe" className="text-sm font-semibold text-accent">
          ← Tilbage til Kampe
        </a>
      </div>
      <p className="mt-1 text-sm text-text-muted">
        Overblik over brugere, vindere og besøg på Ugenstipper.
      </p>

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
          <div className="text-[11.5px] font-semibold text-text-muted">Aktive / sovende</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">
            {activeUsers} / {dormantUsers}
          </div>
          <div className="text-[10.5px] text-text-muted">Har sat mindst ét tip nogensinde</div>
        </div>
      </div>

      {/* ---------- Rundevindere ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">
        Rundevindere
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
          <p className="text-sm text-text-muted">Ingen afgjorte runder endnu.</p>
        )}
      </div>

      {/* ---------- Deltagelse ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">
        Deltagelse
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
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

      {/* ---------- Mini-ligaer og invitationer ---------- */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-muted">
        Mini-ligaer og invitationer
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Mini-ligaer</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{miniLeagueCount ?? 0}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Gns. medlemmer</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{avgLeagueSize}</div>
        </div>
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
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Sidevisninger i alt</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{pageviewsAllTime ?? 0}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Unikke (30 dage)</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{uniqueVisitors30d}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Unikke (7 dage)</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{uniqueVisitors7d}</div>
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
