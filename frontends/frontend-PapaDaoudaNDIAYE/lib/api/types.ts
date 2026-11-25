/**
 * Types des réponses de l'API d'équipe : contrat API_ROUTES.md (racine du dépôt).
 * Les listes peuvent arriver brutes ou enveloppées ({items, total[, page, size]}) :
 * le client (client.ts) extrait automatiquement `items`.
 */

export interface Liens {
  github?: string | null;
  linkedin?: string | null;
  site?: string | null;
}

export interface Experience {
  entreprise: string;
  poste: string;
  lieu?: string | null;
  debut: string; // "AAAA-MM"
  fin?: string | null; // null = en cours
  description?: string | null;
  competences?: string[];
}

export interface Formation {
  ecole: string;
  diplome: string;
  lieu?: string | null;
  debut: string;
  fin?: string | null;
}

export interface CompetenceProfil {
  skill_slug: string;
  nom: string;
  domaine?: string | null;
  niveau?: number | null; // 1 à 5
}

/** R1 — GET /api/profil */
export interface Profil {
  candidat_slug: string;
  prenom: string;
  nom: string;
  titre?: string | null;
  bio?: string | null;
  email?: string | null;
  liens?: Liens | null;
  experiences: Experience[];
  formations: Formation[];
  competences: CompetenceProfil[];
}

/** R2 — GET /api/projets */
export interface Projet {
  projet_slug: string;
  candidat_slug?: string | null;
  titre: string;
  description?: string | null;
  description_longue?: string | null;
  annee?: number | null;
  competences: string[];
  lien_repo?: string | null;
  lien_demo?: string | null;
}

/** R3 + R6 — GET /api/stats/competences[?limit=5] → {total, items: StatCompetence[]} */
export interface StatCompetence {
  skill_slug: string;
  nom: string;
  domaine?: string | null;
  niveau?: number | null;
  nb_projets: number;
  derniere_annee?: number | null;
}

/** R4 — GET /api/graph/projets/{slug}/similaires → {projet_slug, items: ProjetSimilaire[]} */
export interface ProjetSimilaire {
  projet_slug: string;
  titre: string;
  competences_communes: string[];
  nb_communes: number;
}

/** R5 — GET /api/graph/competences */
export type NodeType = "Candidat" | "Projet" | "Competence" | "Domaine";
export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
}
export interface GraphLink {
  source: string;
  target: string;
  type: string; // A_REALISE | UTILISE | APPARTIENT_A
}
export interface Graph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/** R7 — GET /api/graph/domaines/{slug}/competences */
export interface DomaineCompetences {
  domaine_slug: string;
  domaine_nom: string;
  items: { skill_slug: string; nom: string }[];
}

/** Résultat d'un appel : `offline` = true si les données viennent des mocks. */
export interface ApiResult<T> {
  data: T;
  offline: boolean;
}
