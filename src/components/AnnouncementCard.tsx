import type { Announcement } from "@/lib/types";

// Fælles visning af én nyhed - bruges både på forsiden ("Hjem", kun
// hovednyhed + én undernyhed) og på det fulde nyhedsarkiv (/nyheder), så de
// to ikke risikerer at gå ud af trit med hinanden i udseende.
export function AnnouncementCard({
  announcement,
  showNytBadge = false,
  showLogoIfNoImage = false,
}: {
  announcement: Announcement;
  showNytBadge?: boolean;
  showLogoIfNoImage?: boolean;
}) {
  return (
    <div className="card overflow-hidden rounded-xl">
      {showLogoIfNoImage && !announcement.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="Ugenstipper.dk"
          className="mx-auto mb-3 mt-4 block h-48 w-48"
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2">
          {showNytBadge && (
            <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[10px] font-bold text-accent">
              NYT
            </span>
          )}
          <h2 className="text-[15px] font-bold">{announcement.title}</h2>
        </div>
        <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-text-muted">
          {announcement.body}
        </p>
      </div>
      {announcement.image_url && (
        <div className="px-4 pb-4">
          {/* Eget rundet, afgrænset "vindue" til billedet i stedet for at
              lade det fylde kortet helt ud til kanten - kun sådan får det
              afrundede hjørner hele vejen rundt. */}
          <div className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          {announcement.image_caption && (
            <p className="pt-2 text-[12px] italic text-text-muted">
              {announcement.image_caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
