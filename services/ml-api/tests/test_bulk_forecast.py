import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

BULK_ROUTES = [
    "route-aus-paradip",
    "route-indo-vizag",
    "route-saf-haldia",
    "route-aus-vizag",
]

def test_bulk_forecasts_all_corridors():
    """Verifies that all 4 East Coast India bulk trade corridors return valid forecasts."""
    for r in BULK_ROUTES:
        res = client.get(f"/api/v1/forecasts?route_id={r}&horizon=14D")
        assert res.status_code == 200, f"Failed for {r}: {res.text}"
        data = res.json()

        assert data["route_id"] == r
        assert data["unit"] == "USD/MT"
        assert data["expectedRateUsd"] > 0
        assert data["expectedRateUsd"] < 100.0  # Bulk voyage rates are typically 8-35 USD/MT
        assert data["status"] == "available"
        assert "IPA" in data["source_freshness"] or "Baltic" in data["source_freshness"]

        # Ensure series contains valid actuals and predictions
        series = data["series"]
        assert len(series) >= 5

        forecast_pts = [pt for pt in series if pt.get("forecast") is not None]
        assert len(forecast_pts) > 0
        for pt in forecast_pts:
            assert pt["lowerBound"] <= pt["forecast"] <= pt["upperBound"]


def test_bulk_forecast_horizons():
    """Tests 7D, 14D, 30D and long-range 60D/90D handling for Australia to Paradip coal corridor."""
    # Verified ML horizons
    for h in ["7D", "14D", "30D"]:
        res = client.get(f"/api/v1/forecasts?route_id=route-aus-paradip&horizon={h}")
        assert res.status_code == 200
        data = res.json()
        assert data["horizon"] == h
        assert data["status"] == "available"
        assert data["expectedRateUsd"] > 0

    # Long-range horizons outside verified 30D window
    res_60 = client.get("/api/v1/forecasts?route_id=route-aus-paradip&horizon=60D")
    assert res_60.status_code == 200
    data_60 = res_60.json()
    assert data_60["status"] == "unavailable"
    assert "Forecast unavailable for this horizon" in (data_60.get("horizon_notice") or "")


def test_forecast_baselines_endpoint():
    """Tests GET /api/v1/forecasts/baselines returning authentic manifest comparisons."""
    res = client.get("/api/v1/forecasts/baselines")
    assert res.status_code == 200
    data = res.json()

    assert "horizons" in data
    horizons = data["horizons"]
    assert "1W_7D" in horizons
    assert "2W_14D" in horizons
    assert "4W_28D" in horizons

    # Verify model comparisons inside 1W_7D
    w1 = horizons["1W_7D"]
    assert "Baseline_Naive" in w1
    assert "ML_XGBoost" in w1
    assert "ML_RandomForest" in w1
    assert w1["ML_XGBoost"]["mae"] < w1["Baseline_Naive"]["mae"]


def test_forecast_drivers_bulk():
    """Tests GET /api/v1/forecasts/drivers for bulk and container routes."""
    # Bulk route
    res_bulk = client.get("/api/v1/forecasts/drivers?route_id=route-aus-paradip")
    assert res_bulk.status_code == 200
    data_bulk = res_bulk.json()
    assert data_bulk["type"] == "bulk"
    assert len(data_bulk["drivers"]) >= 4
    features = [d["feature"] for d in data_bulk["drivers"]]
    assert "india_avg_turnaround_hours" in features

    # Container route
    res_cont = client.get("/api/v1/forecasts/drivers?route_id=route-sha-rot")
    assert res_cont.status_code == 200
    data_cont = res_cont.json()
    assert data_cont["type"] == "container"


def test_forecast_history_bulk():
    """Tests GET /api/v1/forecasts/history for bulk corridor."""
    res = client.get("/api/v1/forecasts/history?route_id=route-aus-paradip")
    assert res.status_code == 200
    data = res.json()
    assert data["route_id"] == "route-aus-paradip"
    assert data["unit"] == "USD/MT"
    assert len(data["history"]) > 0
    first_pt = data["history"][0]
    assert "actual" in first_pt
    assert "predicted" in first_pt
    assert first_pt["actual"] < 50.0  # Bulk voyage scale
