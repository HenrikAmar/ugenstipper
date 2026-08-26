import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Håndterer redirect tilbage fra Google OAuth-login.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/tip";
  const ref = searchParams.get("ref");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Gemmer "inviteret af", hvis brugeren lige har oprettet sig via Google og kom fra et
      // invite-link. (E-mail/adgangskode-signup gemmer det allerede direkte ved oprettelse.)
      if (ref) {
        const oprettetForNylig =
          Date.now() - new Date(data.user.created_at).getTime() < 2 * 60 * 1000;
        if (oprettetForNylig) {
          await supabase
            .from("profiles")
            .update({ invited_by: ref })
            .eq("id", data.user.id)
            .is("invited_by", null);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?fejl=login-fejlede`);
}
