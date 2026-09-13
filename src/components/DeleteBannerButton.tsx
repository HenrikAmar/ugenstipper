"use client";

import { useTransition } from "react";

export function DeleteBannerButton({
  id,
  imageUrl,
  title,
  deleteBanner,
}: {
  id: string;
  imageUrl: string;
  title: string;
  deleteBanner: (id: string, imageUrl: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ok = confirm(`Er du sikker på, at du vil slette banneret "${title}"? Det kan ikke fortrydes.`);
    if (!ok) return;
    startTransition(() => {
      void deleteBanner(id, imageUrl);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="shrink-0 rounded-lg border border-danger px-3 py-1.5 text-xs font-bold text-danger"
    >
      {pending ? "Sletter …" : "Slet"}
    </button>
  );
}
