from __future__ import annotations

from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase
from portfolio_api.db.mongo import get_mongo_db

from portfolio_api.models.projet import ProjetOut


class ProjetRepository:
    def __init__(self, db: AsyncDatabase) -> None:
        self.collection = db["projets"]

    async def ensure_indexes(self) -> None:
        """Crée et contrôle les index nécessaires pour R2 (et R3/R6)."""
        await self.collection.create_index("projet_slug", unique=True)
        await self.collection.create_index([("candidat_slug", 1), ("annee", -1)])
        await self.collection.create_index("competences")

    async def list_projets(
        self,
        candidat_slug: str,
        competence: str | None = None,
    ) -> list[ProjetOut]:
        """R2 : Liste les projets d'un candidat triés par année décroissante,
        filtrables par skill_slug.
        """
        query: dict = {"candidat_slug": candidat_slug}
        if competence:
            query["competences"] = competence.strip().lower()

        cursor = self.collection.find(query, {"_id": 0}).sort("annee", -1)
        docs = await cursor.to_list(length=None)
        return [ProjetOut.model_validate(doc) for doc in docs]

    async def get_by_slug(self, projet_slug: str) -> ProjetOut | None:
        """R2 (détail) : Récupère un projet précis par son slug."""
        doc = await self.collection.find_one(
            {"projet_slug": projet_slug},
            {"_id": 0},
        )
        if not doc:
            return None
        return ProjetOut.model_validate(doc)
def get_projet_repo(db: AsyncDatabase = Depends(get_mongo_db)) -> ProjetRepository:
    """Dépendance FastAPI pour obtenir le repository de projets."""
    return ProjetRepository(db)