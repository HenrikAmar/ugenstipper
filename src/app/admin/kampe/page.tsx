import { createClient } from "@/lib/supabase/server";
import {
  createRound,
  setCurrentRound,
  createMatch,
  updateMatch,
  submitResult,
  deleteMatch,
} from "./actions";
import { LogoMark } from "@/components/Logo";
import type { Match, Round } from "@/lib/types";
import { utcToDanishLocalInputValue } from "@/lib/time";

// Admin-data (kampe/runder/resultater) må aldrig caches - skal altid være friske.
export const dynamic = "force-dynamic";

export default async function AdminKampePage({
  searchParams,
}: {
  searchParams: { runde?: string };
}) {
  const supabase = createClient();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .order("number", { ascending: true });

  const roundList: Round[] = rounds ?? [];
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
        <a href="/tip" className="text-sm font-semibold text-accent">
          ← Tilbage til Ugenstipper
        </a>
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
        <button className="h-10 rounded-lg bg-navy px-4 text-sm font-bold text-white">
          + Ny runde
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {roundList.map((r) => (
          <a
            key={r.id}
            href={`/admin/kampe?runde=${r.id}`}
            className={`pill ${
              activeRound?.id === r.id
                ? "bg-navy text-white"
                : "border border-border text-text-muted"
            }`}
          >
            Runde {r.number}
            {r.is_current ? " · Aktuel" : ""}
          </a>
        ))}
      </div>

      {activeRound && !activeRound.is_current && (
        <form action={setCurrentRound.bind(null, activeRound.id)} className="mt-3">
          <button className="rounded-lg border border-accent-2 px-3 py-1.5 text-xs font-bold text-accent">
            Sæt Runde {activeRound.number} som indeværende runde
          </button>
        </form>
      )}

      {!activeRound && (
        <p className="mt-8 text-sm text-text-muted">
          Opret en runde ovenfor for at komme i gang.
        </p>
      )}

      {activeRound && (
        <>
          <form
            action={createMatch.bind(null, activeRound.id)}
            className="card mt-6 flex flex-wrap items-end gap-3 rounded-xl p-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted">Hjemmehold</label>
              <input name="home_team" required className="h-10 w-40 rounded-lg border border-border px-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted">Udehold</label>
              <input name="away_team" required className="h-10 w-40 rounded-lg border border-border px-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted">Kampstart</label>
              <input
                name="kickoff_at"
                type="datetime-local"
                required
                className="h-10 rounded-lg border border-border px-3 text-sm"
              />
            </div>
            <button className="h-10 rounded-lg bg-accent-2 px-4 text-sm font-bold text-white">
              + Ny kamp
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-3">
            {matchList.map((m) => {
              const finished = m.result_home !== null && m.result_away !== null;
              return (
                <div key={m.id} className="card rounded-xl p-4">
                  <form
                    action={updateMatch.bind(null, m.id)}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <input
                      name="home_team"
                      defaultValue={m.home_team}
                      className="h-9 w-36 rounded-lg border border-border px-2.5 text-sm"
                    />
                    <span className="pb-2 text-text-muted">–</span>
                    <input
                      name="away_team"
                      defaultValue={m.away_team}
                      className="h-9 w-36 rounded-lg border border-border px-2.5 text-sm"
                    />
                    <input
                      name="kickoff_at"
                      type="datetime-local"
                      defaultValue={utcToDanishLocalInputValue(m.kickoff_at)}
                      className="h-9 rounded-lg border border-border px-2.5 text-sm"
                    />
                    <button className="h-9 rounded-lg border border-border px-3 text-xs font-bold">
                      Gem ændringer
                    </button>
                  </form>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <form
                      action={submitResult.bind(null, m.id)}
                      className="flex items-center gap-2"
                    >
                      <span className="text-xs font-semibold text-text-muted">
                        {finished ? "Officielt resultat" : "Indtast resultat"}
                      </span>
                      <input
                        name="result_home"
                        type="number"
                        min={0}
                        defaultValue={m.result_home ?? ""}
                        className="h-9 w-14 rounded-lg border border-border text-center text-sm"
                      />
                      <span>–</span>
                      <input
                        name="result_away"
                        type="number"
                        min={0}
                        defaultValue={m.result_away ?? ""}
                        className="h-9 w-14 rounded-lg border border-border text-center text-sm"
                      />
                      <button className="h-9 rounded-lg bg-navy px-3 text-xs font-bold text-white">
                        {finished ? "Opdatér resultat" : "Gem resultat"}
                      </button>
                    </form>

                    <form action={deleteMatch.bind(null, m.id)}>
                      <button className="text-xs font-semibold text-danger">Slet kamp</button>
                    </form>
                  </div>
                </div>
              );
            })}
            {matchList.length === 0 && (
              <p className="text-sm text-text-muted">Ingen kampe i denne runde endnu.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
