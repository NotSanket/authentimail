from dataclasses import dataclass
from functools import lru_cache
import os


DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_environment: str
    cors_origins: tuple[str, ...]


@lru_cache
def get_settings() -> Settings:
    configured_origins = os.getenv("AUTHENTIMAIL_CORS_ORIGINS", "")
    origins = tuple(
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ) or DEFAULT_CORS_ORIGINS

    return Settings(
        app_name="authentimail-analysis",
        app_environment=os.getenv("AUTHENTIMAIL_ENV", "development"),
        cors_origins=origins,
    )
