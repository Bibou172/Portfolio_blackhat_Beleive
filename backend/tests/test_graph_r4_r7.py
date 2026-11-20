"""Tests de R4 (projets similaires) et R7 (compétences d'un domaine) : Cypher, service et route.

Le repository est remplacé par un faux qui renvoie des lignes toutes prêtes :
ces tests tournent donc partout (poste local, CI GitHub) sans Neo4j.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from portfolio_api.api import routes_graph
from portfolio_api.repositories.graph_repository import REQUETE_R4, REQUETE_R7
from portfolio_api.services.graph_service import get_competences_domaine, get_projets_similaires

# Ce que renvoie Neo4j pour R4 (déjà trié : nb_communes décroissant)
VOISINS = [
    {"projet_slug": "portfolio-api", "titre": "Portfolio API", "competences_communes": ["neo4j", "mongodb"], "nb_communes": 2},
    {"projet_slug": "data-viz", "titre": "Data Viz", "competences_communes": ["mongodb"], "nb_communes": 1},
]
SANS_VOISIN = [{"projet_slug": None, "titre": None, "competences_communes": [], "nb_communes": 0}]

# Ce que renvoie Neo4j pour R7
BDD = {"domaine_slug": "bases-de-donnees", "domaine_nom": "Bases de données"}
COMPETENCES = [{**BDD, "skill_slug": "neo4j", "nom": "Neo4j"}, {**BDD, "skill_slug": "mongodb", "nom": "MongoDB"}]
DOMAINE_VIDE = [{**BDD, "skill_slug": None, "nom": None}]


class FauxRepository:
    def __init__(self, voisins=VOISINS, competences=COMPETENCES):
        self.voisins = voisins
        self.competences = competences
        self.limit_recue = "jamais appelé"

    async def projets_similaires(self, projet_slug, limit=5):
        self.limit_recue = limit
        return self.voisins[:limit]

    async def competences_domaine(self, domaine_slug):
        return self.competences


def client_avec(repository) -> TestClient:
    app = FastAPI()
    app.include_router(routes_graph.router, prefix="/api")
    app.dependency_overrides[routes_graph.get_graph_repository] = lambda: repository
    return TestClient(app)


# ---------- Cypher (ARCHITECTURE.md §4.2) ----------

def test_cypher_r4_competences_communes():
    assert "MATCH (p:Projet {projet_slug: $projet_slug})" in REQUETE_R4
    assert "(p)-[:UTILISE]->(c:Competence)<-[:UTILISE]-(autre:Projet)" in REQUETE_R4
    assert "WHERE autre <> p" in REQUETE_R4
    assert "ORDER BY nb_communes DESC" in REQUETE_R4
    assert "LIMIT $limit" in REQUETE_R4


def test_cypher_r7_appartient_a():
    assert "MATCH (d:Domaine {domaine_slug: $domaine_slug})" in REQUETE_R7
    assert "(d)<-[:APPARTIENT_A]-(c:Competence)" in REQUETE_R7


@pytest.mark.parametrize("requete", [REQUETE_R4, REQUETE_R7])
def test_cypher_optional_match_pour_distinguer_404_et_liste_vide(requete):
    assert "OPTIONAL MATCH" in requete


# ---------- Service R4 ----------

async def test_r4_format_du_contrat():
    res = await get_projets_similaires(FauxRepository(), "smartcity")
    assert res["projet_slug"] == "smartcity"
    assert res["items"][0] == {
        "projet_slug": "portfolio-api",
        "titre": "Portfolio API",
        "competences_communes": ["mongodb", "neo4j"],  # triées
        "nb_communes": 2,
    }


async def test_r4_limit_transmise_au_repository():
    repo = FauxRepository()
    res = await get_projets_similaires(repo, "smartcity", limit=1)
    assert repo.limit_recue == 1
    assert len(res["items"]) == 1


async def test_r4_projet_sans_voisin():
    assert await get_projets_similaires(FauxRepository(voisins=SANS_VOISIN), "solo") == {"projet_slug": "solo", "items": []}


async def test_r4_projet_inconnu():
    assert await get_projets_similaires(FauxRepository(voisins=[]), "inconnu") is None


# ---------- Service R7 ----------

async def test_r7_format_du_contrat_trie_par_nom():
    assert await get_competences_domaine(FauxRepository(), "bases-de-donnees") == {
        "domaine_slug": "bases-de-donnees",
        "domaine_nom": "Bases de données",
        "items": [{"skill_slug": "mongodb", "nom": "MongoDB"}, {"skill_slug": "neo4j", "nom": "Neo4j"}],
    }


async def test_r7_domaine_sans_competence():
    res = await get_competences_domaine(FauxRepository(competences=DOMAINE_VIDE), "bases-de-donnees")
    assert res["items"] == []


async def test_r7_noms_manquants_remplaces_par_le_slug():
    lignes = [{"domaine_slug": "outils", "domaine_nom": None, "skill_slug": "git", "nom": None}]
    res = await get_competences_domaine(FauxRepository(competences=lignes), "outils")
    assert res == {"domaine_slug": "outils", "domaine_nom": "outils", "items": [{"skill_slug": "git", "nom": "git"}]}


async def test_r7_domaine_inconnu():
    assert await get_competences_domaine(FauxRepository(competences=[]), "inconnu") is None


# ---------- Routes ----------

def test_route_r4():
    res = client_avec(FauxRepository()).get("/api/graph/projets/smartcity/similaires?limit=2")
    assert res.status_code == 200
    assert [i["projet_slug"] for i in res.json()["items"]] == ["portfolio-api", "data-viz"]


@pytest.mark.parametrize("valeur", ["0", "21", "abc"])
def test_route_r4_limit_invalide(valeur):
    res = client_avec(FauxRepository()).get(f"/api/graph/projets/smartcity/similaires?limit={valeur}")
    assert res.status_code == 422


def test_route_r7():
    res = client_avec(FauxRepository()).get("/api/graph/domaines/bases-de-donnees/competences")
    assert res.status_code == 200
    assert res.json()["domaine_nom"] == "Bases de données"


@pytest.mark.parametrize(
    "url", ["/api/graph/projets/inconnu/similaires", "/api/graph/domaines/inconnu/competences"]
)
def test_routes_404(url):
    res = client_avec(FauxRepository(voisins=[], competences=[])).get(url)
    assert res.status_code == 404
    assert "introuvable" in res.json()["detail"]
