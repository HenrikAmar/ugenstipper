import Link from "next/link";
import { SPORT_NAMES } from "@/lib/participation";
import type { Sport } from "@/lib/types";

/**
 * Skifter mellem brugerens konkurrencer.
 *
 * Viser KUN de sporte, brugeren selv har valgt til - og forsvinder helt,
 * hvis han kun er med i én. Den, der kun gider NFL, skal aldrig se en
 * Superliga-fane, og omvendt.
 *
 * Skifter man sport, nulstilles evt. valgt runde bevidst (der er ikke noget
 * "samme runde" på tværs af de to sporte) - siden falder så tilbage til den
 * aktuelle runde for den nyvalgte sport.
 */
export function SportTabs({
  activeSport,
  userSports,
  basePath,
}: {
  activeSport: Sport;
  userSports: Sport[];
  basePath: string;
}) {
  if (userSports.length < 2) return null;

  return (
    <div className="flex gap-2 px-5 pb-1 pt-2">
      {userSports.map((sport) => {
        const active = sport === activeSport;
        return (
          <Link
            key={sport}
            href={`${basePath}?sport=${sport}`}
            className={`pill flex-1 text-center ${
              active
                ? "bg-accent-2 text-white"
                : "border border-border bg-surface text-text-muted"
            }`}
          >
            {SPORT_NAMES[sport]}
          </Link>
        );
      })}
    </div>
  );
}
