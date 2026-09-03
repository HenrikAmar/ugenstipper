import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PrefetchTip } from "@/components/PrefetchTip";
import type { Announcement } from "@/lib/types";

// Forsiden. Viser noget forskelligt afhængig af om man er logget ind:
// - Ikke logget ind: en salgs-/præsentationsside, der forklarer konkurrencen
//   og opfordrer til at oprette en bruger (den gamle forside redirectede
//   bare direkte til /tip uden nogen præsentation).
// - Logget ind: en "Hjem"-side med plads til nyheder/beskeder (fx "Nu er der
//   kommet præmier!") og en stor "Tip her"-knap videre til /tip - man bliver
//   IKKE længere sendt direkte til /tip efter login.
//
// Data (om man er logget ind, nyheder) kan ændre sig - må ikke caches.
export const dynamic = "force-dynamic";

// Nyheder skrives nu af admin på /admin/nyheder og hentes live herunder -
// ingen kode skal ændres for at opdatere, hvad brugerne ser på forsiden.

const STEPS = [
  {
    title: "Tip kampene",
    text: "Gæt resultatet for hver kamp i runden - du kan altid nå at ændre dine tips, helt frem til den enkelte kamp bliver fløjtet i gang.",
  },
  {
    title: "Saml point",
    text: "1 point for det rigtige udfald, 2 point hvis du også rammer det ene holds måltal - eller 5 point i alt, hvis du rammer resultatet helt præcist.",
  },
  {
    title: "Følg stillingen",
    text: "Se hvordan du klarer dig mod dine venner, runde efter runde - hele sæsonen igennem.",
  },
];

const FEATURES = [
  {
    title: "Miniligaer",
    text: "Opret din egen liga med venner, familie eller kollegaer - med eller uden kode.",
  },
  {
    title: "Bonusrunder",
    text: "Ekstra sjove runder ind imellem, fx når et dansk hold spiller i Europa.",
  },
  {
    title: "Inviter venner",
    text: "Få flere med, og se hvem der topper listen over inviterede venner.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allerede logget ind? Vis "Hjem" med nyheder + en stor "Tip her"-knap i
  // stedet for salgsteksten - man skal ikke se den igen, men skal heller
  // ikke sendes direkte til /tip uden om denne side.
  if (user) {
    const { data: announcements } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    const announcementList: Announcement[] = announcements ?? [];

    return (
      <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
        <PrefetchTip />
        <AppHeader title="Ugenstipper.dk" />

        <div className="flex flex-col gap-3 px-5 pt-3">
          {announcementList.map((announcement, i) => (
            <div key={announcement.id} className="card overflow-hidden rounded-xl">
              {i === 0 && !announcement.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/logo.png"
                  alt="Ugenstipper.dk"
                  className="mx-auto mb-3 mt-4 block h-48 w-48"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  {i === 0 && (
                    <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[10px] font-bold text-accent">
                      NYT
                    </span>
                  )}
                  <h2 className="text-[15px] font-bold">{announcement.title}</h2>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-text-muted">
                  {announcement.body}
                </p>
              </div>
              {announcement.image_url && (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={announcement.image_url}
                    alt={announcement.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {announcement.image_caption && (
                    <p className="px-4 py-2.5 text-[12px] italic text-text-muted">
                      {announcement.image_caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 pt-5">
          <Link
            href="/tip"
            className="flex h-16 items-center justify-center rounded-[14px] bg-accent-2 text-[18px] font-extrabold text-white"
          >
            Tip her
          </Link>
        </div>

        <div className="px-5 pt-8">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
            Sådan virker det
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="card flex items-start gap-3 rounded-xl p-4">
                <div className="badge flex-shrink-0 bg-accent-2">{i + 1}</div>
                <div>
                  <h3 className="text-[14px] font-bold">{step.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pt-8">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
            Mere end bare tips
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card rounded-xl p-4">
                <h3 className="text-[14px] font-bold">{feature.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pt-8">
          <p className="text-center text-[13px] text-text-muted">
            <Link href="/regler" className="font-semibold text-accent underline underline-offset-2">
              Læs de fulde regler
            </Link>
          </p>
        </div>

        <BottomNav />
      </div>
    );
  }

  const ref = searchParams.ref;
  const signupHref = `/login?mode=signup${ref ? `&ref=${ref}` : ""}`;
  const loginHref = ref ? `/login?ref=${ref}` : "/login";

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg">
      <div className="relative overflow-hidden bg-navy px-7 pb-11 pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Ugenstipper.dk" className="mx-auto block h-48 w-48" />
        <h1 className="mt-8 max-w-[280px] text-[28px] font-bold leading-tight text-white">
          Tip Superligaen med vennerne – helt gratis
        </h1>
        <p className="mt-3 max-w-[300px] text-[14.5px] leading-relaxed text-[#AAB4C6]">
          Gæt resultaterne i hver runde, saml point, og se hvem der kender Superligaen bedst.
        </p>
        <p className="mt-2 max-w-[300px] text-[13px] text-[#AAB4C6]">
          Ingen indsats, ingen odds - bare skarpe tips og en fælles stilling med vennerne.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={signupHref}
            className="flex h-[50px] items-center justify-center rounded-[10px] bg-accent-2 text-[15px] font-bold text-white"
          >
            Opret gratis konto
          </Link>
          <Link
            href={loginHref}
            className="flex h-[50px] items-center justify-center rounded-[10px] border border-white/25 text-[15px] font-bold text-white"
          >
            Jeg har allerede en bruger
          </Link>
        </div>
      </div>

      <div className="px-6 pt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
          Sådan virker det
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="card flex items-start gap-3 rounded-xl p-4">
              <div className="badge flex-shrink-0 bg-accent-2">{i + 1}</div>
              <div>
                <h3 className="text-[14px] font-bold">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
          Mere end bare tips
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card rounded-xl p-4">
              <h3 className="text-[14px] font-bold">{feature.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-8">
        <div className="card rounded-xl p-4">
          <h2 className="text-[15px] font-bold">100% gratis, altid</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
            Ugenstipper er lavet af fodboldgale venner i vores fritid - for sjov, uden indsats og
            uden skjulte gebyrer. Vi er i øjeblikket i en testfase, så der er ingen præmier på
            højkant endnu - det er på vej!
          </p>
        </div>
      </div>

      <div className="px-6 py-8">
        <Link
          href={signupHref}
          className="flex h-[50px] items-center justify-center rounded-[10px] bg-accent-2 text-[15px] font-bold text-white"
        >
          Kom i gang - opret din bruger
        </Link>
        <p className="mt-3 text-center text-[13px] text-text-muted">
          <Link href="/regler" className="font-semibold text-accent underline underline-offset-2">
            Læs de fulde regler
          </Link>
        </p>
      </div>

      <footer className="border-t border-border px-6 py-6 text-center text-[12px] text-text-muted">
        Ugenstipper · Gratis Superliga-tips med vennerne
      </footer>
    </div>
  );
}
