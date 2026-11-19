"""Configuration centralisée (variables d'environnement / .env)."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Portfolio Polyglotte API"
    debug: bool = False

    mongo_url: str =  os.getenv("MONGO_URL")
    mongo_db: str = os.getenv("MONGO_DB")

    neo4j_uri: str = os.getenv("NEO4J_URI")
    neo4j_user: str = os.getenv("NEO4J_USER")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD")

    cors_origins: str = os.getenv("CORS_ORIGINS")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
