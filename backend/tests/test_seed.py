"""Tests unitaires du seed (scripts/seed.py), sans base réelle.

MongoDB et Neo4j sont remplacés par des faux objets (mocks) : les tests ne touchent
pas aux données d'Atlas / Aura et tournent aussi en CI, sans .env.

Lancement (depuis backend/) :
    uv run pytest tests/test_seed.py -v
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from portfolio_api.scripts import seed

# --- Données de test (même forme que data/*/_exemple.json, modèle 1 candidat) ---

CANDIDAT = {
    "candidat_slug": "papa-daouda",
    "prenom": "Papa Daouda",
    "nom": "Ndiaye",
    "experiences": [{"entreprise": "X", "lieu": "Rouen", "competences": ["python"]}],
    "formations": [{"ecole": "ESIGELEC"}],
    "competences": [
        {"skill_slug": "mongodb", "nom": "MongoDB", "domaine": "bases-de-donnees", "niveau": 3},
        {"skill_slug": "python", "nom": "Python", "domaine": "langages", "niveau": 4},
    ],
}

PROJETS = [
    {
        "projet_slug": "smartcity-explorer",
        "candidat_slug": "papa-daouda",
        "titre": "SmartCity Explorer",
        "annee": 2026,
        "competences": ["python", "mongodb", "neo4j"],
    },
    {
        "projet_slug": "portfolio",
        "candidat_slug": "papa-daouda",
        "titre": "Portfolio",
        "annee": 2027,
        "competences": ["python", "fastapi"],
    },
]


# --- Faux MongoDB / Neo4j ---------------------------------------------------


def fake_collection() -> MagicMock:
    col = MagicMock()
    col.delete_many = AsyncMock()
    col.insert_many = AsyncMock()
    col.create_index = AsyncMock()
    return col


@pytest.fixture
def fake_mongo(monkeypatch):
    db = MagicMock()
    db.candidats = fake_collection()
    db.projets = fake_collection()
    monkeypatch.setattr(seed, "get_mongo_db", lambda: db)
    return db


class FakeSession:
    """Session Neo4j qui enregistre chaque requête Cypher et ses paramètres."""

    def __init__(self):
        self.calls: list[tuple[str, dict]] = []

    async def run(self, query, **params):
        self.calls.append((" ".join(query.split()), params))

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def query(self, fragment: str) -> tuple[str, dict]:
        """Retourne l'appel dont la requête contient `fragment`."""
        matches = [c for c in self.calls if fragment in c[0]]
        assert matches, f"aucune requête contenant {fragment!r}"
        return matches[0]


@pytest.fixture
def fake_neo4j(monkeypatch):
    session = FakeSession()
    driver = MagicMock()
    driver.session = lambda **kw: session
    monkeypatch.setattr(seed, "get_neo4j_driver", lambda: driver)
    return session


# --- load_member_files --------------------------------------------------------


def test_load_member_files_ignore_exemples_et_accepte_objet_ou_liste(tmp_path, monkeypatch):
    (tmp_path / "candidats").mkdir()
    (tmp_path / "projets").mkdir()
    (tmp_path / "candidats" / "_exemple.json").write_text(json.dumps({"candidat_slug": "exemple"}), encoding="utf-8")
    (tmp_path / "candidats" / "moi.json").write_text(json.dumps(CANDIDAT), encoding="utf-8")
    (tmp_path / "projets" / "moi.json").write_text(json.dumps(PROJETS), encoding="utf-8")
    monkeypatch.setattr(seed, "DATA_DIR", tmp_path)

    candidats = seed.load_member_files("candidats")
    projets = seed.load_member_files("projets")

    assert [c["candidat_slug"] for c in candidats] == ["papa-daouda"]  # objet -> liste, _exemple ignoré
    assert [p["projet_slug"] for p in projets] == ["smartcity-explorer", "portfolio"]  # liste conservée


# --- seed_mongo -----------------------------------------------------------------


async def test_seed_mongo_vide_puis_insere(fake_mongo):
    await seed.seed_mongo([CANDIDAT], PROJETS)

    fake_mongo.candidats.delete_many.assert_awaited_once_with({})
    fake_mongo.projets.delete_many.assert_awaited_once_with({})
    inseres_candidats = fake_mongo.candidats.insert_many.await_args.args[0]
    inseres_projets = fake_mongo.projets.insert_many.await_args.args[0]
    assert [c["candidat_slug"] for c in inseres_candidats] == ["papa-daouda"]
    assert [p["projet_slug"] for p in inseres_projets] == ["smartcity-explorer", "portfolio"]


async def test_seed_mongo_ne_modifie_pas_les_donnees_source(fake_mongo):
    """insert_many ajoute un _id aux dicts reçus : le seed doit passer des copies."""
    await seed.seed_mongo([CANDIDAT], PROJETS)

    for doc in fake_mongo.projets.insert_many.await_args.args[0]:
        doc["_id"] = "simule"
    assert all("_id" not in p for p in PROJETS)


