import { getClubStyle } from "@/lib/clubColors";

const FALLBACK_PALETTE = [
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
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
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

export function TeamBadge({ team, size = 30 }: { team: string; size?: number }) {
  const club = getClubStyle(team);

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
        backgroundColor: fallbackColorFor(team),
        fontSize: Math.round(size * 0.37),
      };

  return (
    <div className="badge flex-none" style={style}>
      {initialsFor(team)}
    </div>
  );
}
