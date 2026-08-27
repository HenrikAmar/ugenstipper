import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { TeamBadge } from "@/components/TeamBadge";
import { AppHeader } from "@/components/AppHeader";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { InviteFriend } from "@/components/InviteFriend";
import { MiniligaCard } from "@/components/MiniligaCard";
import { redirect } from "next/navigation";

// Rollen (admin/user) kan ændre sig i databasen - må ikke caches.
export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function ProfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: inviteRow }, { data: miniliga }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("invite_leaderboard")
      .select("qualified_invites")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("mini_league_members")
      .select("mini_leagues(name, password_hash)")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
  ]);

  const miniligaRow =
    (
      miniliga as unknown as {
        mini_leagues: { name: string; password_hash: string | null } | null;
      } | null
    )?.mini_leagues ?? null;
  const miniligaName = miniligaRow?.name ?? null;
  const miniligaHasPassword = miniligaRow?.password_hash != null;

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader title="Profil" />

      <div className="card mx-5 mt-4 flex items-center gap-3.5 rounded-xl p-4">
        <TeamBadge team={profile?.display_name ?? "?"} size={44} />
        <div>
          <div className="text-[15px] font-bold">{profile?.display_name}</div>
          <div className="text-[12.5px] text-text-muted">{user?.email}</div>
        </div>
      </div>

      {profile?.role === "admin" && (
        <a
          href="/admin"
          className="mx-5 mt-4 flex items-center justify-center rounded-[10px] border border-border bg-surface py-3 text-sm font-bold"
        >
          Gå til admin-panel
        </a>
      )}

      {user && <InviteFriend qualifiedInvites={inviteRow?.qualified_invites ?? 0} />}

      {user && <MiniligaCard leagueName={miniligaName} hasPassword={miniligaHasPassword} />}

      <ChangePasswordForm />

      <a
        href="/regler"
        className="mx-5 mt-4 flex items-center justify-center rounded-[10px] border border-border bg-surface py-3 text-sm font-bold"
      >
        Regler
      </a>

      <form action={signOut} className="mx-5 mt-4">
        <button
          type="submit"
          className="w-full rounded-[10px] border border-danger py-3 text-sm font-bold text-danger"
        >
          Log ud
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
