from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from portfolio_api.models.candidat import CandidatOut
from portfolio_api.repositories.candidat_repo import (
    CandidatRepository,
    get_candidat_repo,
)

router = APIRouter(tags=["profil"])


@router.get("/profil", response_model=CandidatOut)
async def get_profil(
    candidat_slug: str = Query(
        default="exemple-candidat",
        min_length=1,
        description="Slug unique du candidat",
    ),
    repo: CandidatRepository = Depends(get_candidat_repo),
) -> CandidatOut:
    candidat = await repo.get_by_slug(candidat_slug=candidat_slug.strip())
    if not candidat:
        raise HTTPException(status_code=404, detail="Candidat introuvable")
    return candidat