import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_cargo_analysis_valid_request():
    payload = {
        "cargo_type": "cmd-coking-coal",
        "cargo_quantity": 50000.0,
        "quantity_unit": "MT",
        "origin_country": "Australia",
        "origin_port": "Hay Point (Queensland)",
        "destination_port": "port-in-prt",
        "delivery_date": "2026-10-31",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
        "preferred_vessel_type": "Panamax",
        "target_freight": 15.0,
        "budget": 800000.0,
        "contract_type": "spot_voyage",
        "is_demo": False,
    }

    response = client.post("/api/v1/cargo-analysis", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["request_id"].startswith("CARGO-ANL-")
    assert data["is_demo"] is False
    assert "cargo_requirement" in data
    assert "freight_market" in data
    assert "chartering_context" in data
    assert "vessel_context" in data
    assert "port_context" in data
    assert "route_context" in data
    assert "cost_context" in data
    assert "decision_workspace" in data
    assert "data_provenance" in data

    # Check cargo context
    assert data["cargo_requirement"]["cargo_quantity_mt"] == 50000.0
    assert data["cargo_requirement"]["quantity_unit"] == "MT"

    # Check port context
    assert data["port_context"]["destination_port_id"] == "port-in-prt"
    assert data["port_context"]["max_permissible_draft_m"] == 17.1
    assert data["port_context"]["is_admissible"] is True

    # Check cost context
    assert data["cost_context"]["freight_rate_usd_mt"] > 0
    assert data["cost_context"]["estimated_freight_baseline_usd"] > 0
    assert "Cost analysis will be generated" in data["cost_context"]["cost_status_notice"]

    # Check freight market context notice
    assert "Forecast analysis will be generated" in data["freight_market"]["forecast_status"]


def test_cargo_analysis_demo_scenario():
    payload = {
        "cargo_type": "Hard Coking Coal (HCC)",
        "cargo_quantity": 50000.0,
        "quantity_unit": "MT",
        "origin_country": "Australia",
        "origin_port": "Newcastle",
        "destination_port": "Paradip Port",
        "delivery_date": "2026-10-31",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
        "preferred_vessel_type": "Panamax",
        "target_freight": 15.0,
        "budget": 800000.0,
        "contract_type": "spot_voyage",
        "is_demo": True,
    }

    response = client.post("/api/v1/cargo-analysis", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_demo"] is True
    assert data["cargo_requirement"]["is_demo"] is True
    assert data["chartering_context"]["laycan_window_days"] == 10
    assert data["vessel_context"]["vessel_class"] == "Panamax"
    assert data["port_context"]["port_code"] == "INPRT"


def test_cargo_analysis_invalid_quantity():
    payload = {
        "cargo_type": "cmd-coking-coal",
        "cargo_quantity": -100.0,
        "quantity_unit": "MT",
        "origin_country": "Australia",
        "origin_port": "Newcastle",
        "destination_port": "port-in-prt",
        "delivery_date": "2026-10-31",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
        "preferred_vessel_type": "Panamax",
    }
    response = client.post("/api/v1/cargo-analysis", json=payload)
    assert response.status_code == 422


def test_cargo_analysis_inverted_laycan():
    payload = {
        "cargo_type": "cmd-coking-coal",
        "cargo_quantity": 50000.0,
        "quantity_unit": "MT",
        "origin_country": "Australia",
        "origin_port": "Newcastle",
        "destination_port": "port-in-prt",
        "delivery_date": "2026-10-31",
        "laycan_start": "2026-10-25",
        "laycan_end": "2026-10-15",
        "preferred_vessel_type": "Panamax",
    }
    response = client.post("/api/v1/cargo-analysis", json=payload)
    assert response.status_code == 422


def test_cargo_analysis_haldia_lighterage():
    payload = {
        "cargo_type": "Thermal Coal",
        "cargo_quantity": 70000.0,
        "quantity_unit": "MT",
        "origin_country": "South Africa",
        "origin_port": "Richards Bay",
        "destination_port": "port-in-ccu",  # Haldia Dock Complex
        "delivery_date": "2026-11-15",
        "laycan_start": "2026-10-20",
        "laycan_end": "2026-10-30",
        "preferred_vessel_type": "Panamax",
    }
    response = client.post("/api/v1/cargo-analysis", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["port_context"]["requires_lighterage"] is True
    assert "Sandheads" in (data["port_context"]["lighterage_location"] or "")
    # Check decision workspace has Port Constraints item
    port_item = next((item for item in data["decision_workspace"] if item["category"] == "Port Constraints"), None)
    assert port_item is not None
    assert port_item["status"] in ["CAUTION", "RESTRICTED"]


def test_cargo_analysis_decision_workspace_integrity():
    payload = {
        "cargo_type": "Iron Ore Fines",
        "cargo_quantity": 140000.0,
        "quantity_unit": "MT",
        "origin_country": "Australia",
        "origin_port": "Port Hedland",
        "destination_port": "port-in-viz",
        "delivery_date": "2026-11-20",
        "laycan_start": "2026-11-01",
        "laycan_end": "2026-11-10",
        "preferred_vessel_type": "Capesize",
    }
    response = client.post("/api/v1/cargo-analysis", json=payload)
    assert response.status_code == 200
    data = response.json()

    categories = [item["category"] for item in data["decision_workspace"]]
    expected_categories = [
        "Freight Outlook",
        "Chartering Context",
        "Vessel Compatibility",
        "Port Constraints",
        "Route Risk",
        "Cost Exposure",
    ]
    for cat in expected_categories:
        assert cat in categories

    for item in data["decision_workspace"]:
        assert len(item["status"]) > 0
        assert len(item["available_data"]) > 0
        assert len(item["relevant_evidence"]) > 0
        assert len(item["actionable_recommendation"]) > 0


def test_cargo_analysis_provenance():
    payload = {
        "cargo_type": "cmd-limestone",
        "cargo_quantity": 55000.0,
        "quantity_unit": "MT",
        "origin_country": "UAE",
        "origin_port": "Mina Saqr",
        "destination_port": "port-in-prt",
        "delivery_date": "2026-12-01",
        "laycan_start": "2026-11-15",
        "laycan_end": "2026-11-25",
        "preferred_vessel_type": "Supramax",
    }
    response = client.post("/api/v1/cargo-analysis", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["data_provenance"]) >= 4
    for prov in data["data_provenance"]:
        assert "source" in prov
        assert "dataset_name" in prov
        assert "status" in prov
