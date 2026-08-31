import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

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
    path.startsWith("/api");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Allerede logget ind? Så skal man ikke se salgs-forsiden eller login-siden
  // igen - man skal direkte ind til at tippe.
  if (user && (path === "/login" || path === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/tip";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
