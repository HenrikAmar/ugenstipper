import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";

// Statistikken ændrer sig når admin indtaster resultater - må ikke caches.
export const dynamic = "force-dynamic";

interface TipWithContext {
  user_id: string;
  points: number | null;
  tip_home: number;
  tip_away: number;
  matches: {
    home_team: string;
    away_team: string;
    kickoff_at: string;
    result_home: number | null;
    result_away: number | null;
    rounds: { number: number; kind: "liga" | "bonus" } | null;
  } | null;
}

export default async function StatistikPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: allTips } = await supabase
    .from("tips")
    .select(
      "user_id, points, tip_home, tip_away, matches(home_team, away_team, kickoff_at, result_home, result_away, rounds(number, kind))"
    );

  const tips = (allTips ?? []) as unknown as TipWithContext[];
  // Bonusrunder holdes uden for den almindelige statistik - deres rundenumre
  // starter forfra (Bonus runde 1, 2, ...) og ville ellers blive blandet
  // sammen med de almindelige runder med samme nummer.
  const decided = tips.filter((t) => t.points !== null && t.matches?.rounds?.kind !== "bonus");

  const myDecided = decided
    .filter((t) => t.user_id === user?.id)
    .sort(
      (a, b) =>
        new Date(b.matches!.kickoff_at).getTime() - new Date(a.matches!.kickoff_at).getTime()
    );

  const accuracy =
    myDecided.length === 0
      ? 0
      : Math.round(
          (myDecided.filter((t) => (t.points ?? 0) > 0).length / myDecided.length) * 100
        );

  // Point pr. runde - for mig og som gennemsnit af alle
  const myByRound = new Map<number, number>();
  const allByRound = new Map<number, { sum: number; users: Set<string> }>();

  for (const t of decided) {
    const roundNumber = t.matches?.rounds?.number;
    if (roundNumber === undefined || roundNumber === null) continue;
    if (t.user_id === user?.id) {
      myByRound.set(roundNumber, (myByRound.get(roundNumber) ?? 0) + (t.points ?? 0));
    }
    const entry = allByRound.get(roundNumber) ?? { sum: 0, users: new Set<string>() };
    entry.sum += t.points ?? 0;
    entry.users.add(t.user_id);
    allByRound.set(roundNumber, entry);
  }

  const roundNumbers = Array.from(myByRound.keys()).sort((a, b) => a - b);
  const chartRounds = roundNumbers.map((number) => {
    const all = allByRound.get(number);
    const avg = all && all.users.size > 0 ? all.sum / all.users.size : 0;
    return { number, mine: myByRound.get(number) ?? 0, avg };
  });

  let bestRound: { number: number; points: number } | null = null;
  let worstRound: { number: number; points: number } | null = null;
  for (const r of chartRounds) {
    if (!bestRound || r.mine > bestRound.points) bestRound = { number: r.number, points: r.mine };
    if (!worstRound || r.mine < worstRound.points) worstRound = { number: r.number, points: r.mine };
  }

  let streak = 0;
  for (const t of myDecided) {
    if ((t.points ?? 0) > 0) streak++;
    else break;
  }

  const maxChartPoints = Math.max(1, ...chartRounds.map((r) => Math.max(r.mine, r.avg)));
  const chartWidth = 330;
  const chartHeight = 120;
  const step = chartRounds.length > 1 ? chartWidth / (chartRounds.length - 1) : 0;

  function toPoint(index: number, value: number) {
    const x = chartRounds.length > 1 ? index * step : chartWidth / 2;
    const y = chartHeight - (value / maxChartPoints) * (chartHeight - 15) - 5;
    return `${Math.round(x)},${Math.round(y)}`;
  }

  const minePoly = chartRounds.map((r, i) => toPoint(i, r.mine)).join(" ");
  const avgPoly = chartRounds.map((r, i) => toPoint(i, r.avg)).join(" ");

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader title="Din statistik" />

      <div className="grid grid-cols-2 gap-2.5 px-5 pt-4">
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Træfsikkerhed</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{accuracy}%</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Aktuel stime</div>
          <div className="mt-1 font-heading text-2xl font-extrabold">{streak}</div>
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Bedste runde</div>
          <div className="mt-1 font-heading text-lg font-extrabold">
            {bestRound ? `Runde ${bestRound.number}` : "–"}
          </div>
          {bestRound && (
            <div className="text-[11px] font-bold text-accent">{bestRound.points} point</div>
          )}
        </div>
        <div className="card rounded-xl p-3.5">
          <div className="text-[11.5px] font-semibold text-text-muted">Dårligste runde</div>
          <div className="mt-1 font-heading text-lg font-extrabold">
            {worstRound ? `Runde ${worstRound.number}` : "–"}
          </div>
          {worstRound && (
            <div className="text-[11px] font-bold text-text-muted">{worstRound.points} point</div>
          )}
        </div>
      </div>

      {chartRounds.length > 0 && (
        <div className="card mx-5 mt-4 rounded-xl p-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] font-bold">Point pr. runde</span>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[9px] w-[9px] rounded-full bg-accent-2" /> Dig
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[2px] w-[9px] bg-[#B7BEC9]" /> Snit
              </span>
            </div>
          </div>
          <svg width={chartWidth} height={chartHeight} className="mt-2">
            <polyline points={avgPoly} fill="none" stroke="#B7BEC9" strokeWidth={2} strokeDasharray="4 4" />
            <polyline
              points={minePoly}
              fill="none"
              stroke="#17A673"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-1 flex justify-between px-1">
            {chartRounds.map((r) => (
              <span key={r.number} className="text-[10px] font-semibold text-[#B0B6BF]">
                R{r.number}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 pt-6">
        <div className="mb-2.5 text-[13px] font-bold">Seneste resultater</div>
        <div className="flex flex-col gap-2">
          {myDecided.slice(0, 6).map((t, i) => (
            <div key={i} className="card flex items-center gap-2.5 rounded-[10px] p-2.5">
              <span className="flex-1 text-[13px] font-semibold">
                {t.matches?.home_team} – {t.matches?.away_team} · dit tip {t.tip_home}-{t.tip_away}
              </span>
              <span className="text-[12px] font-extrabold text-accent">+{t.points}</span>
            </div>
          ))}
          {myDecided.length === 0 && (
            <p className="text-sm text-text-muted">Ingen afgjorte kampe endnu.</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
