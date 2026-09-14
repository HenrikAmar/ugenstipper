import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import type { Announcement } from "@/lib/types";

// Skal altid vise den nyeste liste - må ikke caches.
export const dynamic = "force-dynamic";

// Det fulde nyhedsarkiv. Forsiden ("Hjem") viser kun hovednyheden og én
// undernyhed, med et "Se gamle nyheder"-link hertil, hvis der er flere -
// se src/app/page.tsx og src/app/admin/nyheder.
export default async function NyhederPage() {
  const supabase = createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const announcementList: Announcement[] = announcements ?? [];

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-bg pb-24">
      <AppHeader title="Nyheder" />

      <div className="px-5 pt-2">
        <Link href="/" className="text-sm font-semibold text-accent">
          ← Tilbage til forsiden
        </Link>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-3">
        {announcementList.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">Ingen nyheder endnu.</p>
        )}
        {announcementList.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
