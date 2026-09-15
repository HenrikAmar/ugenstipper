import { NextRequest } from "next/server";
import { hentNflResultater } from "@/lib/nflResults";

// Kan tage lidt tid, hvis en hel runde skal hentes og alle point genberegnes.
export const maxDuration = 60;

/**
 * Henter færdigspillede NFL-resultater automatisk (se src/lib/nflResults.ts).
 *
 * Køres af Vercel én gang i døgnet - se vercel.json. Vercels gratis-plan
 * tillader kun ét dagligt kørsel pr. cronjob, og det er rigeligt her: formålet
 * er ikke live-resultater, men at ingen skal sidde og taste om natten.
 * Kampene om søndagen er indtastet mandag morgen, og mandagskampen tirsdag.
 *
 * Vil man have dem ind med det samme, er der en "Hent resultater nu"-knap på
 * /admin/kampe, som kalder præcis det samme.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rapport = await hentNflResultater();

  console.log("[nfl-resultater]", rapport.besked, {
    indtastede: rapport.indtastede,
    mangler: rapport.mangler,
  });

  return Response.json({ ok: true, ...rapport });
}
