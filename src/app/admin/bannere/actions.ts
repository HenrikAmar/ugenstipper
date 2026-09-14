"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
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

  return supabase;
}

export interface BannerFormState {
  error: string | null;
}

export async function createBanner(
  _prevState: BannerFormState,
  formData: FormData
): Promise<BannerFormState> {
  const supabase = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const weight = parseInt(String(formData.get("weight") ?? ""), 10);
  const image = formData.get("image") as File | null;
  const minAgeRaw = String(formData.get("min_age") ?? "").trim();
  const minAge = minAgeRaw ? parseInt(minAgeRaw, 10) : null;

  if (!title || !linkUrl) {
    return { error: "Udfyld både navn og link." };
  }
  if (!Number.isFinite(weight) || weight <= 0) {
    return { error: "Vægt skal være et tal større end 0." };
  }
  if (minAgeRaw && (!Number.isFinite(minAge) || (minAge as number) <= 0)) {
    return { error: "Aldersgrænse skal være et helt tal større end 0 (eller stå tomt)." };
  }
  if (!image || image.size === 0) {
    return { error: "Vælg et billede til banneret." };
  }

  const extension = image.name.split(".").pop() || "jpg";
  const path = `${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("sponsor-banner-images")
    .upload(path, image, { contentType: image.type || undefined });

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket not found")) {
      return {
        error:
          "Billed-lageret findes ikke i databasen endnu. Kør supabase/sponsorbannere.sql i Supabase → SQL Editor, og prøv igen.",
      };
    }
    return { error: `Kunne ikke uploade billedet: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from("sponsor-banner-images")
    .getPublicUrl(path);

  const { error: insertError } = await supabase.from("sponsor_banners").insert({
    title,
    link_url: linkUrl,
    weight,
    min_age: minAge,
    image_url: publicUrlData.publicUrl,
  });

  if (insertError) {
    if (insertError.code === "42P01") {
      return {
        error:
          "Banner-tabellen findes ikke i databasen endnu. Kør supabase/sponsorbannere.sql i Supabase → SQL Editor, og prøv igen.",
      };
    }
    return { error: `Kunne ikke oprette banneret: ${insertError.message}` };
  }

  revalidatePath("/admin/bannere");
  revalidatePath("/tip");
  return { error: null };
}

// Retter navn/link/vægt - og valgfrit et nyt billede, hvis admin uploader et.
// Ingen fejlbesked tilbage til brugeren her (som fx admin/kampe's
// updateMatch) - felterne er påkrævede i selve HTML-formularen, så det er
// ikke muligt at sende den tom ved et uheld.
export async function updateBanner(bannerId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const weight = parseInt(String(formData.get("weight") ?? ""), 10);
  const image = formData.get("image") as File | null;
  const minAgeRaw = String(formData.get("min_age") ?? "").trim();
  const minAge = minAgeRaw ? parseInt(minAgeRaw, 10) : null;
  if (!title || !linkUrl || !Number.isFinite(weight) || weight <= 0) return;
  if (minAgeRaw && (!Number.isFinite(minAge) || (minAge as number) <= 0)) return;

  const update: Record<string, unknown> = { title, link_url: linkUrl, weight, min_age: minAge };

  if (image && image.size > 0) {
    const extension = image.name.split(".").pop() || "jpg";
    const path = `${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("sponsor-banner-images")
      .upload(path, image, { contentType: image.type || undefined });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("sponsor-banner-images")
        .getPublicUrl(path);
      update.image_url = publicUrlData.publicUrl;

      // Ryd op i det gamle billede, så vi ikke samler skrald op i storage.
      const { data: existing } = await supabase
        .from("sponsor_banners")
        .select("image_url")
        .eq("id", bannerId)
        .maybeSingle();
      const oldPath = existing?.image_url?.split("/sponsor-banner-images/")[1];
      if (oldPath) {
        await supabase.storage.from("sponsor-banner-images").remove([oldPath]);
      }
    }
  }

  await supabase.from("sponsor_banners").update(update).eq("id", bannerId);
  revalidatePath("/admin/bannere");
  revalidatePath("/tip");
}

export async function toggleBannerActive(bannerId: string, active: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("sponsor_banners").update({ active }).eq("id", bannerId);
  revalidatePath("/admin/bannere");
  revalidatePath("/tip");
}

export async function deleteBanner(bannerId: string, imageUrl: string) {
  const supabase = await requireAdmin();

  const path = imageUrl.split("/sponsor-banner-images/")[1];
  if (path) {
    await supabase.storage.from("sponsor-banner-images").remove([path]);
  }

  await supabase.from("sponsor_banners").delete().eq("id", bannerId);
  revalidatePath("/admin/bannere");
  revalidatePath("/tip");
}
