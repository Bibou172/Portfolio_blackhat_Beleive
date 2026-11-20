/**
 * Repli : lecture (seule) des fichiers data/ du dépôt — la même source que le seed du backend.
 * Utilisé uniquement quand l'API ne répond pas ou qu'une route n'est pas encore implémentée.
 * Les données sont intégrées au bundle au moment du build ; rien n'est inventé ici.
 */
import type { Competence, Experience, Formation, Profil, Projet } from "./types";

const FICHIER = (import.meta.env.VITE_CANDIDAT_FILE as string | undefined) ?? "HilaryBoco06";

const candidatsBruts = import.meta.glob("../../../../data/candidats/*.json", { eager: true, import: "default" });
const projetsBruts = import.meta.glob("../../../../data/projets/*.json", { eager: true, import: "default" });

function trouver(fichiers: Record<string, unknown>): unknown {
  const cle = Object.keys(fichiers).find((k) => k.endsWith(`/${FICHIER}.json`));
  return cle ? fichiers[cle] : undefined;
}

type Brut = Record<string, any>;

/** Accepte le format de ARCHITECTURE.md et celui de data/*_exemple.json (liens.github, candidat_slugs…). */
function normaliserProjet(p: Brut): Projet {
  return {
    projet_slug: p.projet_slug,
    titre: p.titre,
    description: p.description ?? "",
    description_longue: p.description_longue ?? null,
    annee: p.annee,
    competences: Array.isArray(p.competences) ? p.competences : [],
    lien_repo: p.lien_repo ?? p.liens?.github ?? null,
    lien_demo: p.lien_demo ?? p.liens?.demo ?? null,
    contexte: p.contexte,
    probleme: p.probleme,
    role: p.role,
    fonctionnalites: p.fonctionnalites,
    decisions: p.decisions,
    images: p.images,
    metriques: p.metriques,
  };
}

function normaliserProfil(c: Brut): Profil {
  return {
    candidat_slug: c.candidat_slug,
    prenom: c.prenom,
    nom: c.nom,
    titre: c.titre,
    bio: c.bio,
    email: c.email,
    telephone: c.telephone,
    liens: c.liens,
    experiences: (c.experiences ?? []) as Experience[],
    formations: (c.formations ?? []) as Formation[],
    competences: (c.competences ?? []) as Competence[],
    recherche: c.recherche,
    points_forts: c.points_forts,
  };
}

export function profilLocal(): Profil | null {
  const brut = trouver(candidatsBruts);
  return brut && typeof brut === "object" ? normaliserProfil(brut as Brut) : null;
}

export function projetsLocaux(): Projet[] {
  const brut = trouver(projetsBruts);
  const liste = Array.isArray(brut) ? brut : brut ? [brut] : [];
  return (liste as Brut[]).filter((p) => p?.projet_slug).map(normaliserProjet);
}
