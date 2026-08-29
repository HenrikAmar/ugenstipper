import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Modtager fejl fra browseren (se src/components/ErrorLogger.tsx og
// src/app/error.tsx) og gemmer dem i public.client_errors, så de kan ses
// bagefter i Supabase - selv fejl der opstår før brugeren nåede at logge
// ind, eller på en side der crashede så hårdt at intet andet virkede.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message ?? "").slice(0, 2000);
    if (!message) return new Response("Bad request", { status: 400 });

    const stack = body?.stack ? String(body.stack).slice(0, 4000) : null;
    const path = body?.path ? String(body.path).slice(0, 500) : null;
    const userAgent = request.headers.get("user-agent");

    // Bruges kun til (evt.) at finde brugerens id - fejler helt stille hvis
    // ingen er logget ind eller sessionen selv er i stykker; det må aldrig
    // stoppe selve fejl-logningen.
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
    await admin.from("client_errors").insert({
      message,
      stack,
      path,
      user_agent: userAgent,
      user_id: userId,
    });

    return Response.json({ ok: true });
  } catch {
    // Selve fejl-logningen må aldrig larme eller vælte noget for brugeren -
    // fejler den, er det ærgerligt, men ikke kritisk.
    return new Response("ok", { status: 200 });
  }
}
