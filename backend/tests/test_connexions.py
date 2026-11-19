"""Tests d'intégration : connexion réelle à MongoDB et Neo4j (via les singletons de l'API).

Lancement (depuis backend/) :
    uv run pytest tests/test_connexions.py -v

Ces tests utilisent le .env (MONGO_URL, MONGO_DB, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD).
Sans configuration (ex. CI GitHub sans .env), ils sont ignorés (skipped) au lieu d'échouer.
"""

from __future__ import annotations

import pytest

from portfolio_api.core.config import get_settings
from portfolio_api.db.mongo import close_mongo, get_mongo_db
from portfolio_api.db.neo4j import close_neo4j, get_neo4j_driver

settings = get_settings()


@pytest.mark.skipif(not (settings.mongo_url and settings.mongo_db), reason="MONGO_URL / MONGO_DB non configurés")
async def test_connexion_mongo():
    try:
        db = get_mongo_db()
        reponse = await db.client.admin.command("ping")
        assert reponse.get("ok") == 1
        assert db.name == settings.mongo_db
        # Lecture simple : prouve que les droits sur la base sont corrects
        assert isinstance(await db.list_collection_names(), list)
    finally:
        # Ferme le singleton : chaque test a sa propre boucle asyncio
        await close_mongo()


@pytest.mark.skipif(
    not (settings.neo4j_uri and settings.neo4j_user and settings.neo4j_password),
    reason="NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD non configurés",
)
async def test_connexion_neo4j():
    try:
        driver = get_neo4j_driver()
        await driver.verify_connectivity()
        async with driver.session() as session:
            result = await session.run("RETURN 1 AS ok")
            record = await result.single()
        assert record["ok"] == 1
    finally:
        await close_neo4j()
