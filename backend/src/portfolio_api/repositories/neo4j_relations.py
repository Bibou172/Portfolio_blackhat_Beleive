"""Repository Neo4j : écriture des nœuds et relations du graphe, et contrôles de cohérence.

Règle de l'équipe : un repository ne parle qu'à UNE base et renvoie des dict (lignes brutes) ;
le service (services/relations_service.py) les interprète.

Schéma (ARCHITECTURE.md §4.1) :
    (Candidat)-[:A_REALISE]->(Projet)-[:UTILISE]->(Competence)-[:APPARTIENT_A]->(Domaine)

Toutes les écritures utilisent MERGE sur les slugs pivots : relancer une écriture ne crée
jamais de doublon (seed idempotent, synchronisation rejouable).
"""

from __future__ import annotations

from portfolio_api.db.neo4j import get_neo4j_driver

# ───────────────────────── Écritures ─────────────────────────

MERGE_CANDIDAT = """
MERGE (ca:Candidat {candidat_slug: $candidat_slug})
SET ca.prenom = $prenom, ca.nom = $nom
RETURN ca.candidat_slug AS candidat_slug
"""

# Une compétence appartient à un seul domaine : on retire un éventuel ancien lien APPARTIENT_A.
MERGE_COMPETENCE = """
MERGE (s:Competence {skill_slug: $skill_slug})
SET s.nom = $nom, s.niveau = $niveau
MERGE (d:Domaine {domaine_slug: $domaine_slug})
SET d.nom = coalesce($domaine_nom, d.nom, $domaine_slug)
WITH s, d
OPTIONAL MATCH (s)-[ancien:APPARTIENT_A]->(autre:Domaine)
WHERE autre <> d
DELETE ancien
WITH DISTINCT s, d
MERGE (s)-[:APPARTIENT_A]->(d)
RETURN s.skill_slug AS skill_slug, d.domaine_slug AS domaine_slug
"""

# Projet + A_REALISE depuis le candidat + UTILISE vers ses compétences (liste remplacée entièrement).
# Ne renvoie aucune ligne si le candidat n'existe pas : rien n'est alors créé.
MERGE_PROJET = """
MATCH (ca:Candidat {candidat_slug: $candidat_slug})
MERGE (p:Projet {projet_slug: $projet_slug})
SET p.titre = $titre, p.annee = $annee
MERGE (ca)-[:A_REALISE]->(p)
WITH p
OPTIONAL MATCH (p)-[u:UTILISE]->(old:Competence)
WHERE NOT old.skill_slug IN $competences
DELETE u
WITH DISTINCT p
OPTIONAL MATCH (s:Competence)
WHERE s.skill_slug IN $competences
FOREACH (x IN CASE WHEN s IS NULL THEN [] ELSE [s] END | MERGE (p)-[:UTILISE]->(x))
RETURN p.projet_slug AS projet_slug, count(s) AS nb_utilise
"""

COMPETENCES_CONNUES = """
MATCH (s:Competence)
WHERE s.skill_slug IN $slugs
RETURN collect(s.skill_slug) AS connues
"""

# Suppression (ARCHITECTURE.md §5) : le projet et ses relations ; Competence et Domaine sont conservés.
SUPPRIMER_PROJET = """
MATCH (p:Projet {projet_slug: $projet_slug})
DETACH DELETE p
RETURN count(*) AS supprimes
"""

# ───────────────────────── Cohérence (lecture seule) ─────────────────────────

COMPTES = """
MATCH (n)
WHERE n:Candidat OR n:Projet OR n:Competence OR n:Domaine
RETURN labels(n)[0] AS label, count(*) AS nb
"""

SLUGS_PROJETS = """
MATCH (p:Projet)
RETURN collect(p.projet_slug) AS slugs
"""

