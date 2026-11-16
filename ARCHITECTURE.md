# 🧠 ARCHITECTURE - Équipe `TODO-nom-equipe`

> **Jalon 1** : ce document est votre **spécification**. Il doit être **complet** : toute l'équipe va coder dessus.
> Toutes les sections sont obligatoires. Remplacez **tous** les `TODO` (la CI « Livrables » les compte).
> En soutenance (5 à 6 min), vous présenterez surtout la **section 1** (schéma) et le contrat `API_ROUTES.md`.

## 1. Schéma d'architecture

Montrez **qui stocke quoi** et **quels flux** : frontends → API → MongoDB / Neo4j.


`![Architecture](docs/architecture.excalidraw.png)`

L'image reste modifiable : rouvrez-la dans Excalidraw (ou dans VS Code avec l'extension *Excalidraw*).

```mermaid
flowchart LR
    F["Frontends (1 par membre)"] -->|HTTP JSON| API["FastAPI - backend d'équipe"]
    API -->|"candidats, projets"| M[("MongoDB")]
    API -->|"graphe de compétences"| N[("Neo4j")]
    %% TODO : complétez / corrigez ce schéma selon VOS choix
```

TODO : en 3 à 5 lignes, le rôle de chaque base dans votre portfolio.
La base Mongo permet de gerer les collections profil et projets
La basse Neo permet peremt de gerer les liens entre les compétences et les projets 

## 2. Les requêtes à servir


| # | Besoin (vu par un recruteur) | Route API | Base(s) interrogée(s) |
|---|---|---|---|
| R1 | Profil + timeline (expériences, formations) d'un candidat | `GET /api/profil` | MongoDB |
| R2 | Projets d'un candidat, filtrables par compétence | `GET /api/projets` | MongoDB |
| R3 | Statistiques d'un candidat par compétence | `GET /api/stats/competences` | MongoDB |
| R4 | Projets similaires à un projet | `GET /api/graph/projets/{projet_slug}/similaires` | Neo4j |
| R5 | Graphe de compétences d'un candidat | `GET /api/graph/competences` | Neo4j |
| R6 | Top N des compétences les plus utilisées | `GET /api/competences/top?n=5` | MongoDB |
| R7 | Compétences d'un domaine donné | `GET /api/graph/domaines/{domaine_slug}/competences` | Neo4j |
| R8 | Expériences filtrées par lieu | `GET /api/experiences?lieu=...` | MongoDB |

## 3. Modèle MongoDB

### 3.1 Collection `candidats` - pattern TODO (*Embedding* ? *Referencing* ?)

```json
TODO : un document d'exemple complet
```

**Justification** (cardinalité bornée ou non, lecture en une requête, fréquence de mise à jour) : TODO

### 3.2 Collection `projets` - pattern TODO

```json
TODO : un document d'exemple complet
```

**Justification** : TODO

### 3.3 Index

| Collection | Index | Requête servie (R#) |
|---|---|---|
| TODO | TODO | TODO |

### 3.4 Pipeline d'agrégation clé (R3)

```javascript
TODO : db.projets.aggregate([ ... ])
```

## 4. Modèle Neo4j

### 4.1 Schéma du graphe

```mermaid
graph LR
    %% TODO : vos nœuds et relations orientées, ex. (Candidat)-[:A_REALISE]->(Projet)-[:UTILISE]->(Competence)-[:APPARTIENT_A]->(Domaine)
    A[TODO] --> B[TODO]
```

| Label | Propriétés | Clé unique |
|---|---|---|
| TODO | TODO | TODO |

| Relation | De → Vers | Propriétés | Pourquoi ce sens |
|---|---|---|---|
| TODO | TODO | TODO | TODO |

### 4.2 Les 3 requêtes Cypher clés

```cypher
// R4 - projets similaires
TODO

// R5 - graphe de compétences d'un candidat
TODO

// Compétences communes aux membres de l'équipe (ou requête de votre choix)
TODO
```

### 4.3 Contraintes

```cypher
TODO : CREATE CONSTRAINT ... IF NOT EXISTS
```

## 5. Cohérence entre les bases (slugs pivots)

| Entité | Slug | Dans MongoDB | Dans Neo4j |
|---|---|---|---|
| Candidat | `candidat_slug` (ex. `alice-martin`) | TODO | TODO |
| Projet | `projet_slug` (ex. `smartcity-explorer`) | TODO | TODO |
| Compétence | `skill_slug` (ex. `mongodb`) | TODO | TODO |

**Suppression d'un projet** : que faites-vous dans chaque base ? TODO

## 6. Répartition du travail

| Membre (pseudo GitHub) | Backend (couches / routes) | Frontend |
|---|---|---|
| TODO | TODO | `frontends/frontend-TODO/` |

## 7. MVP de l'application
MVP :
- Entité 1:Candidat
- Entité 2:Expériences
- Entité 3:Formations
- Entité 4:Projets
- Entité 5:Compétences