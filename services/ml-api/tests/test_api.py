import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "champion_model" in data

def test_routes_endpoint():
    res = client.get("/api/v1/routes")
    assert res.status_code == 200
    routes = res.json()
    assert len(routes) >= 3
    assert routes[0]["id"] == "route-sha-rot"

def test_markets_endpoint():
    res = client.get("/api/v1/markets")
    assert res.status_code == 200
    assert len(res.json()) >= 3

def test_forecasts_endpoint():
    res = client.get("/api/v1/forecasts?route_id=route-sha-rot&horizon=30D")
    assert res.status_code == 200
    data = res.json()
    assert data["route_id"] == "route-sha-rot"
    assert data["horizon"] == "30D"
    assert data["expectedRateUsd"] > 0
    assert len(data["series"]) > 0

def test_model_current_endpoint():
    res = client.get("/api/v1/model/current")
    assert res.status_code == 200
    data = res.json()
    assert "Ensemble-M3" in data["version"]
    assert "evaluationMetrics" in data

def test_data_sources_registry():
    res = client.get("/api/v1/data-sources")
    assert res.status_code == 200
    sources = res.json()
    assert len(sources) >= 10
    unctad = next(s for s in sources if s["id"] == "src-unctad")
    assert unctad["access_type"] == "public"

def test_admin_retraining_requires_secret():
    # Without secret header -> 403 Forbidden
    res = client.post("/api/v1/admin/retraining/run", json={"reason": "manual"})
    assert res.status_code == 403

    # With valid secret header -> 200 OK
    headers = {"x-internal-secret": settings.API_INTERNAL_SECRET}
    res_auth = client.post("/api/v1/admin/retraining/run", json={"reason": "manual"}, headers=headers)
    assert res_auth.status_code == 200
    data = res_auth.json()
    assert data["status"] in ["success", "failed"]
    assert "message" in data

def test_forecasts_all_horizons():
    """Tests GET /api/v1/forecasts across 7D, 14D, and 30D horizons."""
    for h in ["7D", "14D", "30D"]:
        res = client.get(f"/api/v1/forecasts?route_id=route-sha-rot&horizon={h}")
        assert res.status_code == 200
        data = res.json()
        assert data["route_id"] == "route-sha-rot"
        assert data["horizon"] == h
        assert data["expectedRateUsd"] > 0
        assert data["confidencePercent"] >= 90.0
        assert len(data["series"]) >= 5
        # Ensure at least one forecast point with valid intervals exists
        forecast_pts = [pt for pt in data["series"] if pt.get("forecast") is not None]
        assert len(forecast_pts) > 0
        for pt in forecast_pts:
            assert pt["lowerBound"] <= pt["forecast"] <= pt["upperBound"]

def test_forecasts_by_route_id():
    """Tests GET /api/v1/forecasts/{route_id} across all 3 verified corridors."""
    for r in ["route-sha-rot", "route-sha-lax", "route-rot-nyc"]:
        res = client.get(f"/api/v1/forecasts/{r}?horizon=14D")
        assert res.status_code == 200
        data = res.json()
        assert data["route_id"] == r
        assert data["expectedRateUsd"] > 0

def test_forecast_generate_post_endpoint():
    """Tests POST /api/v1/forecasts/generate endpoint."""
    payload = {"route_id": "route-sha-lax", "horizon": "7D"}
    res = client.post("/api/v1/forecasts/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["route_id"] == "route-sha-lax"
    assert data["horizon"] == "7D"
    assert data["expectedRateUsd"] > 0

def test_forecast_history_endpoint():
    """Tests GET /api/v1/forecasts/history endpoint."""
    res = client.get("/api/v1/forecasts/history?route_id=route-sha-rot")
    assert res.status_code == 200
    data = res.json()
    assert data["route_id"] == "route-sha-rot"
    assert "history" in data
    assert len(data["history"]) > 0
    first = data["history"][0]
    assert "actual" in first
    assert "predicted" in first
    assert "error" in first

def test_forecast_models_endpoint():
    """Tests GET /api/v1/forecasts/models endpoint."""
    res = client.get("/api/v1/forecasts/models")
    assert res.status_code == 200
    data = res.json()
    assert "champion" in data
    assert "horizons" in data
    assert "dataset_audit" in data

def test_forecast_invalid_route_returns_404():
    """Tests that querying an invalid corridor returns 404."""
    res = client.get("/api/v1/forecasts?route_id=invalid-route-xyz")
    assert res.status_code == 404
    assert "not recognized" in res.json()["detail"]

def test_ports_endpoint():
    """Tests GET /api/v1/ports returns global and Indian ports."""
    res = client.get("/api/v1/ports")
    assert res.status_code == 200
    ports = res.json()
    assert len(ports) >= 5
    assert any(p["id"] == "port-sha" for p in ports)

def test_signals_endpoint():
    """Tests GET /api/v1/signals returns market leading signals."""
    res = client.get("/api/v1/signals")
    assert res.status_code == 200
    signals = res.json()
    assert len(signals) >= 4
    assert any(s["id"] == "sig-red-sea" for s in signals)

def test_alerts_endpoint():
    """Tests GET /api/v1/alerts returns active risk alerts."""
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 3
    assert any(a["id"] == "alt-cape-rotterdam" for a in alerts)

def test_insights_endpoint():
    """Tests GET /api/v1/insights returns grounded AI domain insights."""
    res = client.get("/api/v1/insights")
    assert res.status_code == 200
    insights = res.json()
    assert len(insights) >= 3
    assert any("Asia-Europe" in i["title"] for i in insights)

def test_dashboard_summary_endpoint():
    """Tests GET /api/v1/dashboard/summary returns consolidated KPIs."""
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "globalCompositeRate" in data
    assert "asiaEuropeRate" in data
    assert "championModel" in data
    assert data["championModel"] == "v2.5"



