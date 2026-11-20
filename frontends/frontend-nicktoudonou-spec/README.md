
# Frontend de @nicktoudonou-spec

- **Technologie** : HTML + CSS + JavaScript (sans framework). Graphe de compétences affiché avec la bibliothèque vis-network.
- **Lancer** :

  1. Backend, à la racine du projet : `just dev` (API sur http://localhost:8000)
  2. Frontend, dans un 2e terminal :
     cd frontends/frontend-nicktoudonou-spec
     python -m http.server 5173

  3. Ouvrir http://localhost:5173
- **Routes de `API_ROUTES.md` consommées** : 1 (profil), 2 et 3 (projets), 4 (expériences), 5 (statistiques), 6 (projets similaires), 7 (graphe), 8 (compétences d'un domaine), 9 à 12 (page Admin).