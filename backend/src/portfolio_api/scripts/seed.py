"""Peuple MongoDB et Neo4j avec les VRAIES données de tous les membres (dossier data/).

Exigences (évaluées au Jalon 2) :
- 1 seule commande : `just seed`
- idempotent : relancer le seed ne crée pas de doublons
- reproductible sur une machine neuve après `just up`
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from pymongo import ASCENDING, DESCENDING

from portfolio_api.db.mongo import close_mongo, get_mongo_db
from portfolio_api.db.neo4j import close_neo4j, get_neo4j_driver

DATA_DIR = Path(__file__).resolve().parents[4] / "data"


def load_member_files(kind: str) -> list[dict]:
    """Charge data/<kind>/*.json (hors fichiers commençant par '_', ex. _exemple.json)."""
    docs: list[dict] = []
    for path in sorted((DATA_DIR / kind).glob("*.json")):
        if path.name.startswith("_"):
            continue
        content = json.loads(path.read_text(encoding="utf-8"))
        docs.extend(content if isinstance(content, list) else [content])
    return docs


def normalize_projets(projets: list[dict]) -> list[dict]:
    """Accepte le format de data/projets/_exemple.json (`candidat_slugs`, une liste)
    et le ramène au modèle d'ARCHITECTURE.md §3.2 (`candidat_slug`, un seul candidat).
    """
    normalises = []
    for p in projets:
        p = dict(p)
        slugs = p.pop("candidat_slugs", None) or []
        if not p.get("candidat_slug") and slugs:
            p["candidat_slug"] = slugs[0]
        normalises.append(p)
    return normalises


async def seed_mongo(candidats: list[dict], projets: list[dict]) -> None:
    """Vide puis remplit `candidats` et `projets` (ARCHITECTURE.md §3), puis crée les index (§3.3)."""
    db = get_mongo_db()

    # 1. Vider : relancer le seed donne toujours le même résultat (idempotent)
    await db.candidats.delete_many({})
    await db.projets.delete_many({})

    # 2. Insérer (copies : insert_many ajoute un _id dans les dicts qu'on lui passe)
    if candidats:
        await db.candidats.insert_many([dict(c) for c in candidats])
    if projets:
        await db.projets.insert_many([dict(p) for p in projets])

    # 3. Index (create_index ne fait rien si l'index existe déjà)
    await db.candidats.create_index([("candidat_slug", ASCENDING)], unique=True)
    await db.candidats.create_index([("experiences.lieu", ASCENDING)])
    await db.projets.create_index([("projet_slug", ASCENDING)], unique=True)
    await db.projets.create_index([("candidat_slug", ASCENDING), ("annee", DESCENDING)])
    await db.projets.create_index([("competences", ASCENDING)])

    print(f"[seed] MongoDB : {len(candidats)} candidat(s), {len(projets)} projet(s), index OK")


CONTRAINTES = [
    "CREATE CONSTRAINT candidat_slug IF NOT EXISTS FOR (c:Candidat) REQUIRE c.candidat_slug IS UNIQUE",
    "CREATE CONSTRAINT projet_slug IF NOT EXISTS FOR (p:Projet) REQUIRE p.projet_slug IS UNIQUE",
    "CREATE CONSTRAINT skill_slug IF NOT EXISTS FOR (s:Competence) REQUIRE s.skill_slug IS UNIQUE",
    "CREATE CONSTRAINT domaine_slug IF NOT EXISTS FOR (d:Domaine) REQUIRE d.domaine_slug IS UNIQUE",
]


async def seed_neo4j(candidats: list[dict], projets: list[dict]) -> None:
    """Crée le graphe Candidat -> Projet -> Competence -> Domaine (ARCHITECTURE.md §4)."""
    # Compétences déclarées dans le profil (nom, niveau, domaine)
    competences = [
        {
            "skill_slug": s["skill_slug"],
            "nom": s.get("nom", s["skill_slug"]),
            "niveau": s.get("niveau"),
            "domaine": s.get("domaine"),
            "domaine_nom": s["domaine"].replace("-", " ").capitalize() if s.get("domaine") else None,
        }
        for c in candidats
        for s in c.get("competences", [])
    ]

    async with get_neo4j_driver().session() as session:
        # 1. Contraintes d'unicité (§4.3) — IF NOT EXISTS : idempotent
        for requete in CONTRAINTES:
            await session.run(requete)

        # 2. Vider le graphe du portfolio (idempotent, pas de nœuds orphelins)
        await session.run(
            "MATCH (n) WHERE n:Candidat OR n:Projet OR n:Competence OR n:Domaine DETACH DELETE n"
        )

        # 3. Candidat
        await session.run(
            """
            UNWIND $rows AS row
            MERGE (c:Candidat {candidat_slug: row.candidat_slug})
            SET c.prenom = row.prenom, c.nom = row.nom
            """,
            rows=[{k: c.get(k) for k in ("candidat_slug", "prenom", "nom")} for c in candidats],
        )

        # 4. Compétences + Domaines : (Competence)-[:APPARTIENT_A]->(Domaine)
        await session.run(
            """
            UNWIND $rows AS row
            MERGE (s:Competence {skill_slug: row.skill_slug})
            SET s.nom = row.nom, s.niveau = row.niveau
            WITH s, row WHERE row.domaine IS NOT NULL
            MERGE (d:Domaine {domaine_slug: row.domaine})
            SET d.nom = row.domaine_nom
            MERGE (s)-[:APPARTIENT_A]->(d)
            """,
            rows=competences,
        )

        # 5. Projets : (Candidat)-[:A_REALISE]->(Projet)-[:UTILISE]->(Competence)
        #    Une compétence utilisée par un projet mais absente du profil est créée avec son slug comme nom.
        await session.run(
            """
            UNWIND $rows AS row
            MERGE (p:Projet {projet_slug: row.projet_slug})
            SET p.titre = row.titre, p.annee = row.annee
            WITH p, row
            OPTIONAL MATCH (c:Candidat {candidat_slug: row.candidat_slug})
            FOREACH (_ IN CASE WHEN c IS NULL THEN [] ELSE [1] END | MERGE (c)-[:A_REALISE]->(p))
            WITH p, row
            UNWIND row.competences AS skill
            MERGE (s:Competence {skill_slug: skill})
            ON CREATE SET s.nom = skill
            MERGE (p)-[:UTILISE]->(s)
            """,
            rows=[
                {
                    "projet_slug": p["projet_slug"],
                    "candidat_slug": p.get("candidat_slug"),
                    "titre": p.get("titre"),
                    "annee": p.get("annee"),
                    "competences": p.get("competences", []),
                }
                for p in projets
            ],
        )

    print(f"[seed] Neo4j : {len(candidats)} candidat(s), {len(projets)} projet(s), {len(competences)} compétence(s)")


async def main() -> None:
    candidats = load_member_files("candidats")
    projets = normalize_projets(load_member_files("projets"))
    print(f"[seed] {len(candidats)} candidat(s), {len(projets)} projet(s) trouvés dans {DATA_DIR}")
    try:
        await seed_mongo(candidats, projets)
        await seed_neo4j(candidats, projets)
    finally:
        await close_mongo()
        await close_neo4j()
    print("[seed] OK")


if __name__ == "__main__":
    asyncio.run(main())
