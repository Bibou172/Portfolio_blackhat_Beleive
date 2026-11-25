"""Portfolio Polyglotte — application FastAPI."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from portfolio_api.api.experiences import router as experiences_router
from portfolio_api.api.profil import router as profil_router
from portfolio_api.api.projets import router as projets_router
from portfolio_api.api.routes_graph import router as graph_router
from portfolio_api.api.routes_stats import router as stats_router
from portfolio_api.core.config import get_settings
from portfolio_api.db.mongo import close_mongo
from portfolio_api.db.neo4j import close_neo4j
from portfolio_api.models import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_mongo()
    await close_neo4j()


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="API d'équipe du Portfolio Polyglotte — voir API_ROUTES.md",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["santé"])
async def health() -> HealthResponse:
    return HealthResponse()


# Routeurs (voir API_ROUTES.md)
app.include_router(profil_router, prefix="/api")  # R1
app.include_router(projets_router, prefix="/api")  # R2 + détail d'un projet
app.include_router(experiences_router, prefix="/api")  # R8
app.include_router(stats_router, prefix="/api")  # R3 + R6
app.include_router(graph_router, prefix="/api")  # R4, R5, R7 (préfixe /graph)
