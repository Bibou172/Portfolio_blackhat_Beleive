from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from portfolio_api.models.projet import ProjetOut
from portfolio_api.repositories.projet_repo import (
    ProjetRepository,
    get_projet_repo,
)

router = APIRouter(tags=["projets"])


@router.get("/projets", response_model=list[ProjetOut])
async def list_projets(
    competence: str | None = Query(
        default=None,
        min_length=1,
        description="Filtrer par skill_slug (ex. mongodb, python)",
    ),
    candidat_slug: str | None = Query(
        default=None,
        min_length=1,
        description="Facultatif : un backend = un candidat (API_ROUTES.md)",
    ),
    repo: ProjetRepository = Depends(get_projet_repo),
) -> list[ProjetOut]:
    return await repo.list_projets(
        candidat_slug=candidat_slug.strip() if candidat_slug else None,
        competence=competence,
    )


@router.get("/projets/{projet_slug}", response_model=ProjetOut)
async def get_projet(
    projet_slug: str,
    repo: ProjetRepository = Depends(get_projet_repo),
) -> ProjetOut:
    projet = await repo.get_by_slug(projet_slug=projet_slug.strip())
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return projet