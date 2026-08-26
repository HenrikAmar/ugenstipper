import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { TeamBadge } from "@/components/TeamBadge";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <div className="px-5 pb-1 pt-6">
        <h1 className="text-[22px] font-extrabold">Profil</h1>
      </div>

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
