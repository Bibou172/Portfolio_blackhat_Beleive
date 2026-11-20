"""Connexion MongoDB (singleton).

TODO (équipe) : reprenez le singleton de SmartCity (`db/mongo.py`, Sprint 1).
Recommandé : `pymongo.AsyncMongoClient` (même API que Motor).

    from pymongo import AsyncMongoClient
    from pymongo.asynchronous.database import AsyncDatabase
"""
"""from __future__ import annotations

_client: AsyncMongoClient | None = None
def get_mongo_db():
    """Retourne la base MongoDB du portfolio (instance unique)."""
    raise NotImplementedError("TODO : connexion MongoDB")"""


async def close_mongo() -> None:
    """Ferme la connexion (appelé à l'arrêt de l'API)."""
    return None
from __future__ import annotations

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from portfolio_api.core.config import settings

_client: AsyncMongoClient | None = None


def get_mongo_db() -> AsyncDatabase:
    """Retourne la base MongoDB du portfolio (instance unique)."""
    global _client
    if _client is None:
        if not settings.mongo_url or not settings.mongo_db:
            raise RuntimeError("MONGO_URL et MONGO_DB doivent être configurés")
        _client = AsyncMongoClient(settings.mongo_url)
    return _client[settings.mongo_db]


async def close_mongo_client() -> None:
    """Ferme proprement le client MongoDB."""
    global _client
    if _client is not None:
        await _client.close()
        _client = None