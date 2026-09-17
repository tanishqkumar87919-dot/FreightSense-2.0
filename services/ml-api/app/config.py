import os
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Explicitly load .env from services/ml-api and fallback to root .env.local
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env.local"))

class Settings(BaseSettings):
    # App
    APP_NAME: str = "FreightSense ML & Forecast Service"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://uuvkwrvcemeepbnsnnhv.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "mock-anon-key")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or None

    # FastAPI Internal Security & CORS
    FASTAPI_BASE_URL: str = os.getenv("FASTAPI_BASE_URL", "http://localhost:8000")
    API_INTERNAL_SECRET: str = os.getenv("API_INTERNAL_SECRET", "fs-dev-secret-internal-key-2026")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://freightsense.vercel.app")

    # Authoritative Data Sources API Keys
    COMTRADE_API_KEY: Optional[str] = os.getenv("COMTRADE_API_KEY", None)
    MARINETRAFFIC_API_KEY: Optional[str] = os.getenv("MARINETRAFFIC_API_KEY", None)
    NOAA_API_TOKEN: Optional[str] = os.getenv("NOAA_API_TOKEN", None)
    FRED_API_KEY: Optional[str] = os.getenv("FRED_API_KEY", None)
    EIA_API_KEY: Optional[str] = os.getenv("EIA_API_KEY", None)
    BALTIC_API_KEY: Optional[str] = os.getenv("BALTIC_API_KEY", None)
    OTHER_PROVIDER_KEYS: Optional[str] = os.getenv("OTHER_PROVIDER_KEYS", None)

    # ML & Model Registry
    MODEL_REGISTRY_BUCKET: str = os.getenv("MODEL_REGISTRY_BUCKET", "freightsense-models")
    MODEL_ARTIFACT_BASE_PATH: str = os.getenv("MODEL_ARTIFACT_BASE_PATH", "artifacts/models")
    DEFAULT_MODEL_VERSION: str = os.getenv("DEFAULT_MODEL_VERSION", "v2.5")
    RETRAINING_ENABLED: bool = os.getenv("RETRAINING_ENABLED", "false").lower() in ("true", "1")
    AUTO_PROMOTION_ENABLED: bool = os.getenv("AUTO_PROMOTION_ENABLED", "false").lower() in ("true", "1")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
