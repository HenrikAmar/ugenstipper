import { createClient } from "@/lib/supabase/server";
import { getTippableRounds, roundLabel } from "@/lib/rounds";
import { pickWeightedBanner, filterBannersForAge } from "@/lib/banners";
import { calculateAge } from "@/lib/age";
import { RoundTabs } from "@/components/RoundTabs";
import { TipRoundForm } from "@/components/TipRoundForm";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import type { Match, SponsorBanner, Tip } from "@/lib/types";

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
    { data: activeBanners },
  ] = await Promise.all([
    supabase.auth.getUser(),
    getTippableRounds(supabase).catch((err) => {
      console.error("[/tip] getTippableRounds fejlede:", err);
      return null;
    }),
    supabase.from("sponsor_banners").select("*").eq("active", true),
  ]);

  // Bannere med en aldersgrænse (fx betting, 18+) skal filtreres fra FØR
  // den vægtede lodtrækning, ud fra brugerens alder (se supabase/alder.sql
  // og src/middleware.ts, som sikrer alle har udfyldt en fødselsdato, før
  // de når hertil).
  const { data: profile } = await supabase
    .from("profiles")
    .select("birth_date")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const userAge = calculateAge(profile?.birth_date ?? null);

  // Vælg ét banner tilfældigt, vægtet efter sponsorernes aftalte fordeling
  // (se src/lib/banners.ts og src/app/admin/bannere) - og tæl visningen op,
  // så admin kan se, hvor meget hvert banner reelt bliver vist.
  const eligibleBanners = filterBannersForAge(
    (activeBanners ?? []) as SponsorBanner[],
    userAge
  );
  const banner = pickWeightedBanner(eligibleBanners);
  if (banner) {
    try {
      await supabase.rpc("increment_banner_impression", { p_id: banner.id });
    } catch (err) {
      console.error("[/tip] Kunne ikke tælle banner-visning op:", err);
    }
  }

  if (rounds === null) {
    return (
      <div className="mx-auto max-w-[420px] px-6 py-16 text-center">
        <h1 className="text-lg font-bold">Kunne ikke hente kampene</h1>
        <p className="mt-2 text-sm text-text-muted">
          Der opstod en midlertidig fejl ved hentning af kampene. Prøv at
          genindlæse siden om et lille øjeblik.
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

  // Almindeligt objekt i stedet for en Map - så det kan sendes videre til
  // TipRoundForm (en klient-komponent, som ikke kan modtage en Map som prop).
  const tipsByMatch: Record<string, Tip> = {};
  for (const t of tips ?? []) tipsByMatch[t.match_id] = t;

  const tippedCount = matchList.filter((m) => Boolean(tipsByMatch[m.id])).length;

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader title="Tip" />

      {banner && (
        <div className="px-5 pb-4 pt-1">
          {/* Sponsorbanner, valgt vægtet blandt de aktive bannere ovenfor.
              Ligger øverst på siden (før man begynder at tippe), så alle ser
              det - ikke kun dem der scroller helt ned. Linker via
              /api/banner-click, som tæller klikket op og derefter sender
              videre til sponsorens rigtige link - se den route og
              src/app/admin/bannere for hvor tallene vises. Åbner i nyt
              faneblad, da det altid er et eksternt link. */}
          <a
            href={`/api/banner-click/${banner.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image_url} alt={banner.title} className="w-full" />
          </a>
        </div>
      )}

      <RoundTabs rounds={rounds} activeRoundId={activeRound.id} basePath="/tip" />

      <div className="flex items-baseline justify-between px-5 pb-3">
        <span className="text-xs font-semibold uppercase text-text-muted">
          {roundLabel(activeRound)} · {activeRound.season}
        </span>
        <span className="text-xs font-bold text-accent">
          {tippedCount} af {matchList.length} tippet
        </span>
      </div>

      {/* key={activeRound.id} er vigtig: uden den bliver komponenten IKKE
          nulstillet, når man skifter runde via fanerne ovenfor (kun
          props opdateres) - så kan felterne fejlagtigt vise forrige
          rundes (eller tomme) værdier for den nye runde. */}
      <TipRoundForm key={activeRound.id} matches={matchList} tipsByMatch={tipsByMatch} />

      <BottomNav />
    </div>
  );
}
