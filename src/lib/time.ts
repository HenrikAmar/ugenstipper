// Hjælpefunktioner til at regne rigtigt med dansk tid (Europe/Copenhagen), uanset om
// serveren selv kører i UTC (det gør Vercel) - og uanset sommer-/vintertid.

const TIME_ZONE = "Europe/Copenhagen";

// Hvor mange minutter en given tidszone ligger fra UTC på et givent tidspunkt.
// Bruger browserens/Nodes indbyggede tidszone-database, så sommer-/vintertid håndteres automatisk.
function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const asIfUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    map.hour === "24" ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return (asIfUtc - date.getTime()) / 60000;
}

// Tager den "naive" tekst fra en <input type="datetime-local"> (fx "2026-08-30T18:00"),
// som admin har tastet i DANSK tid, og regner den om til det korrekte UTC-tidspunkt,
// som skal gemmes i databasen.
export function danishLocalToUtcISOString(naiveLocal: string): string {
  const guess = new Date(`${naiveLocal}:00.000Z`);
  const offsetMinutes = getTimeZoneOffsetMinutes(TIME_ZONE, guess);
  return new Date(guess.getTime() - offsetMinutes * 60000).toISOString();
}

// Det omvendte: tager et UTC-tidspunkt fra databasen, og laver det om til den tekst,
// som <input type="datetime-local"> skal vise, så admin ser det rigtige, danske klokkeslæt.
export function utcToDanishLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}
