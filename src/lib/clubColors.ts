// Vejledende klubfarver til de runde "badges" med holdinitialer.
// Farverne er baseret på hvert holds velkendte trøje-/klubidentitet (offentligt
// kendt, ikke officielle brand-hexkoder fra klubberne selv) - så de er til at
// kende, uden at vi bruger rigtige klublogoer (undgår varemærke-problemer).
// Ret gerne til, hvis en farve ikke rammer helt rigtigt for dig.

interface ClubStyle {
  bg: string;
  text: string;
  border?: string;
  /** Faste initialer til badge'et (så vi ikke bare gætter ud fra navnet). */
  code: string;
  /** Navne/forkortelser en admin kunne finde på at skrive for holdet. */
  aliases: string[];
}

const CLUBS: ClubStyle[] = [
  {
    bg: "#FFFFFF",
    text: "#16233D",
    border: "#0C4DA2",
    code: "FCK",
    aliases: ["fck", "fc kobenhavn", "fc koebenhavn", "fc københavn", "kobenhavn", "københavn", "fc copenhagen", "copenhagen"],
  },
  {
    bg: "#FFD400",
    text: "#16233D",
    code: "BIF",
    aliases: ["brondby", "brøndby", "brondby if", "brøndby if", "bif"],
  },
  {
    bg: "#D0021B",
    text: "#FFFFFF",
    code: "FCM",
    aliases: ["fcm", "fc midtjylland", "midtjylland"],
  },
  {
    bg: "#E4572E",
    text: "#FFFFFF",
    code: "FCN",
    aliases: ["fcn", "fc nordsjælland", "fc nordsjaelland", "nordsjælland", "nordsjaelland"],
  },
  {
    bg: "#111111",
    text: "#FFFFFF",
    code: "OB",
    aliases: ["ob", "odense boldklub", "odense"],
  },
  {
    bg: "#1B2A4A",
    text: "#FFFFFF",
    code: "AGF",
    aliases: ["agf", "agf aarhus", "aarhus gymnastikforening"],
  },
  {
    bg: "#F0B429",
    text: "#16233D",
    border: "#111111",
    code: "ACH",
    aliases: ["ac horsens", "horsens"],
  },
  {
    bg: "#C1121F",
    text: "#FFFFFF",
    code: "SIF",
    aliases: ["silkeborg", "silkeborg if"],
  },
  {
    bg: "#1A1A1A",
    text: "#FFFFFF",
    border: "#B3122A",
    code: "RFC",
    aliases: ["randers", "randers fc", "randers freja"],
  },
  {
    bg: "#111111",
    text: "#FFFFFF",
    border: "#FFFFFF",
    code: "VFF",
    aliases: ["viborg", "viborg ff"],
  },
  {
    bg: "#4FA8DE",
    text: "#FFFFFF",
    code: "LBK",
    aliases: ["lyngby", "lyngby bk", "lyngby boldklub"],
  },
  {
    bg: "#A6192E",
    text: "#FFFFFF",
    code: "SØN",
    aliases: ["sonderjyske", "sønderjyske", "sonderjyske fodbold"],
  },
  // Andre kendte klubber (kan komme i spil ved op-/nedrykning senere sæsoner)
  {
    bg: "#EE1C25",
    text: "#FFFFFF",
    code: "AAB",
    aliases: ["aab", "aalborg", "aalborg bk"],
  },
  {
    bg: "#B3122A",
    text: "#FFFFFF",
    border: "#FFD400",
    code: "VB",
    aliases: ["vejle", "vejle boldklub", "vb"],
  },
  {
    bg: "#1B7A3D",
    text: "#FFFFFF",
    code: "FCF",
    aliases: ["fc fredericia", "fredericia"],
  },
  {
    bg: "#2E86C1",
    text: "#FFFFFF",
    code: "HVI",
    aliases: ["hvidovre", "hvidovre if"],
  },
  {
    bg: "#0B6E4F",
    text: "#FFFFFF",
    code: "HBK",
    aliases: ["hb koge", "hb køge", "koge", "køge"],
  },
];

// De 12 hold i den aktuelle Superliga-sæson (2026/27) - bruges til dropdown i
// admin-panelet, så man vælger holdet i stedet for at skrive det (undgår stavefejl).
export const SUPERLIGA_TEAMS: string[] = [
  "FC København",
  "Brøndby IF",
  "FC Midtjylland",
  "FC Nordsjælland",
  "OB",
  "AGF",
  "AC Horsens",
  "Silkeborg IF",
  "Randers FC",
  "Viborg FF",
  "Lyngby BK",
  "SønderjyskE",
].sort((a, b) => a.localeCompare(b, "da"));

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
