import { createClient } from "@/lib/supabase/server";
import { TeamBadge } from "@/components/TeamBadge";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import Link from "next/link";

// Stillingen ændrer sig når admin indtaster resultater - må ikke caches.
export const dynamic = "force-dynamic";

interface TipRow {
  user_id: string;
  points: number | null;
  matches: { round_id: string } | null;
}

interface InviteRow {
  user_id: string;
  display_name: string;
  qualified_invites: number;
}

interface RankRow {
  id: string;
  display_name: string;
  points: number;
}

interface StickyRow extends RankRow {
  rank: number;
}

// Viser altid toppen af listen - og fastgør din egen række nederst med din rigtige
// placering, hvis du ikke allerede er med i toppen. Er du allerede med i toppen,
// vises listen bare helt normalt (uden en ekstra, klistret række).
function buildStickyRanking(
  sorted: RankRow[],
  currentUserId: string | undefined,
  windowSize: number
): { rows: StickyRow[]; showGap: boolean } {
  const withRank: StickyRow[] = sorted.map((row, i) => ({ ...row, rank: i + 1 }));
  const myIndex = currentUserId ? withRank.findIndex((r) => r.id === currentUserId) : -1;

  if (myIndex === -1 || myIndex < windowSize) {
    return { rows: withRank.slice(0, windowSize), showGap: false };
  }

  const top = withRank.slice(0, windowSize - 1);
  return { rows: [...top, withRank[myIndex]], showGap: true };
}

function RankingList({
  rows,
  showGap,
  userId,
  valueLabel,
}: {
  rows: StickyRow[];
  showGap: boolean;
  userId: string | undefined;
  valueLabel: (row: StickyRow) => number;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => {
        const isMe = row.id === userId;
        const isPinned = showGap && i === rows.length - 1;
        return (
          <div key={row.id} className="flex flex-col gap-2">
            {isPinned && <div className="text-center text-sm text-text-muted">⋯</div>}
            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                isMe ? "border-[1.5px] border-accent-2 bg-accent-tint" : "border-border bg-surface"
              }`}
            >
              <div className="w-5 text-center font-heading text-sm font-bold text-text-muted">
                {row.rank}
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
                {valueLabel(row)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function StillingPage({
  searchParams,
}: {
  searchParams: { visning?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const visning = searchParams.visning === "runde" ? "runde" : "samlet";

  const [{ data: profiles }, { data: currentRound }, { data: tips }, { data: inviteTop }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("rounds").select("id, number").eq("is_current", true).maybeSingle(),
      supabase.from("tips").select("user_id, points, matches(round_id)"),
      supabase
        .from("invite_leaderboard")
        .select("user_id, display_name, qualified_invites")
        .gt("qualified_invites", 0)
        .order("qualified_invites", { ascending: false })
        .limit(3),
    ]);

  const inviteRanking = (inviteTop ?? []) as InviteRow[];

  const tipRows = (tips ?? []) as unknown as TipRow[];

  const totals = new Map<string, number>();
  for (const tip of tipRows) {
    if (tip.points === null) continue;
    if (visning === "runde" && tip.matches?.round_id !== currentRound?.id) continue;
    totals.set(tip.user_id, (totals.get(tip.user_id) ?? 0) + tip.points);
  }

  const ranking: RankRow[] = (profiles ?? [])
    .map((p) => ({ ...p, points: totals.get(p.id) ?? 0 }))
    .sort((a, b) => b.points - a.points);

  const generalDisplay = buildStickyRanking(ranking, user?.id, 5);

  const { data: membership } = await supabase
    .from("mini_league_members")
    .select("league_id, mini_leagues(name)")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  let miniligaName: string | null = null;
  let miniligaDisplay: { rows: StickyRow[]; showGap: boolean } = { rows: [], showGap: false };

  if (membership) {
    miniligaName =
      (membership as unknown as { mini_leagues: { name: string } | null }).mini_leagues?.name ??
      null;

    const { data: members } = await supabase
      .from("mini_league_members")
      .select("user_id")
      .eq("league_id", membership.league_id);

    const memberIds = new Set((members ?? []).map((m) => m.user_id));
    const miniligaRanking = ranking.filter((r) => memberIds.has(r.id));
    miniligaDisplay = buildStickyRanking(miniligaRanking, user?.id, 3);
  }

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader
        title="Stilling"
        subtitle={
          <p className="mt-0.5 text-[13px] text-text-muted">
            {currentRound ? `Efter runde ${currentRound.number}` : "Ingen aktiv runde"}
          </p>
        }
      />

      <div className="flex gap-2 px-5 py-3.5">
        <Link
          href="/stilling?visning=samlet"
          className={`pill ${
            visning === "samlet" ? "bg-navy text-white" : "border border-border text-text-muted"
          }`}
        >
          Samlet
        </Link>
        <Link
          href="/stilling?visning=runde"
          className={`pill ${
            visning === "runde" ? "bg-navy text-white" : "border border-border text-text-muted"
          }`}
        >
          Denne runde
        </Link>
      </div>

      <div className="px-5">
        <RankingList
          rows={generalDisplay.rows}
          showGap={generalDisplay.showGap}
          userId={user?.id}
          valueLabel={(row) => row.points}
        />
        {ranking.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">
            Ingen point endnu denne sæson.
          </p>
        )}
      </div>

      {miniligaName && (
        <div className="mt-6 px-5">
          <h2 className="mb-2 text-[13px] font-bold text-text-muted">Miniliga – {miniligaName}</h2>
          <RankingList
            rows={miniligaDisplay.rows}
            showGap={miniligaDisplay.showGap}
            userId={user?.id}
            valueLabel={(row) => row.points}
          />
        </div>
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
