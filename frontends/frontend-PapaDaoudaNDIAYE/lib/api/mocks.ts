/**
 * Données de secours (MODE HORS-LIGNE), utilisées quand l'API ne répond pas.
 * ⚠️ Contenu FICTIF de démonstration : les vraies données viennent de data/ via `just seed`.
 *
 * Les fonctions ci-dessous reproduisent les calculs du backend (agrégations
 * MongoDB, requêtes Cypher) pour que les écrans restent cohérents hors-ligne.
 */
import type {
  DomaineCompetences,
  Experience,
  Graph,
  GraphLink,
  GraphNode,
  Profil,
  Projet,
  ProjetSimilaire,
  StatCompetence,
} from "./types";

/** Noms lisibles des domaines (secours si l'API ne fournit pas `domaine_nom`). */
export const DOMAINES: Record<string, string> = {
  langages: "Langages",
  "intelligence-artificielle": "Intelligence artificielle",
  "data-science": "Data science",
  "big-data": "Big Data",
  "bases-de-donnees": "Bases de données",
  developpement: "Développement",
  backend: "Backend",
  data: "Data",
  devops: "DevOps",
  frontend: "Frontend",
  outils: "Outils",
};

/** "big-data" -> "Big Data" (connu) ou "Mon domaine" (déduit du slug). */
export function domaineNom(slug: string): string {
  if (DOMAINES[slug]) return DOMAINES[slug];
  const s = slug.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const mockProfil: Profil = {
  candidat_slug: "papa-daouda-ndiaye",
  prenom: "Papa Daouda",
  nom: "Ndiaye",
  titre: "Élève-ingénieur Big Data — ESIGELEC",
  bio: "Élève-ingénieur passionné par les architectures de données polyglottes : documents MongoDB, graphes Neo4j et API Python. Je cherche un stage ou une alternance en data engineering.",
  email: "contact@example.com",
  liens: {
    github: "https://github.com/PapaDaoudaNDIAYE",
    linkedin: "https://www.linkedin.com/",
  },
  experiences: [
    {
      entreprise: "DataPort Normandie",
      poste: "Stagiaire Data Engineer",
      lieu: "Rouen",
      debut: "2026-04",
      fin: "2026-08",
      description: "Pipeline d'ingestion de données portuaires, orchestration Airflow et stockage MongoDB.",
      competences: ["python", "mongodb", "airflow"],
    },
    {
      entreprise: "Atelier Numérique ESIGELEC",
      poste: "Développeur API (projet école)",
      lieu: "Saint-Étienne-du-Rouvray",
      debut: "2025-10",
      fin: "2026-01",
      description: "API FastAPI connectée à Neo4j pour recommander des projets étudiants.",
      competences: ["fastapi", "neo4j", "python"],
    },
    {
      entreprise: "Hackathon Open Data",
      poste: "Développeur data (48 h)",
      lieu: "Paris",
      debut: "2025-03",
      fin: "2025-03",
      description: "Visualisation de données de mobilité urbaine, prototype React.",
      competences: ["python", "react"],
    },
    {
      entreprise: "Teranga Analytics",
      poste: "Analyste données (stage d'été)",
      lieu: "Dakar",
      debut: "2024-06",
      fin: "2024-08",
      description: "Tableaux de bord de ventes et requêtes SQL d'analyse.",
      competences: ["sql", "powerbi"],
    },
  ],
  formations: [
    {
      ecole: "ESIGELEC",
      diplome: "Cycle ingénieur — Big Data (BDTN)",
      lieu: "Saint-Étienne-du-Rouvray",
      debut: "2024-09",
      fin: "2027-06",
    },
    {
      ecole: "Classes préparatoires scientifiques",
      diplome: "CPGE MPSI / MP",
      lieu: "Dakar",
      debut: "2022-09",
      fin: "2024-06",
    },
  ],
  competences: [
    { skill_slug: "python", nom: "Python", domaine: "langages", niveau: 5 },
    { skill_slug: "sql", nom: "SQL", domaine: "langages", niveau: 4 },
    { skill_slug: "typescript", nom: "TypeScript", domaine: "langages", niveau: 3 },
    { skill_slug: "mongodb", nom: "MongoDB", domaine: "bases-de-donnees", niveau: 4 },
    { skill_slug: "neo4j", nom: "Neo4j", domaine: "bases-de-donnees", niveau: 4 },
    { skill_slug: "fastapi", nom: "FastAPI", domaine: "backend", niveau: 4 },
    { skill_slug: "airflow", nom: "Airflow", domaine: "data", niveau: 3 },
    { skill_slug: "powerbi", nom: "Power BI", domaine: "data", niveau: 3 },
    { skill_slug: "docker", nom: "Docker", domaine: "devops", niveau: 3 },
    { skill_slug: "react", nom: "React", domaine: "frontend", niveau: 3 },
  ],
};

export const mockProjets: Projet[] = [
  {
    projet_slug: "smartcity-explorer",
    candidat_slug: "papa-daouda-ndiaye",
    titre: "SmartCity Explorer",
    description: "API polyglotte de données urbaines : capteurs dans MongoDB, réseau de quartiers dans Neo4j.",
    description_longue:
      "TP fil rouge NoSQL. Les mesures des capteurs (qualité de l'air, trafic) sont stockées en documents MongoDB avec agrégations par quartier ; les relations entre quartiers, lignes de bus et équipements sont modélisées dans Neo4j pour calculer des itinéraires et des zones d'influence.",
    annee: 2026,
    competences: ["python", "mongodb", "neo4j", "fastapi"],
    lien_repo: "https://github.com/PapaDaoudaNDIAYE",
    lien_demo: null,
  },
  {
    projet_slug: "portfolio-polyglotte",
    candidat_slug: "papa-daouda-ndiaye",
    titre: "Portfolio Polyglotte",
    description: "Ce portfolio jouable : API FastAPI (MongoDB + Neo4j) et frontend Next.js / Phaser.",
    description_longue:
      "Projet d'équipe ESIGELEC. Le backend sert le profil et les projets depuis MongoDB, et le graphe de compétences depuis Neo4j, reliés par des slugs pivots. Ce frontend en fait un monde ouvert : chaque voiture mène à une section.",
    annee: 2026,
    competences: ["fastapi", "mongodb", "neo4j", "react", "typescript"],
    lien_repo: "https://github.com/PapaDaoudaNDIAYE",
    lien_demo: null,
  },
  {
    projet_slug: "pipeline-meteo",
    candidat_slug: "papa-daouda-ndiaye",
    titre: "Pipeline Météo",
    description: "Ingestion quotidienne de données météo ouvertes, orchestrée par Airflow.",
    description_longue:
      "DAG Airflow qui télécharge les relevés météo, les nettoie en Python, les historise en SQL et publie des indicateurs. Le tout tourne dans des conteneurs Docker.",
    annee: 2025,
    competences: ["python", "airflow", "docker", "sql"],
    lien_repo: "https://github.com/PapaDaoudaNDIAYE",
    lien_demo: null,
  },
  {
    projet_slug: "dashboard-energie",
    candidat_slug: "papa-daouda-ndiaye",
    titre: "Dashboard Énergie",
    description: "Tableau de bord de consommation électrique régionale.",
    description_longue:
      "Préparation des données en Python et SQL, puis tableau de bord Power BI avec indicateurs de consommation par région et par saison.",
    annee: 2025,
    competences: ["powerbi", "sql", "python"],
    lien_repo: null,
    lien_demo: null,
  },
  {
    projet_slug: "graph-recommandation",
    candidat_slug: "papa-daouda-ndiaye",
    titre: "Graphe de recommandation",
    description: "Recommandation de films par parcours de graphe Neo4j.",
    description_longue:
      "Import d'un jeu de données de films dans Neo4j et recommandations par voisins communs (filtrage collaboratif en Cypher), servies par un script Python conteneurisé.",
    annee: 2025,
    competences: ["neo4j", "python", "docker"],
    lien_repo: "https://github.com/PapaDaoudaNDIAYE",
    lien_demo: null,
  },
];

// ---------------------------------------------------------------------------
// Calculs équivalents aux requêtes du backend
// ---------------------------------------------------------------------------

export function mockProjetsFiltres(competence?: string): Projet[] {
  const list = competence ? mockProjets.filter((p) => p.competences.includes(competence)) : mockProjets;
  return [...list].sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0));
}

