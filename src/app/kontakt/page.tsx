import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ContactForm } from "@/components/ContactForm";
import { sendContactMessage } from "./actions";

export const dynamic = "force-dynamic";

export default async function KontaktPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader title="Kontakt os" />

      <div className="px-5 pt-2">
        <a href="/profil" className="text-sm font-semibold text-accent">
          ← Tilbage til profil
        </a>
      </div>

      <ContactForm sendContactMessage={sendContactMessage} defaultEmail={user?.email ?? undefined} />

      <div className="px-5 pt-4">
        <a href="/profil" className="text-sm font-semibold text-accent">
          ← Tilbage til profil
        </a>
      </div>

      <BottomNav />
    </div>
  );
}