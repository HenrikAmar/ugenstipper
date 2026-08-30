import { NextRequest } from "next/server";
import { runAutoResultater } from "@/lib/autoResultater";

// Køres automatisk én gang om dagen af Vercel (se vercel.json) - samme
// CRON_SECRET som det eksisterende tip-reminder-job bruger, intet nyt at
// sætte op i Vercel for denne del.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const summary = await runAutoResultater();
  return Response.json(summary);
}