/** R3 : $unwind competences -> $group -> $sort (ARCHITECTURE.md §3.4), enrichi avec le profil (API_ROUTES.md route 5). */
export function mockStats(): StatCompetence[] {
  const profil = new Map(mockProfil.competences.map((c) => [c.skill_slug, c]));
  const map = new Map<string, StatCompetence>();
  for (const p of mockProjets) {
    for (const c of p.competences) {
      const info = profil.get(c);
      const s = map.get(c) ?? {
        skill_slug: c,
        nom: info?.nom ?? c,
        domaine: info?.domaine ?? null,
        niveau: info?.niveau ?? null,
        nb_projets: 0,
        derniere_annee: null,
      };
      s.nb_projets += 1;
      s.derniere_annee = Math.max(s.derniere_annee ?? 0, p.annee ?? 0) || null;
      map.set(c, s);
    }
  }
  return [...map.values()].sort((a, b) => b.nb_projets - a.nb_projets || a.skill_slug.localeCompare(b.skill_slug));
}

/** R6 : même pipeline + $limit n. */
export function mockTop(n: number): StatCompetence[] {
  return mockStats().slice(0, n);
}

/** R4 : projets partageant des compétences, triés par nombre de compétences communes. */
export function mockSimilaires(slug: string, limit: number): ProjetSimilaire[] {
  const ref = mockProjets.find((p) => p.projet_slug === slug);
  if (!ref) return [];
  return mockProjets
    .filter((p) => p.projet_slug !== slug)
    .map((p) => {
      const communes = p.competences.filter((c) => ref.competences.includes(c));
      return { projet_slug: p.projet_slug, titre: p.titre, competences_communes: communes, nb_communes: communes.length };
    })
    .filter((s) => s.nb_communes > 0)
    .sort((a, b) => b.nb_communes - a.nb_communes)
    .slice(0, limit);
}

