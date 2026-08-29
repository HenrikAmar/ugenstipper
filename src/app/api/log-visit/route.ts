import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Modtager side-visninger fra browseren (se src/components/VisitLogger.tsx)
// og gemmer dem i public.page_visits, så admin kan se besøgstal i Supabase -
// se src/app/admin/statistik/page.tsx.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = String(body?.path ?? "").slice(0, 500);
    const visitorId = String(body?.visitor_id ?? "").slice(0, 100);
    if (!path || !visitorId) return new Response("Bad request", { status: 400 });

    // Bruges kun til (evt.) at finde brugerens id - fejler helt stille hvis
    // ingen er logget ind eller sessionen selv er i stykker; det må aldrig
    // stoppe selve besøgs-logningen.
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // ignoreres med vilje
    }

    const admin = createAdminClient();
    await admin.from("page_visits").insert({
      path,
      visitor_id: visitorId,
      user_id: userId,
    });

    return Response.json({ ok: true });
  } catch {
    // Selve besøgs-logningen må aldrig larme eller vælte noget for brugeren -
    // fejler den, er det ærgerligt, men ikke kritisk.
    return new Response("ok", { status: 200 });
  }
}
