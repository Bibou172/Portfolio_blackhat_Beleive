from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from portfolio_api.models.candidat import ExperienceOut
from portfolio_api.repositories.candidat_repo import (
    CandidatRepository,
    get_candidat_repo,
)

router = APIRouter(tags=["experiences"])


@router.get("/experiences", response_model=list[ExperienceOut])
async def get_experiences(
    lieu: str | None = Query(
        default=None,
        min_length=1,
        description="Filtrer les expériences par lieu (ex. Rouen)",
    ),
    candidat_slug: str = Query(
        default="exemple-candidat",
        min_length=1,
        description="Slug unique du candidat",
    ),
    repo: CandidatRepository = Depends(get_candidat_repo),
) -> list[ExperienceOut]:
    experiences = await repo.get_experiences(
        candidat_slug=candidat_slug.strip(),
        lieu=lieu,
    )
    if experiences is None:
        raise HTTPException(status_code=404, detail="Candidat introuvable")
    return experiences