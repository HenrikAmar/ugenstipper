import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Banneret på /tip linker herind i stedet for direkte til sponsorens side,
// så vi kan tælle klikket op, før vi sender brugeren videre. Se
// src/app/admin/bannere for hvor visninger og klik vises frem.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: banner } = await supabase
    .from("sponsor_banners")
    .select("link_url")
    .eq("id", params.id)
    .maybeSingle();

  if (!banner) {
    return Response.redirect(new URL("/tip", request.url));
  }

  // Fejler denne (fx en midlertidig databasefejl), skal brugeren stadig
  // sendes videre til sponsoren - en tabt tælling er ærgerlig, men må
  // aldrig stå i vejen for selve klikket.
  try {
    await supabase.rpc("increment_banner_click", { p_id: params.id });
  } catch (err) {
    console.error("[banner-click] Kunne ikke tælle klik op:", err);
  }

  return Response.redirect(banner.link_url);
}
