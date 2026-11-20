import { colors } from "@/theme/tokens";

/**
 * Les 5 sections du portfolio = les 5 voitures garées dans la rue.
 * Ajouter une section : ajoute une entrée ici (+ la page app/<id>/page.tsx).
 * L'ordre du tableau = l'ordre des voitures dans la rue (de gauche à droite).
 */
export type SectionId = "parcours" | "projets" | "competences" | "graphe" | "contact";
export type CarStyle = "suv" | "convertible" | "muscle" | "coupe" | "van";

export interface SectionDef {
  id: SectionId;
  href: `/${SectionId}`;
  /** Texte du panneau néon et du titre de la page. */
  label: string;
  /** Description courte (mode classique, SEO). */
  description: string;
  /** Nom de la voiture affiché dans la page. */
  carName: string;
  car: CarStyle;
  color: string;
  /** Routes de l'API utilisées par la section (R1…R8, voir ARCHITECTURE.md). */
  routes: string[];
}

export const SECTIONS: SectionDef[] = [
  {
    id: "parcours",
    href: "/parcours",
    label: "Parcours",
    description: "Expériences et formations, filtrables par ville.",
    carName: "SUV turquoise",
    car: "suv",
    color: colors.teal,
    routes: ["R1 GET /api/profil", "R8 GET /api/experiences?lieu="],
  },
  {
    id: "projets",
    href: "/projets",
    label: "Projets",
    description: "Missions réalisées, filtre par compétence et missions similaires.",
    carName: "décapotable rose",
    car: "convertible",
    color: colors.pink,
    routes: ["R2 GET /api/projets?competence=", "R4 GET /api/graph/projets/{slug}/similaires"],
  },
  {
    id: "competences",
    href: "/competences",
    label: "Compétences",
    description: "Statistiques par compétence, top 5 et domaines.",
    carName: "muscle car orange",
    car: "muscle",
    color: colors.orange,
    routes: [
      "R3 GET /api/stats/competences",
      "R6 GET /api/competences/top?n=5",
      "R7 GET /api/graph/domaines/{slug}/competences",
    ],
  },
  {
    id: "graphe",
    href: "/graphe",
    label: "Graphe",
    description: "Radar des liens entre projets, compétences et domaines (Neo4j).",
    carName: "coupé violet",
    car: "coupe",
    color: colors.violet,
    routes: ["R5 GET /api/graph/competences"],
  },
  {
    id: "contact",
    href: "/contact",
    label: "Contact",
    description: "Profil, bio et liens (GitHub, LinkedIn, e-mail).",
    carName: "van jaune",
    car: "van",
    color: colors.yellow,
    routes: ["R1 GET /api/profil"],
  },
];

export function getSection(id: SectionId): SectionDef {
  const s = SECTIONS.find((x) => x.id === id);
  if (!s) throw new Error(`Section inconnue : ${id}`);
  return s;
}

/** Section correspondant à un chemin (/projets/abc -> projets), sinon null. */
export function sectionFromPath(pathname: string): SectionDef | null {
  const first = pathname.split("/")[1] ?? "";
  return SECTIONS.find((s) => s.id === first) ?? null;
}

export const TIPS = [
  "Astuce : la voiture rose contient les projets.",
  "Astuce : approche-toi d'une voiture et appuie sur E pour y entrer.",
  "Astuce : Échap te fait sortir du véhicule et revenir dans la rue.",
  "Astuce : pressé ? Le bouton « Mode classique » affiche une navigation sans jeu.",
  "Astuce : le SUV turquoise retrace le parcours, ville par ville.",
  "Astuce : dans le coupé violet, clique sur un nœud du radar pour illuminer ses liens.",
  "Astuce : sur mobile, touche une voiture et l'avatar y va tout seul.",
];
