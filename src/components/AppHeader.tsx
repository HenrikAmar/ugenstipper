import { LogoMark } from "@/components/Logo";
import type { ReactNode } from "react";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="px-5 pb-1 pt-6">
      <div className="flex items-center gap-2">
        <LogoMark size={24} />
        <h1 className="text-[22px] font-extrabold">{title}</h1>
      </div>
      {subtitle}
    </div>
  );
}
