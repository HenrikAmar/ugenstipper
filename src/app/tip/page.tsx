import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTippableRounds, roundLabel } from "@/lib/rounds";
import { RoundTabs } from "@/components/RoundTabs";
import { MatchCard } from "@/components/MatchCard";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
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

  // De to opslag herunder er uafhængige af hinanden - kør dem samtidig i
  // stedet for efter hinanden, det gør siden mærkbart hurtigere at åbne.
  // getTippableRounds fanges særskilt (i stedet for at lade Promise.all
  // fejle helt), så vi kan vise en anden besked, hvis det er databasen der
  // ikke svarer, end hvis der reelt bare ikke er sat en runde op.
  const [
    {
      data: { user },
    },
    rounds,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getTippableRounds(supabase).catch(() => null),
  ]);

  if (rounds === null) {
    return (
      <div className="mx-auto max-w-[420px] px-6 py-16 text-center">
        <h1 className="text-lg font-bold">Kunne ikke hente kampene</h1>
        <p className="mt-2 text-sm text-text-muted">
          Databasen svarede ikke lige nu - det sker typisk hvis den lige skal
          vågne op efter en periode uden besøgende. Prøv at genindlæse siden om
          et lille øjeblik.
        </p>
      </div>
    );
  }

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
      <AppHeader title="Tip" />
      <RoundTabs rounds={rounds} activeRoundId={activeRound.id} basePath="/tip" />

      <div className="flex items-baseline justify-between px-5 pb-3">
        <span className="text-xs font-semibold uppercase text-text-muted">
          {roundLabel(activeRound)} · {activeRound.season}
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

      <div className="px-5 pt-5">
        <Link href="/" className="block overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/banner-forside.jpg" alt="Ugenstipper.dk" className="w-full" />
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
