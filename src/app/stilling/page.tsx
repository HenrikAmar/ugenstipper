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

  const [{ data: profiles }, { data: currentRound }, { data: tips }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.from("rounds").select("id, number").eq("is_current", true).maybeSingle(),
    supabase.from("tips").select("user_id, points, matches(round_id)"),
  ]);

  const tipRows = (tips ?? []) as unknown as TipRow[];

  const totals = new Map<string, number>();
  for (const tip of tipRows) {
    if (tip.points === null) continue;
    if (visning === "runde" && tip.matches?.round_id !== currentRound?.id) continue;
    totals.set(tip.user_id, (totals.get(tip.user_id) ?? 0) + tip.points);
  }

  const ranking = (profiles ?? [])
    .map((p) => ({ ...p, points: totals.get(p.id) ?? 0 }))
    .sort((a, b) => b.points - a.points);

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

      <div className="flex flex-col gap-2 px-5">
        {ranking.map((row, i) => {
          const isMe = row.id === user?.id;
          return (
            <div
              key={row.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                isMe ? "border-[1.5px] border-accent-2 bg-accent-tint" : "border-border bg-surface"
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
                {row.points}
              </div>
            </div>
          );
        })}
        {ranking.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">
            Ingen point endnu denne sæson.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
