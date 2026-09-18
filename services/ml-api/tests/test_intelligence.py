import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_intelligence_context():
    """Verify endpoint returns complete grounded intelligence context."""
    response = client.get(
        "/api/v1/intelligence/context",
        params={
            "commodity_name": "Hard Coking Coal (HCC)",
            "cargo_quantity_mt": 50000.0,
            "origin_port": "Newcastle, Australia",
            "destination_port_id": "port-in-prt",
            "vessel_class": "Panamax",
            "forecast_rate_usd_mt": 15.50,
            "waiting_days": 1.8,
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert data["commodity_name"] == "Hard Coking Coal (HCC)"
    assert data["cargo_quantity_mt"] == 50000.0
    assert data["destination_port_id"] == "port-in-prt"
    assert data["destination_port"] == "Paradip Port"
    assert data["vessel_class"] == "Panamax"
    assert data["forecast_rate_usd_mt"] == 15.50

    # Verify Uncertainty Intervals
    intervals = data["uncertainty_intervals"]
    for horizon in ["horizon_7d", "horizon_15d", "horizon_30d", "horizon_45d", "horizon_60d", "horizon_90d"]:
        assert horizon in intervals
        assert intervals[horizon]["lower"] <= intervals[horizon]["forecast"] <= intervals[horizon]["upper"]

    # Verify Feature Drivers
    drivers = data["feature_drivers"]
    assert len(drivers) >= 5
    assert drivers[0]["feature"] == "india_avg_turnaround_hours"
    assert drivers[0]["weight_pct"] == 34.2
    assert "Port Turnaround" in drivers[0]["name"]

    # Verify Decision Trace
    trace = data["decision_trace"]
    assert len(trace) == 7
    node_phases = [n["phase_number"] for n in trace]
    assert 2 in node_phases
    assert 3 in node_phases
    assert 4 in node_phases
    assert 5 in node_phases
    assert 6 in node_phases
    assert 7 in node_phases

    # Verify Assumptions & Model Card
    assert len(data["assumptions"]) >= 8
    assert data["model_card"]["version"] == "v2.5"
    assert data["model_card"]["status"] == "champion"

    # Verify Data Quality & Missing Variables
    assert data["data_quality"]["evidence_state"] == "MODERATE EVIDENCE"
    assert len(data["missing_variables"]) >= 5
    assert len(data["explanation_flow"]) == 4


def test_explain_why_forecast_increasing():
    """Verify explain response for 'Why is forecast increasing?'"""
    payload = {
        "query": "Why is the 30-day forecast increasing for Australia to Paradip?",
        "commodity_name": "Hard Coking Coal (HCC)",
        "destination_port_id": "port-in-prt",
        "cargo_quantity_mt": 50000.0,
        "forecast_rate_usd_mt": 15.50,
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Forecast Explainability"
    assert "projected at $15.50/MT" in data["answer"]
    assert len(data["evidence"]) >= 3
    assert "ocean freight totals $775,000" in data["impact"]
    assert "95% Empirical Prediction Interval" in data["uncertainty"]
    assert len(data["decision_factors"]) >= 3
    assert len(data["trace_nodes"]) == 7


def test_explain_top_drivers():
    """Verify explain response for 'What are the top 3 drivers influencing this freight rate?'"""
    payload = {
        "query": "What are the top 3 drivers influencing this freight rate?",
        "destination_port_id": "port-in-prt",
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Feature Importance & Attribution"
    assert "Destination Port Turnaround & Congestion (34.2%)" in data["answer"]
    assert "VLSFO Bunker Fuel Price (26.5%)" in data["answer"]
    assert len(data["evidence"]) >= 4


def test_explain_vessel_compatibility():
    """Verify explain response for 'Is a Capesize vessel compatible with Paradip Port?'"""
    payload = {
        "query": "Is a Capesize vessel compatible with Paradip Port?",
        "vessel_class": "Capesize",
        "destination_port_id": "port-in-prt",
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Vessel Compatibility & Hydrodynamics"
    assert "Fully compatible with direct deepwater berthing" in data["answer"]
    assert "17.1m" in data["answer"]


def test_explain_waiting_time_scenario():
    """Verify explain response for 'What happens to total cost if destination port waiting time increases by 3 days?'"""
    payload = {
        "query": "What happens to total cost if destination port waiting time increases by 3 days?",
        "cargo_quantity_mt": 50000.0,
        "destination_port_id": "port-in-prt",
        "waiting_days": 1.8,
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Scenario Impact & Demurrage Analysis"
    assert "$90,000 in additional demurrage" in data["answer"]
    assert "+$1.80/MT" in data["answer"]


def test_explain_missing_variables():
    """Verify explain response for 'What variables are currently unobserved or missing?'"""
    payload = {
        "query": "What variables are currently unobserved or missing from this analysis?",
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Data Coverage & Operational Gaps"
    assert "Live berth queue lineups" in data["answer"]
    assert "Private shipbroker fixtures" in data["answer"]
    assert len(data["limitations"]) >= 5


def test_explain_demurrage_vs_charter_allowance():
    """Verify explain response for 'How does the estimated demurrage compare to standard charter party allowance?'"""
    payload = {
        "query": "How does the estimated demurrage compare to standard charter party allowance?",
        "cargo_quantity_mt": 50000.0,
        "destination_port_id": "port-in-prt",
        "waiting_days": 1.8,
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Charter Party & Laytime Analysis"
    assert "allowed laytime is 1.64 days" in data["answer"]
    assert "30,500 MT/day" in data["answer"]


def test_explain_bunker_assumptions():
    """Verify explain response for bunker fuel assumptions."""
    payload = {
        "query": "What assumptions is the voyage economics model making for bunker fuel?",
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Bunker Fuel & Voyage Economics"
    assert "$620.00/MT" in data["answer"]
    assert "28.0 MT/day" in data["answer"]


def test_explain_recommended_chartering_window():
    """Verify explain response for recommended laycan window."""
    payload = {
        "query": "What is the recommended chartering window based on the forecast trend?",
        "cargo_quantity_mt": 50000.0,
        "forecast_rate_usd_mt": 15.50,
        "laycan_start": "2026-10-15",
        "laycan_end": "2026-10-25",
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Chartering & Procurement Recommendation"
    assert "Fix laycan within 15 to 30 days" in data["answer"]
    assert "$30,000 to $47,500" in data["impact"]


def test_explain_unsupported_query_fallback():
    """Verify unsupported queries receive clean, auditable domain boundary fallback."""
    payload = {
        "query": "Who is going to win the FIFA World Cup tournament in 2026?",
    }
    response = client.post("/api/v1/intelligence/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["intent_category"] == "Out of Scope / Insufficient Context"
    assert data["answer"] == (
        "I don't have enough data in the current FreightSense context to answer that. "
        "FreightSense Intelligence is strictly bounded to bulk cargo procurement, freight forecasting, "
        "vessel chartering, East Coast India port constraints, and voyage economics."
    )
    assert data["data_status"] == "Out of Scope"


def test_get_model_card():
    """Verify endpoint returns champion forecasting model card."""
    response = client.get("/api/v1/intelligence/model-card")
    assert response.status_code == 200
    data = response.json()

    assert data["model_name"] == "FreightSense XGBoost Multi-Horizon Delta Estimator + Empirical 95% Uncertainty"
    assert data["version"] == "v2.5"
    assert data["algorithm"].startswith("Gradient Boosted Decision Trees")
    assert data["metrics"]["interval_coverage"] == 95.0
    assert data["metrics"]["directional_accuracy"] == 95.4
    assert data["status"] == "champion"
    assert "india_avg_turnaround_hours" in data["feature_set"]


def test_get_assumptions():
    """Verify endpoint returns complete canonical assumption register."""
    response = client.get("/api/v1/intelligence/assumptions")
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 8
    parameters = [a["parameter"] for a in data]
    assert "VLSFO Bunker Fuel Price" in parameters
    assert "Paradip Anchorage Waiting Time" in parameters
    assert "Panamax Daily Charter Hire (TCE)" in parameters
    assert "Demurrage Rate" in parameters
    assert "Discharge Rate at Paradip" in parameters


def test_get_data_quality():
    """Verify endpoint returns transparent evidence state and criteria evaluations."""
    response = client.get("/api/v1/intelligence/data-quality")
    assert response.status_code == 200
    data = response.json()

    assert data["evidence_state"] == "MODERATE EVIDENCE"
    assert data["historical_observations_count"] == 1460
    assert len(data["criteria_evaluated"]) >= 5
    passed_criteria = [c for c in data["criteria_evaluated"] if c["passed"]]
    unobserved_criteria = [c for c in data["criteria_evaluated"] if not c["passed"]]
    assert len(passed_criteria) >= 3
    assert len(unobserved_criteria) >= 2
