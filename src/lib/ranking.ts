export interface RankRow {
  id: string;
  display_name: string;
  points: number;
  avatar_color?: string | null;
}

export interface StickyRow extends RankRow {
  rank: number;
}

// Viser altid toppen af listen - og fastgør din egen række nederst med din rigtige
// placering, hvis du ikke allerede er med i toppen. Er du allerede med i toppen,
// vises listen bare helt normalt (uden en ekstra, klistret række).
export function buildStickyRanking(
  sorted: RankRow[],
  currentUserId: string | undefined,
  windowSize: number
): { rows: StickyRow[]; showGap: boolean } {
  const withRank: StickyRow[] = sorted.map((row, i) => ({ ...row, rank: i + 1 }));
  const myIndex = currentUserId ? withRank.findIndex((r) => r.id === currentUserId) : -1;

  if (myIndex === -1 || myIndex < windowSize) {
    return { rows: withRank.slice(0, windowSize), showGap: false };
  }

  const top = withRank.slice(0, windowSize - 1);
  return { rows: [...top, withRank[myIndex]], showGap: true };
}
