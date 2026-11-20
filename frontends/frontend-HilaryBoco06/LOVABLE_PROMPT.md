# Prompt Lovable — Portfolio « carnet de route »

> **Transparence** : aucune connexion à Lovable n'était disponible au moment de la réalisation. L'interface de ce dossier a été codée à la main avec la stack que génère Lovable (React + TypeScript + Vite + Tailwind), à partir du prompt ci-dessous.
> Pour l'utiliser : collez-le sur lovable.dev. Pour réintégrer le résultat, copiez les composants visuels dans `src/sections/` et `src/components/`, en gardant la couche de données `src/lib/` (API d'équipe + repli `data/`).

---

Crée un portfolio professionnel one-page, plus une page de détail par projet, pour un·e élève-ingénieur·e en informatique / data. Son objectif : **décrocher un emploi ou une alternance**. C'est un outil de recrutement, pas une vitrine décorative : un recruteur doit comprendre en 5 secondes qui est la personne, ce qu'elle sait faire, ce qu'elle a construit et comment la contacter.

## Direction artistique : « le voyage comme métaphore du parcours »
- Ambiance : carnet de route premium, minimaliste, immersif. Le visiteur doit comprendre immédiatement qu'il s'agit d'un profil tech.
- Palette Ocean Blue : bleu océan profond `#063B5C`, bleu marine `#082C46`, bleu lagon `#18A7B5`, turquoise `#55C9D0`, bleu ciel `#A9DDEB`, blanc écume `#F4FAFC`, beige sable `#F1E6D2`. Dégradés subtils océan → turquoise.
- Typographies : **Fraunces** (titres, avec un mot en italique coloré dans chaque titre), **Inter** (texte), **JetBrains Mono** (petits surtitres en capitales espacées).
- Motifs : lignes topographiques en fond, pointillés « itinéraire », boussole dans le logo, sections numérotées « Étape 01 · À propos ».
- Illustrations 2D modernes « carnet de voyage », style premium légèrement ludique (pas enfantin), contours doux : océan de nuit avec île tropicale, voilier et avion ; carte de voyage illustrée avec itinéraire en pointillés et rose des vents ; lagon de jour ; phare. Petits motifs : avion en papier, voilier, boussole.
- Micro-interactions : apparition douce au scroll, cartes qui se soulèvent au survol, flèches qui glissent. Respecter `prefers-reduced-motion`.

## Sections (dans cet ordre)
1. **Hero** plein écran sur photo de montagnes : prénom + nom (le nom de famille en italique sable), titre professionnel, bio courte, badge « recherche » animé (ex. alternance). Boutons « Découvrir mes projets » (terracotta), « Télécharger mon CV » (affiché seulement si le PDF existe), « Me contacter » (contour). Icônes LinkedIn et GitHub. À droite, un portrait rond entouré d'un anneau pointillé « boussole » (monogramme si pas de photo). Indicateur « Commencer le voyage ».
2. **Étape 01 — À propos** : bio, phrase d'objectif mise en avant, 4 cartes repères (dernière formation, dernière expérience, nombre de compétences et domaines, villes). Photo « carte de voyage » avec une citation.
3. **Étape 02 — Compétences** (« Mon équipement de voyage ») : ligne « les plus utilisées » (top 5 avec compteur de projets), filtres par domaine (Frontend, Backend, Langages, Bases de données, Outils, Méthodes…), cartes par domaine avec niveau 1–5 affiché en 5 segments et « utilisée dans N projets ».
4. **Étape 03 — Projets** (« Les destinations explorées ») : filtres par technologie, cartes façon **carte d'embarquement** (bandeau « Vol 01 · code 3 lettres », titre, contexte, description, technologies, talon perforé avec l'année et « Lire l'étude de cas »).
5. **Étape 04 — Parcours** sur fond bleu nuit : timeline verticale en pointillés (en alternance gauche/droite sur desktop) qui mêle expériences et formations, avec filtre par ville.
6. **Étape 05 — Points forts** : 4 chiffres clés (projets, compétences, domaines, expériences) et liste de points forts.
7. **Étape 06 — Graphe de compétences** sur fond nuit : graphe force-directed Candidat → Projets → Compétences → Domaines. Survoler un nœud met ses liens en évidence ; cliquer sur un projet ouvre son étude de cas. Légende des couleurs.
8. **Étape 07 — Contact** sur photo de lac voilée : accroche « Et si la prochaine étape se faisait ensemble ? », email avec bouton copier, LinkedIn, GitHub, formulaire (nom, entreprise, message) qui ouvre la messagerie du visiteur avec le message prérempli. Ne jamais simuler un envoi.
9. **Footer** bleu nuit : nom, titre, plan du site « Itinéraire », liens, « Retour au départ ».

**Page projet `/projets/:slug`** (étude de cas) : bandeau photo sombre avec titre, contexte, année, boutons code / démo. Colonne principale : Objectif, Le problème, Mon rôle, Fonctionnalités principales, Décisions techniques, captures. Colonne latérale collante : stack technique avec domaines, métriques, bloc « Projets similaires » (compétences en commun).

## Contraintes
- Responsive mobile-first (menu plein écran sur mobile), accessible (contrastes, focus visibles, aria-labels, lien d'évitement), rapide (images en lazy loading, pas de bibliothèque d'animation lourde).
- Toutes les données viennent d'une API REST (`/api/profil`, `/api/projets`, `/api/stats/competences`, `/api/experiences`, `/api/graph/competences`, `/api/graph/projets/{slug}/similaires`, `/api/graph/domaines/{slug}/competences`). **Aucune donnée inventée** : une section sans données est masquée.
- Langue : français.
