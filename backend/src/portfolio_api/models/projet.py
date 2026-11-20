from pydantic import BaseModel, ConfigDict, Field


class ProjetOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    projet_slug: str
    candidat_slug: str
    titre: str
    description: str
    description_longue: str | None = None
    annee: int = Field(ge=1900, le=2100)
    competences: list[str] = Field(default_factory=list)
    lien_repo: str | None = None
    lien_demo: str | None = None

Projet = ProjetOut  # Alias pratique si certains fichiers utilisent le nom court