import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_all_constraints_includes_new_ports():
    """Verify all 8 East Coast Indian ports are present in constraints matrix."""
    resp = client.get("/api/v1/ports/east-coast-constraints")
    assert resp.status_code == 200
    data = resp.json()
    assert "port-in-prt" in data
    assert "port-in-viz" in data
    assert "port-in-enr" in data
    assert "port-in-maa" in data
    assert "port-in-kri" in data
    assert "port-in-ccu" in data
    assert "port-in-tut" in data
    assert "port-in-dhm" in data
    assert len(data) >= 8


def test_port_id_alias_resolution():
    """Verify that colloquial port aliases are correctly resolved."""
    for alias in ["paradip", "vizag", "ennore", "chennai", "haldia", "tuticorin", "dhamra"]:
        resp = client.get(f"/api/v1/ports/east-coast-constraints/{alias}")
        assert resp.status_code == 200
        data = resp.json()
        assert "port_id" in data
        assert data["port_id"].startswith("port-in-")


def test_evaluate_port_intelligence_paradip_coal():
    """Verify single-port intelligence evaluation for Paradip with Coal parcel."""
    payload = {
        "port_id": "port-in-prt",
        "commodity_id": "cmd-coking-coal",
        "commodity_name": "Hard Coking Coal (HCC)",
        "cargo_quantity_mt": 55000,
        "vessel_class": "Panamax",
        "vessel_draft_m": 13.8,
        "ukc_requirement_m": 1.0,
    }
    resp = client.post("/api/v1/ports/intelligence/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["port_id"] == "port-in-prt"
    assert data["max_permissible_draft_m"] == 17.1
    # UKC = 17.1 - 13.8 = 3.3m
    assert data["vessel_compatibility"]["under_keel_clearance_m"] == 3.3
    assert data["vessel_compatibility"]["ukc_status"] == "Safe"
    assert data["vessel_compatibility"]["is_admissible"] is True

    # Cargo compatibility
    assert data["cargo_compatibility"]["is_supported"] is True
    assert data["cargo_compatibility"]["status"] == "Supported"
    assert data["cargo_compatibility"]["discharge_rate_mt_day"] >= 30000

    # Risk matrix: exactly 6 dimensions
    assert len(data["risk_matrix"]) == 6
    dimensions = [d["dimension"] for d in data["risk_matrix"]]
    assert any("Congestion" in d for d in dimensions)
    assert any("Draft" in d for d in dimensions)
    assert any("Weather" in d for d in dimensions)
    assert any("Vessel" in d for d in dimensions)
    assert any("Cargo" in d for d in dimensions)
    assert any("Operational" in d for d in dimensions)

    # Decision factors
    assert len(data["decision_factors"]["advantages"]) > 0
    assert len(data["decision_factors"]["required_verifications"]) > 0


def test_evaluate_port_intelligence_chennai_coal_restriction():
    """Verify that Chennai Port flags coal as legally prohibited by environmental mandate."""
    payload = {
        "port_id": "port-in-maa",
        "commodity_id": "cmd-thermal-coal",
        "commodity_name": "Thermal Coal",
        "cargo_quantity_mt": 60000,
        "vessel_class": "Panamax",
    }
    resp = client.post("/api/v1/ports/intelligence/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["cargo_compatibility"]["is_supported"] is False
    assert data["cargo_compatibility"]["status"] == "Prohibited"
    assert "High Court" in data["cargo_compatibility"]["notes"] or "MoEFCC" in data["cargo_compatibility"]["notes"]
    assert any("REGULATORY RESTRICTION" in c for c in data["decision_factors"]["constraints"])


def test_evaluate_port_intelligence_haldia_lighterage():
    """Verify that Haldia Dock Complex triggers Sandheads lighterage for Panamax draft."""
    payload = {
        "port_id": "port-in-ccu",
        "commodity_id": "cmd-coking-coal",
        "commodity_name": "Hard Coking Coal",
        "cargo_quantity_mt": 50000,
        "vessel_class": "Panamax",
        "vessel_draft_m": 13.8,
    }
    resp = client.post("/api/v1/ports/intelligence/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["vessel_compatibility"]["requires_lighterage"] is True
    assert data["vessel_compatibility"]["ukc_status"] == "Violated"
    assert data["lighterage_required"] is True
    assert "Sandheads" in (data["lighterage_location"] or "")


def test_compare_ports_intelligence():
    """Verify side-by-side comparison across candidate East Coast Indian ports."""
    payload = {
        "commodity_id": "cmd-coking-coal",
        "commodity_name": "Hard Coking Coal (HCC)",
        "cargo_quantity_mt": 50000,
        "preferred_vessel_class": "Panamax",
        "vessel_draft_m": 13.8,
    }
    resp = client.post("/api/v1/ports/intelligence/compare", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["evaluated_ports_count"] >= 8
    items = data["comparison_items"]
    assert len(items) >= 8

    # Verify Paradip is compatible with safe UKC
    prt_item = next(i for i in items if i["port_id"] == "port-in-prt")
    assert prt_item["cargo_supported"] is True
    assert prt_item["ukc_status"] == "Safe"

    # Verify Chennai has coal prohibited
    maa_item = next(i for i in items if i["port_id"] == "port-in-maa")
    assert maa_item["cargo_supported"] is False
    assert maa_item["cargo_status"] == "Prohibited"

    # Verify Haldia requires lighterage
    ccu_item = next(i for i in items if i["port_id"] == "port-in-ccu")
    assert ccu_item["lighterage_required"] is True
