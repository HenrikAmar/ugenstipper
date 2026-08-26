"use server";

import { createClient } from "@/lib/supabase/server";

export async function createMiniliga(name: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_miniliga", {
    p_name: name,
    p_password: password,
  });

  if (error) return { error: error.message };
  return { success: true, id: data as string };
}

export async function joinMiniliga(name: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("join_miniliga", {
    p_name: name,
    p_password: password,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function leaveMiniliga() {
  const supabase = createClient();
  const { error } = await supabase.rpc("leave_miniliga");

  if (error) return { error: error.message };
  return { success: true };
}

// Sender en invitation til miniligaen på brugerens vegne. Kræver at brugeren selv taster
// password ind igen, så vi kan bekræfte det er korrekt OG sende det videre i mailen - vi
// gemmer aldrig selve passwordet, kun en hash af det.
export async function inviteToMiniliga(email: string, password: string) {
  const trimmed = email.trim().toLowerCase();
  const gyldigEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  if (!trimmed || !gyldigEmail) {
    return { error: "Indtast en gyldig e-mail." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du skal være logget ind." };
  }

  const { data: membership } = await supabase
    .from("mini_league_members")
    .select("league_id, mini_leagues(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { error: "Du er ikke med i en miniliga." };
  }

  const { error: pwError } = await supabase.rpc("check_miniliga_password", {
    p_league_id: membership.league_id,
    p_password: password || null,
  });

  if (pwError) {
    return { error: "Forkert kode." };
  }

  const leagueName =
    (membership as unknown as { mini_leagues: { name: string } | null }).mini_leagues?.name ??
    "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const afsenderNavn = profile?.display_name ?? "En ven";

  const adgangHtml = password
    ? `<p>Navn: <strong>${leagueName}</strong><br />Kode: <strong>${password}</strong></p>`
    : `<p>Miniligaen "<strong>${leagueName}</strong>" har ingen kode - søg den bare frem under "Deltag i miniliga" og skriv navnet.</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Ugenstipper <info@ugenstipper.dk>",
      to: [trimmed],
      subject: `${afsenderNavn} har inviteret dig til miniligaen "${leagueName}"`,
      html: `
        <div style="font-family: sans-serif; font-size: 15px; color: #111; max-width: 420px;">
          <p>Hej!</p>
          <p><strong>${afsenderNavn}</strong> har oprettet miniligaen <strong>${leagueName}</strong> på Ugenstipper og vil gerne have dig med.</p>
          <p>
            Log ind (eller opret en gratis bruger) på
            <a href="https://ugenstipper.dk">ugenstipper.dk</a>, gå til din profil, og vælg
            "Deltag i miniliga".
          </p>
          ${adgangHtml}
        </div>
      `,
    }),
  });

  if (!res.ok) {
    return { error: "Kunne ikke sende invitationen. Prøv igen om lidt." };
  }

  return { success: true };
}
