"""Modèles de réponse des routes 6 et 8 (R4 et R7, Neo4j).

Ils reflètent exactement les payloads décrits dans API_ROUTES.md.
"""

from pydantic import BaseModel


class ProjetSimilaireOut(BaseModel):
    projet_slug: str
    titre: str
    competences_communes: list[str]
    nb_communes: int


class ProjetsSimilairesOut(BaseModel):
    projet_slug: str
    items: list[ProjetSimilaireOut]


class CompetenceDomaineOut(BaseModel):
    skill_slug: str
    nom: str


class CompetencesDomaineOut(BaseModel):
    domaine_slug: str
    domaine_nom: str
    items: list[CompetenceDomaineOut]
