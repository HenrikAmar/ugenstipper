"use client";

// Egen "er du sikker"-boks i appens eget design (logo, farver, skrifttype) -
// i stedet for browserens grimme, uspecifikke indbyggede confirm()-boks.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Bekræft",
  cancelLabel = "Annuller",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-[340px] rounded-xl bg-surface p-5 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Ugenstipper.dk" className="mx-auto mb-3 block h-14 w-14" />
        <h2 className="text-[16px] font-bold">{title}</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-text-muted">{message}</p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-lg border border-border text-[14px] font-bold text-text-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-lg bg-danger text-[14px] font-bold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
