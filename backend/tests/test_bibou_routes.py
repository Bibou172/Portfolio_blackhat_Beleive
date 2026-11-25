from __future__ import annotations

from fastapi.testclient import TestClient

from portfolio_api.main import app
from portfolio_api.models.candidat import CandidatOut, ExperienceOut
from portfolio_api.models.projet import ProjetOut
from portfolio_api.repositories.candidat_repo import get_candidat_repo
from portfolio_api.repositories.projet_repo import get_projet_repo


class FakeCandidatRepo:
    def __init__(self) -> None:
        self.candidat = CandidatOut(
            candidat_slug="exemple-candidat",
            prenom="Alice",
            nom="Martin",
            titre="Élève-ingénieure Big Data",
            bio="Bio test",
            email="alice@example.com",
            experiences=[
                ExperienceOut(
                    entreprise="Entreprise X",
                    poste="Stagiaire Data",
                    lieu="Rouen",
                    debut="2026-04",
                    fin="2026-08",
                    description="Pipeline",
                    competences=["python", "mongodb"],
                ),
                ExperienceOut(
                    entreprise="Entreprise Y",
                    poste="Dev Backend",
                    lieu="Paris",
                    debut="2025-06",
                    fin="2025-08",
                    description="API",
                    competences=["fastapi"],
                ),
            ],
        )

    async def get_by_slug(self, candidat_slug: str) -> CandidatOut | None:
        return self.candidat if candidat_slug == self.candidat.candidat_slug else None

    async def get_experiences(
        self, candidat_slug: str, lieu: str | None = None
    ) -> list[ExperienceOut] | None:
        if candidat_slug != self.candidat.candidat_slug:
            return None
        if not lieu:
            return self.candidat.experiences
        return [
            e
            for e in self.candidat.experiences
            if e.lieu.lower() == lieu.strip().lower()
        ]


class FakeProjetRepo:
    def __init__(self) -> None:
        self.projets = [
            ProjetOut(
                projet_slug="smartcity-explorer",
                candidat_slug="exemple-candidat",
                titre="SmartCity Explorer",
                description="App urbaine",
                annee=2026,
                competences=["mongodb", "fastapi"],
            )
        ]

    async def list_projets(
        self, candidat_slug: str, competence: str | None = None
    ) -> list[ProjetOut]:
        res = [p for p in self.projets if p.candidat_slug == candidat_slug]
        if competence:
            res = [p for p in res if competence.strip().lower() in p.competences]
        return res

    async def get_by_slug(self, projet_slug: str) -> ProjetOut | None:
        for p in self.projets:
            if p.projet_slug == projet_slug:
                return p
        return None


def test_routes_r1_r2_r8() -> None:
    app.dependency_overrides[get_candidat_repo] = lambda: FakeCandidatRepo()
    app.dependency_overrides[get_projet_repo] = lambda: FakeProjetRepo()

    client = TestClient(app)

    # R1 : Profil OK et 404
    r1 = client.get("/api/profil?candidat_slug=exemple-candidat")
    assert r1.status_code == 200
    assert r1.json()["prenom"] == "Alice"
    assert client.get("/api/profil?candidat_slug=inconnu").status_code == 404

    # R8 : Expériences filtrées par lieu
    r8 = client.get("/api/experiences?candidat_slug=exemple-candidat&lieu=rouen")
    assert r8.status_code == 200
    assert len(r8.json()) == 1
    assert r8.json()[0]["lieu"] == "Rouen"

    # R2 : Liste des projets + filtre compétence + détail projet
    r2_list = client.get(
        "/api/projets?candidat_slug=exemple-candidat&competence=mongodb"
    )
    assert r2_list.status_code == 200
    assert len(r2_list.json()) == 1

    r2_detail = client.get("/api/projets/smartcity-explorer")
    assert r2_detail.status_code == 200
    assert r2_detail.json()["titre"] == "SmartCity Explorer"
    assert client.get("/api/projets/projet-inexistant").status_code == 404

    app.dependency_overrides.clear()