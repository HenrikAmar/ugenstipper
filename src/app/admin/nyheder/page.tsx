import { createClient } from "@/lib/supabase/server";
import { deleteAnnouncement, setPinnedAnnouncement } from "./actions";
import { NyhedForm } from "./NyhedForm";
import { DeleteAnnouncementButton } from "@/components/DeleteAnnouncementButton";
import type { Announcement } from "@/lib/types";

// Nyheder må aldrig caches - skal altid være friske, både her og på forsiden.
export const dynamic = "force-dynamic";

export default async function AdminNyhederPage() {
  const supabase = createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const announcementList: Announcement[] = announcements ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-8 w-8" />
            <h1 className="text-2xl font-extrabold">Nyheder</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Skriv nyheder til forsiden herfra - de vises med det samme, ingen
            kode eller push nødvendig. Forsiden viser kun hovednyheden og
            den næstnyeste nyhed derunder - resten kan ses under &quot;Se
            gamle nyheder&quot;. Sæt en nyhed som hovednyhed, hvis den skal
            blive stående øverst, selvom du opretter nyere nyheder bagefter.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-right">
          <a href="/admin/kampe" className="text-sm font-semibold text-accent">
            ← Kampe
          </a>
          <a href="/admin/bannere" className="text-sm font-semibold text-accent">
            Bannere →
          </a>
          <a href="/admin/nyhedsbrev" className="text-sm font-semibold text-accent">
            Nyhedsbrev →
          </a>
          <a href="/tip" className="text-sm font-semibold text-text-muted">
            Tilbage til Ugenstipper
          </a>
        </div>
      </div>

      <NyhedForm />

      <div className="mt-8 flex flex-col gap-3">
        {announcementList.length === 0 && (
          <p className="text-sm text-text-muted">Ingen nyheder oprettet endnu.</p>
        )}
        {announcementList.map((announcement) => (
          <div key={announcement.id} className="card overflow-hidden rounded-xl">
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{announcement.title}</h3>
                  {announcement.pinned && (
                    <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[10px] font-bold text-accent">
                      HOVEDNYHED
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-text-muted">
                  {announcement.body}
                </p>
                <p className="mt-1.5 text-[11px] text-text-muted">
                  {new Date(announcement.created_at).toLocaleString("da-DK")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <form action={setPinnedAnnouncement.bind(null, announcement.id, !announcement.pinned)}>
                  <button className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-bold">
                    {announcement.pinned ? "Fjern som hovednyhed" : "Sæt som hovednyhed"}
                  </button>
                </form>
                <DeleteAnnouncementButton
                  id={announcement.id}
                  imageUrl={announcement.image_url}
                  title={announcement.title}
                  deleteAnnouncement={deleteAnnouncement}
                />
              </div>
            </div>
            {announcement.image_url && (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={announcement.image_url}
                  alt={announcement.title}
                  className="aspect-[4/3] w-full max-w-xs object-cover"
                />
                {announcement.image_caption && (
                  <p className="max-w-xs px-1 py-1.5 text-[11px] italic text-text-muted">
                    {announcement.image_caption}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
