import { createClient } from "@/lib/supabase/server";
import { updateBanner, toggleBannerActive, deleteBanner } from "./actions";
import { BannerForm } from "./BannerForm";
import { DeleteBannerButton } from "@/components/DeleteBannerButton";
import type { SponsorBanner } from "@/lib/types";

// Bannere kan ændres når som helst - må aldrig caches.
export const dynamic = "force-dynamic";

export default async function AdminBannerePage() {
  const supabase = createClient();

  const { data: banners } = await supabase
    .from("sponsor_banners")
    .select("*")
    .order("created_at", { ascending: false });

  const bannerList: SponsorBanner[] = banners ?? [];

  // Til at vise "denne fylder X% af visningerne lige nu" - kun blandt de
  // aktive, da det er dem der reelt er med i den vægtede lodtrækning på
  // /tip (se src/lib/banners.ts).
  const activeWeightSum = bannerList
    .filter((b) => b.active)
    .reduce((sum, b) => sum + b.weight, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-8 w-8" />
            <h1 className="text-2xl font-extrabold">Bannere</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Sponsorbannere der vises nederst på /tip, under kampene. Har du flere aktive
            bannere, roterer de tilfældigt efter deres vægt - fx giver 50/25/25 en hovedsponsor
            dobbelt så mange visninger som hver af de to andre.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-right">
          <a href="/admin/kampe" className="text-sm font-semibold text-accent">
            ← Kampe
          </a>
          <a href="/admin/statistik" className="text-sm font-semibold text-accent">
            Statistik →
          </a>
          <a href="/admin/nyhedsbrev" className="text-sm font-semibold text-accent">
            Nyhedsbrev →
          </a>
          <a href="/tip" className="text-sm font-semibold text-text-muted">
            Tilbage til Ugenstipper
          </a>
        </div>
      </div>

      <BannerForm />

      <div className="mt-8 flex flex-col gap-3">
        {bannerList.length === 0 && (
          <p className="text-sm text-text-muted">Ingen bannere oprettet endnu.</p>
        )}
        {bannerList.map((banner) => {
          const share =
            banner.active && activeWeightSum > 0
              ? Math.round((banner.weight / activeWeightSum) * 100)
              : null;
          const ctr =
            banner.impressions > 0
              ? ((banner.clicks / banner.impressions) * 100).toFixed(1)
              : null;

          return (
            <div key={banner.id} className="card overflow-hidden rounded-xl">
              <div className="flex gap-3 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{banner.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        banner.active
                          ? "bg-accent-tint text-accent"
                          : "bg-border text-text-muted"
                      }`}
                    >
                      {banner.active ? "Aktiv" : "Inaktiv"}
                      {share !== null ? ` · ${share}%` : ""}
                    </span>
                    {banner.min_age !== null && (
                      <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-text-muted">
                        {banner.min_age}+
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[12px] text-text-muted">{banner.link_url}</p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {banner.impressions} visninger · {banner.clicks} klik
                    {ctr !== null ? ` · ${ctr}% CTR` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <form action={toggleBannerActive.bind(null, banner.id, !banner.active)}>
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold">
                      {banner.active ? "Sæt inaktiv" : "Sæt aktiv"}
                    </button>
                  </form>
                  <DeleteBannerButton
                    id={banner.id}
                    imageUrl={banner.image_url}
                    title={banner.title}
                    deleteBanner={deleteBanner}
                  />
                </div>
              </div>

              <form
                action={updateBanner.bind(null, banner.id)}
                className="flex flex-wrap items-end gap-3 border-t border-border p-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-text-muted">Navn</label>
                  <input
                    name="title"
                    defaultValue={banner.title}
                    className="h-9 w-44 rounded-lg border border-border px-2.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-text-muted">Link</label>
                  <input
                    name="link_url"
                    type="url"
                    defaultValue={banner.link_url}
                    className="h-9 w-56 rounded-lg border border-border px-2.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-text-muted">Vægt</label>
                  <input
                    name="weight"
                    type="number"
                    min={1}
                    defaultValue={banner.weight}
                    className="h-9 w-20 rounded-lg border border-border px-2.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-text-muted">
                    Aldersgrænse
                  </label>
                  <input
                    name="min_age"
                    type="number"
                    min={1}
                    defaultValue={banner.min_age ?? ""}
                    placeholder="Ingen"
                    className="h-9 w-20 rounded-lg border border-border px-2.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-text-muted">
                    Skift billede (valgfrit)
                  </label>
                  <input name="image" type="file" accept="image/*" className="text-xs" />
                </div>
                <button className="h-9 rounded-lg border border-border px-3 text-xs font-bold">
                  Gem ændringer
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
