"""Routes du graphe (Neo4j) : R4, R5, R7."""

from fastapi import APIRouter, HTTPException

from portfolio_api.repositories.graph_repository import GraphRepository
from portfolio_api.services.graph_service import get_graphe_competences

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/competences")
async def graphe_competences():
    """R5 : graphe de compétences prêt à afficher."""
    graphe = await get_graphe_competences(GraphRepository())
    if graphe is None:
        raise HTTPException(status_code=404, detail="Candidat introuvable dans Neo4j (lancez just seed)")
    return graphe