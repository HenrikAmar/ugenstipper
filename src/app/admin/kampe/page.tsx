import { createClient } from "@/lib/supabase/server";
import {
  createRound,
  setCurrentRound,
  createMatch,
  updateMatch,
  submitResult,
  deleteMatch,
  deleteRound,
} from "./actions";
import { LogoMark } from "@/components/Logo";
import type { Match, Round } from "@/lib/types";
import { utcToDanishLocalInputValue } from "@/lib/time";
import { SUPERLIGA_TEAMS } from "@/lib/clubColors";
import { DeleteRoundButton } from "@/components/DeleteRoundButton";
import { roundLabel } from "@/lib/rounds";

// Til redigeringsformularen: sørger for at holdets nuværende navn altid er en
// mulighed i dropdown'en, selv hvis det (fra en gammel kamp) ikke matcher
// nøjagtigt et af de 12 hold - så vi aldrig overskriver noget ved en fejl.
function teamOptions(current: string) {
  return SUPERLIGA_TEAMS.includes(current) ? SUPERLIGA_TEAMS : [current, ...SUPERLIGA_TEAMS];
}

// Admin-data (kampe/runder/resultater) må aldrig caches - skal altid være friske.
export const dynamic = "force-dynamic";

export default async function AdminKampePage({
  searchParams,
}: {
  searchParams: { runde?: string };
}) {
  const supabase = createClient();

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .order("number", { ascending: true });

  // Vis almindelige runder for sig og bonusrunder for sig (i stedet for
  // blandet sammen, bare fordi de tilfældigvis har samme nummer).
  const roundList: Round[] = (rounds ?? []).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "liga" ? -1 : 1;
    return a.number - b.number;
  });
  const activeRound =
    roundList.find((r) => r.id === searchParams.runde) ??
    roundList.find((r) => r.is_current) ??
    roundList[0];

  const { data: matches } = activeRound
    ? await supabase
        .from("matches")
        .select("*")
        .eq("round_id", activeRound.id)
        .order("kickoff_at", { ascending: true })
    : { data: [] as Match[] };

  const matchList: Match[] = matches ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
            <h1 className="text-2xl font-extrabold">Kampe</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Opret runder og kampe, og indtast officielle resultater.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-accent-tint px-3 py-1 text-xs font-bold text-accent">
            {userCount ?? 0} brugere
          </span>
          <a href="/tip" className="text-sm font-semibold text-accent">
            ← Tilbage til Ugenstipper
          </a>
        </div>
      </div>

      <form action={createRound} className="card mt-6 flex flex-wrap items-end gap-3 rounded-xl p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-muted">Sæson</label>
          <input
            name="season"
            defaultValue="2026/27"
            required
            className="h-10 rounded-lg border border-border px-3 text-sm"
          />
          <span className="text-[10px] text-text-muted">
            Til bonusrunder: brug fx &bdquo;Bonus sæson 1&rdquo;
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-muted">Runde-nummer</label>
          <input
            name="number"
            type="number"
            required
            className="h-10 w-28 rounded-lg border border-border px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-muted">Type</label>
          <div className="flex h-10 items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="radio" name="kind" value="liga" defaultChecked />
              Almindelig runde
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="kind" value="bonus" />
              Bonusrunde
            </label>
          </div>
        </div>
        <button className="h-10 rounded-lg bg-navy px-4 text-sm font-bold text-white">