import type { ReactNode } from "react";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="px-5 pb-1 pt-6">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-8 w-8" />
        <h1 className="text-[22px] font-extrabold">{title}</h1>
      </div>
      {subtitle}
    </div>
  );
}
