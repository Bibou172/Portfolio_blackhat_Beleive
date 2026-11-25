# 📜 API_ROUTES - Contrat d'interface de l'équipe

> **Jalon 1** : le contrat entre le backend d'équipe et **chaque** frontend. Il découle de `ARCHITECTURE.md` (requêtes R1 à R8, §2).
> Après la soutenance, toute modification passe par une Pull Request relue par l'équipe.

Base URL : `http://localhost:8000` · Swagger : `http://localhost:8000/docs`

## Conventions

- **Un backend = un candidat** : chaque membre a sa propre base, donc aucune URL ne contient de slug de candidat. Le profil sert d'entrée unique.
- Identifiants publics = **slugs** de projet, de compétence et de domaine (`smartcity-explorer`, `mongodb`, `bases-de-donnees`), jamais d'`ObjectId` exposé (le champ `_id` n'apparaît dans aucune réponse). Ils servent de pivots entre MongoDB et Neo4j.
- Dates au format `YYYY-MM`. `fin: null` = en cours.
- Erreurs : `{"detail": "..."}` avec `404` (ressource inconnue), `409` (slug déjà existant), `422` (paramètre ou corps invalide), `401` (clé admin absente ou fausse), `502` (écriture MongoDB faite mais synchronisation Neo4j échouée).
- Pagination (uniquement `GET /api/projets`) : `?page=1&size=20` → `{"items": [...], "total": 42, "page": 1, "size": 20}`. Les autres listes sont bornées (quelques dizaines d'éléments) : réponse `{"items": [...], "total": n}` sans pagination.
- Les routes d'écriture (`POST`, `DELETE`) exigent l'en-tête `X-API-Key: <ADMIN_API_KEY>` (valeur définie dans `.env`). Les routes `GET` sont publiques.
- Les routes `/api/graph/*` interrogent Neo4j, toutes les autres MongoDB (voir ARCHITECTURE.md §1).

| # | Route | Requête | Base | Écran |
|---|---|---|---|---|
| 0 | `GET /api/health` | - | - | - |
| 1 | `GET /api/profil` | R1 | MongoDB | Accueil, Parcours |
| 2 | `GET /api/projets` | R2 | MongoDB | Projets |
| 3 | `GET /api/projets/{projet_slug}` | détail de R2 | MongoDB | Détail d'un projet |
| 4 | `GET /api/experiences` | R8 | MongoDB | Parcours |
| 5 | `GET /api/stats/competences` | R3 + R6 | MongoDB | Accueil, Compétences |
| 6 | `GET /api/graph/projets/{projet_slug}/similaires` | R4 | Neo4j | Détail d'un projet |
| 7 | `GET /api/graph/competences` | R5 | Neo4j | Graphe |
| 8 | `GET /api/graph/domaines/{domaine_slug}/competences` | R7 | Neo4j | Compétences |
| 9 | `POST /api/experiences` | écriture | MongoDB | Admin |
| 10 | `POST /api/formations` | écriture | MongoDB | Admin |
| 11 | `POST /api/projets` | écriture | MongoDB puis Neo4j | Admin |
| 12 | `DELETE /api/projets/{projet_slug}` | écriture | MongoDB puis Neo4j | Admin |

## `GET /api/health`

Fourni. Réponse : `{"status": "ok"}`

## 1. `GET /api/profil` : profil et timeline (R1)

- **Paramètres** : aucun.
- **Écran qui l'utilise** : Accueil (identité, liens, compétences phares) et Parcours (timeline).
- **Erreurs** : `404` si la base n'a pas été alimentée (`just seed`).
- Un seul appel renvoie le document complet (pattern *Embedding*). `experiences` et `formations` sont triées de la plus récente à la plus ancienne (`debut` décroissant).

```json
{
  "candidat_slug": "alice-martin",
  "prenom": "Alice",
  "nom": "Martin",
  "titre": "Élève-ingénieure Big Data — ESIGELEC",
  "bio": "Passionnée par les bases de données NoSQL et le développement d'API.",
  "email": "alice.martin@example.com",
  "liens": {
    "github": "https://github.com/exemple",
    "linkedin": "https://www.linkedin.com/in/exemple"
  },
  "experiences": [
    {
      "entreprise": "Entreprise X",
      "poste": "Stagiaire Data Engineer",
      "lieu": "Rouen",
      "debut": "2026-04",
      "fin": "2026-08",
      "description": "Pipeline d'ingestion de données.",
      "competences": ["python", "mongodb", "airflow"]
    }
  ],
  "formations": [
    {
      "ecole": "ESIGELEC",
      "diplome": "Cycle ingénieur — Big Data (BDTN)",
      "lieu": "Saint-Étienne-du-Rouvray",
      "debut": "2024-09",
      "fin": "2027-06"
    }
  ],
  "competences": [
    { "skill_slug": "python", "nom": "Python", "domaine": "langages", "niveau": 4 },
    { "skill_slug": "mongodb", "nom": "MongoDB", "domaine": "bases-de-donnees", "niveau": 3 }
  ]
}
```

## 2. `GET /api/projets` : projets du candidat (R2)

- **Paramètres** : `competence` (optionnel, un `skill_slug`, ex. `?competence=mongodb`) ; `page` (défaut 1) ; `size` (défaut 20, max 100).
- **Écran** : Projets (liste avec filtre par compétence). Tri : `annee` décroissante.
- **Erreurs** : aucune erreur métier, un filtre sans résultat renvoie `200` avec `items: []`.
- La liste renvoie la version courte d'un projet (sans `description_longue`).

```json
{
  "items": [
    {
      "projet_slug": "smartcity-explorer",
      "titre": "SmartCity Explorer",
      "description": "Application de visualisation de données urbaines.",
      "annee": 2026,
      "competences": ["mongodb", "fastapi", "neo4j"],
      "lien_repo": "https://github.com/exemple/smartcity-explorer",
      "lien_demo": null
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

## 3. `GET /api/projets/{projet_slug}` : détail d'un projet

- **Paramètres** : `projet_slug` (chemin).
- **Écran** : Détail d'un projet. Les projets similaires se chargent à part via la route 6, pour qu'une panne Neo4j n'empêche pas d'afficher le projet.
- **Erreurs** : `404` si le projet n'existe pas.

```json
{
  "projet_slug": "smartcity-explorer",
  "titre": "SmartCity Explorer",
  "description": "Application de visualisation de données urbaines.",
  "description_longue": "Tableau de bord interactif alimenté par des données ouvertes sur la mobilité et l'énergie.",
  "annee": 2026,
  "competences": ["mongodb", "fastapi", "neo4j"],
  "lien_repo": "https://github.com/exemple/smartcity-explorer",
  "lien_demo": null
}
```

## 4. `GET /api/experiences` : expériences filtrées par lieu (R8)

- **Paramètres** : `lieu` (optionnel, comparaison exacte insensible à la casse, ex. `?lieu=Rouen`).
- **Écran** : Parcours (filtre par ville). Tri : `debut` décroissant.
- **Erreurs** : aucune erreur métier, un lieu sans résultat renvoie `200` avec `items: []`.

```json
{
  "items": [
    {
      "entreprise": "Entreprise X",
      "poste": "Stagiaire Data Engineer",
      "lieu": "Rouen",
      "debut": "2026-04",
      "fin": "2026-08",
      "description": "Pipeline d'ingestion de données.",
      "competences": ["python", "mongodb", "airflow"]
    }
  ],
  "total": 1
}
```

## 5. `GET /api/stats/competences` : statistiques et top des compétences (R3 + R6)

- **Paramètres** : `limit` (optionnel, entier ≥ 1) : ne garde que les `limit` premières compétences. Sans `limit`, toutes les compétences sont renvoyées (R3). `?limit=5` donne le top 5 (R6).
- **Écran** : Accueil (compétences phares avec `?limit=5`) et Compétences (statistiques complètes). Le champ `domaine` permet au frontend de filtrer par domaine sans appel supplémentaire.
- Agrégation MongoDB sur `projets` (ARCHITECTURE.md §3.4). `nom`, `domaine` et `niveau` viennent du document `candidats` (lecture par le service, sans `$lookup`). Seules les compétences utilisées par au moins un projet apparaissent. Tri : `nb_projets` décroissant puis `skill_slug` croissant.

```json
{
  "total": 3,
  "items": [
    { "skill_slug": "mongodb", "nom": "MongoDB", "domaine": "bases-de-donnees", "niveau": 3, "nb_projets": 2, "derniere_annee": 2026 },
    { "skill_slug": "python", "nom": "Python", "domaine": "langages", "niveau": 4, "nb_projets": 2, "derniere_annee": 2026 },
    { "skill_slug": "neo4j", "nom": "Neo4j", "domaine": "bases-de-donnees", "niveau": 2, "nb_projets": 1, "derniere_annee": 2026 }
  ]
}
```

## 6. `GET /api/graph/projets/{projet_slug}/similaires` : projets similaires (R4, Neo4j)

- **Paramètres** : `projet_slug` (chemin) ; `limit` (défaut 5, max 20).
- **Écran** : Détail d'un projet (bloc « Projets similaires »). Tri : `nb_communes` décroissant.
- **Erreurs** : `404` si le nœud `Projet` n'existe pas. Un projet sans voisin renvoie `200` avec `items: []`.

```json
{
  "projet_slug": "smartcity-explorer",
  "items": [
    {
      "projet_slug": "portfolio-api",
      "titre": "Portfolio API",
      "competences_communes": ["mongodb", "neo4j"],
      "nb_communes": 2
    }
  ]
}
```

## 7. `GET /api/graph/competences` : graphe de compétences prêt à afficher (R5, Neo4j)

- **Paramètres** : aucun.
- **Écran** : Graphe (compatible D3 force, vis-network, Cytoscape : `links` référence les `id` de `nodes`).
- Chemin couvert : `Candidat → Projet → Compétence → Domaine`. Le backend transforme le résultat Cypher en `nodes` / `links` dédoublonnés. `id` = `<type>:<slug>`, ce qui évite toute collision entre types.
- **Erreurs** : `404` si le nœud `Candidat` est absent de Neo4j (seed non lancé). Un candidat sans projet renvoie `200` avec le seul nœud candidat et `links: []`.

```json
{
  "nodes": [
    { "id": "candidat:alice-martin", "type": "candidat", "label": "Alice Martin" },
    { "id": "projet:smartcity-explorer", "type": "projet", "label": "SmartCity Explorer", "annee": 2026 },
    { "id": "competence:mongodb", "type": "competence", "label": "MongoDB", "niveau": 3 },
    { "id": "competence:neo4j", "type": "competence", "label": "Neo4j", "niveau": 2 },
    { "id": "domaine:bases-de-donnees", "type": "domaine", "label": "Bases de données" }
  ],
  "links": [
    { "source": "candidat:alice-martin", "target": "projet:smartcity-explorer", "type": "A_REALISE" },
    { "source": "projet:smartcity-explorer", "target": "competence:mongodb", "type": "UTILISE" },
    { "source": "projet:smartcity-explorer", "target": "competence:neo4j", "type": "UTILISE" },
    { "source": "competence:mongodb", "target": "domaine:bases-de-donnees", "type": "APPARTIENT_A" },
    { "source": "competence:neo4j", "target": "domaine:bases-de-donnees", "type": "APPARTIENT_A" }
  ]
}
```

## 8. `GET /api/graph/domaines/{domaine_slug}/competences` : compétences d'un domaine (R7, Neo4j)

- **Paramètres** : `domaine_slug` (chemin, ex. `bases-de-donnees`).
- **Écran** : Compétences (filtre par domaine). Tri : `nom` croissant.
- **Erreurs** : `404` si le domaine n'existe pas.

```json
{
  "domaine_slug": "bases-de-donnees",
  "domaine_nom": "Bases de données",
  "items": [
    { "skill_slug": "mongodb", "nom": "MongoDB" },
    { "skill_slug": "neo4j", "nom": "Neo4j" }
  ]
}
```

## Routes d'administration (écran « Admin », candidat uniquement)

Toutes exigent `X-API-Key`. Règle commune : chaque `skill_slug` cité dans `competences` doit déjà exister dans les `competences` du profil (ajoutées via `data/` et le seed), sinon `422` avec la liste des slugs inconnus. Cela garantit que chaque compétence a un domaine et un nœud Neo4j.

## 9. `POST /api/experiences` : ajouter une expérience

- **Corps** : `entreprise`, `poste`, `lieu`, `debut` (obligatoires) ; `fin`, `description`, `competences` (optionnels).
- **Réponse** : `201` avec l'expérience créée.
- Écriture MongoDB uniquement (`$push` sur `experiences`) : les expériences ne sont pas dans le graphe.

```json
{
  "entreprise": "Entreprise Y",
  "poste": "Data Engineer alternant",
  "lieu": "Paris",
  "debut": "2026-09",
  "fin": null,
  "description": "Industrialisation de pipelines Spark.",
  "competences": ["python"]
}
```

## 10. `POST /api/formations` : ajouter une formation

- **Corps** : `ecole`, `diplome`, `debut` (obligatoires) ; `lieu`, `fin` (optionnels).
- **Réponse** : `201` avec la formation créée.

```json
{
  "ecole": "ESIGELEC",
  "diplome": "Cycle ingénieur — Big Data (BDTN)",
  "lieu": "Saint-Étienne-du-Rouvray",
  "debut": "2024-09",
  "fin": "2027-06"
}
```

## 11. `POST /api/projets` : ajouter un projet

- **Corps** : `projet_slug`, `titre`, `description`, `annee`, `competences` (obligatoires, au moins une compétence) ; `description_longue`, `lien_repo`, `lien_demo` (optionnels).
- **Réponse** : `201` avec le projet créé (même format que la route 3). `409` si `projet_slug` existe déjà.
- Ordre : insertion MongoDB (source de vérité), puis dans Neo4j `MERGE` du nœud `Projet`, de la relation `A_REALISE` depuis l'unique nœud `Candidat` et des relations `UTILISE`. Si Neo4j échoue : `502`, le projet reste dans MongoDB et le script de synchronisation rejoue l'écriture Neo4j.

```json
{
  "projet_slug": "portfolio-api",
  "titre": "Portfolio API",
  "description": "API FastAPI polyglotte MongoDB + Neo4j.",
  "annee": 2026,
  "competences": ["python", "mongodb", "neo4j"],
  "lien_repo": "https://github.com/exemple/portfolio-api"
}
```

## 12. `DELETE /api/projets/{projet_slug}` : supprimer un projet

- **Paramètres** : `projet_slug` (chemin).
- **Réponse** : `204` sans corps. `404` si le projet n'existe pas.
- Ordre (ARCHITECTURE.md §5) : `deleteOne` MongoDB, puis `DETACH DELETE` du nœud `Projet` dans Neo4j. Les nœuds `Competence` et `Domaine` sont conservés. Si Neo4j échoue : `502` et le script de synchronisation relance la suppression.