async def test_seed_mongo_cree_les_index_de_l_architecture(fake_mongo):
    await seed.seed_mongo([CANDIDAT], PROJETS)

    def index(col):
        return {(tuple(c.args[0]), c.kwargs.get("unique", False)) for c in col.create_index.await_args_list}

    assert index(fake_mongo.candidats) == {
        ((("candidat_slug", 1),), True),
        ((("experiences.lieu", 1),), False),
    }
    assert index(fake_mongo.projets) == {
        ((("projet_slug", 1),), True),
        ((("candidat_slug", 1), ("annee", -1)), False),
        ((("competences", 1),), False),
    }


async def test_seed_mongo_sans_donnees_ne_plante_pas(fake_mongo):
    """insert_many([]) lève une erreur avec PyMongo : il ne doit pas être appelé."""
    await seed.seed_mongo([], [])

    fake_mongo.candidats.delete_many.assert_awaited_once()
    fake_mongo.candidats.insert_many.assert_not_awaited()
    fake_mongo.projets.insert_many.assert_not_awaited()


async def test_seed_mongo_idempotent(fake_mongo):
    """Relancer le seed : à chaque fois on vide AVANT d'insérer -> pas de doublons."""
    ordre = []
    fake_mongo.projets.delete_many.side_effect = lambda *a: ordre.append("delete")
    fake_mongo.projets.insert_many.side_effect = lambda *a: ordre.append("insert")

    await seed.seed_mongo([CANDIDAT], PROJETS)
    await seed.seed_mongo([CANDIDAT], PROJETS)

    assert ordre == ["delete", "insert", "delete", "insert"]


# --- seed_neo4j ---------------------------------------------------------------


async def test_seed_neo4j_contraintes_puis_nettoyage(fake_neo4j):
    await seed.seed_neo4j([CANDIDAT], PROJETS)

    requetes = [q for q, _ in fake_neo4j.calls]
    contraintes = [q for q in requetes if q.startswith("CREATE CONSTRAINT")]
    assert len(contraintes) == 4
    assert all("IF NOT EXISTS" in q for q in contraintes)  # idempotent
    for label in ("Candidat", "Projet", "Competence", "Domaine"):
        assert any(f":{label})" in q for q in contraintes)

    # Les contraintes sont créées avant le nettoyage, le nettoyage avant les MERGE
    i_delete = next(i for i, q in enumerate(requetes) if "DETACH DELETE" in q)
    i_merge = next(i for i, q in enumerate(requetes) if "MERGE" in q)
    assert len(contraintes) <= i_delete < i_merge


async def test_seed_neo4j_candidat(fake_neo4j):
    await seed.seed_neo4j([CANDIDAT], PROJETS)

    _, params = fake_neo4j.query("MERGE (c:Candidat")
    assert params["rows"] == [{"candidat_slug": "papa-daouda", "prenom": "Papa Daouda", "nom": "Ndiaye"}]


async def test_seed_neo4j_competences_et_domaines(fake_neo4j):
    await seed.seed_neo4j([CANDIDAT], PROJETS)

    query, params = fake_neo4j.query("APPARTIENT_A")
    assert "MERGE (d:Domaine" in query
    par_slug = {r["skill_slug"]: r for r in params["rows"]}
    assert par_slug["mongodb"] == {
        "skill_slug": "mongodb",
        "nom": "MongoDB",
        "niveau": 3,
        "domaine": "bases-de-donnees",
        "domaine_nom": "Bases de donnees",
    }
    assert par_slug["python"]["domaine"] == "langages"


async def test_seed_neo4j_projets_et_relations(fake_neo4j):
    await seed.seed_neo4j([CANDIDAT], PROJETS)

    query, params = fake_neo4j.query("MERGE (p:Projet")
    assert "A_REALISE" in query and "UTILISE" in query
    assert params["rows"][0] == {
        "projet_slug": "smartcity-explorer",
        "candidat_slug": "papa-daouda",
        "titre": "SmartCity Explorer",
        "annee": 2026,
        "competences": ["python", "mongodb", "neo4j"],
    }
    assert len(params["rows"]) == 2


# --- main ---------------------------------------------------------------------


async def test_main_ferme_les_connexions_meme_en_cas_d_erreur(monkeypatch):
    close_mongo, close_neo4j = AsyncMock(), AsyncMock()
    monkeypatch.setattr(seed, "load_member_files", lambda kind: [])
    monkeypatch.setattr(seed, "seed_mongo", AsyncMock(side_effect=RuntimeError("Atlas KO")))
    monkeypatch.setattr(seed, "seed_neo4j", AsyncMock())
    monkeypatch.setattr(seed, "close_mongo", close_mongo)
    monkeypatch.setattr(seed, "close_neo4j", close_neo4j)

    with pytest.raises(RuntimeError, match="Atlas KO"):
        await seed.main()

    close_mongo.assert_awaited_once()
    close_neo4j.assert_awaited_once()
