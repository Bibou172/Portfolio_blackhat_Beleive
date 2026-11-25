const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** "2026-04" -> "avr. 2026" (sans Date : rendu identique serveur / client). */
export function formatMois(value?: string | null): string {
  if (!value) return "aujourd'hui";
  const [annee, mois] = value.split("-");
  const m = Number(mois);
  return m >= 1 && m <= 12 ? `${MOIS[m - 1]} ${annee}` : annee;
}

export function formatPeriode(debut: string, fin?: string | null): string {
  const d = formatMois(debut);
  const f = formatMois(fin);
  return d === f ? d : `${d} → ${f}`;
}

/** Numéro de mission sur 2 chiffres : 1 -> "01". */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Hachage déterministe d'une chaîne (positions stables sur le radar). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
