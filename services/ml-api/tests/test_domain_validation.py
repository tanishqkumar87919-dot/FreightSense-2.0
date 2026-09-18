import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient

from app.main import app

from app.domain.models import (
    DryBulkVesselClassModel,
    EastCoastPortConstraintModel,
    CharterValidationRequest,
)
from app.domain.validation import (
    validate_cargo_quantity,
    validate_laycan,
    validate_port_draft,
    validate_charter_fixture,
)
from app.api.routes.port_constraints import CANONICAL_PORT_CONSTRAINTS
from app.api.routes.bulk import CANONICAL_VESSEL_CLASSES

client = TestClient(app)


def test_validate_cargo_quantity():
    # Negative cargo
    ok, err = validate_cargo_quantity(-100)
    assert not ok
    assert "positive" in err

    # Zero cargo
    ok, err = validate_cargo_quantity(0)
    assert not ok

    # Exceeding global bounds
    ok, err = validate_cargo_quantity(500000)
    assert not ok
    assert "exceeds maximum" in err

    # Valid parcel
    ok, err = validate_cargo_quantity(120000)
    assert ok
    assert err is None


def test_validate_laycan_dates():
    # Valid laycan
    ok, err, warn = validate_laycan("2026-10-01", "2026-10-10")
    assert ok
    assert err is None

    # Inverted dates
    ok, err, warn = validate_laycan("2026-10-15", "2026-10-05")
    assert not ok
    assert "cannot be after" in err

    # Malformed dates
    ok, err, warn = validate_laycan("not-a-date", "2026-10-05")
    assert not ok
    assert "Invalid laycan" in err

    # Long laycan warning
    ok, err, warn = validate_laycan("2026-10-01", "2026-11-15")
    assert ok
    assert warn is not None


def test_port_draft_validation():
    paradip_data = EastCoastPortConstraintModel(**CANONICAL_PORT_CONSTRAINTS["port-in-prt"])
    haldia_data = EastCoastPortConstraintModel(**CANONICAL_PORT_CONSTRAINTS["port-in-ccu"])
    chennai_data = EastCoastPortConstraintModel(**CANONICAL_PORT_CONSTRAINTS["port-in-maa"])

    # 1. 14.5m vessel at Paradip (max 17.1m) -> Admissible without lighterage
    res, msg = validate_port_draft(14.5, paradip_data, ukc_req_m=1.0)
    assert res.is_admissible is True
    assert res.requires_lighterage is False
    assert res.under_keel_clearance_m == 2.6

    # 2. 14.5m vessel at Haldia (max 8.2m, riverine) -> Requires lighterage at Sandheads
    res, msg = validate_port_draft(14.5, haldia_data, ukc_req_m=1.0)
    assert res.is_admissible is True
    assert res.requires_lighterage is True
    assert "Sandheads" in res.lighterage_location

    # 3. 16.5m Capesize at Chennai (max 14.0m, no lighterage) -> NOT admissible
    res, msg = validate_port_draft(16.5, chennai_data, ukc_req_m=1.0)
    assert res.is_admissible is False
    assert res.requires_lighterage is False


def test_api_bulk_commodities():
    response = client.get("/api/v1/bulk/commodities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    categories = [c["category"] for c in data]
    assert "Coking Coal" in categories
    assert "Thermal Coal" in categories
    assert "Iron Ore" in categories


def test_api_bulk_vessel_classes():
    response = client.get("/api/v1/bulk/vessel-classes")
    assert response.status_code == 200
    data = response.json()
    names = [v["name"] for v in data]
    assert "Capesize" in names
    assert "Panamax" in names
    assert "Supramax" in names


def test_api_bulk_routes():
    response = client.get("/api/v1/bulk/routes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    route_ids = [r["id"] for r in data]
    assert "route-aus-paradip" in route_ids
    assert "route-indo-vizag" in route_ids
    assert "route-saf-haldia" in route_ids


def test_api_east_coast_constraints():
    response = client.get("/api/v1/ports/east-coast-constraints")
    assert response.status_code == 200
    data = response.json()
    assert "port-in-prt" in data
    assert "port-in-viz" in data
    assert "port-in-ccu" in data
    assert data["port-in-prt"]["max_permissible_draft_m"] == 17.1
    assert data["port-in-ccu"]["lighterage_required"] is True


def test_api_port_feasibility_check():
    # Feasible check
    req = {
        "port_id": "port-in-prt",
        "vessel_draft_m": 15.0,
        "ukc_requirement_m": 1.0,
    }
    response = client.post("/api/v1/ports/check-feasibility", json=req)
    assert response.status_code == 200
    res = response.json()
    assert res["is_admissible"] is True
    assert res["under_keel_clearance_m"] == 2.1

    # Inadmissible check
    req_bad = {
        "port_id": "port-in-maa",
        "vessel_draft_m": 17.0,
        "ukc_requirement_m": 1.0,
    }
    response_bad = client.post("/api/v1/ports/check-feasibility", json=req_bad)
    assert response_bad.status_code == 200
    res_bad = response_bad.json()
    assert res_bad["is_admissible"] is False


def test_api_validate_charter_fixture():
    # Valid Capesize fixture to Paradip
    valid_req = {
        "commodity_id": "cmd-coking-coal",
        "commodity_name": "Hard Coking Coal",
        "cargo_quantity_mt": 140000,
        "origin_port_id": "port-aus-haypoint",
        "destination_port_id": "port-in-prt",
        "preferred_vessel_class": "Capesize",
        "laycan_start": "2026-10-05",
        "laycan_end": "2026-10-12",
        "charter_type": "spot_voyage",
    }
    response = client.post("/api/v1/bulk/validate-charter", json=valid_req)
    assert response.status_code == 200
    res = response.json()
    assert res["valid"] is True
    assert res["draft_feasibility"]["is_admissible"] is True
    assert res["estimated_discharge_days"] > 0
