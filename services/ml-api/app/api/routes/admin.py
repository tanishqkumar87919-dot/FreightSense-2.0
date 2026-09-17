from fastapi import APIRouter, Header, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app.config import settings
from app.ml.retrain import run_retraining
from app.ml.registry import ModelRegistry

router = APIRouter()

class RetrainRequest(BaseModel):
    reason: str = "manual"

def verify_admin_token(x_internal_secret: Optional[str] = Header(None)):
    """Server-side authorization check for administrative and ML retraining triggers."""
    if not x_internal_secret or x_internal_secret != settings.API_INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid or missing administrative secret token.")
    return True

@router.post("/admin/retraining/run", dependencies=[Depends(verify_admin_token)])
def trigger_admin_retraining(req: RetrainRequest):
    success, message = run_retraining(reason=req.reason)
    return {
        "status": "success" if success else "failed",
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/admin/training-runs", dependencies=[Depends(verify_admin_token)])
def get_training_runs():
    registry = ModelRegistry()
    manifest = registry.get_manifest()
    return {
        "champion": manifest.get("champion"),
        "challenger": manifest.get("challenger"),
        "history": manifest.get("history", []),
    }
