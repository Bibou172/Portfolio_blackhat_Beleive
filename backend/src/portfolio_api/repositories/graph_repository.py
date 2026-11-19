"""Repository Neo4j du graphe : R4 (projets similaires), R5 (graphe de compétences)."""

from __future__ import annotations

from portfolio_api.db.neo4j import get_neo4j_driver

REQUETE_R5 = """
MATCH (ca:Candidat)
OPTIONAL MATCH (ca)-[:A_REALISE]->(p:Projet)
OPTIONAL MATCH (p)-[:UTILISE]->(c:Competence)
OPTIONAL MATCH (c)-[:APPARTIENT_A]->(d:Domaine)
RETURN ca {.candidat_slug, .prenom, .nom} AS candidat,
       p  {.projet_slug, .titre, .annee}  AS projet,
       c  {.skill_slug, .nom, .niveau}    AS competence,
       d  {.domaine_slug, .nom}           AS domaine
"""

# R4 - projets partageant au moins une compétence avec le projet donné
REQUETE_R4 = """
MATCH (p:Projet {projet_slug: $projet_slug})-[:UTILISE]->(c:Competence)<-[:UTILISE]-(autre:Projet)
WHERE autre <> p
RETURN autre.projet_slug AS projet_slug,
       autre.titre AS titre,
       collect(c.skill_slug) AS competences_communes,
       count(c) AS nb_communes
ORDER BY nb_communes DESC, projet_slug ASC
LIMIT $limit
"""

REQUETE_PROJET_EXISTE = """
MATCH (p:Projet {projet_slug: $projet_slug})
RETURN count(p) > 0 AS existe
"""


class GraphRepository:
    def __init__(self, driver=None):
        # On peut lui donner un faux driver (tests), sinon il prend le vrai.
        self.driver = driver or get_neo4j_driver()

    async def lignes_graphe_competences(self) -> list[dict]:
        """Renvoie une ligne par chemin candidat → projet → compétence → domaine."""
        async with self.driver.session() as session:
            resultat = await session.run(REQUETE_R5)
            return [ligne.data() async for ligne in resultat]

    async def _lire(self, requete: str, **params) -> list[dict]:
        """Exécute une requête de lecture et renvoie les lignes en dictionnaires."""
        async with self.driver.session() as session:
            resultat = await session.run(requete, **params)
            return [ligne.data() async for ligne in resultat]

    # ── R4 ──
    async def projet_existe(self, projet_slug: str) -> bool:
        lignes = await self._lire(REQUETE_PROJET_EXISTE, projet_slug=projet_slug)
        return bool(lignes and lignes[0].get("existe"))

    async def projets_similaires(self, projet_slug: str, limit: int = 5) -> list[dict]:
        """Projets voisins, triés par nombre de compétences communes décroissant."""
        return await self._lire(REQUETE_R4, projet_slug=projet_slug, limit=limit)