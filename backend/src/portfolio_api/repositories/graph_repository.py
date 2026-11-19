"""Repository Neo4j du graphe de compétences (R5)."""

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


class GraphRepository:
    def __init__(self, driver=None):
        # On peut lui donner un faux driver (tests), sinon il prend le vrai.
        self.driver = driver or get_neo4j_driver()

    async def lignes_graphe_competences(self) -> list[dict]:
        """Renvoie une ligne par chemin candidat → projet → compétence → domaine."""
        async with self.driver.session() as session:
            resultat = await session.run(REQUETE_R5)
            return [ligne.data() async for ligne in resultat]