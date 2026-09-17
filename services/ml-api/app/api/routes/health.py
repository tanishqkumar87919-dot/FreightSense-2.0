from fastapi import APIRouter
from datetime import datetime, timezone
from app.config import settings
from app.ml.registry import ModelRegistry

router = APIRouter()

@router.get("/health")
def get_health():
    registry = ModelRegistry()
    manifest = registry.get_manifest()
    champ = manifest.get("champion")

    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "champion_model": champ.get("version") if champ else None,
        "champion_algorithm": champ.get("algorithm") if champ else None,
        "retraining_enabled": settings.RETRAINING_ENABLED,
    }
