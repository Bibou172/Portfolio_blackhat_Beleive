"""Routes du graphe (Neo4j) : R4, R5, R7 — routes 6, 7 et 8 de API_ROUTES.md."""

from fastapi import APIRouter, Depends, HTTPException, Query

from portfolio_api.models.graph import CompetencesDomaineOut, ProjetsSimilairesOut
from portfolio_api.repositories.graph_repository import GraphRepository
from portfolio_api.services.graph_service import get_competences_domaine, get_graphe_competences, get_projets_similaires

router = APIRouter(prefix="/graph", tags=["graph"])


def get_graph_repository() -> GraphRepository:
    """Dépendance remplaçable dans les tests (app.dependency_overrides)."""
    return GraphRepository()


@router.get("/competences")
async def graphe_competences(repository: GraphRepository = Depends(get_graph_repository)):
    """R5 : graphe de compétences prêt à afficher."""
    graphe = await get_graphe_competences(repository)
    if graphe is None:
        raise HTTPException(status_code=404, detail="Candidat introuvable dans Neo4j (lancez just seed)")
    return graphe


@router.get("/projets/{projet_slug}/similaires", response_model=ProjetsSimilairesOut)
async def projets_similaires(
    projet_slug: str,
    limit: int = Query(5, ge=1, le=20, description="Nombre maximum de projets similaires (1 à 20)."),
    repository: GraphRepository = Depends(get_graph_repository),
):
    """R4 : projets partageant des compétences avec le projet donné, triés par nb_communes décroissant."""
    resultat = await get_projets_similaires(repository, projet_slug, limit)
    if resultat is None:
        raise HTTPException(status_code=404, detail=f"Projet '{projet_slug}' introuvable dans Neo4j")
    return resultat


@router.get("/domaines/{domaine_slug}/competences", response_model=CompetencesDomaineOut)
async def competences_domaine(domaine_slug: str, repository: GraphRepository = Depends(get_graph_repository)):
    """R7 : compétences d'un domaine, triées par nom."""
    resultat = await get_competences_domaine(repository, domaine_slug)
    if resultat is None:
        raise HTTPException(status_code=404, detail=f"Domaine '{domaine_slug}' introuvable dans Neo4j")
    return resultat
