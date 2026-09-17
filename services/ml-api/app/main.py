import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import health
from app.api.router import api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("freightsense")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FreightSense 2.0 Machine Learning, Authoritative Data Ingestion, and Continuous Forecasting Service",
)

# Enable CORS dynamically based on environment configuration
raw_origins = settings.ALLOWED_ORIGINS.split(",")
allowed_origins = [o.strip() for o in raw_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register health check at root /health
app.include_router(health.router, tags=["Health"])

# Register v1 API routes under /api/v1
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    logger.info("FreightSense 2.0 ML Service started on %s:%d", settings.HOST, settings.PORT)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
