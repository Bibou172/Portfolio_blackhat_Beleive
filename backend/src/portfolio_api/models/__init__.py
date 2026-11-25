"""Modèles Pydantic — doivent refléter EXACTEMENT les payloads de API_ROUTES.md.

TODO (équipe) : définir CandidatOut, ExperienceOut, FormationOut, ProjetOut, StatsOut, GraphOut…


from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
from portfolio_api.models.candidat import (
    Candidat,
    CompetenceProfil,
    Experience,
    Formation,
    Liens,
)"""

from __future__ import annotations

from pydantic import BaseModel

from portfolio_api.models.candidat import (
    Candidat,
    CandidatOut,
    CompetenceProfil,
    CompetenceProfilOut,
    Experience,
    ExperienceOut,
    Formation,
    FormationOut,
    Liens,
    LiensOut,
)
from portfolio_api.models.projet import Projet, ProjetOut


class HealthResponse(BaseModel):
    status: str = "ok"


# Alias ou modèles de sortie alignés avec API_ROUTES.md
__all__ = [
    "Candidat",
    "CandidatOut",
    "CompetenceProfil",
    "Experience",
    "ExperienceOut",
    "Formation",
    "FormationOut",
    "HealthResponse",
    "Liens",
    "Projet",
    "ProjetOut",
]