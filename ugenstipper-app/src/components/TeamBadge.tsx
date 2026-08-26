const PALETTE = [
  "#16233D",
  "#17A673",
  "#0EA5E9",
  "#6D28D9",
  "#B45309",
  "#DC4C4C",
  "#0E7D57",
  "#B91C7C",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
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
  return (
    <div
      className="badge flex-none"
      style={{
        width: size,
        height: size,
        backgroundColor: colorFor(team),
        fontSize: Math.round(size * 0.37),
      }}
    >
      {initialsFor(team)}
    </div>
  );
}
