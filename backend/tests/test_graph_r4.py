"""Tests de R4 (projets similaires) : repository, service et route, avec un faux Neo4j."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from faux_neo4j import FauxDriver
from portfolio_api.main import app
from portfolio_api.repositories import graph_repository
from portfolio_api.repositories.graph_repository import REQUETE_PROJET_EXISTE, REQUETE_R4, GraphRepository
from portfolio_api.services.graph_service import get_projets_similaires

VOISINS = [
    {"projet_slug": "portfolio-api", "titre": "Portfolio API", "competences_communes": ["neo4j", "mongodb"], "nb_communes": 2},
    {"projet_slug": "data-viz", "titre": "Data Viz", "competences_communes": ["mongodb"], "nb_communes": 1},
]


def driver_r4(existe: bool = True, voisins: list[dict] = VOISINS) -> FauxDriver:
    def repondre(requete, params):
        if requete == REQUETE_PROJET_EXISTE:
            return [{"existe": existe}]
        if requete == REQUETE_R4:
            return voisins[: params["limit"]]
        raise AssertionError(f"requête inattendue : {requete}")

    return FauxDriver(repondre)


# ── Repository ──
def test_requete_r4_conforme_a_architecture():
    assert "[:UTILISE]->(c:Competence)<-[:UTILISE]-(autre:Projet)" in REQUETE_R4
    assert "WHERE autre <> p" in REQUETE_R4
    assert "ORDER BY nb_communes DESC" in REQUETE_R4
    assert "LIMIT $limit" in REQUETE_R4


def test_repository_passe_les_parametres():
    d = driver_r4()
    lignes = asyncio.run(GraphRepository(driver=d).projets_similaires("smartcity", 1))
    assert lignes == VOISINS[:1]
    assert d.appels[-1][1] == {"projet_slug": "smartcity", "limit": 1}


def test_projet_existe():
    assert asyncio.run(GraphRepository(driver=driver_r4(existe=True)).projet_existe("x")) is True
    assert asyncio.run(GraphRepository(driver=driver_r4(existe=False)).projet_existe("x")) is False


# ── Service ──
def test_service_format_api_routes():
    r = asyncio.run(get_projets_similaires(GraphRepository(driver=driver_r4()), "smartcity", 5))
    assert r["projet_slug"] == "smartcity"
    assert r["items"][0] == {
        "projet_slug": "portfolio-api",
        "titre": "Portfolio API",
        "competences_communes": ["mongodb", "neo4j"],  # triées
        "nb_communes": 2,
    }


def test_service_projet_inconnu_none():
    assert asyncio.run(get_projets_similaires(GraphRepository(driver=driver_r4(existe=False)), "x")) is None


def test_service_projet_sans_voisin_liste_vide():
    r = asyncio.run(get_projets_similaires(GraphRepository(driver=driver_r4(voisins=[])), "solo"))
    assert r == {"projet_slug": "solo", "items": []}


# ── Route (contrat API_ROUTES.md §6) ──
@pytest.fixture
def client(monkeypatch):
    etat = {"driver": driver_r4()}
    monkeypatch.setattr(graph_repository, "get_neo4j_driver", lambda: etat["driver"])
    with TestClient(app) as c:
        yield c, etat


def test_route_200(client):
    c, _ = client
    r = c.get("/api/graph/projets/smartcity/similaires")
    assert r.status_code == 200
    assert len(r.json()["items"]) == 2


def test_route_limit(client):
    c, etat = client
    assert len(c.get("/api/graph/projets/smartcity/similaires?limit=1").json()["items"]) == 1
    assert etat["driver"].appels[-1][1]["limit"] == 1


def test_route_404(client):
    c, etat = client
    etat["driver"] = driver_r4(existe=False)
    r = c.get("/api/graph/projets/inconnu/similaires")
    assert r.status_code == 404
    assert "detail" in r.json()


@pytest.mark.parametrize("limit", [0, 21, "abc"])
def test_route_422(client, limit):
    c, _ = client
    assert c.get(f"/api/graph/projets/smartcity/similaires?limit={limit}").status_code == 422
