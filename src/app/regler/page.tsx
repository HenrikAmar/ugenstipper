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
            Du kan tippe på den aktuelle runde samt de næste 2 runder. Du kan altid ændre dit tip,
            helt frem til lige inden kampstart - du taster blot dit nye tip og klikker på
            &bdquo;Gem runde&rdquo;.
          </p>
        </section>

        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">NFL</h2>
          <p className="text-[13.5px] leading-relaxed text-text-muted">
            Ved siden af Superliga-konkurrencen kører vi også en NFL-konkurrence - samme
            spilform, samme login. De to konkurrencer (og deres miniligaer) holdes helt adskilt
            fra hinanden. Point optjenes efter de samme principper som ovenfor, men
            Resultaterne indtastes manuelt af os efter hver runde.
          </p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">
            NFL har sit eget pointsystem, fordi scorerne er langt højere og mere spredte end i
            fodbold - et bud som 27-10 rammes næsten aldrig helt præcist. Derfor er der flere
            måder at score på undervejs:
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13.5px] leading-relaxed text-text-muted">
            <li>3 point, hvis du rammer den rigtige vinder.</li>
            <li>
              3 point, hvis du rammer sejrsmarginen - altså at de vinder med præcis det antal
              point, du gættede.
            </li>
            <li>3 point for hvert af de to holds score, du rammer præcist.</li>
            <li>
              10 point oveni, hvis du rammer hele resultatet. Touchdown!
            </li>
          </ul>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">
            Det hele lægges sammen, så en enkelt kamp kan give helt op til 22 point, hvis du
            rammer plet. I praksis giver en kamp 0, 3, 6 eller 22 point - flere af reglerne
            hænger nemlig sammen: rammer du både marginen og det ene holds score, er det andet
            tal givet på forhånd, og så har du jo ramt hele resultatet. Pointsystemet for NFL er
            nyt, og vi justerer det gerne undervejs, hvis det viser sig at ramme skævt.
          </p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">
            Du vælger selv, hvad du vil være med i: Superliga, NFL eller begge dele. Det gør du
            under &bdquo;Dine konkurrencer&rdquo; på forsiden (og under Profil). Vælger du kun den
            ene, ser du slet ikke den anden - hverken kampe, stilling eller påmindelser. Det
            eneste krav er, at du er med i mindst én; ellers ville der jo ikke være noget at
            tippe. Du kan skifte når som helst, og dine tips og point bliver gemt, så du kan
            vende tilbage til en konkurrence uden at have mistet noget.
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
            Under din profil kan du oprette dine egne miniligaer med venner, familie eller
            kollegaer - du kan sagtens være med i flere ad gangen (f.eks. én med familien og én med
            kollegaerne). Giv den et navn, og vælg selv, om den skal have en kode - uden kode er
            den åben for alle, der kender navnet. Du kan forlade en miniliga igen, når du vil.
            Miniligaer oprettes separat for Superliga og NFL.
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
            Når konkurrencen skydes i gang d. 9. oktober, kan du vinde en valgfri, officiel
            Superligatrøje til en værdi af op til 750 kr.! Vi lægger i øjeblikket sidste hånd på
            de præcise sæsonperioder og slutdatoer - endelig info følger her på siden lige op til
            kampstart. Gør dig klar!
          </p>
        </section>

        <section className="card rounded-xl p-4">
          <h2 className="mb-2 text-[15px] font-bold">Dine data</h2>
          <p className="text-[13.5px] leading-relaxed text-text-muted">
            Når du logger ind, gemmer vi din e-mail, dit navn og din fødselsdato i vores database
            (placeret i Irland) for at kunne administrere din profil, udbetale præmier og sikre,
            at du ikke får vist reklamer, der ikke er beregnet til din aldersgruppe (f.eks.
            spil/betting til brugere under 18 år). Vi sælger eller deler aldrig dine data og
            sporer ikke din adfærd.
          </p>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
