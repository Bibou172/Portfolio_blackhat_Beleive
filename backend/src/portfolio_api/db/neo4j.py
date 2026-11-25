"""Connexion Neo4j (singleton AsyncDriver)."""

from __future__ import annotations

import ssl

import truststore
from neo4j import AsyncDriver, AsyncGraphDatabase

from portfolio_api.core.config import get_settings

_driver: AsyncDriver | None = None

# Schémas « +s » (TLS vérifié) -> schéma nu + ssl_context explicite.
# Le driver refuse un ssl_context avec neo4j+s://, d'où la conversion.
_SECURE_SCHEMES = {"neo4j+s": "neo4j", "bolt+s": "bolt"}


def get_neo4j_driver() -> AsyncDriver:
    """Retourne le driver Neo4j asynchrone (instance unique).

    Le certificat TLS d'Aura est vérifié avec le magasin de certificats du système
    (truststore) : évite les SSLCertVerificationError sur les postes Windows dont
    l'antivirus ou le réseau inspecte le trafic TLS.
    """
    global _driver
    if _driver is None:
        settings = get_settings()
        uri = settings.neo4j_uri
        auth = (settings.neo4j_user, settings.neo4j_password)
        scheme, sep, rest = uri.partition("://")
        if scheme in _SECURE_SCHEMES:
            _driver = AsyncGraphDatabase.driver(
                f"{_SECURE_SCHEMES[scheme]}{sep}{rest}",
                auth=auth,
                encrypted=True,
                ssl_context=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT),
            )
        else:
            _driver = AsyncGraphDatabase.driver(uri, auth=auth)
    return _driver


async def close_neo4j() -> None:
    """Ferme le driver (appelé à l'arrêt de l'API)."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
