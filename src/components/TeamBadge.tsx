import { getClubStyle } from "@/lib/clubColors";

// Samme palette bruges til brugernes badges (kampklubberne har deres egne,
// rigtige farver via getClubStyle) - både til det automatiske "tilfældige"
// farvevalg herunder, og til "Vælg din farve" på profilsiden
// (AvatarColorPicker.tsx), så de 8 valgmuligheder altid matcher det, man
// reelt kan ende med at få tildelt automatisk.
export const AVATAR_PALETTE = [
  "#16233D",
  "#17A673",
  "#0EA5E9",
  "#6D28D9",
  "#B45309",
  "#DC4C4C",
  "#0E7D57",
  "#B91C7C",
];

function fallbackColorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initialsFor(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function TeamBadge({
  team,
  size = 30,
  colorOverride,
}: {
  team: string;
  size?: number;
  // Bruges når det er en BRUGER (ikke en fodboldklub), som selv har valgt en
  // farve på profilsiden ("Vælg din farve") - i stedet for den automatisk
  // udregnede tilfældige farve herunder. Har ingen effekt for rigtige
  // klubnavne (de bruger altid deres egen, rigtige farve).
  colorOverride?: string | null;
}) {
  const club = getClubStyle(team);
  const initials = club ? club.code : initialsFor(team);

  const style: React.CSSProperties = club
    ? {
        width: size,
        height: size,
        backgroundColor: club.bg,
        color: club.text,
        border: club.border ? `2px solid ${club.border}` : undefined,
        fontSize: Math.round(size * 0.37),
      }
    : {
        width: size,
        height: size,
        backgroundColor: colorOverride || fallbackColorFor(team),
        fontSize: Math.round(size * 0.37),
      };

  return (
    <div className="badge flex-none" style={style}>
      {initials}
    </div>
  );
}
