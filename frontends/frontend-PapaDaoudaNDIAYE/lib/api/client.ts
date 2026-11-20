/**
 * Client typé de l'API d'équipe (R1 à R8 d'ARCHITECTURE.md).
 *
 * Utilisable côté serveur (Server Components) ET navigateur (HUD, jeu).
 * Chaque fonction renvoie { data, offline } : si l'API est éteinte, trop lente,
 * renvoie une erreur ou un format inattendu, on bascule sur les mocks et
 * `offline` vaut true (badge « MODE HORS-LIGNE » dans le HUD).
 */
import { API_TIMEOUT_MS, API_URL } from "./config";
import {
  DOMAINES,
  domaineNom,
  mockDomaine,
  mockExperiences,
  mockGraph,
  mockProfil,
  mockProjets,
  mockProjetsFiltres,
  mockSimilaires,
  mockStats,
  mockTop,
} from "./mocks";
import type {
  ApiResult,
  DomaineCompetences,
  Experience,
  Graph,
  NodeType,
  Profil,
  Projet,
  ProjetSimilaire,
  StatCompetence,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    path: string,
  ) {
    super(`API ${status} sur ${path}`);
  }
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!res.ok) throw new ApiError(res.status, path);
  return res.json();
}

async function withFallback<T>(path: string, parse: (raw: unknown) => T, mock: () => T): Promise<ApiResult<T>> {
  try {
    return { data: parse(await fetchJson(path)), offline: false };
  } catch {
    return { data: mock(), offline: true };
  }
}

// --- Validation légère du format reçu (sinon -> mocks) ------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Accepte une liste brute ou une réponse paginée {items: [...]}. */
function asList<T>(raw: unknown, check: (item: unknown) => boolean): T[] {
  const list = isObject(raw) && Array.isArray(raw.items) ? raw.items : raw;
  if (!Array.isArray(list) || !list.every(check)) throw new Error("Format de liste inattendu");
  return list as T[];
}

const hasString = (o: unknown, key: string) => isObject(o) && typeof o[key] === "string";

function parseProfil(raw: unknown): Profil {
  if (!hasString(raw, "candidat_slug")) throw new Error("Profil invalide");
  const p = raw as unknown as Profil;
  return { ...p, experiences: p.experiences ?? [], formations: p.formations ?? [], competences: p.competences ?? [] };
}

const parseProjet = (raw: unknown): Projet => {
  if (!hasString(raw, "projet_slug")) throw new Error("Projet invalide");
  const p = raw as unknown as Projet;
  return { ...p, competences: p.competences ?? [] };
};

const parseProjets = (raw: unknown) => asList<unknown>(raw, (x) => hasString(x, "projet_slug")).map(parseProjet);

/** Route 5 : {total, items: [{skill_slug, nom, domaine, niveau, nb_projets, derniere_annee}]}. */
const parseStats = (raw: unknown) =>
  asList<StatCompetence>(raw, (x) => hasString(x, "skill_slug")).map((s) => ({ ...s, nom: s.nom || s.skill_slug }));

const NODE_TYPES: Record<string, NodeType> = {
  candidat: "Candidat",
  projet: "Projet",
  competence: "Competence",
  domaine: "Domaine",
};

/** Route 7 : types en minuscules dans l'API ("candidat") -> types du frontend ("Candidat"). */
function parseGraph(raw: unknown): Graph {
  if (!isObject(raw) || !Array.isArray(raw.nodes) || !Array.isArray(raw.links)) throw new Error("Graphe invalide");
  const nodes = raw.nodes.map((n) => {
    if (!hasString(n, "id") || !hasString(n, "type")) throw new Error("Nœud invalide");
    const node = n as { id: string; type: string; label?: string };
    const type = NODE_TYPES[node.type.toLowerCase()];
    if (!type) throw new Error(`Type de nœud inconnu : ${node.type}`);
    return { id: node.id, type, label: node.label ?? node.id };
  });
  const links = raw.links.map((l) => {
    if (!hasString(l, "source") || !hasString(l, "target")) throw new Error("Lien invalide");
    const link = l as { source: string; target: string; type?: string };
    return { source: link.source, target: link.target, type: link.type ?? "" };
  });
  return { nodes, links };
}

/** Route 8 : {domaine_slug, domaine_nom, items: [{skill_slug, nom}]} (ou une liste brute de lignes). */
function parseDomaine(slug: string) {
  return (raw: unknown): DomaineCompetences => {
    const items = asList<{ skill_slug: string; nom?: string | null }>(raw, (x) => hasString(x, "skill_slug"));
    const nom = isObject(raw) && typeof raw.domaine_nom === "string" ? raw.domaine_nom : domaineNom(slug);
    return {
      domaine_slug: slug,
      domaine_nom: nom,
      items: items.map((c) => ({ skill_slug: c.skill_slug, nom: c.nom || c.skill_slug })),
    };
  };
}

const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
};

// --- Routes R1 à R8 ------------------------------------------------------------

/** R1 — profil + timeline (expériences, formations). */
export const getProfil = () => withFallback("/api/profil", parseProfil, () => mockProfil);

/** R2 — projets, filtrables par compétence. */
export const getProjets = (competence?: string) =>
  withFallback(`/api/projets${qs({ competence })}`, parseProjets, () => mockProjetsFiltres(competence));

/** Détail d'un projet (route 3) ; si elle échoue, on cherche dans la liste R2. */
export async function getProjet(slug: string): Promise<ApiResult<Projet | null>> {
  try {
    return { data: parseProjet(await fetchJson(`/api/projets/${encodeURIComponent(slug)}`)), offline: false };
  } catch {
    const list = await getProjets();
    return { data: list.data.find((p) => p.projet_slug === slug) ?? null, offline: list.offline };
  }
}

/** R3 — statistiques par compétence. */
export const getStatsCompetences = () => withFallback("/api/stats/competences", parseStats, mockStats);

/** R4 — projets similaires (Neo4j) : {projet_slug, items}. */
export const getProjetsSimilaires = (slug: string, limit = 4) =>
  withFallback(
    `/api/graph/projets/${encodeURIComponent(slug)}/similaires${qs({ limit })}`,
    (raw) => asList<ProjetSimilaire>(raw, (x) => hasString(x, "projet_slug")),
    () => mockSimilaires(slug, limit),
  );

/** R5 — graphe de compétences {nodes, links} (Neo4j). */
export const getGraphCompetences = () => withFallback("/api/graph/competences", parseGraph, mockGraph);

/** R6 — top N des compétences : même route que R3 avec ?limit=N (API_ROUTES.md, route 5). */
export const getTopCompetences = (n = 5) =>
  withFallback(`/api/stats/competences${qs({ limit: n })}`, parseStats, () => mockTop(n));

/** R7 — compétences d'un domaine (Neo4j). */
export const getCompetencesDomaine = (domaineSlug: string) =>
  withFallback(
    `/api/graph/domaines/${encodeURIComponent(domaineSlug)}/competences`,
    parseDomaine(domaineSlug),
    () => mockDomaine(domaineSlug),
  );

/** R8 — expériences filtrées par lieu. */
export const getExperiences = (lieu?: string) =>
  withFallback(
    `/api/experiences${qs({ lieu })}`,
    (raw) => asList<Experience>(raw, (x) => hasString(x, "entreprise")),
    () => mockExperiences(lieu),
  );

export { DOMAINES, domaineNom, mockProjets };
