"""Route 5 de API_ROUTES.md : GET /api/stats/competences (R3 + R6).

À enregistrer dans main.py :
    from portfolio_api.api.routes_stats import router as stats_router
    app.include_router(stats_router, prefix="/api")
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from portfolio_api.db.mongo import get_mongo_db
from portfolio_api.models.stats import StatsCompetencesOut
from portfolio_api.repositories.mongo_stats import MongoStatsRepository
from portfolio_api.services.stats_service import CandidatIntrouvable, StatsService

router = APIRouter(tags=["statistiques"])


def get_stats_service() -> StatsService:
    return StatsService(MongoStatsRepository(get_mongo_db()))


@router.get("/stats/competences", response_model=StatsCompetencesOut)
async def stats_competences(
    limit: int | None = Query(
        None,
        ge=1,
        description="Ne garde que les `limit` premières compétences (top N, R6). "
        "Sans limit : toutes les compétences (R3).",
    ),
    service: StatsService = Depends(get_stats_service),
):
    """R3 + R6 : statistiques des compétences utilisées par au moins un projet."""
    try:
        return await service.stats_competences(limit)
    except CandidatIntrouvable as erreur:
        raise HTTPException(status_code=404, detail=str(erreur))