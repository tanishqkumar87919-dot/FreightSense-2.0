from fastapi import APIRouter
from app.api.routes import (
    health,
    routes,
    forecasts,
    models,
    feedback,
    data_quality,
    data_sources,
    admin,
    bulk,
    port_constraints,
    cargo_analysis,
    chartering,
    scenario,
    intelligence,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(routes.router, tags=["Routes & Markets"])
api_router.include_router(forecasts.router, tags=["Forecasting"])
api_router.include_router(bulk.router, tags=["Bulk Cargo & Chartering"])
api_router.include_router(port_constraints.router, tags=["East Coast Port Constraints"])
api_router.include_router(cargo_analysis.router, tags=["Intelligent Cargo Analysis"])
api_router.include_router(chartering.router, tags=["Vessel Selection & Chartering"])
api_router.include_router(scenario.router, tags=["Scenario Simulator & What-If Engine"])
api_router.include_router(intelligence.router, tags=["Intelligence & Explainability Engine"])
api_router.include_router(models.router, tags=["Models"])
api_router.include_router(feedback.router, tags=["Feedback & Observations"])
api_router.include_router(data_quality.router, tags=["Data Quality"])
api_router.include_router(data_sources.router, tags=["Data Sources Registry"])
api_router.include_router(admin.router, tags=["Admin & Retraining"])


