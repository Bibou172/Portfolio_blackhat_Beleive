"""Tests de R3 + R6 : pipeline, service et route (sans base de données).

Le repository est remplacé par un faux qui renvoie des lignes toutes prêtes :
ces tests tournent donc partout (poste local, CI GitHub) sans MongoDB.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from portfolio_api.api import routes_stats
from portfolio_api.repositories.mongo_stats import build_competences_pipeline
from portfolio_api.services.stats_service import CandidatIntrouvable, StatsService

CANDIDAT = {
    "candidat_slug": "exemple-candidat",
    "competences": [
        {"skill_slug": "python", "nom": "Python", "domaine": "langages", "niveau": 4},
        {"skill_slug": "mongodb", "nom": "MongoDB", "domaine": "bases-de-donnees", "niveau": 3},
        {"skill_slug": "neo4j", "nom": "Neo4j", "domaine": "bases-de-donnees", "niveau": 2},
    ],
}

# Ce que renvoie l'agrégation MongoDB (déjà triée : nb_projets décroissant puis nom croissant)
LIGNES = [
    {"competence": "mongodb", "nb_projets": 2, "derniere_annee": 2026},
    {"competence": "python", "nb_projets": 2, "derniere_annee": 2026},
    {"competence": "neo4j", "nb_projets": 1, "derniere_annee": 2025},
]


class FauxRepository:
    def __init__(self, candidat=CANDIDAT, lignes=LIGNES):
        self.candidat = candidat
        self.lignes = lignes
        self.limit_recue = "jamais appelé"

    async def get_candidat(self, candidat_slug=None):
        return self.candidat

    async def stats_competences(self, candidat_slug, limit=None):
        self.limit_recue = limit
        return self.lignes if limit is None else self.lignes[:limit]


@pytest.fixture(autouse=True)
def pas_de_slug_force(monkeypatch):
    monkeypatch.delenv("CANDIDAT_SLUG", raising=False)


def client_avec(repository) -> TestClient:
    app = FastAPI()
    app.include_router(routes_stats.router, prefix="/api")
    app.dependency_overrides[routes_stats.get_stats_service] = lambda: StatsService(repository)
    return TestClient(app)


# ---------- Pipeline ----------

def test_pipeline_r3_sans_limit():
    etapes = [list(e)[0] for e in build_competences_pipeline("exemple-candidat")]
    assert etapes == ["$match", "$unwind", "$group", "$sort", "$project"]


def test_pipeline_r6_limit_juste_apres_le_tri():
    pipeline = build_competences_pipeline("exemple-candidat", 5)
    etapes = [list(e)[0] for e in pipeline]
    assert etapes == ["$match", "$unwind", "$group", "$sort", "$limit", "$project"]
    assert pipeline[4] == {"$limit": 5}


def test_pipeline_filtre_sur_le_candidat_et_trie_comme_le_contrat():
    pipeline = build_competences_pipeline("alice")
    assert pipeline[0] == {"$match": {"candidat_slug": "alice"}}
    assert pipeline[3] == {"$sort": {"nb_projets": -1, "_id": 1}}


# ---------- Service ----------

async def test_format_du_contrat():
    res = await StatsService(FauxRepository()).stats_competences()
    assert res["total"] == 3
    assert res["items"][0] == {
        "skill_slug": "mongodb",
        "nom": "MongoDB",
        "domaine": "bases-de-donnees",
        "niveau": 3,
        "nb_projets": 2,
        "derniere_annee": 2026,
    }


async def test_limit_transmise_au_repository():
    repo = FauxRepository()
    res = await StatsService(repo).stats_competences(limit=2)
    assert repo.limit_recue == 2
    assert [i["skill_slug"] for i in res["items"]] == ["mongodb", "python"]
    assert res["total"] == 2


async def test_competence_absente_du_profil():
    lignes = [{"competence": "rust", "nb_projets": 1, "derniere_annee": 2026}]
    res = await StatsService(FauxRepository(lignes=lignes)).stats_competences()
    assert res["items"][0] == {
        "skill_slug": "rust",
        "nom": "rust",
        "domaine": None,
        "niveau": None,
        "nb_projets": 1,
        "derniere_annee": 2026,
    }


async def test_aucun_projet():
    res = await StatsService(FauxRepository(lignes=[])).stats_competences()
    assert res == {"total": 0, "items": []}


async def test_base_non_alimentee():
    with pytest.raises(CandidatIntrouvable):
        await StatsService(FauxRepository(candidat=None)).stats_competences()


# ---------- Route ----------

def test_route_r3():
    res = client_avec(FauxRepository()).get("/api/stats/competences")
    assert res.status_code == 200
    assert res.json()["total"] == 3
    assert "_id" not in res.text


def test_route_r6():
    res = client_avec(FauxRepository()).get("/api/stats/competences?limit=2")
    assert res.status_code == 200
    assert [i["skill_slug"] for i in res.json()["items"]] == ["mongodb", "python"]


@pytest.mark.parametrize("valeur", ["0", "-3", "abc"])
def test_route_limit_invalide(valeur):
    res = client_avec(FauxRepository()).get(f"/api/stats/competences?limit={valeur}")
    assert res.status_code == 422


def test_route_404_si_base_vide():
    res = client_avec(FauxRepository(candidat=None)).get("/api/stats/competences")
    assert res.status_code == 404
    assert "detail" in res.json()