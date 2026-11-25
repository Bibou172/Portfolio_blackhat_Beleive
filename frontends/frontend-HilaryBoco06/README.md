# Frontend de @HilaryBoco06

Portfolio « carnet de voyage numérique » : le parcours professionnel raconté comme un voyage, avec une identité Ocean Blue (bleu océan, marine, lagon, turquoise, ciel, écume, sable) et des illustrations 2D originales, pensé pour qu'un recruteur comprenne en quelques secondes qui je suis, ce que je sais faire et comment me contacter.

- **Technologie** : React 18 + TypeScript + Vite 5 + Tailwind CSS 3 (stack de type Lovable), `react-router-dom` (routes), `d3-force` (graphe de compétences), `lucide-react` (icônes), `three` (île 3D de l'accueil).
- **Prompt de conception** : [`LOVABLE_PROMPT.md`](./LOVABLE_PROMPT.md).

## Accueil : île 3D interactive

L'accueil est une île low-poly en 3D (Three.js, construite en code, sans modèle externe). Cliquer sur un objet déplace la caméra vers lui et ouvre un panneau :

| Objet | Panneau |
|---|---|
| Phare | Parcours |
| Voilier | Projets |
| Malle d'exploratrice | Compétences |
| Carte sur chevalet | À propos |
| Montgolfière | Graphe de compétences |
| Bouteille à la mer | Contact |

La barre « Explorer » en bas de l'écran ouvre les mêmes panneaux au clavier et pour les lecteurs d'écran. La scène est chargée à part (≈ 140 ko gzip) et se met en pause hors écran. Sans WebGL, ou si le visiteur préfère réduire les animations, l'illustration SVG la remplace. « Commencer le voyage » mène directement au **Parcours**, première section de la page.

## Lancer

Prérequis : Node.js ≥ 18.

```bash
cd frontends/frontend-HilaryBoco06
npm install
npm run dev          # http://localhost:5173
```

Production : `npm run build` puis `npm run preview` (même port).

En développement, l'API d'équipe est attendue sur `http://localhost:8000` (`just up && just seed && just dev`). Autre adresse : copier `.env.example` en `.env.local` et renseigner `VITE_API_URL`.
Le port **5173** fait déjà partie de `CORS_ORIGINS` dans le `.env` du dépôt : aucune modification CORS n'est nécessaire.

## Déploiement (Vercel)

Le déploiement se fait **depuis le poste qui possède `data/`**, car ce dossier est ignoré par Git. Ne pas brancher le déploiement automatique GitHub : le build n'aurait ni le téléphone, ni l'adresse personnelle, ni les points forts.

1. `npx vercel login`, puis `npx vercel link` dans ce dossier.
2. Variable `VITE_API_URL` (production) = URL HTTPS de l'API d'équipe (sans `/` final). Le reste est dans [`vercel.json`](./vercel.json) : build Vite, réécriture SPA (`/projets/:slug` fonctionne en accès direct), cache longue durée, cron quotidien.
3. `npx vercel pull --environment=production`, `npx vercel build --prod`, puis `npx vercel deploy --prebuilt --prod` : le build est local, les fichiers JSON bruts ne sont pas envoyés.
4. Côté backend (projet Vercel de l'API) : ajouter l'URL du frontend dans `CORS_ORIGINS`, sinon le navigateur bloque les appels.

Sans `VITE_API_URL`, ou si l'API est injoignable, le site reste complet grâce aux fichiers `data/` (si `/api/health` ne répond pas, toute la session bascule sur `data/`, sans attente répétée).

`api/reveil.js` est appelée chaque jour par le cron Vercel : elle lit le graphe via l'API pour limiter la mise en pause de Neo4j Aura Free (72 h d'inactivité). Contournement non officiel, sans garantie.

## Données

Aucun contenu professionnel n'est écrit en dur dans le frontend.

1. **Source principale : l'API d'équipe** (contrat `API_ROUTES.md`).
2. **Repli : `data/candidats/HilaryBoco06.json` et `data/projets/HilaryBoco06.json`**, lus en lecture seule (la même source que le seed). Ils sont utilisés quand l'API est injoignable ou qu'une route n'est pas encore implémentée. Les calculs de repli reprennent ceux d'`ARCHITECTURE.md` (§3.4 pour R3/R6, §4.2 pour R4/R5/R7).

Une section sans données est masquée. En développement, un badge en bas à gauche indique la source utilisée (API, `data/` ou aucune).

Champs **facultatifs** reconnus en plus du contrat (affichés seulement s'ils existent) :
- profil : `telephone`, `email_personnel`, `recherche` (ex. « Recherche une alternance… »), `points_forts` (liste) ;
- projet : `contexte`, `probleme`, `role`, `fonctionnalites` (liste), `decisions` (liste), `images` (URLs), `metriques` (objet).

**CV et photo** : déposez `public/cv.pdf` et `public/images/photo.jpg` (dossier à créer). Le bouton « Télécharger mon CV » et la photo apparaissent alors automatiquement.

## Routes de `API_ROUTES.md` consommées

| Page / section | Route(s) |
|---|---|
| Accueil (hero), À propos, navigation, pied de page | `GET /api/profil` (R1) |
| Compétences : cartes par domaine, « les plus utilisées » | `GET /api/profil`, `GET /api/stats/competences` (R3 + R6) |
| Compétences : filtre par domaine | `GET /api/graph/domaines/{domaine_slug}/competences` (R7) |
| Projets : galerie + filtre par compétence | `GET /api/projets?competence=…&page=1&size=100` (R2) |
| Détail d'un projet `/projets/:slug` | `GET /api/projets/{projet_slug}` |
| Détail d'un projet : projets similaires | `GET /api/graph/projets/{projet_slug}/similaires?limit=5` (R4) |
| Parcours (timeline) + filtre par ville | `GET /api/profil`, `GET /api/experiences?lieu=…` (R8) |
| Graphe de compétences | `GET /api/graph/competences` (R5) |

Le formulaire de contact n'envoie rien lui-même : l'API ne contient pas de route de contact. Il prépare le message et l'ouvre dans la messagerie du visiteur (`mailto:`).

## Structure

```text
src/
├── lib/          # types (contrat API), client HTTP, repli data/, hooks, mise en forme
├── components/   # Navbar, Footer, cartes projet, graphe SVG, en-têtes de section
├── sections/     # Hero, À propos, Compétences, Projets, Parcours, Points forts, Graphe, Contact
├── pages/        # Accueil, détail projet, 404
├── scene/        # île 3D : objets, construction Three.js, composant React
└── panels/       # contenus des panneaux ouverts depuis l'île
public/illustrations/  # illustrations SVG originales (océan de nuit, carte de voyage, lagon, phare)
```
