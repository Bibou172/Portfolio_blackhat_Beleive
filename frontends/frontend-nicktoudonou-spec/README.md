# Frontend de @nicktoudonou-spec

- **Technologie** : HTML + CSS + JavaScript (modules ES, sans framework ni dépendance). Le graphe Neo4j est dessiné sur un `<canvas>` par une petite simulation de forces écrite à la main (`js/graph.js`).
- **Lancer** :
  1. Backend, à la racine du projet : `just dev` (API sur http://localhost:8000)
  2. Frontend, dans un 2e terminal :
     ```bash
     cd frontends/frontend-nicktoudonou-spec
     python -m http.server 5173
     ```
  3. Ouvrir http://localhost:5173 (page d'ajout de données : http://localhost:5173/#/admin)
- **Routes de `API_ROUTES.md` consommées** : 1 (profil), 2 et 3 (projets, détail), 4 (expériences par lieu), 5 (statistiques), 6 (projets similaires), 7 (graphe de compétences), 9 à 12 (page Admin).

## Organisation

```
index.html            squelette (en-tête, menu, zone #app)
css/tokens.css        couleurs, polices, grille : l'identité en un seul endroit
css/base.css          reset, typo, boutons, puces, apparitions
css/sections.css      une partie par section + responsive
js/config.js          TOUT ce qui se personnalise (slug, textes, images, CV)
js/api.js             le seul fichier qui parle au réseau
js/data.js            une fonction par route + mise en cache + calculs de secours
js/router.js          #/ , #/work ... , #/projet/<slug> , #/admin
js/graph.js           graphe animé (hero) et interactif (Map)
js/sections/*.js      hero, work, about, expertise, experience, map, contact
js/pages/*.js         accueil, étude de cas d'un projet, admin
assets/               images et CV (à ajouter)
```

## Robustesse

Chaque section charge ses propres données : si une route tombe, seule sa section affiche un message d'erreur clair. Si `/api/stats/competences` renvoie une liste vide, les statistiques sont recalculées à partir des projets. Si Neo4j ne répond pas, le hero affiche un graphe construit depuis le profil MongoDB.
