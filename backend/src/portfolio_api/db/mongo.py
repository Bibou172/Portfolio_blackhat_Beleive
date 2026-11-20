from __future__ import annotations

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from portfolio_api.core.config import get_settings

settings = get_settings()
_client: AsyncMongoClient | None = None


def get_mongo_db() -> AsyncDatabase:
    """Retourne la base MongoDB du portfolio (instance unique)."""
    global _client
    if _client is None:
        if not settings.mongo_url or not settings.mongo_db:
            raise RuntimeError("MONGO_URL et MONGO_DB doivent être configurés")
        _client = AsyncMongoClient(settings.mongo_url)
    return _client[settings.mongo_db]


async def close_mongo() -> None:
    """Ferme proprement le client MongoDB."""
    global _client
    if _client is not None:
        await _client.close()
        _client = None