# Chaque contrôle renvoie une seule ligne avec la clé « valeur » : liste de slugs ou nombre.
CONTROLES = {
    "projets_sans_candidat": """
        MATCH (p:Projet) WHERE NOT (:Candidat)-[:A_REALISE]->(p)
        RETURN collect(p.projet_slug) AS valeur""",
    "projets_sans_competence": """
        MATCH (p:Projet) WHERE NOT (p)-[:UTILISE]->(:Competence)
        RETURN collect(p.projet_slug) AS valeur""",
    "competences_sans_domaine": """
        MATCH (s:Competence) WHERE NOT (s)-[:APPARTIENT_A]->(:Domaine)
        RETURN collect(s.skill_slug) AS valeur""",
    "competences_multi_domaines": """
        MATCH (s:Competence)-[:APPARTIENT_A]->(d:Domaine)
        WITH s, count(d) AS n WHERE n > 1
        RETURN collect(s.skill_slug) AS valeur""",
    "noeuds_sans_slug": """
        MATCH (n)
        WHERE (n:Candidat AND n.candidat_slug IS NULL) OR (n:Projet AND n.projet_slug IS NULL)
           OR (n:Competence AND n.skill_slug IS NULL) OR (n:Domaine AND n.domaine_slug IS NULL)
        RETURN count(n) AS valeur""",
    "relations_mal_orientees": """
        MATCH (a)-[r:A_REALISE|UTILISE|APPARTIENT_A]->(b)
        WHERE (type(r) = 'A_REALISE' AND NOT (a:Candidat AND b:Projet))
           OR (type(r) = 'UTILISE' AND NOT (a:Projet AND b:Competence))
           OR (type(r) = 'APPARTIENT_A' AND NOT (a:Competence AND b:Domaine))
        RETURN count(r) AS valeur""",
    # Sans contrainte d'unicité, un même slug pourrait apparaître sur plusieurs nœuds.
    "slugs_en_double": """
        CALL {
            MATCH (n:Candidat) WITH n.candidat_slug AS slug, count(*) AS c WHERE c > 1 RETURN 'Candidat:' + slug AS doublon
            UNION ALL
            MATCH (n:Projet) WITH n.projet_slug AS slug, count(*) AS c WHERE c > 1 RETURN 'Projet:' + slug AS doublon
            UNION ALL
            MATCH (n:Competence) WITH n.skill_slug AS slug, count(*) AS c WHERE c > 1 RETURN 'Competence:' + slug AS doublon
            UNION ALL
            MATCH (n:Domaine) WITH n.domaine_slug AS slug, count(*) AS c WHERE c > 1 RETURN 'Domaine:' + slug AS doublon
        }
        RETURN collect(doublon) AS valeur""",
}


class Neo4jRelationsRepository:
    def __init__(self, driver=None):
        # On peut lui donner un faux driver (tests), sinon il prend le vrai.
        self.driver = driver or get_neo4j_driver()

    async def _executer(self, requete: str, **params) -> list[dict]:
        async with self.driver.session() as session:
            resultat = await session.run(requete, **params)
            return [ligne.data() async for ligne in resultat]

    # ── Écritures ──
    async def merge_candidat(self, candidat_slug: str, prenom: str, nom: str) -> list[dict]:
        return await self._executer(MERGE_CANDIDAT, candidat_slug=candidat_slug, prenom=prenom, nom=nom)

    async def merge_competence(
        self, skill_slug: str, nom: str, domaine_slug: str, niveau: int | None = None, domaine_nom: str | None = None
    ) -> list[dict]:
        return await self._executer(
            MERGE_COMPETENCE, skill_slug=skill_slug, nom=nom, niveau=niveau, domaine_slug=domaine_slug, domaine_nom=domaine_nom
        )

    async def merge_projet(
        self, candidat_slug: str, projet_slug: str, titre: str, annee: int | None, competences: list[str]
    ) -> list[dict]:
        """Aucune ligne si le candidat n'existe pas (rien n'est alors créé)."""
        return await self._executer(
            MERGE_PROJET, candidat_slug=candidat_slug, projet_slug=projet_slug, titre=titre, annee=annee, competences=competences
        )

    async def competences_connues(self, slugs: list[str]) -> list[dict]:
        return await self._executer(COMPETENCES_CONNUES, slugs=slugs)

    async def supprimer_projet(self, projet_slug: str) -> list[dict]:
        return await self._executer(SUPPRIMER_PROJET, projet_slug=projet_slug)

    # ── Cohérence (lecture seule) ──
    async def comptes(self) -> list[dict]:
        return await self._executer(COMPTES)

    async def slugs_projets(self) -> list[dict]:
        return await self._executer(SLUGS_PROJETS)

    async def controle(self, nom: str) -> list[dict]:
        return await self._executer(CONTROLES[nom])
