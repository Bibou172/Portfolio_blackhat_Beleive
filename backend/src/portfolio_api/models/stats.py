"""Modèles de réponse de la route 5 (GET /api/stats/competences).

Ils reflètent exactement le payload décrit dans API_ROUTES.md.
"""

from pydantic import BaseModel


class CompetenceStatOut(BaseModel):
    skill_slug: str
    nom: str
    domaine: str | None = None
    niveau: int | None = None
    nb_projets: int
    derniere_annee: int | None = None


class StatsCompetencesOut(BaseModel):
    total: int
    items: list[CompetenceStatOut]