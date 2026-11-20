/** Mise en forme : dates YYYY-MM, libellés de domaines, initiales. */

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function formatMois(ym?: string | null): string {
  if (!ym) return "aujourd'hui";
  const [a, m] = ym.split("-");
  const i = Number(m) - 1;
  return i >= 0 && i < 12 ? `${MOIS[i]} ${a}` : a;
}

export function periode(debut: string, fin?: string | null): string {
  return `${formatMois(debut)} — ${fin ? formatMois(fin) : "en cours"}`;
}

/** Libellés lisibles des slugs de domaine (ARCHITECTURE.md : bases-de-donnees, langages…). */
const DOMAINES: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  "bases-de-donnees": "Bases de données",
  langages: "Langages",
  data: "Data & IA",
  "data-science": "Data science",
  ia: "Intelligence artificielle",
  devops: "DevOps",
  cloud: "Cloud",
  outils: "Outils & environnement",
  methodes: "Méthodes & pratiques",
  reseaux: "Réseaux",
  securite: "Sécurité",
  mobile: "Mobile",
  autres: "Autres",
};

/** Ordre d'affichage souhaité ; les domaines inconnus suivent par ordre alphabétique. */
export const ORDRE_DOMAINES = ["frontend", "backend", "langages", "bases-de-donnees", "data", "data-science", "ia", "cloud", "devops", "outils", "methodes"];

export function libelleDomaine(slug: string): string {
  if (DOMAINES[slug]) return DOMAINES[slug];
  const s = slug.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function trierDomaines(slugs: string[]): string[] {
  const rang = (s: string) => {
    const i = ORDRE_DOMAINES.indexOf(s);
    return i === -1 ? 100 : i;
  };
  return [...new Set(slugs)].sort((a, b) => rang(a) - rang(b) || a.localeCompare(b));
}

export function initiales(prenom?: string, nom?: string): string {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
}

export function nomComplet(prenom?: string, nom?: string): string {
  return [prenom, nom].filter(Boolean).join(" ");
}
