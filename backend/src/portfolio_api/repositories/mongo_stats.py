"""Repository MongoDB : agrégation sur les compétences (R3 et R6).

Règle de l'équipe : un repository ne parle qu'à UNE base et renvoie des dict.
"""

from typing import Any

from pymongo.asynchronous.database import AsyncDatabase


def build_competences_pipeline(
    candidat_slug: str, limit: int | None = None
) -> list[dict[str, Any]]:
    """Construit le pipeline d'agrégation (ARCHITECTURE.md §3.4).

    R3 : limit=None  -> statistiques de toutes les compétences.
    R6 : limit=N     -> seulement les N premières (top N).
    """
    pipeline: list[dict[str, Any]] = [
        {"$match": {"candidat_slug": candidat_slug}},
        {"$unwind": "$competences"},
        {
            "$group": {
                "_id": "$competences",
                "nb_projets": {"$sum": 1},
                "derniere_annee": {"$max": "$annee"},
            }
        },
        {"$sort": {"nb_projets": -1, "_id": 1}},
    ]
    if limit is not None:
        pipeline.append({"$limit": limit})
    pipeline.append(
        {
            "$project": {
                "_id": 0,
                "competence": "$_id",
                "nb_projets": 1,
                "derniere_annee": 1,
            }
        }
    )
    return pipeline


class MongoStatsRepository:
    def __init__(self, db: AsyncDatabase):
        self._projets = db["projets"]
        self._candidats = db["candidats"]

    async def get_candidat(self, candidat_slug: str | None = None) -> dict[str, Any] | None:
        """Renvoie le slug et les compétences du candidat.

        Un backend = un candidat : sans slug précisé, on prend le premier trouvé.
        """
        query = {"candidat_slug": candidat_slug} if candidat_slug else {}
        return await self._candidats.find_one(
            query, {"_id": 0, "candidat_slug": 1, "competences": 1}
        )

    async def stats_competences(
        self, candidat_slug: str, limit: int | None = None
    ) -> list[dict[str, Any]]:
        """R3 (limit=None) ou R6 (limit=N) : agrégation sur la collection projets."""
        cursor = await self._projets.aggregate(build_competences_pipeline(candidat_slug, limit))
        return await cursor.to_list()