"""Service : statistiques de compétences et top N (R3 + R6)."""

import os
from typing import Any

from portfolio_api.repositories.mongo_stats import MongoStatsRepository


class CandidatIntrouvable(Exception):
    """Aucun candidat dans la base (le seed n'a pas été lancé)."""


class StatsService:
    def __init__(self, repository: MongoStatsRepository):
        self._repo = repository

    async def stats_competences(self, limit: int | None = None) -> dict[str, Any]:
        """R3 (sans limit) ou R6 (avec limit) : stats par compétence.

        Le tri et le $limit sont faits par MongoDB. Le service ajoute nom,
        domaine et niveau, lus dans le document `candidats` (pas de $lookup).
        """
        # CANDIDAT_SLUG (facultatif) force le candidat si la base en contient plusieurs.
        candidat = await self._repo.get_candidat(os.getenv("CANDIDAT_SLUG") or None)
        if candidat is None:
            raise CandidatIntrouvable(
                "Aucun candidat dans la base : la base n'a pas été alimentée (just seed)"
            )

        profil = {c["skill_slug"]: c for c in candidat.get("competences", [])}
        rows = await self._repo.stats_competences(candidat["candidat_slug"], limit)
        items = [self._enrich(row, profil) for row in rows]
        return {"total": len(items), "items": items}

    @staticmethod
    def _enrich(row: dict[str, Any], profil: dict[str, dict[str, Any]]) -> dict[str, Any]:
        slug = row["competence"]
        info = profil.get(slug, {})  # compétence absente du profil : valeurs par défaut
        return {
            "skill_slug": slug,
            "nom": info.get("nom", slug),
            "domaine": info.get("domaine"),
            "niveau": info.get("niveau"),
            "nb_projets": row["nb_projets"],
            "derniere_annee": row["derniere_annee"],
        }