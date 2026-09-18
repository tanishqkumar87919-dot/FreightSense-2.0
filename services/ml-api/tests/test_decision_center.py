import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ALLOWED_PROVENANCE = {
    "LIVE",
    "HISTORICAL",
    "SIMULATED",
    "CONFIGURED",
    "USER INPUT",
    "CALCULATED",
    "MODEL OUTPUT",
    "UNAVAILABLE",
    "GROUNDED",
}


def test_decision_center_evaluate_valid():
    payload = {
        "cargo_type": "Thermal Coal",
        "cargo_quantity": 75000.0,
        "origin_port": "Newcastle, Australia",
        "origin_country": "Australia",
        "destination_port_id": "port-in-prt",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
        "vessel_class": "Panamax",
        "charter_type": "Voyage",
        "freight_assumption_usd_pmt": 15.50,
        "bunker_assumption_usd_pmt": 620.0,
        "active_scenario": "base",
    }
    response = client.post("/api/v1/decision-center/evaluate", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    # 1. Check all 9 workflow steps
    assert len(data["steps"]) == 9
    step_ids = [s["id"] for s in data["steps"]]
    expected_step_ids = [
        "cargo", "route", "forecast", "vessel", "port",
        "economics", "scenario", "intelligence", "decision"
    ]
    assert step_ids == expected_step_ids
    for s in data["steps"]:
        assert s["status"] == "completed"

    # 2. Check 9-node decision trace
    assert len(data["decision_trace"]) == 9
    trace_ids = [t["node_id"] for t in data["decision_trace"]]
    assert "trace-01-cargo" in trace_ids
    assert "trace-03-forecast" in trace_ids
    assert "trace-06-economics" in trace_ids
    assert "trace-09-decision" in trace_ids

    # 3. Check modular results
    assert "cargo_result" in data
    assert "route_result" in data
    assert "forecast_result" in data
    assert "vessel_result" in data
    assert "port_result" in data
    assert "economics_result" in data
    assert "scenario_result" in data
    assert "explainability_result" in data

    # 4. Check economics calculations
    econ = data["economics_result"]
    assert econ["ocean_freight_usd"] > 0
    assert econ["total_voyage_cost_usd"] > 0
    assert econ["cost_per_mt_usd"] > 0

    # 5. Check decision factors
    assert len(data["decision_factors"]) >= 5
    for f in data["decision_factors"]:
        assert f["data_provenance"] in ALLOWED_PROVENANCE

    # 6. Check neutral factual decision summary
    summary = data["decision_summary"]
    assert len(summary["freight_outlook"]) > 10
    assert len(summary["vessel_fit"]) > 10
    assert len(summary["port_fit"]) > 10
    assert len(summary["key_assumptions"]) >= 2
    assert len(summary["known_limitations"]) >= 1

    # 7. Check side-by-side comparison
    assert len(data["side_by_side_comparisons"]) >= 5
    metrics = [c["metric"] for c in data["side_by_side_comparisons"]]
    assert "Freight Rate" in metrics
    assert "Total Landed Cost" in metrics


def test_decision_center_validation_laycan_error():
    payload = {
        "cargo_type": "Thermal Coal",
        "cargo_quantity": 75000.0,
        "origin_port": "Newcastle, Australia",
        "destination_port_id": "port-in-prt",
        "laycan_start": "2026-10-25",
        "laycan_end": "2026-10-15",  # Invalid: end before start
        "vessel_class": "Panamax",
    }
    response = client.post("/api/v1/decision-center/evaluate", json=payload)
    assert response.status_code == 422
    assert "Laycan" in response.json()["detail"]


def test_decision_center_validation_cargo_quantity_error():
    payload = {
        "cargo_type": "Thermal Coal",
        "cargo_quantity": -5000.0,  # Invalid: negative quantity
        "origin_port": "Newcastle, Australia",
        "destination_port_id": "port-in-prt",
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
        "vessel_class": "Panamax",
    }
    response = client.post("/api/v1/decision-center/evaluate", json=payload)
    assert response.status_code == 422
    assert "Cargo Validation Error" in response.json()["detail"]


def test_decision_center_data_provenance_map():
    payload = {
        "cargo_type": "Hard Coking Coal (HCC)",
        "cargo_quantity": 50000.0,
        "origin_port": "Newcastle, Australia",
        "destination_port_id": "port-in-dhm",
        "laycan_start": "2026-11-01",
        "laycan_end": "2026-11-12",
        "vessel_class": "Panamax",
    }
    response = client.post("/api/v1/decision-center/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    prov_map = data["data_provenance_map"]
    assert prov_map["cargo_quantity"] == "USER INPUT"
    assert prov_map["forecast_rate"] == "MODEL OUTPUT"
    assert prov_map["voyage_economics"] == "CALCULATED"
    assert prov_map["scenario_variance"] == "SIMULATED"
