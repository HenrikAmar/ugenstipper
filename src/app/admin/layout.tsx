import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Admin-tjekket skal altid slå op på den nyeste rolle i databasen - må ikke caches.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/tip");

  return <div className="min-h-screen bg-bg">{children}</div>;
}
