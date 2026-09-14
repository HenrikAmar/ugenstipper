import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, needsBirthDate } = await updateSession(request);

  const path = request.nextUrl.pathname;
  // /regler skal kunne ses uden at være logget ind, så man kan læse reglerne,
  // før man vælger at oprette en bruger (se knappen på login-siden).
  //
  // "/" (forsiden) skal også kunne ses uden at være logget ind - det er den
  // nye landingsside, der præsenterer konkurrencen for nye besøgende, før de
  // opretter sig (se src/app/page.tsx).
  //
  // VIGTIGT: /api skal ALTID være undtaget herfra. API-ruter (cron-jobs,
  // webhooks m.m.) har ingen indlogget browser-session med cookies - de
  // godkender sig selv på deres egen måde (se fx CRON_SECRET-tjekket i
  // src/app/api/cron/*). Uden denne undtagelse fangede middleware'en enhver
  // sådan forespørgsel som "ikke logget ind" og omdirigerede den til
  // /login FØR den overhovedet nåede ruten - hvilket i praksis betød at
  // BÅDE det daglige "husk at tippe"-cron-job OG det automatiske
  // resultat-cron-job (Vercel + GitHub Actions) aldrig har virket, uden at
  // det fejlede synligt nogen steder. Fundet 31/8 i forbindelse med at
  // resultater ikke blev hentet automatisk.
  const isPublicPath =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/regler") ||
    // Afmeld-linket i nyhedsbrev-mails skal kunne bruges uden at være logget
    // ind - man skal jo netop kunne afmelde sig, selvom man ikke lige har
    // lyst til/husker at logge ind. Se src/app/nyhedsbrev/afmeld.
    path.startsWith("/nyhedsbrev") ||
    path.startsWith("/api");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Allerede logget ind og på vej til login-siden? Så skal man ikke se den
  // igen - man skal ind på forsiden ("Hjem"), hvor evt. nyheder/beskeder
  // vises, før man selv vælger at gå videre til at tippe (se src/app/page.tsx
  // - "/" viser noget forskelligt afhængig af om man er logget ind eller ej,
  // så den skal IKKE omdirigeres videre her).
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Aldersverificering: alle brugere skal have udfyldt deres fødselsdato,
  // før de kan bruge resten af siden - se src/app/alder og
  // supabase/alder.sql. Grunden: vi vil ikke risikere at vise
  // aldersbegrænsede reklamer (fx betting) til nogen under 18. Vi undtager
  // /alder selv (ellers uendelig omdirigering) og alle de offentlige sider
  // ovenfor (fx skal /regler kunne læses uden at skulle igennem dette
  // først, og /api må ALDRIG blokeres - se forklaringen længere oppe).
  const isAlderPath = path.startsWith("/alder");
  if (user && needsBirthDate && !isPublicPath && !isAlderPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/alder";
    return NextResponse.redirect(url);
  }

  // Har allerede udfyldt fødselsdato, men er på vej til /alder (fx et
  // gammelt åbent faneblad)? Så skal man bare videre til forsiden.
  if (user && !needsBirthDate && isAlderPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
