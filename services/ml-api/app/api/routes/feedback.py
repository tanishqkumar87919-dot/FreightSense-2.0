import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

# In-memory stores for feedback and observations
FEEDBACK_STORE = []
USER_OBSERVATIONS_STORE = []

class PredictionFeedbackRequest(BaseModel):
    prediction_id: Optional[str] = None
    route_id: str
    rating: str  # helpful, unhelpful, incorrect
    comment: Optional[str] = None
    suggested_rate: Optional[float] = None

class UserObservationRequest(BaseModel):
    entity_type: str  # route, port, vessel, corridor
    entity_id: str
    observation_type: str  # rate, dwell_time, delay, fuel_surcharge
    value: float
    unit: str
    source_context: str
    confidence: float = Field(default=85.0, ge=0.0, le=100.0)

@router.post("/feedback/prediction")
def submit_prediction_feedback(req: PredictionFeedbackRequest):
    record = {
        "id": str(uuid.uuid4()),
        "target_type": "forecast",
        "route_id": req.route_id,
        "prediction_id": req.prediction_id,
        "rating": req.rating,
        "comment": req.comment,
        "suggested_rate": req.suggested_rate,
        "received_at": datetime.now(timezone.utc).isoformat(),
        "is_ground_truth": False,  # Rule: subjective feedback is never ground truth
    }
    FEEDBACK_STORE.append(record)
    return {
        "status": "success",
        "message": "Feedback recorded for model monitoring and review.",
        "feedback_id": record["id"],
    }

@router.post("/user-observations")
def submit_user_observation(req: UserObservationRequest):
    record = {
        "id": str(uuid.uuid4()),
        "entity_type": req.entity_type,
        "entity_id": req.entity_id,
        "observation_type": req.observation_type,
        "value": req.value,
        "unit": req.unit,
        "source_context": req.source_context,
        "confidence": req.confidence,
        "moderation_status": "pending",  # Rule: requires human/algorithmic audit before promotion
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    USER_OBSERVATIONS_STORE.append(record)
    return {
        "status": "success",
        "message": "Observation submitted for quality scoring and moderation.",
        "observation_id": record["id"],
        "moderation_status": "pending",
    }
