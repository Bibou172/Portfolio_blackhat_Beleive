from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LiensOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    github: str | None = None
    linkedin: str | None = None


class ExperienceOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    entreprise: str
    poste: str
    lieu: str
    debut: str
    fin: str | None = None
    description: str
    competences: list[str] = Field(default_factory=list)


class FormationOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ecole: str
    diplome: str
    lieu: str | None = None  # optionnel (API_ROUTES.md, route 10)
    debut: str
    fin: str | None = None


class CompetenceProfilOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    skill_slug: str
    nom: str
    domaine: str
    niveau: int = Field(ge=1, le=5)


class CandidatOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    candidat_slug: str
    prenom: str
    nom: str
    titre: str
    bio: str
    email: EmailStr | None = None
    liens: LiensOut = Field(default_factory=LiensOut)
    experiences: list[ExperienceOut] = Field(default_factory=list)
    formations: list[FormationOut] = Field(default_factory=list)
    competences: list[CompetenceProfilOut] = Field(default_factory=list)


# Alias pratiques si certains fichiers utilisent les noms courts
Liens = LiensOut
Experience = ExperienceOut
Formation = FormationOut
CompetenceProfil = CompetenceProfilOut
Candidat = CandidatOut