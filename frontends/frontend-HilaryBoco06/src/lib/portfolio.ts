/**
 * Accès aux données du portfolio.
 * Règle : on interroge d'abord l'API d'équipe (API_ROUTES.md). Si elle est injoignable ou si la route
 * n'est pas encore disponible, on se replie sur data/ (même source que le seed) avec le même calcul
 * que celui décrit dans ARCHITECTURE.md (§3.4 pour R3, §4.2 pour R4/R5/R7).
 */
import { apiGet } from "./api";
import { profilLocal, projetsLocaux } from "./localData";
import { libelleDomaine } from "./format";
import type {
  CompetencesDomaine,
  Experience,
  Graphe,
  GraphLink,
  GraphNode,
  Profil,
  Projet,
  ProjetSimilaire,
  Resultat,
  StatCompetence,
} from "./types";

async function avecRepli<T>(appel: () => Promise<T>, repli: () => T | null): Promise<Resultat<T | null>> {
  try {
    return { data: await appel(), source: "api" };
  } catch {
    const local = repli();
    return { data: local, source: local === null ? "aucune" : "local" };
  }
}

type Liste<T> = { items: T[]; total: number };

/**
 * R2 et R8 : le contrat (API_ROUTES.md) prévoit {items, total} ; l'implémentation actuelle renvoie une liste brute.
 * On accepte les deux formats ; toute autre réponse déclenche le repli sur data/.
 */
function versListe<T>(reponse: T[] | Liste<T>): T[] {
  if (Array.isArray(reponse)) return reponse;
  if (reponse && Array.isArray(reponse.items)) return reponse.items;
  throw new Error("Format de liste inattendu");
}

/**
 * Candidat demandé à R1, R2 et R8 : leur paramètre candidat_slug vaut « exemple-candidat » par défaut,
 * un candidat que le seed n'insère pas. Paramètre sans effet si le backend n'en a plus besoin.
 */
const CANDIDAT_SLUG =
  (import.meta.env.VITE_CANDIDAT_SLUG as string | undefined)?.trim() || profilLocal()?.candidat_slug || "hilary-boco";

/**
 * Les modèles de l'API suppriment les champs hors ARCHITECTURE.md (téléphone, points forts, études de cas) :
 * on les complète avec data/ quand il s'agit du même candidat ou du même projet.
 */
function completerProfil(api: Profil): Profil {
  const local = profilLocal();
  if (!local || local.candidat_slug !== api.candidat_slug) return api;
  return {
    ...api,
    telephone: api.telephone ?? local.telephone,
    recherche: api.recherche ?? local.recherche,
    points_forts: api.points_forts ?? local.points_forts,
  };
}

function completerProjet(api: Projet): Projet {
  const local = projetsLocaux().find((p) => p.projet_slug === api.projet_slug);
  if (!local) return api;
  const champs = ["contexte", "probleme", "role", "fonctionnalites", "decisions", "images", "metriques"] as const;
  const complements = Object.fromEntries(champs.filter((c) => api[c] === undefined && local[c] !== undefined).map((c) => [c, local[c]]));
  return { ...api, ...complements };
}

// ── R1 ──
export function getProfil() {
  return avecRepli(
    async () => completerProfil(await apiGet<Profil>(`/api/profil?candidat_slug=${encodeURIComponent(CANDIDAT_SLUG)}`)),
    profilLocal,
  );
}

// ── R8 ──
export function getExperiences(lieu?: string) {
  const q = new URLSearchParams({ candidat_slug: CANDIDAT_SLUG });
  if (lieu) q.set("lieu", lieu);
  return avecRepli(
    async () => versListe(await apiGet<Experience[] | Liste<Experience>>(`/api/experiences?${q}`)),
    () => {
      const profil = profilLocal();
      if (!profil) return null;
      return profil.experiences
        .filter((e) => !lieu || (e.lieu ?? "").toLowerCase() === lieu.toLowerCase())
        .sort((a, b) => b.debut.localeCompare(a.debut));
    },
  );
}

// ── R2 ──
export function getProjets(competence?: string) {
  const q = new URLSearchParams({ page: "1", size: "100", candidat_slug: CANDIDAT_SLUG });
  if (competence) q.set("competence", competence);
  return avecRepli(
    async () => versListe(await apiGet<Projet[] | Liste<Projet>>(`/api/projets?${q}`)).map(completerProjet),
    () => {
      const projets = projetsLocaux();
      if (!projets.length && !profilLocal()) return null;
      return projets
        .filter((p) => !competence || p.competences.includes(competence))
        .sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0));
    },
  );
}

