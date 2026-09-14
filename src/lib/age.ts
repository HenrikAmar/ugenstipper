/**
 * Udregner alder i hele år ud fra en fødselsdato (YYYY-MM-DD, som Supabase
 * returnerer "date"-kolonner). Bruges til at afgøre, om en bruger må se et
 * aldersbegrænset banner - se src/lib/banners.ts.
 */
export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
