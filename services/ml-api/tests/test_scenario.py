import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_scenario_presets():
    """Verify endpoint returns canonical scenario presets with overrides."""
    response = client.get("/api/v1/scenario/presets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 7

    preset_ids = [p["preset_id"] for p in data]
    assert "preset-base" in preset_ids
    assert "preset-freight-surge" in preset_ids
    assert "preset-congestion" in preset_ids
    assert "preset-vessel-cape" in preset_ids
    assert "preset-laycan-shift" in preset_ids
    assert "preset-bunker-spike" in preset_ids

    for preset in data:
        assert "name" in preset
        assert "description" in preset
        assert "assumptions_summary" in preset
        assert "variable_overrides" in preset
        assert isinstance(preset["variable_overrides"], dict)


def test_simulate_scenario_base_case():
    """Verify standard simulation returns complete economics, sensitivity tables, and explainability."""
    payload = {
        "scenario_name": "Base Newcastle to Paradip Coal",
        "base_commodity_name": "Hard Coking Coal (HCC)",
        "base_origin_port": "Newcastle, Australia",
        "base_cargo_quantity_mt": 50000.0,
        "base_freight_rate_usd_mt": 15.50,
        "base_vessel_class": "Panamax",
        "base_destination_port_id": "port-in-prt",
        "base_bunker_price_usd_mt": 620.0,
        "base_charter_hire_usd_day": 18000.0,
        "base_demurrage_rate_usd_day": 18000.0,
        "base_port_waiting_days": 1.8,
        "base_port_pda_usd": 75000.0,
        "base_laycan_start": "2026-10-15",
        "base_laycan_end": "2026-10-25",
    }

    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scenario_name"] == "Base Newcastle to Paradip Coal"
    assert "timestamp" in data

    # Check Base Economics
    base_eco = data["base_economics"]
    assert base_eco["freight_rate_usd_mt"] == 15.50
    assert base_eco["total_freight_usd"] == 775000.0
    assert base_eco["demurrage_exposure_usd"] == pytest.approx(1.8 * 18000.0, 0.01)
    assert base_eco["cost_per_mt_usd"] > 15.50

    # Check Deltas for base case (should be 0)
    assert data["total_cost_delta_usd"] == 0.0
    assert data["total_cost_delta_pct"] == 0.0
    assert data["cost_per_mt_delta_usd"] == 0.0

    # Check Port & Vessel Evaluation
    assert data["port_evaluation"]["port_name"] == "Paradip Port"
    assert data["port_evaluation"]["cargo_supported"] is True
    assert data["vessel_evaluation"]["vessel_class"] == "Panamax"
    assert data["vessel_evaluation"]["ukc_status"] == "Safe"

    # Check Sensitivity Analyses
    assert "sensitivity_analyses" in data
    tables = data["sensitivity_analyses"]
    assert len(tables) >= 3
    param_names = [t["parameter_name"] for t in tables]
    assert "Port Waiting Days" in param_names
    assert "Spot Freight Rate" in param_names
    assert "VLSFO Bunker Fuel Price" in param_names

    # Check Explainability Chain
    assert "explanation_chain" in data
    assert len(data["explanation_chain"]) >= 1

    # Check Provenance
    assert "data_provenance" in data
    assert len(data["data_provenance"]) >= 1
    assert data["data_provenance"][0]["source"] == "FreightSense Scenario Orchestration Engine"


def test_simulate_scenario_freight_surge():
    """Verify simulation calculates accurate cost increases when freight surges."""
    payload = {
        "scenario_name": "Freight Surge +15%",
        "base_commodity_name": "Hard Coking Coal (HCC)",
        "base_origin_port": "Newcastle, Australia",
        "base_cargo_quantity_mt": 50000.0,
        "base_freight_rate_usd_mt": 15.50,
        "simulated_freight_rate_usd_mt": 17.83,
        "base_vessel_class": "Panamax",
        "base_destination_port_id": "port-in-prt",
        "base_bunker_price_usd_mt": 620.0,
        "base_charter_hire_usd_day": 18000.0,
        "base_demurrage_rate_usd_day": 18000.0,
        "base_port_waiting_days": 1.8,
        "base_port_pda_usd": 75000.0,
    }

    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_cost_delta_usd"] > 0
    assert data["total_cost_delta_pct"] > 0
    assert data["cost_per_mt_delta_usd"] > 0

    # Ensure change is registered in variable_changes
    changed_vars = [c["variable_name"] for c in data["variable_changes"]]
    assert any("Freight" in v for v in changed_vars)


def test_simulate_scenario_congestion_and_demurrage():
    """Verify congestion extension drives demurrage exposure without altering base freight."""
    payload = {
        "scenario_name": "Congestion Surge",
        "base_commodity_name": "Hard Coking Coal (HCC)",
        "base_origin_port": "Newcastle, Australia",
        "base_cargo_quantity_mt": 50000.0,
        "base_freight_rate_usd_mt": 15.50,
        "base_vessel_class": "Panamax",
        "base_destination_port_id": "port-in-prt",
        "base_port_waiting_days": 1.8,
        "simulated_port_waiting_days": 6.8,
        "base_demurrage_rate_usd_day": 20000.0,
        "base_bunker_price_usd_mt": 620.0,
        "base_charter_hire_usd_day": 18000.0,
        "base_port_pda_usd": 75000.0,
    }

    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    dem_comp = data["demurrage_comparison"]
    assert dem_comp["base_exposure_usd"] == pytest.approx(1.8 * 20000.0, 0.01)
    assert dem_comp["simulated_exposure_usd"] == pytest.approx(6.8 * 20000.0, 0.01)
    assert dem_comp["delta_demurrage_usd"] == pytest.approx(100000.0, 0.01)


def test_simulate_scenario_port_switch_environmental_restriction():
    """Verify switching destination to Chennai for coal triggers environmental restriction warning."""
    payload = {
        "scenario_name": "Chennai Coal Diversion",
        "base_commodity_name": "Hard Coking Coal (HCC)",
        "base_origin_port": "Newcastle, Australia",
        "base_cargo_quantity_mt": 50000.0,
        "base_freight_rate_usd_mt": 15.50,
        "base_vessel_class": "Panamax",
        "base_destination_port_id": "port-in-prt",
        "simulated_destination_port_id": "port-in-maa",  # Chennai
        "base_bunker_price_usd_mt": 620.0,
        "base_charter_hire_usd_day": 18000.0,
        "base_demurrage_rate_usd_day": 18000.0,
        "base_port_waiting_days": 1.8,
        "base_port_pda_usd": 75000.0,
    }

    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    port_eval = data["port_evaluation"]
    assert port_eval["cargo_supported"] is False
    assert "prohibited" in port_eval["cargo_restriction_note"].lower() or "ennore" in port_eval["cargo_restriction_note"].lower()

    # Verify decision factors note regulatory prohibition
    constraints = " ".join(data["decision_factors"]["operational_constraints"])
    assert "REGULATORY PROHIBITION" in constraints


def test_simulate_scenario_vessel_shift():
    """Verify shifting to Capesize alters steaming speed, fuel burn, and economy of scale."""
    payload = {
        "scenario_name": "Cape Shift",
        "base_commodity_name": "Iron Ore Fines",
        "base_origin_port": "Port Hedland, Australia",
        "base_cargo_quantity_mt": 70000.0,
        "base_freight_rate_usd_mt": 14.0,
        "base_vessel_class": "Panamax",
        "simulated_vessel_class": "Capesize",
        "simulated_cargo_quantity_mt": 150000.0,
        "simulated_charter_hire_usd_day": 28000.0,
        "base_destination_port_id": "port-in-kri",  # Krishnapatnam
        "base_bunker_price_usd_mt": 600.0,
        "base_charter_hire_usd_day": 18000.0,
        "base_demurrage_rate_usd_day": 20000.0,
        "base_port_waiting_days": 1.5,
        "base_port_pda_usd": 75000.0,
    }

    response = client.post("/api/v1/scenario/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["vessel_evaluation"]["vessel_class"] == "Capesize"
    assert data["simulated_scenario_summary"]["quantity_mt"] == 150000.0
    assert data["simulated_economics"]["bunker_cost_usd"] > data["base_economics"]["bunker_cost_usd"]
