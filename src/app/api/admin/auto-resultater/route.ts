import { createClient } from "@/lib/supabase/server";
import { runAutoResultater } from "@/lib/autoResultater";

// Admins manuelle "Hent resultater nu"-knap (se src/components/AutoResultButton.tsx).
// Samme resultat-hentning som kører automatisk hver gang admin/kampe-siden
// besøges og i det daglige cron-job - denne rute er bare til at kunne trykke
// "nu" og se et øjeblikkeligt svar i stedet for at vente eller genindlæse.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return new Response("Forbidden", { status: 403 });

  const summary = await runAutoResultater();
  return Response.json(summary);
}
