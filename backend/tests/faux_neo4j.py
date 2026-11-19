"""Faux driver Neo4j pour les tests : imite seulement ce que les repositories utilisent
(driver.session() en contexte asynchrone, session.run(), itération asynchrone, record.data()).

Usage : FauxDriver(repondre) où repondre(requete, params) -> list[dict] renvoie les lignes.
Chaque appel est enregistré dans driver.appels sous la forme (requete, params).
"""

from __future__ import annotations

from typing import Callable


class FauxRecord:
    def __init__(self, donnees: dict):
        self._donnees = donnees

    def data(self) -> dict:
        return self._donnees

    def __getitem__(self, cle):
        return self._donnees[cle]


class FauxResultat:
    def __init__(self, lignes: list[dict]):
        self._lignes = lignes

    def __aiter__(self):
        return self._lire()

    async def _lire(self):
        for ligne in self._lignes:
            yield FauxRecord(ligne)


class FausseSession:
    def __init__(self, driver: "FauxDriver"):
        self._driver = driver

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def run(self, requete: str, **params):
        self._driver.appels.append((requete, params))
        return FauxResultat(self._driver.repondre(requete, params))


class FauxDriver:
    def __init__(self, repondre: Callable[[str, dict], list[dict]] = lambda requete, params: []):
        self.repondre = repondre
        self.appels: list[tuple[str, dict]] = []

    def session(self):
        return FausseSession(self)
