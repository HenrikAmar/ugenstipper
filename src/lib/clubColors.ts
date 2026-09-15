// Klubfarver til de runde "badges" med holdinitialer.
//
// Farverne er holdenes velkendte trøjefarver - ikke klubbernes officielle
// brand-filer eller logoer, så vi undgår varemærke-problemer. Superliga-
// farverne er gennemgået og bekræftet af Henrik (sep 2026); tidligere var
// flere af dem gæt, og fx stod Viborg og OB fejlagtigt som sorte.
//
// Bemærk den løbende afvejning: mange danske klubber spiller i blåt og hvidt,
// og rammer man farven 100 % for dem alle, bliver badge'erne umulige at kende
// fra hinanden på en rundeoversigt. Derfor får de hver sin nuance, og
// kant- og skriftfarven bruges til at skille dem ad - i stedet for at give en
// klub en farve, den slet ikke har. Samme princip er brugt til NFL's mange
// marineblå hold længere nede.
//
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
    border: "#003A70",
    // gul/blå - blå kant, så den ikke ligner Horsens' gule
    code: "BIF",
    aliases: ["brondby", "brøndby", "brondby if", "brøndby if", "bif"],
  },
  {
    bg: "#D0021B",
    text: "#FFFFFF",
    border: "#111111",
    // rød/sort - sort kant adskiller fra Silkeborgs og FCNs røde
    code: "FCM",
    aliases: ["fcm", "fc midtjylland", "midtjylland"],
  },
  {
    bg: "#CF010E",
    text: "#FFFFFF",
    // rød
    code: "FCN",
    aliases: ["fcn", "fc nordsjælland", "fc nordsjaelland", "nordsjælland", "nordsjaelland"],
  },
  {
    bg: "#005B9E",
    text: "#FFFFFF",
    border: "#FFFFFF",
    // blå/hvid - hvid kant antyder striberne
    code: "OB",
    aliases: ["ob", "odense boldklub", "odense"],
  },
  {
    bg: "#FFFFFF",
    text: "#111111",
    border: "#111111",
    // hvid og sort
    code: "AGF",
    aliases: ["agf", "agf aarhus", "aarhus gymnastikforening"],
  },
  {
    bg: "#FFD200",
    text: "#111111",
    border: "#111111",
    // gul/sort
    code: "ACH",
    aliases: ["ac horsens", "horsens"],
  },
  {
    bg: "#C8102E",
    text: "#FFFFFF",
    border: "#FFFFFF",
    // rød - hvid kant adskiller den fra FCM's røde
    code: "SIF",
    aliases: ["silkeborg", "silkeborg if"],
  },
  {
    bg: "#81C0FF",
    text: "#16233D",
    border: "#16233D",
    // lyseblå - mørk ring adskiller den fra SønderjyskEs lyseblå
    code: "RFC",
    aliases: ["randers", "randers fc", "randers freja"],
  },
  {
    bg: "#007A33",
    text: "#FFFFFF",
    // grøn
    code: "VFF",
    aliases: ["viborg", "viborg ff"],
  },
  {
    bg: "#0F3CA0",
    text: "#FFFFFF",
    // kongeblå
    code: "LBK",
    aliases: ["lyngby", "lyngby bk", "lyngby boldklub"],
  },
  {
    bg: "#5BC2E7",
    text: "#16233D",
    // lyseblå - mørk skrift, ellers kan man ikke læse den
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

  // ---------- NFL ----------
  // Samme princip som ovenfor: velkendte holdfarver, ikke officielle
  // brand-filer eller logoer. "code" er holdets almindelige NFL-forkortelse,
  // som enhver NFL-seer kender fra tv-grafikken.
  //
  // Flere hold deler næsten samme grundfarve (der er rigtig mange marineblå
  // hold i NFL). Dér skiller vi dem ad på skrift- og kantfarven i stedet for
  // at finde på en farve, holdet ikke har.
  { bg: "#A40227", text: "#FFFFFF", code: "ARI", aliases: ["arizona cardinals", "cardinals", "arizona", "ari"] },
  { bg: "#A71930", text: "#FFFFFF", border: "#000000", code: "ATL", aliases: ["atlanta falcons", "falcons", "atlanta", "atl"] },
  { bg: "#29126F", text: "#FFFFFF", code: "BAL", aliases: ["baltimore ravens", "ravens", "baltimore", "bal"] },
  { bg: "#00338D", text: "#FFFFFF", border: "#D50A0A", code: "BUF", aliases: ["buffalo bills", "bills", "buffalo", "buf"] },
  { bg: "#0085CA", text: "#FFFFFF", border: "#000000", code: "CAR", aliases: ["carolina panthers", "panthers", "carolina", "car"] },
  { bg: "#0B1C3A", text: "#FFFFFF", border: "#E64100", code: "CHI", aliases: ["chicago bears", "bears", "chicago", "chi"] },
  { bg: "#FB4F14", text: "#000000", border: "#000000", code: "CIN", aliases: ["cincinnati bengals", "bengals", "cincinnati", "cin"] },
  { bg: "#472A08", text: "#FFFFFF", border: "#FF3C00", code: "CLE", aliases: ["cleveland browns", "browns", "cleveland", "cle"] },
  { bg: "#002A5C", text: "#FFFFFF", border: "#B0B7BC", code: "DAL", aliases: ["dallas cowboys", "cowboys", "dallas", "dal"] },
  { bg: "#0A2343", text: "#FC4C02", border: "#FC4C02", code: "DEN", aliases: ["denver broncos", "broncos", "denver", "den"] },
  { bg: "#0076B6", text: "#FFFFFF", border: "#BBBBBB", code: "DET", aliases: ["detroit lions", "lions", "detroit", "det"] },
  { bg: "#204E32", text: "#FFB612", code: "GB", aliases: ["green bay packers", "packers", "green bay", "gb"] },
  { bg: "#021018", text: "#FFFFFF", border: "#EB0028", code: "HOU", aliases: ["houston texans", "texans", "houston", "hou"] },
  // Colts spiller notorisk i hvidt med blå hestesko - derfor hvid bund,
  // ligesom FCK ovenfor, så de ikke drukner blandt de mange blå hold.
  { bg: "#003B75", text: "#FFFFFF", border: "#FFFFFF", code: "IND", aliases: ["indianapolis colts", "colts", "indianapolis", "ind"] },
  { bg: "#007487", text: "#FFFFFF", border: "#D7A22A", code: "JAX", aliases: ["jacksonville jaguars", "jaguars", "jacksonville", "jax", "jac"] },
  { bg: "#E31837", text: "#FFFFFF", border: "#FFB612", code: "KC", aliases: ["kansas city chiefs", "chiefs", "kansas city", "kc"] },
  { bg: "#000000", text: "#A5ACAF", border: "#A5ACAF", code: "LV", aliases: ["las vegas raiders", "raiders", "las vegas", "oakland raiders", "lv"] },
  { bg: "#0080B4", text: "#FFFFFF", border: "#FFC52F", code: "LAC", aliases: ["los angeles chargers", "chargers", "san diego chargers", "lac"] },
  { bg: "#003594", text: "#FFFFFF", border: "#FFA500", code: "LAR", aliases: ["los angeles rams", "rams", "st louis rams", "lar"] },
  { bg: "#008E97", text: "#FFFFFF", border: "#F58220", code: "MIA", aliases: ["miami dolphins", "dolphins", "miami", "mia"] },
  { bg: "#4F2683", text: "#FFC62F", code: "MIN", aliases: ["minnesota vikings", "vikings", "minnesota", "min"] },
  { bg: "#002244", text: "#FFFFFF", border: "#C60C30", code: "NE", aliases: ["new england patriots", "patriots", "new england", "ne"] },
  // Saints vendes om (guld bund, sort skrift), så de ikke ligner Steelers.
  { bg: "#D3BC8D", text: "#101820", code: "NO", aliases: ["new orleans saints", "saints", "new orleans"] },
  { bg: "#0B2340", text: "#FFFFFF", border: "#A71930", code: "NYG", aliases: ["new york giants", "giants", "nyg"] },
  { bg: "#125740", text: "#FFFFFF", code: "NYJ", aliases: ["new york jets", "jets", "nyj"] },
  { bg: "#004C54", text: "#FFFFFF", border: "#A5ACAF", code: "PHI", aliases: ["philadelphia eagles", "eagles", "philadelphia", "phi"] },
  { bg: "#27251F", text: "#FFB612", code: "PIT", aliases: ["pittsburgh steelers", "steelers", "pittsburgh", "pit"] },
  { bg: "#AA0000", text: "#FFFFFF", border: "#B3995D", code: "SF", aliases: ["san francisco 49ers", "49ers", "san francisco", "niners", "sf"] },
  { bg: "#002244", text: "#69BE28", border: "#69BE28", code: "SEA", aliases: ["seattle seahawks", "seahawks", "seattle", "sea"] },
  { bg: "#D50A0A", text: "#FFFFFF", border: "#FF7900", code: "TB", aliases: ["tampa bay buccaneers", "buccaneers", "tampa bay", "bucs"] },
  { bg: "#0C2C56", text: "#4B92DB", border: "#4B92DB", code: "TEN", aliases: ["tennessee titans", "titans", "tennessee", "ten"] },
  { bg: "#5A1414", text: "#FFB612", code: "WAS", aliases: ["washington commanders", "commanders", "washington", "was", "wsh"] },
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

// De 32 NFL-hold - bruges som dropdown i admin på samme måde som Superligaen
// ovenfor. Uden den ville admin skulle skrive holdnavnet i hånden, og en
// stavefejl ville betyde, at holdet mister sin farve uden nogen fejlbesked.
// Navnene skal derfor stemme overens med aliasserne i CLUBS ovenfor.
export const NFL_TEAMS: string[] = [
  "Arizona Cardinals",
  "Atlanta Falcons",
  "Baltimore Ravens",
  "Buffalo Bills",
  "Carolina Panthers",
  "Chicago Bears",
  "Cincinnati Bengals",
  "Cleveland Browns",
  "Dallas Cowboys",
  "Denver Broncos",
  "Detroit Lions",
  "Green Bay Packers",
  "Houston Texans",
  "Indianapolis Colts",
  "Jacksonville Jaguars",
  "Kansas City Chiefs",
  "Las Vegas Raiders",
  "Los Angeles Chargers",
  "Los Angeles Rams",
  "Miami Dolphins",
  "Minnesota Vikings",
  "New England Patriots",
  "New Orleans Saints",
  "New York Giants",
  "New York Jets",
  "Philadelphia Eagles",
  "Pittsburgh Steelers",
  "San Francisco 49ers",
  "Seattle Seahawks",
  "Tampa Bay Buccaneers",
  "Tennessee Titans",
  "Washington Commanders",
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
