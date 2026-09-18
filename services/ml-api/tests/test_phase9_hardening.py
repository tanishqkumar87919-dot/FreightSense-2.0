import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_phase9_data_quality_endpoint():
    """Verify /api/v1/data-quality returns healthy quality gates and source freshness."""
    resp = client.get("/api/v1/data-quality")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "quality_gates" in data
    assert data["quality_gates"]["schema_validation"] == "100% Passed"
    assert "source_freshness" in data
    assert len(data["source_freshness"]) >= 10
    assert "target_freight_dataset" in data
    assert data["target_freight_dataset"]["total_records_ingested"] == 570


def test_phase9_intelligence_data_quality():
    """Verify /api/v1/intelligence/data-quality returns evidence state and sources."""
    resp = client.get("/api/v1/intelligence/data-quality")
    assert resp.status_code == 200
    data = resp.json()
    assert "evidence_state" in data
    assert data["evidence_state"] in ["HIGH EVIDENCE", "MODERATE EVIDENCE", "LIMITED EVIDENCE", "INSUFFICIENT DATA"]
    assert "verified_sources_count" in data
    assert data["verified_sources_count"] >= 3


def test_phase9_model_card_transparency():
    """Verify /api/v1/intelligence/model-card returns model architecture and metrics."""
    resp = client.get("/api/v1/intelligence/model-card")
    assert resp.status_code == 200
    data = resp.json()
    assert "model_name" in data
    assert "version" in data
    assert "metrics" in data
    assert "mae" in data["metrics"]
    assert "rmse" in data["metrics"]
    assert "training_data_period" in data
    assert "evaluation_method" in data
    assert "status" in data


def test_phase9_decision_center_epistemic_provenance():
    """Verify Decision Center includes KNOWN, ESTIMATED, SIMULATED, UNKNOWN epistemic tags."""
    payload = {
        "cargo_type": "Coking Coal",
        "cargo_quantity": 75000.0,
        "origin_port": "Gladstone, Australia",
        "origin_country": "Australia",
        "destination_port_id": "port-in-prt",
        "vessel_class": "Panamax",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
        "charter_type": "Spot Voyage Charter",
        "freight_assumption_usd_pmt": 15.80,
    }
    resp = client.post("/api/v1/decision-center/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    # Check epistemic classifications in data provenance map
    prov_map = data.get("data_provenance_map", {})
    assert prov_map.get("epistemic_port_limits") == "KNOWN"
    assert prov_map.get("epistemic_forecast") == "ESTIMATED"
    assert prov_map.get("epistemic_what_if") == "SIMULATED"
    assert prov_map.get("epistemic_unobserved") == "UNKNOWN"

    # Check 9 steps are complete
    assert len(data["steps"]) == 9
    assert all(s["status"] == "completed" for s in data["steps"])


def test_phase9_error_sanitization():
    """Ensure malformed payload does not leak server traces or internal paths."""
    malformed_payload = {
        "cargo_type": "Iron Ore",
        "cargo_quantity": -500.0,  # Invalid quantity
        "origin_port": "Port Hedland",
        "destination_port_id": "port-in-prt",
        "laycan_start": "2026-10-25",
        "laycan_end": "2026-10-15",  # Inverted laycan
    }
    resp = client.post("/api/v1/decision-center/evaluate", json=malformed_payload)
    assert resp.status_code == 422
    err_detail = resp.json().get("detail", "")
    assert "Traceback" not in str(err_detail)
    assert "/Users/" not in str(err_detail)
    assert ".py" not in str(err_detail)
