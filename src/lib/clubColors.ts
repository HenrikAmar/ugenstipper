// Vejledende klubfarver til de runde "badges" med holdinitialer.
// Farverne er baseret på hvert holds velkendte trøje-/klubidentitet (offentligt
// kendt, ikke officielle brand-hexkoder fra klubberne selv) - så de er til at
// kende, uden at vi bruger rigtige klublogoer (undgår varemærke-problemer).
// Ret gerne til, hvis en farve ikke rammer helt rigtigt for dig.

interface ClubStyle {
  bg: string;
  text: string;
  border?: string;
  /** Navne/forkortelser en admin kunne finde på at skrive for holdet. */
  aliases: string[];
}

const CLUBS: ClubStyle[] = [
  {
    bg: "#FFFFFF",
    text: "#16233D",
    border: "#0C4DA2",
    aliases: ["fck", "fc kobenhavn", "fc koebenhavn", "fc københavn", "kobenhavn", "københavn", "fc copenhagen", "copenhagen"],
  },
  {
    bg: "#FFD400",
    text: "#16233D",
    aliases: ["brondby", "brøndby", "brondby if", "brøndby if", "bif"],
  },
  {
    bg: "#D0021B",
    text: "#FFFFFF",
    aliases: ["fcm", "fc midtjylland", "midtjylland"],
  },
  {
    bg: "#E4572E",
    text: "#FFFFFF",
    aliases: ["fcn", "fc nordsjælland", "fc nordsjaelland", "nordsjælland", "nordsjaelland"],
  },
  {
    bg: "#111111",
    text: "#FFFFFF",
    aliases: ["ob", "odense boldklub", "odense"],
  },
  {
    bg: "#1B2A4A",
    text: "#FFFFFF",
    aliases: ["agf", "agf aarhus", "aarhus gymnastikforening"],
  },
  {
    bg: "#F0B429",
    text: "#16233D",
    border: "#111111",
    aliases: ["ac horsens", "horsens"],
  },
  {
    bg: "#C1121F",
    text: "#FFFFFF",
    aliases: ["silkeborg", "silkeborg if"],
  },
  {
    bg: "#1A1A1A",
    text: "#FFFFFF",
    border: "#B3122A",
    aliases: ["randers", "randers fc", "randers freja"],
  },
  {
    bg: "#111111",
    text: "#FFFFFF",
    border: "#FFFFFF",
    aliases: ["viborg", "viborg ff"],
  },
  {
    bg: "#4FA8DE",
    text: "#FFFFFF",
    aliases: ["lyngby", "lyngby bk", "lyngby boldklub"],
  },
  {
    bg: "#A6192E",
    text: "#FFFFFF",
    aliases: ["sonderjyske", "sønderjyske", "sonderjyske fodbold"],
  },
  // Andre kendte klubber (kan komme i spil ved op-/nedrykning senere sæsoner)
  {
    bg: "#EE1C25",
    text: "#FFFFFF",
    aliases: ["aab", "aalborg", "aalborg bk"],
  },
  {
    bg: "#B3122A",
    text: "#FFFFFF",
    border: "#FFD400",
    aliases: ["vejle", "vejle boldklub", "vb"],
  },
  {
    bg: "#1B7A3D",
    text: "#FFFFFF",
    aliases: ["fc fredericia", "fredericia"],
  },
  {
    bg: "#2E86C1",
    text: "#FFFFFF",
    aliases: ["hvidovre", "hvidovre if"],
  },
  {
    bg: "#0B6E4F",
    text: "#FFFFFF",
    aliases: ["hb koge", "hb køge", "koge", "køge"],
  },
];

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "");
}

const LOOKUP = new Map<string, ClubStyle>();
for (const club of CLUBS) {
  for (const alias of club.aliases) {
    LOOKUP.set(normalize(alias), club);
  }
}

export function getClubStyle(teamName: string): ClubStyle | null {
  const normalized = normalize(teamName);
  if (!normalized) return null;

  const exact = LOOKUP.get(normalized);
  if (exact) return exact;

  // Løs matchning, fx "FC København 2" eller "FCK U19" skrevet i admin-panelet.
  let bestMatch: ClubStyle | null = null;
  let bestLength = 0;
  for (const [alias, club] of LOOKUP) {
    if (alias.length < 3) continue;
    if (normalized.includes(alias) && alias.length > bestLength) {
      bestMatch = club;
      bestLength = alias.length;
    }
  }
  return bestMatch;
}
