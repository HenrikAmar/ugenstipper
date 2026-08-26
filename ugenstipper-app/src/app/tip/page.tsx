import { createClient } from "@/lib/supabase/server";
import { getTippableRounds } from "@/lib/rounds";
import { RoundTabs } from "@/components/RoundTabs";
import { MatchCard } from "@/components/MatchCard";
import { BottomNav } from "@/components/BottomNav";
import type { Match, Tip } from "@/lib/types";

// Data ændrer sig hele tiden (nye tips, admin-ændringer) - denne side må
// aldrig caches af Next.js, den skal altid hente friske data.
export const dynamic = "force-dynamic";

export default async function TipPage({
  searchParams,
}: {
  searchParams: { runde?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rounds = await getTippableRounds(supabase);

  if (rounds.length === 0) {
    return (
      <div className="mx-auto max-w-[420px] px-6 py-16 text-center">
        <h1 className="text-lg font-bold">Ingen aktiv runde endnu</h1>
        <p className="mt-2 text-sm text-text-muted">
          Admin har ikke sat en indeværende runde op endnu. Kom tilbage senere.
        </p>
      </div>
    );
  }

  const activeRound =
    rounds.find((r) => r.id === searchParams.runde) ??
    rounds.find((r) => r.is_current) ??
    rounds[0];

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("round_id", activeRound.id)
    .order("kickoff_at", { ascending: true });

  const matchList: Match[] = matches ?? [];

  const { data: tips } = await supabase
    .from("tips")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .in("match_id", matchList.map((m) => m.id));

  const tipsByMatch = new Map<string, Tip>((tips ?? []).map((t) => [t.match_id, t]));

  const tippedCount = matchList.filter((m) => tipsByMatch.has(m.id)).length;

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <RoundTabs rounds={rounds} activeRoundId={activeRound.id} basePath="/tip" />

      <div className="flex items-baseline justify-between px-5 pb-3">
        <span className="text-xs font-semibold uppercase text-text-muted">
          Runde {activeRound.number} · {activeRound.season}
        </span>
        <span className="text-xs font-bold text-accent">
          {tippedCount} af {matchList.length} tippet
        </span>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {matchList.length === 0 && (
          <p className="text-sm text-text-muted">Ingen kampe oprettet i denne runde endnu.</p>
        )}
        {matchList.map((match) => (
          <MatchCard key={match.id} match={match} existingTip={tipsByMatch.get(match.id)} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
