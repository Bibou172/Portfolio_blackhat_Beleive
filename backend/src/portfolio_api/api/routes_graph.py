"""Routes du graphe (Neo4j) : R4, R5, R7."""

from fastapi import APIRouter, HTTPException, Query

from portfolio_api.repositories.graph_repository import GraphRepository
from portfolio_api.services.graph_service import get_competences_domaine, get_graphe_competences, get_projets_similaires

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/competences")
async def graphe_competences():
    """R5 : graphe de compétences prêt à afficher."""
    graphe = await get_graphe_competences(GraphRepository())
    if graphe is None:
        raise HTTPException(status_code=404, detail="Candidat introuvable dans Neo4j (lancez just seed)")
    return graphe


@router.get("/projets/{projet_slug}/similaires")
async def projets_similaires(projet_slug: str, limit: int = Query(5, ge=1, le=20)):
    """R4 : projets partageant des compétences avec le projet donné."""
    resultat = await get_projets_similaires(GraphRepository(), projet_slug, limit)
    if resultat is None:
        raise HTTPException(status_code=404, detail=f"Projet '{projet_slug}' introuvable dans Neo4j")
    return resultat


@router.get("/domaines/{domaine_slug}/competences")
async def competences_domaine(domaine_slug: str):
    """R7 : compétences d'un domaine, triées par nom."""
    resultat = await get_competences_domaine(GraphRepository(), domaine_slug)
    if resultat is None:
        raise HTTPException(status_code=404, detail=f"Domaine '{domaine_slug}' introuvable dans Neo4j")
    return resultat
