import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const profileResult = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "");

  return (
    <pre style={{ padding: 24, fontSize: 13, whiteSpace: "pre-wrap" }}>
      {JSON.stringify(
        {
          user: user ? { id: user.id, email: user.email } : null,
          userError,
          profileData: profileResult.data,
          profileError: profileResult.error,
        },
        null,
        2
      )}
    </pre>
  );
}