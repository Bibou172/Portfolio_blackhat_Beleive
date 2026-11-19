"""Tests de R7 (compétences d'un domaine) : repository, service et route, avec un faux Neo4j."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from faux_neo4j import FauxDriver
from portfolio_api.main import app
from portfolio_api.repositories import graph_repository
from portfolio_api.repositories.graph_repository import REQUETE_R7, GraphRepository
from portfolio_api.services.graph_service import get_competences_domaine

DOMAINE = {"domaine_slug": "bases-de-donnees", "domaine_nom": "Bases de données"}
LIGNES = [
    {**DOMAINE, "skill_slug": "neo4j", "nom": "Neo4j"},
    {**DOMAINE, "skill_slug": "mongodb", "nom": "MongoDB"},
]


def driver_r7(lignes):
    def repondre(requete, params):
        assert requete == REQUETE_R7
        return lignes

    return FauxDriver(repondre)


def service(lignes):
    return asyncio.run(get_competences_domaine(GraphRepository(driver=driver_r7(lignes)), "bases-de-donnees"))


# ── Repository ──
def test_requete_r7_suit_appartient_a():
    assert "MATCH (d:Domaine {domaine_slug: $domaine_slug})" in REQUETE_R7
    assert "OPTIONAL MATCH (d)<-[:APPARTIENT_A]-(c:Competence)" in REQUETE_R7
    assert "ORDER BY" in REQUETE_R7


def test_repository_passe_le_slug():
    d = driver_r7(LIGNES)
    asyncio.run(GraphRepository(driver=d).competences_domaine("bases-de-donnees"))
    assert d.appels == [(REQUETE_R7, {"domaine_slug": "bases-de-donnees"})]


# ── Service ──
def test_service_format_api_routes_et_tri_par_nom():
    assert service(LIGNES) == {
        "domaine_slug": "bases-de-donnees",
        "domaine_nom": "Bases de données",
        "items": [{"skill_slug": "mongodb", "nom": "MongoDB"}, {"skill_slug": "neo4j", "nom": "Neo4j"}],
    }


def test_service_domaine_inconnu_none():
    assert service([]) is None


def test_service_domaine_sans_competence_liste_vide():
    r = service([{**DOMAINE, "skill_slug": None, "nom": None}])
    assert r == {**{"domaine_slug": "bases-de-donnees", "domaine_nom": "Bases de données"}, "items": []}


def test_service_noms_manquants_remplaces_par_le_slug():
    r = service([{"domaine_slug": "outils", "domaine_nom": None, "skill_slug": "git", "nom": None}])
    assert r["domaine_nom"] == "outils"
    assert r["items"] == [{"skill_slug": "git", "nom": "git"}]


# ── Route (contrat API_ROUTES.md §8) ──
@pytest.fixture
def client(monkeypatch):
    etat = {"driver": driver_r7(LIGNES)}
    monkeypatch.setattr(graph_repository, "get_neo4j_driver", lambda: etat["driver"])
    with TestClient(app) as c:
        yield c, etat


def test_route_200(client):
    c, _ = client
    r = c.get("/api/graph/domaines/bases-de-donnees/competences")
    assert r.status_code == 200
    assert [i["skill_slug"] for i in r.json()["items"]] == ["mongodb", "neo4j"]


def test_route_404(client):
    c, etat = client
    etat["driver"] = driver_r7([])
    r = c.get("/api/graph/domaines/inconnu/competences")
    assert r.status_code == 404
    assert "introuvable" in r.json()["detail"]
