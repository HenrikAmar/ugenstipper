"use client";

import { useTransition } from "react";

export function DeleteAnnouncementButton({
  id,
  imageUrl,
  title,
  deleteAnnouncement,
}: {
  id: string;
  imageUrl: string | null;
  title: string;
  deleteAnnouncement: (id: string, imageUrl: string | null) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ok = confirm(`Er du sikker på, at du vil slette nyheden ${title}? Det kan ikke fortrydes.`);
    if (!ok) return;
    startTransition(() => {
      void deleteAnnouncement(id, imageUrl);
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
