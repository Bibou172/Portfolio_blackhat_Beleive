from __future__ import annotations

import os

from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase
from portfolio_api.db.mongo import get_mongo_db

from portfolio_api.models.candidat import CandidatOut, ExperienceOut


class CandidatRepository:
    def __init__(self, db: AsyncDatabase) -> None:
        self.collection = db["candidats"]

    async def ensure_indexes(self) -> None:
        """Crée et contrôle les index nécessaires pour R1 et R8."""
        await self.collection.create_index("candidat_slug", unique=True)
        await self.collection.create_index("experiences.lieu")

    async def get_by_slug(self, candidat_slug: str | None = None) -> CandidatOut | None:
        """R1 : Récupère le profil complet du candidat.

        Un backend = un candidat (API_ROUTES.md) : sans slug, on prend CANDIDAT_SLUG
        s'il est défini, sinon l'unique candidat de la base (comme MongoStatsRepository).
        """
        slug = candidat_slug or os.getenv("CANDIDAT_SLUG") or None
        doc = await self.collection.find_one(
            {"candidat_slug": slug} if slug else {},
            {"_id": 0},
        )
        if not doc:
            return None
        return CandidatOut.model_validate(doc)

    async def get_experiences(
        self,
        candidat_slug: str | None = None,
        lieu: str | None = None,
    ) -> list[ExperienceOut] | None:
        """R8 : Récupère les expériences du candidat, filtrées par lieu si fourni.

        Retourne None si le candidat n'existe pas, ou une liste (éventuellement vide)
        d'expériences correspondantes.
        """
        candidat = await self.get_by_slug(candidat_slug)
        if not candidat:
            return None

        if not lieu:
            return candidat.experiences

        lieu_normalise = lieu.strip().lower()
        return [
            exp
            for exp in candidat.experiences
            if exp.lieu.strip().lower() == lieu_normalise
        ]
def get_candidat_repo(db: AsyncDatabase = Depends(get_mongo_db)) -> CandidatRepository:
    """Dépendance FastAPI pour obtenir le repository de candidats."""
    return CandidatRepository(db)