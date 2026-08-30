import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

// Reglerne skal kunne ses uden at være logget ind (se src/middleware.ts,
// hvor /regler er sat som offentlig sti) - så folk kan tjekke dem, før de
// vælger at oprette en bruger.
export default function ReglerPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader title="Regler" />

      <div className="px-5 pt-2">
        <a href="/profil" className="text-sm font-semibold text-accent">
          ← Tilbage til profil
        </a>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-2">
        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">Om Ugenstipper</h2>
          <p className="text-[13.5px] leading-relaxed text-text-muted">
            Ugenstipper er lavet af fodboldgale venner i vores fritid for sjov - og det er og
            bliver 100% gratis. Vi håber, I vil tage godt imod vores konkurrencer, og at de kan
            give jer lidt ekstra spænding og gode diskussioner op til hver runde. Vi gør, hvad vi
            kan for at holde siden kørende og resultaterne opdaterede, men vi er ikke et
            professionelt firma - så bær over med os, hvis der en sjælden gang skulle glippe noget
            undervejs.
          </p>
        </section>

        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">Sådan får du point</h2>
          <ul className="flex flex-col gap-1.5 text-[13.5px] leading-relaxed text-text-muted">
            <li>1 point, hvis du rammer det rigtige udfald (hjemmesejr, uafgjort eller udesejr).</li>
            <li>
              1 point, hvis du rammer det ene af de to måltal præcist (f.eks. hjemmeholdets mål,
              selvom udeholdets ikke stemmer).
            </li>
            <li>5 point i alt, hvis du rammer det præcise resultat (i stedet for de to ovenfor).</li>
          </ul>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">
            En kamp giver altså enten 0, 1, 2 eller 5 point.
          </p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">
            Du kan tippe på den aktuelle runde samt de næste 2 runder - og du kan ændre dine tips
            helt frem til, at den enkelte kamp fløjtes i gang.
          </p>
        </section>

        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">Bonusrunder</h2>
          <p className="text-[13.5px] leading-relaxed text-text-muted">
            Ind imellem opretter vi en bonusrunde - f.eks. når et dansk hold spiller i Europa. Det
            er ren lir: bonusrunde-point tæller ikke med i den rigtige stilling. De har deres egen
            &bdquo;Bonusrunde-stilling&rdquo; nederst på Stilling-siden, opdelt i egne
            bonus-sæsoner.
          </p>
        </section>

        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">Miniligaer</h2>
          <p className="text-[13.5px] leading-relaxed text-text-muted">
            Under din profil kan du oprette din egen miniliga med venner, familie eller kollegaer.
            Giv den et navn, og vælg selv, om den skal have en kode - uden kode er den åben for
            alle, der kender navnet. Du kan kun være med i én miniliga ad gangen, men du kan
            forlade den og skifte, når du vil.
          </p>
        </section>

        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">Inviter en ven</h2>
          <p className="text-[13.5px] leading-relaxed text-text-muted">
            Du kan invitere venner direkte fra din profil. En invitation tæller først med i din
            tæller, når din ven rent faktisk er kommet i gang med at spille - altså har tippet
            alle kampe i mindst 3 runder. Det er for at sikre, at det er ægte, aktive medspillere,
            det handler om.
          </p>
        </section>

        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">Præmier</h2>
          <p className="text-[13.5px] leading-relaxed text-text-muted">
            Vi er i øjeblikket i en testfase, så der er ingen præmier på højkant lige nu - det er
            ren ære og håneret! Vi arbejder dog stærkt på sagen i baggrunden, og så snart der er
            fede præmier klar til stillingen, opdaterer vi vilkårene her på siden.
          </p>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