/** R5 : graphe Candidat -> Projet -> Competence -> Domaine. */
export function mockGraph(): Graph {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const candidatId = `candidat:${mockProfil.candidat_slug}`;
  nodes.push({ id: candidatId, label: `${mockProfil.prenom} ${mockProfil.nom}`, type: "Candidat" });

  const skills = new Map(mockProfil.competences.map((c) => [c.skill_slug, c]));
  const usedSkills = new Set<string>();
  for (const p of mockProjets) {
    const pid = `projet:${p.projet_slug}`;
    nodes.push({ id: pid, label: p.titre, type: "Projet" });
    links.push({ source: candidatId, target: pid, type: "A_REALISE" });
    for (const c of p.competences) {
      usedSkills.add(c);
      links.push({ source: pid, target: `competence:${c}`, type: "UTILISE" });
    }
  }
  const domaines = new Set<string>();
  for (const slug of usedSkills) {
    const s = skills.get(slug);
    nodes.push({ id: `competence:${slug}`, label: s?.nom ?? slug, type: "Competence" });
    if (s?.domaine) {
      domaines.add(s.domaine);
      links.push({ source: `competence:${slug}`, target: `domaine:${s.domaine}`, type: "APPARTIENT_A" });
    }
  }
  for (const d of domaines) nodes.push({ id: `domaine:${d}`, label: domaineNom(d), type: "Domaine" });
  return { nodes, links };
}

/** R7 : compétences d'un domaine. */
export function mockDomaine(domaineSlug: string): DomaineCompetences {
  return {
    domaine_slug: domaineSlug,
    domaine_nom: domaineNom(domaineSlug),
    items: mockProfil.competences
      .filter((c) => c.domaine === domaineSlug)
      .map((c) => ({ skill_slug: c.skill_slug, nom: c.nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom)),
  };
}

/** R8 : expériences filtrées par lieu. */
export function mockExperiences(lieu?: string): Experience[] {
  const all = mockProfil.experiences;
  return lieu ? all.filter((e) => e.lieu === lieu) : all;
}