export function getProjet(slug: string) {
  return avecRepli(
    async () => completerProjet(await apiGet<Projet>(`/api/projets/${encodeURIComponent(slug)}`)),
    () => projetsLocaux().find((p) => p.projet_slug === slug) ?? null,
  );
}

// ── R3 + R6 ──
export function getStatsCompetences(limit?: number) {
  const q = limit ? `?limit=${limit}` : "";
  return avecRepli(
    async () => versListe(await apiGet<StatCompetence[] | Liste<StatCompetence>>(`/api/stats/competences${q}`)),
    () => {
      const profil = profilLocal();
      if (!profil) return null;
      const parSlug = new Map(profil.competences.map((c) => [c.skill_slug, c]));
      const agg = new Map<string, StatCompetence>();
      for (const p of projetsLocaux()) {
        for (const slug of p.competences) {
          const c = parSlug.get(slug);
          const s = agg.get(slug) ?? {
            skill_slug: slug,
            nom: c?.nom ?? slug,
            domaine: c?.domaine ?? "autres",
            niveau: c?.niveau,
            nb_projets: 0,
            derniere_annee: undefined,
          };
          s.nb_projets += 1;
          if (p.annee && (!s.derniere_annee || p.annee > s.derniere_annee)) s.derniere_annee = p.annee;
          agg.set(slug, s);
        }
      }
      const items = [...agg.values()].sort((a, b) => b.nb_projets - a.nb_projets || a.skill_slug.localeCompare(b.skill_slug));
      return limit ? items.slice(0, limit) : items;
    },
  );
}

// ── R4 ──
export function getProjetsSimilaires(slug: string, limit = 5) {
  return avecRepli(
    async () =>
      (await apiGet<{ projet_slug: string; items: ProjetSimilaire[] }>(
        `/api/graph/projets/${encodeURIComponent(slug)}/similaires?limit=${limit}`,
      )).items,
    () => {
      const projets = projetsLocaux();
      const ref = projets.find((p) => p.projet_slug === slug);
      if (!ref) return null;
      return projets
        .filter((p) => p.projet_slug !== slug)
        .map((p) => {
          const communes = p.competences.filter((c) => ref.competences.includes(c)).sort();
          return { projet_slug: p.projet_slug, titre: p.titre, competences_communes: communes, nb_communes: communes.length };
        })
        .filter((s) => s.nb_communes > 0)
        .sort((a, b) => b.nb_communes - a.nb_communes || a.projet_slug.localeCompare(b.projet_slug))
        .slice(0, limit);
    },
  );
}

// ── R5 ──
export function getGraphe() {
  return avecRepli(
    () => apiGet<Graphe>("/api/graph/competences"),
    () => {
      const profil = profilLocal();
      if (!profil) return null;
      const nodes = new Map<string, GraphNode>();
      const links = new Map<string, GraphLink>();
      const lien = (source: string, target: string, type: GraphLink["type"]) =>
        links.set(`${source}|${target}|${type}`, { source, target, type });
      const parSlug = new Map(profil.competences.map((c) => [c.skill_slug, c]));
      const idCa = `candidat:${profil.candidat_slug}`;
      nodes.set(idCa, { id: idCa, type: "candidat", label: `${profil.prenom} ${profil.nom}` });
      for (const p of projetsLocaux()) {
        const idP = `projet:${p.projet_slug}`;
        nodes.set(idP, { id: idP, type: "projet", label: p.titre, annee: p.annee });
        lien(idCa, idP, "A_REALISE");
        for (const slug of p.competences) {
          const c = parSlug.get(slug);
          if (!c) continue; // même règle que l'API : une compétence doit exister dans le profil
          const idC = `competence:${slug}`;
          nodes.set(idC, { id: idC, type: "competence", label: c.nom, niveau: c.niveau });
          lien(idP, idC, "UTILISE");
          const idD = `domaine:${c.domaine}`;
          nodes.set(idD, { id: idD, type: "domaine", label: libelleDomaine(c.domaine) });
          lien(idC, idD, "APPARTIENT_A");
        }
      }
      return { nodes: [...nodes.values()], links: [...links.values()] };
    },
  );
}

// ── R7 ──
export function getCompetencesDomaine(domaine: string) {
  return avecRepli(
    () => apiGet<CompetencesDomaine>(`/api/graph/domaines/${encodeURIComponent(domaine)}/competences`),
    () => {
      const profil = profilLocal();
      if (!profil) return null;
      const items = profil.competences
        .filter((c) => c.domaine === domaine)
        .map((c) => ({ skill_slug: c.skill_slug, nom: c.nom }))
        .sort((a, b) => a.nom.localeCompare(b.nom));
      return items.length ? { domaine_slug: domaine, domaine_nom: libelleDomaine(domaine), items } : null;
    },
  );
}
