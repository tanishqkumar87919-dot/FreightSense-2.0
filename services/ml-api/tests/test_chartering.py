import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_charter_candidates():
    """Verify endpoint returns candidate bulk vessels with Baltic specs."""
    response = client.get("/api/v1/chartering/candidates")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    
    # Check required attributes on candidate vessels
    for v in data:
        assert "id" in v
        assert "name" in v
        assert "vessel_class" in v
        assert "dwt" in v
        assert "typical_draft_m" in v
        assert "laden_speed_knots" in v
        assert "daily_bunker_fuel_mt" in v
        assert "provenance" in v
        assert v["provenance"]["status"] == "demo"


def test_evaluate_chartering_canonical_sih():
    """Verify evaluation of 50,000 MT coal to Paradip."""
    payload = {
        "commodity_id": "cmd-coking-coal",
        "cargo_quantity_mt": 50000.0,
        "origin_port": "Newcastle / Hay Point",
        "destination_port": "port-in-prt",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
        "target_freight_usd_mt": 15.0,
        "daily_hire_usd_day": 15500.0,
        "bunker_fuel_price_usd_mt": 615.0,
    }
    response = client.post("/api/v1/chartering/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["cargo_quantity_mt"] == 50000.0
    assert data["candidates_analyzed"] >= 5
    assert len(data["vessel_analyses"]) >= 5
    assert "advisory_notice" in data

    # Check top candidate details
    top = data["vessel_analyses"][0]
    assert "vessel" in top
    assert "fit_score" in top
    assert top["fit_score"]["total_score"] > 0
    assert "voyage_economics" in top
    assert top["voyage_economics"]["voyage_charter_usd_mt"] > 0
    assert top["voyage_economics"]["time_charter_usd_mt"] > 0
    assert "demurrage_exposure" in top
    assert top["demurrage_exposure"]["allowed_laytime_days"] > 0
    assert "ballast_leg" in top
    assert top["ballast_leg"]["ballast_days"] > 0


def test_evaluate_chartering_haldia_lighterage():
    """Verify Haldia triggers lighterage constraint."""
    payload = {
        "commodity_id": "cmd-thermal-coal",
        "cargo_quantity_mt": 55000.0,
        "origin_port": "Richards Bay",
        "destination_port": "port-in-hld",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
    }
    response = client.post("/api/v1/chartering/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # All vessels at Haldia should have requires_lighterage True
    for a in data["vessel_analyses"]:
        assert a["requires_lighterage"] is True
        assert "Sandheads" in (a["lighterage_location"] or "")


def test_evaluate_chartering_user_overrides():
    """Verify user overrides for freight, hire, bunker and demurrage take effect."""
    payload = {
        "commodity_id": "cmd-iron-ore",
        "cargo_quantity_mt": 120000.0,
        "origin_port": "Port Hedland",
        "destination_port": "port-in-prt",
        "laycan_start": "2026-11-01",
        "laycan_end": "2026-11-10",
        "target_freight_usd_mt": 12.50,
        "daily_hire_usd_day": 26000.0,
        "bunker_fuel_price_usd_mt": 650.0,
        "demurrage_rate_usd_day": 35000.0,
        "port_cost_usd": 50000.0,
    }
    response = client.post("/api/v1/chartering/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    top = data["vessel_analyses"][0]
    assert top["demurrage_exposure"]["daily_demurrage_rate_usd"] == 35000.0
    assert any("Voyage Freight: $12.50/MT" in asm for asm in top["voyage_economics"]["calculation_assumptions"])


def test_evaluate_chartering_invalid_dates_fallback():
    """Verify malformed laycan dates gracefully fall back to defaults."""
    payload = {
        "commodity_id": "cmd-coking-coal",
        "cargo_quantity_mt": 45000.0,
        "origin_port": "Gladstone",
        "destination_port": "Visakhapatnam",
        "laycan_start": "invalid-date",
        "laycan_end": "invalid-date",
    }
    response = client.post("/api/v1/chartering/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["vessel_analyses"]) >= 5
