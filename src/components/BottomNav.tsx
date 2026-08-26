"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/tip", label: "Tip" },
  { href: "/stilling", label: "Stilling" },
  { href: "/statistik", label: "Statistik" },
  { href: "/profil", label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 items-center justify-around border-t border-border bg-surface">
      {ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                active ? "bg-accent-2" : "bg-transparent"
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                active ? "text-accent-2" : "text-text-muted"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
