# Frontend de @nicktoudonou-spec

- **Technologie** : HTML + CSS + JavaScript (modules ES, sans framework ni dépendance, rien à installer). Les décors (ville à l'heure dorée, rue néon, monolithe, champ ivoire) sont dessinés en code sur des `<canvas>` (`js/scenes.js`) : aucune image de jeu vidéo n'est utilisée. Le graphe Neo4j est dessiné par une petite simulation de forces écrite à la main (`js/graph.js`). Polices auto-hébergées dans `assets/fonts/` (Archivo, Instrument Serif, IBM Plex Mono, licence OFL).
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
index.html            squelette (en-tête, menu, rail, transition, zone #app)
css/tokens.css        couleurs des "mondes", polices, grille : l'identité en un seul endroit
css/base.css          reset, typo, grille, apparitions
css/components.css    boutons biseautés, puces, panneaux HUD, en-tête, rail, menu, transition
css/sections.css      une partie par section + responsive
js/scenes.js          décors cinématographiques dessinés en code + calques animés (trafic, pluie)
js/chrome.js          en-tête, menu, barre de progression, rail, couleur d'accent par section
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

## Ambiances

| Section | Monde | Couleur |
|---|---|---|
| 00 Hero | ville à l'heure dorée, graphe en constellation, parallaxe | ambre |
| 01 Work | un monde par projet (doré, néon, monolithe, ivoire), scènes empilées | celle du projet |
| 02 About | ivoire, courbes de niveau | orange brûlé |
| 03 Expertise | monolithe : colonnes = nombre réel de projets | rouge |
| 04 Experience | journal de bord néon | cyan / magenta |
| 05 Map | graphe Neo4j interactif | vert signal |
| 06 Contact | rouge, plaques inclinées | rouge / noir |

## Mettre de vraies photos

Dépose `assets/hero.jpg` (une ville au coucher du soleil, à toi ou libre de droits, ex. Unsplash) et `assets/portrait.jpg`. Pour un projet, renseigne le champ `image` dans son JSON. Si un fichier manque, le décor dessiné reste affiché.
