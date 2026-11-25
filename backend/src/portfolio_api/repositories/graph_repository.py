"""Repository Neo4j du graphe : R4 (projets similaires), R5 (graphe de compétences), R7 (compétences d'un domaine)."""

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

# R4 - projets partageant au moins une compétence avec le projet donné (ARCHITECTURE.md §4.2).
# OPTIONAL MATCH : un projet sans voisin renvoie une ligne (projet_slug null) ;
# un projet inexistant ne renvoie aucune ligne.
REQUETE_R4 = """
MATCH (p:Projet {projet_slug: $projet_slug})
OPTIONAL MATCH (p)-[:UTILISE]->(c:Competence)<-[:UTILISE]-(autre:Projet)
WHERE autre <> p
WITH autre, collect(c.skill_slug) AS competences_communes, count(c) AS nb_communes
RETURN autre.projet_slug AS projet_slug,
       autre.titre AS titre,
       competences_communes,
       nb_communes
ORDER BY nb_communes DESC, projet_slug ASC
LIMIT $limit
"""

# R7 - compétences d'un domaine. OPTIONAL MATCH : un domaine sans compétence renvoie
# une ligne (skill_slug null) ; un domaine inexistant ne renvoie aucune ligne.
REQUETE_R7 = """
MATCH (d:Domaine {domaine_slug: $domaine_slug})
OPTIONAL MATCH (d)<-[:APPARTIENT_A]-(c:Competence)
RETURN d.domaine_slug AS domaine_slug,
       d.nom AS domaine_nom,
       c.skill_slug AS skill_slug,
       c.nom AS nom
ORDER BY toLower(c.nom)
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

    async def projets_similaires(self, projet_slug: str, limit: int = 5) -> list[dict]:
        """R4 : aucune ligne si le projet n'existe pas."""
        return await self._lire(REQUETE_R4, projet_slug=projet_slug, limit=limit)

    async def competences_domaine(self, domaine_slug: str) -> list[dict]:
        """R7 : aucune ligne si le domaine n'existe pas."""
        return await self._lire(REQUETE_R7, domaine_slug=domaine_slug)
