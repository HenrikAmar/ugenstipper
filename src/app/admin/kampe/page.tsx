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
import { AutoResultButton } from "@/components/AutoResultButton";
import { roundLabel } from "@/lib/rounds";
import { runAutoResultater } from "@/lib/autoResultater";

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

  // Henter automatisk officielle resultater fra API-Football for kampe der
  // mangler et resultat, hver gang admin åbner siden - se
  // src/lib/autoResultater.ts. Fejler det (fx manglende API-nøgle), skal det
  // aldrig vælte selve admin-siden - kun logges.
  try {
    await runAutoResultater();
  } catch (err) {
    console.error("Automatisk resultat-hentning fejlede", err);
  }

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
          <a href="/admin/statistik" className="text-sm font-semibold text-accent">
            Statistik →
          </a>
          <a href="/tip" className="text-sm font-semibold text-text-muted">
            ← Tilbage til Ugenstipper
          </a>
          <AutoResultButton />
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
          + Ny runde
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {roundList.map((r) => (
          <a key={r.id}
            href={`/admin/kampe?runde=${r.id}`}
            className={`pill ${
              activeRound?.id === r.id
                ? "bg-navy text-white"
                : "border border-border text-text-muted"
            }`}
          >
            {roundLabel(r)}
            {r.is_current ? " · Aktuel" : ""}
          </a>
        ))}
      </div>

      {activeRound && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeRound.kind === "liga" && !activeRound.is_current && (
            <form action={setCurrentRound.bind(null, activeRound.id)}>
              <button className="rounded-lg border border-accent-2 px-3 py-1.5 text-xs font-bold text-accent">
                Sæt {roundLabel(activeRound)} som indeværende runde
              </button>
            </form>
          )}
          <DeleteRoundButton
            roundId={activeRound.id}
            roundLabel={roundLabel(activeRound)}
            deleteRound={deleteRound}
          />
        </div>
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
            {activeRound.kind === "liga" ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted">Hjemmehold</label>
                  <select
                    name="home_team"
                    required
                    defaultValue=""
                    className="h-10 w-44 rounded-lg border border-border px-3 text-sm"
                  >
                    <option value="" disabled>
                      Vælg hold
                    </option>
                    {SUPERLIGA_TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted">Udehold</label>
                  <select
                    name="away_team"
                    required
                    defaultValue=""
                    className="h-10 w-44 rounded-lg border border-border px-3 text-sm"
                  >
                    <option value="" disabled>
                      Vælg hold
                    </option>
                    {SUPERLIGA_TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted">Hjemmehold</label>
                  <input
                    name="home_team"
                    required
                    placeholder="fx FC København"
                    className="h-10 w-44 rounded-lg border border-border px-3 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-muted">Udehold</label>
                  <input
                    name="away_team"
                    required
                    placeholder="fx Real Madrid"
                    className="h-10 w-44 rounded-lg border border-border px-3 text-sm"
                  />
                </div>
              </>
            )}
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
                    {activeRound.kind === "liga" ? (
                      <>
                        <select
                          name="home_team"
                          defaultValue={m.home_team}
                          className="h-9 w-40 rounded-lg border border-border px-2.5 text-sm"
                        >
                          {teamOptions(m.home_team).map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                        <span className="pb-2 text-text-muted">–</span>
                        <select
                          name="away_team"
                          defaultValue={m.away_team}
                          className="h-9 w-40 rounded-lg border border-border px-2.5 text-sm"
                        >
                          {teamOptions(m.away_team).map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <input
                          name="home_team"
                          defaultValue={m.home_team}
                          className="h-9 w-40 rounded-lg border border-border px-2.5 text-sm"
                        />
                        <span className="pb-2 text-text-muted">–</span>
                        <input
                          name="away_team"
                          defaultValue={m.away_team}
                          className="h-9 w-40 rounded-lg border border-border px-2.5 text-sm"
                        />
                      </>
                    )}
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
