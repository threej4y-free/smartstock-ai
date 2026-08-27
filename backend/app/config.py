from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SmartStock API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://smartstock:smartstock@localhost:5432/smartstock"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    sql_echo: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="SMARTSTOCK_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
