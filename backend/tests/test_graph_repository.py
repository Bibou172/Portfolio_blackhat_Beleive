"""Tests du repository R5 et de la liaison service ↔ repository, avec un faux Neo4j."""

import asyncio

from portfolio_api.repositories.graph_repository import GraphRepository
from portfolio_api.services.graph_service import get_graphe_competences

LIGNE = {
    "candidat": {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin"},
    "projet": {"projet_slug": "dashboard-ventes", "titre": "Dashboard des ventes", "annee": 2026},
    "competence": {"skill_slug": "mongodb", "nom": "MongoDB", "niveau": 3},
    "domaine": {"domaine_slug": "bases-de-donnees", "nom": "Bases de données"},
}


# ── Faux Neo4j : on imite seulement ce que le repository utilise ──
class FakeRecord:
    def __init__(self, donnees):
        self._donnees = donnees

    def data(self):
        return self._donnees


class FakeResult:
    def __init__(self, lignes):
        self._lignes = lignes

    def __aiter__(self):
        return self._lire()

    async def _lire(self):
        for ligne in self._lignes:
            yield FakeRecord(ligne)


class FakeSession:
    def __init__(self, lignes):
        self._lignes = lignes
        self.requetes = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def run(self, requete, **params):
        self.requetes.append(requete)
        return FakeResult(self._lignes)


class FakeDriver:
    def __init__(self, lignes):
        self.fake_session = FakeSession(lignes)

    def session(self):
        return self.fake_session


# ── Les tests ──
def test_repository_renvoie_les_lignes():
    driver = FakeDriver([LIGNE])
    repo = GraphRepository(driver=driver)

    lignes = asyncio.run(repo.lignes_graphe_competences())

    assert lignes == [LIGNE]
    assert "OPTIONAL MATCH" in driver.fake_session.requetes[0]


def test_service_renvoie_le_graphe():
    repo = GraphRepository(driver=FakeDriver([LIGNE]))

    graphe = asyncio.run(get_graphe_competences(repo))

    assert len(graphe["nodes"]) == 4
    assert len(graphe["links"]) == 3


def test_service_sans_candidat_renvoie_none():
    repo = GraphRepository(driver=FakeDriver([]))

    graphe = asyncio.run(get_graphe_competences(repo))

    assert graphe is None