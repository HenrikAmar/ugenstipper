"use client";

import { TeamBadge } from "@/components/TeamBadge";
import { visningsnavn } from "@/lib/clubColors";
import type { LiveKamp } from "@/lib/nflResults";
import type { Match, Tip } from "@/lib/types";

// Viser altid dansk tid (Europe/Copenhagen), uanset hvor i verden man selv sidder,
// og uanset om siden først bliver tegnet op på serveren (som kører i UTC).
const TIME_ZONE = "Europe/Copenhagen";

function formatKickoff(iso: string) {
  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat("da-DK", {
    weekday: "short",
    timeZone: TIME_ZONE,
  }).format(date);
  const day = new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(date);
  const time = new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
  return `${weekday}. ${day} · ${time}`;
}

export function MatchCard({
  match,
  existingTip,
  value,
  onChange,
  live,
  pladsTilLangeNavne = false,
}: {
  match: Match;
  existingTip: Tip | undefined;
  // Styres af den samlede formular (TipRoundForm) - denne kortkomponent har
  // ikke længere sin egen "gem"-knap eller egen tilstand for tippet.
  value: { home: string; away: string };
  onChange: (home: string, away: string) => void;
  // Stillingen lige nu, hvis kampen er i gang (kun NFL - se
  // src/lib/useNflLive.ts). Den hentes til visning og gemmes aldrig, så den
  // kan ikke udløse point. Er kampen afgjort, vinder det officielle resultat.
  live?: LiveKamp;
  /**
   * To forskellige opstillinger af samme kort:
   *
   *  false (standard): holdnavn - tal - holdnavn på ÉN række. Kompakt, og
   *    fint til korte navne som "Brøndby IF" og "AGF".
   *
   *  true: navnene får hele rækken for sig selv, og tallene flytter ned
   *    under dem. Nødvendigt ved lange navne som "Los Angeles Chargers" og
   *    "Washington Commanders" - ellers klemmer tallene navnene så meget
   *    sammen, at man kun kan læse "Los Angel..." og ikke kan se, hvem man
   *    egentlig tipper på.
   *
   * TipRoundForm afgør det for en hel runde ad gangen, så alle kort i samme
   * runde ser ens ud.
   */
  pladsTilLangeNavne?: boolean;
}) {
  const locked = new Date(match.kickoff_at) <= new Date();
  const finished = match.result_home !== null && match.result_away !== null;
  const visLive = Boolean(live) && !finished;

  // Navnet holdes altid på ÉN linje og klippes af med "..." , hvis det er for
  // langt - to linjer rodede kortene for meget til. Til gengæld har navnet i
  // den luftige opstilling hele rækken til rådighed i stedet for kun en
  // tredjedel, så der bliver klippet langt mindre af end før. Skriften er en
  // anelse mindre dér, hvilket giver et par tegn mere at gøre godt med.
  const navneStil = pladsTilLangeNavne
    ? "truncate text-[13.5px] font-semibold"
    : "truncate text-sm font-semibold";

  const hjemmeNavn = (
    <div
      className={`flex min-w-0 items-center gap-2.5 ${
        pladsTilLangeNavne ? "flex-1" : ""
      }`}
    >
      <TeamBadge team={match.home_team} />
      {/* Badge og farver slår op på det FULDE navn - kun teksten forkortes. */}
      <span className={navneStil}>{visningsnavn(match.home_team)}</span>
    </div>
  );

  const udeNavn = (
    <div
      className={`flex min-w-0 items-center justify-end gap-2.5 ${
        pladsTilLangeNavne ? "flex-1" : ""
      }`}
    >
      <span className={`${navneStil} text-right`}>{visningsnavn(match.away_team)}</span>
      <TeamBadge team={match.away_team} />
    </div>
  );

  if (locked) {
    // "Dit tip"-linjen og "kampen er i gang"-linjen skal fremstå lige så
    // tydelige som holdnavnene (text-sm) - kun "Du tippede ikke på denne
    // kamp" (ingen tip at fremhæve) beholder den mindre skriftstørrelse.
    const footerTextSize = finished && !existingTip ? "text-[11.5px]" : "text-sm";

    const resultat = (
      <div
        className={`flex items-center gap-2 font-heading text-base font-bold ${
          visLive ? "text-accent" : "text-text-muted"
        }`}
      >
        {/* Mens kampen er i gang (ikke længere kun "låst", men heller ikke
            afgjort endnu) skal felterne stå tomme - de må aldrig vise
            brugerens eget tip som om det var stillingen. Har vi en
            live-stilling, vises DEN i stedet for stregerne. */}
        <span>{finished ? match.result_home : visLive ? live!.hjemmeScore : "–"}</span>
        <span className="text-[#B7BEC9]">–</span>
        <span>{finished ? match.result_away : visLive ? live!.udeScore : "–"}</span>
      </div>
    );

    return (
      <div className="card flex flex-col gap-2.5 rounded-card border-border bg-surface-2 p-4 opacity-80">
        {pladsTilLangeNavne ? (
          <>
            <div className="flex items-center justify-between gap-2">
              {hjemmeNavn}
              {udeNavn}
            </div>
            <div className="flex justify-center">{resultat}</div>
          </>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            {hjemmeNavn}
            {resultat}
            {udeNavn}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 font-semibold text-text-muted">
          <span className={footerTextSize}>
            {finished
              ? existingTip
                ? `Dit tip: ${existingTip.tip_home}-${existingTip.tip_away}`
                : "Du tippede ikke på denne kamp"
              : existingTip
                ? `Kampen er i gang · dit tip er låst (${existingTip.tip_home}-${existingTip.tip_away})`
                : "Kampen er i gang · dit tip er låst"}
          </span>
          {/* ESPN leverer teksten færdigformateret, fx "4:32 - 3rd", så vi
              slipper for selv at regne quarter og spilleur ud. */}
          {visLive && live!.status && (
            <span className="shrink-0 rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-bold text-accent">
              {live!.status}
            </span>
          )}
          {finished && existingTip?.points !== null && existingTip?.points !== undefined && (
            <span className="shrink-0 text-[11.5px] font-bold text-accent">
              +{existingTip.points} point
            </span>
          )}
        </div>
      </div>
    );
  }

  // Er det der står i felterne lige nu allerede gemt i databasen? Bruges kun
  // til det lille "✓ Gemt"-praj - selve gemningen sker samlet for hele
  // runden via "Gem runde"-knappen nederst på siden.
  const savedAsIs =
    Boolean(existingTip) &&
    value.home === (existingTip?.tip_home?.toString() ?? "") &&
    value.away === (existingTip?.tip_away?.toString() ?? "");

  const felter = (
    <div className="flex items-center gap-1.5">
      <input
        inputMode="numeric"
        value={value.home}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""), value.away)}
        className="h-[34px] w-[34px] rounded-lg border border-accent-2 bg-accent-tint text-center font-heading text-[15px] font-bold text-accent"
      />
      <span className="font-bold text-[#B7BEC9]">–</span>
      <input
        inputMode="numeric"
        value={value.away}
        onChange={(e) => onChange(value.home, e.target.value.replace(/[^0-9]/g, ""))}
        className="h-[34px] w-[34px] rounded-lg border border-accent-2 bg-accent-tint text-center font-heading text-[15px] font-bold text-accent"
      />
    </div>
  );

  return (
    <div className="card flex flex-col gap-2.5 rounded-card p-4 shadow-sm">
      {pladsTilLangeNavne ? (
        <>
          <div className="flex items-center justify-between gap-2">
            {hjemmeNavn}
            {udeNavn}
          </div>
          <div className="flex justify-center">{felter}</div>
        </>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          {hjemmeNavn}
          {felter}
          {udeNavn}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-muted">
          {formatKickoff(match.kickoff_at)}
        </span>
        {savedAsIs && <span className="text-[11.5px] font-bold text-accent">✓ Gemt</span>}
      </div>
    </div>
  );
}
