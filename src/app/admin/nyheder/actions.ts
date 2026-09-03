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

export interface AnnouncementFormState {
  error: string | null;
}

export async function createAnnouncement(
  _prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const supabase = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const imageCaption = String(formData.get("image_caption") ?? "").trim();
  const image = formData.get("image") as File | null;
  if (!title || !body) {
    return { error: "Udfyld både titel og tekst." };
  }

  let imageUrl: string | null = null;

  // Billedet er valgfrit - en tom filvælger sender stadig et File-objekt
  // med størrelse 0, så det tjekkes eksplicit.
  if (image && image.size > 0) {
    const extension = image.name.split(".").pop() || "jpg";
    const path = `${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("announcement-images")
      .upload(path, image, { contentType: image.type || undefined });

    if (uploadError) {
      if (uploadError.message.toLowerCase().includes("bucket not found")) {
        return {
          error:
            "Billed-lageret findes ikke i databasen endnu. Kør supabase/nyheder.sql i Supabase → SQL Editor, og prøv igen.",
        };
      }
      return { error: `Kunne ikke uploade billedet: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from("announcement-images")
      .getPublicUrl(path);
    imageUrl = publicUrlData.publicUrl;
  }

  const { error: insertError } = await supabase.from("announcements").insert({
    title,
    body,
    image_url: imageUrl,
    // Kun relevant hvis der rent faktisk er et billede - så vi ikke gemmer
    // en "hængende" billedetekst uden billede.
    image_caption: imageUrl ? imageCaption || null : null,
  });

  if (insertError) {
    if (insertError.code === "42P01") {
      return {
        error:
          "Nyheder-tabellen findes ikke i databasen endnu. Kør supabase/nyheder.sql i Supabase → SQL Editor, og prøv igen.",
      };
    }
    return { error: `Kunne ikke oprette nyheden: ${insertError.message}` };
  }

  revalidatePath("/admin/nyheder");
  revalidatePath("/");
  return { error: null };
}

export async function deleteAnnouncement(id: string, imageUrl: string | null) {
  const supabase = await requireAdmin();

  if (imageUrl) {
    // Udtræk filstien fra den offentlige URL, så billedet også ryddes op i
    // storage - ikke kun selve nyheds-rækken.
    const path = imageUrl.split("/announcement-images/")[1];
    if (path) {
      await supabase.storage.from("announcement-images").remove([path]);
    }
  }

  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/nyheder");
  revalidatePath("/");
}
