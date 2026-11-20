/** Types alignés sur API_ROUTES.md (contrat d'équipe) — champs facultatifs en plus pour les études de cas. */

export interface Liens {
  github?: string;
  linkedin?: string;
  [autre: string]: string | undefined;
}

export interface Experience {
  entreprise: string;
  poste: string;
  lieu?: string;
  debut: string; // YYYY-MM
  fin?: string | null;
  description?: string;
  competences?: string[];
}

export interface Formation {
  ecole: string;
  diplome: string;
  lieu?: string;
  debut: string;
  fin?: string | null;
}

export interface Competence {
  skill_slug: string;
  nom: string;
  domaine: string;
  niveau?: number; // 1 à 5
}

export interface Profil {
  candidat_slug: string;
  prenom: string;
  nom: string;
  titre?: string;
  bio?: string;
  email?: string;
  /** Facultatif (hors contrat API). */
  telephone?: string;
  liens?: Liens;
  experiences: Experience[];
  formations: Formation[];
  competences: Competence[];
  /** Facultatifs (non présents dans le contrat API) : affichés seulement s'ils existent. */
  recherche?: string;
  points_forts?: string[];
}

export interface Projet {
  projet_slug: string;
  titre: string;
  description: string;
  description_longue?: string | null;
  annee?: number;
  competences: string[];
  lien_repo?: string | null;
  lien_demo?: string | null;
  /** Facultatifs : structure « étude de cas ». */
  contexte?: string;
  probleme?: string;
  role?: string;
  fonctionnalites?: string[];
  decisions?: string[];
  images?: string[];
  metriques?: Record<string, string | number>;
}

export interface StatCompetence {
  skill_slug: string;
  nom: string;
  domaine: string;
  niveau?: number;
  nb_projets: number;
  derniere_annee?: number;
}

export interface ProjetSimilaire {
  projet_slug: string;
  titre: string;
  competences_communes: string[];
  nb_communes: number;
}

export interface GraphNode {
  id: string;
  type: "candidat" | "projet" | "competence" | "domaine";
  label: string;
  annee?: number;
  niveau?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "A_REALISE" | "UTILISE" | "APPARTIENT_A";
}

export interface Graphe {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CompetencesDomaine {
  domaine_slug: string;
  domaine_nom: string;
  items: { skill_slug: string; nom: string }[];
}

/** D'où vient la donnée affichée : l'API d'équipe ou le fichier data/ (repli). */
export type Source = "api" | "local" | "aucune";

export interface Resultat<T> {
  data: T;
  source: Source;
}
