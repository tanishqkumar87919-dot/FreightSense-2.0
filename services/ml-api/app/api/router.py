from fastapi import APIRouter
from app.api.routes import health, routes, forecasts, models, feedback, data_quality, data_sources, admin

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(routes.router, tags=["Routes & Markets"])
api_router.include_router(forecasts.router, tags=["Forecasting"])
api_router.include_router(models.router, tags=["Models"])
api_router.include_router(feedback.router, tags=["Feedback & Observations"])
api_router.include_router(data_quality.router, tags=["Data Quality"])
api_router.include_router(data_sources.router, tags=["Data Sources Registry"])
api_router.include_router(admin.router, tags=["Admin & Retraining"])
