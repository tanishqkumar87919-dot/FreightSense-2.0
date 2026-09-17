# FreightSense 2.0 - Machine Learning & Ingestion Service

Production-oriented maritime intelligence platform backend powered by Python 3.11, FastAPI, authoritative data ingestion adapters, leak-free feature pipelines, and champion/challenger continuous learning.

## Quickstart

### 1. Environment Setup
```bash
cd services/ml-api
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Run Historical Data Ingestion Backfill
```bash
# Ingest all authoritative sources (P0: UNCTAD, Comtrade, World Bank, NOAA, Natural Earth; P1: Baltic, MarineTraffic, FRED, EIA, Panama Canal)
python -m app.ingestion.backfill --source all

# Ingest single source
python -m app.ingestion.backfill --source unctad
```

### 3. Model Training & Evaluation
```bash
# Train candidate forecasting model (evaluates naive baseline first, then candidate regressor)
python -m app.ml.train --target freight_rate --horizon 7
python -m app.ml.train --target freight_rate --horizon 30

# Retraining runner
python -m app.ml.retrain --reason scheduled
```

### 4. Run FastAPI Forecast Service
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive OpenAPI documentation will be accessible at: `http://localhost:8000/docs`

### 5. Run Automated Pytest Suite
```bash
PYTHONPATH=. pytest -v
```

## API Endpoints

- `GET /health`: Subsystem health & active champion model info
- `GET /api/v1/routes`: Canonical maritime tradelane corridors
- `GET /api/v1/markets`: Global container and freight indices
- `GET /api/v1/forecasts`: Multi-horizon forecasts with 95% Bayesian confidence bounds
- `POST /api/v1/forecasts`: On-demand rate projections
- `GET /api/v1/model/current`: Active champion model specification & 3-year backtest metrics
- `GET /api/v1/model/metrics`: Performance metrics by horizon
- `POST /api/v1/feedback/prediction`: User utility ratings & discrepancy reports (isolated from ground truth)
- `POST /api/v1/user-observations`: Field telemetry submissions (quarantined pending moderation)
- `GET /api/v1/data-quality`: Ingestion health, range bounds, and source latency
- `GET /api/v1/data-sources`: Authoritative source provenance registry
- `POST /api/v1/admin/retraining/run`: Controlled retraining pipeline (authorized with `x-internal-secret`)
- `GET /api/v1/admin/training-runs`: Historical training runs & champion/challenger manifest
