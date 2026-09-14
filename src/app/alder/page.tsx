import { Logo } from "@/components/Logo";
import { AldersForm } from "./AldersForm";
import { signOut } from "./actions";

// Skal altid vise den nyeste tilstand - må ikke caches.
export const dynamic = "force-dynamic";

// Mødes af alle brugere, der endnu ikke har udfyldt deres fødselsdato (se
// src/middleware.ts, som sender dem hertil, og supabase/alder.sql for
// selve databaseændringen). Ingen BottomNav her med vilje - man skal først
// videre, når fødselsdatoen er udfyldt.
export default function AlderPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-bg">
      <div className="bg-navy px-7 pb-10 pt-14">
        <Logo size={34} />
        <h1 className="mt-6 text-[22px] font-bold leading-tight text-white">
          Lige én ting, før du fortsætter
        </h1>
        <p className="mt-2.5 text-sm text-[#AAB4C6]">
          Vi skal bruge din fødselsdato, så vi kan overholde reglerne om aldersgrænser på
          reklamer - fx skal vi kunne sikre os, at vi aldrig viser reklamer for spil/betting til
          nogen under 18 år.
        </p>
        <p className="mt-2 text-sm text-[#AAB4C6]">
          Det ændrer intet ved selve spillet - du kan sagtens deltage i Ugenstipper, uanset alder.
        </p>
      </div>

      <div className="flex flex-1 flex-col px-6 py-7">
        <AldersForm />

        <div className="flex-1" />

        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-[10px] border border-border py-3 text-sm font-bold text-text-muted"
          >
            Log ud
          </button>
        </form>
      </div>
    </div>
  );
}
