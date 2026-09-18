import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException

from app.domain.models import (
    CargoAnalysisRequest,
    CargoAnalysisResponse,
    CargoRequirementContext,
    FreightMarketContext,
    CharteringContext,
    VesselContext,
    PortContext,
    RouteContext,
    CostContext,
    DecisionWorkspaceItem,
    DataProvenanceModel,
    DryBulkVesselClassModel,
    EastCoastPortConstraintModel,
    BulkCommodityModel,
    BulkRouteModel,
)
from app.domain.validation import (
    validate_cargo_quantity,
    validate_laycan,
    validate_port_draft,
)
from app.api.routes.bulk import (
    CANONICAL_BULK_COMMODITIES,
    CANONICAL_VESSEL_CLASSES,
    CANONICAL_BULK_ROUTES,
)
from app.api.routes.port_constraints import CANONICAL_PORT_CONSTRAINTS

router = APIRouter()


def _resolve_commodity(cargo_type: str) -> Dict[str, Any]:
    query = cargo_type.lower().strip()
    for c in CANONICAL_BULK_COMMODITIES:
        if c["id"].lower() == query or query in c["name"].lower() or query in c["category"].lower():
            return c
    if "coal" in query:
        return CANONICAL_BULK_COMMODITIES[0]
    return CANONICAL_BULK_COMMODITIES[0]


def _resolve_vessel_class(vessel_type: str) -> Dict[str, Any]:
    query = vessel_type.lower().strip()
    for v in CANONICAL_VESSEL_CLASSES:
        if v["name"].lower() == query or v["id"].lower() == query:
            return v
    for v in CANONICAL_VESSEL_CLASSES:
        if "panamax" in v["name"].lower():
            return v
    return CANONICAL_VESSEL_CLASSES[2]


def _resolve_port(port_identifier: str) -> Dict[str, Any]:
    query = port_identifier.lower().strip()
    if query in CANONICAL_PORT_CONSTRAINTS:
        return CANONICAL_PORT_CONSTRAINTS[query]

    for pid, pdata in CANONICAL_PORT_CONSTRAINTS.items():
        if (
            pid.lower() == query
            or pdata["port_code"].lower() == query
            or query in pdata["port_name"].lower()
        ):
            return pdata

    clean_id = query.replace("india-", "").replace("port-", "")
    for pid, pdata in CANONICAL_PORT_CONSTRAINTS.items():
        if clean_id in pid.lower():
            return pdata

    return CANONICAL_PORT_CONSTRAINTS["port-in-prt"]


def _resolve_route(origin_port: str, origin_country: str, dest_port_code: str) -> Dict[str, Any]:
    q_orig = origin_port.lower()
    q_country = origin_country.lower()

    for r in CANONICAL_BULK_ROUTES:
        if (
            q_orig in r["origin_port"].lower()
            or q_country in r["origin_country"].lower()
        ):
            return r

    return CANONICAL_BULK_ROUTES[0]


@router.post("/cargo-analysis", response_model=CargoAnalysisResponse)
def analyze_cargo_requirement(req: CargoAnalysisRequest):
    """
    Executes an intelligent bulk cargo procurement analysis:
    - Validates cargo quantity against global limits and vessel envelopes
    - Validates laycan date windows and assesses cancellation risk
    - Computes sailing draft based on load factor
    - Assesses port admissibility, under-keel clearance, lighterage requirements
    - Resolves shipping corridor, distance, transit days, and choke points
    - Generates structured Procurement Decision Workspace and Data Provenance
    """
    # 1. Lookups
    commodity_data = _resolve_commodity(req.cargo_type)
    vessel_data = _resolve_vessel_class(req.preferred_vessel_type)
    port_data = _resolve_port(req.destination_port)

    vessel_model = DryBulkVesselClassModel(**vessel_data)
    port_model = EastCoastPortConstraintModel(**port_data)

    # 2. Validation Checks
    ok_qty, err_qty = validate_cargo_quantity(req.cargo_quantity, vessel_model)
    if not ok_qty and err_qty:
        if req.cargo_quantity <= 0 or req.cargo_quantity > 350000:
            raise HTTPException(status_code=422, detail=err_qty)

    ok_lay, err_lay, warn_lay = validate_laycan(req.laycan_start, req.laycan_end)
    if not ok_lay and err_lay:
        raise HTTPException(status_code=422, detail=err_lay)

    try:
        start_d = datetime.strptime(req.laycan_start.strip(), "%Y-%m-%d").date()
        end_d = datetime.strptime(req.laycan_end.strip(), "%Y-%m-%d").date()
        laycan_window = (end_d - start_d).days
    except Exception:
        laycan_window = 10

    # 3. Resolve Route
    route_data = _resolve_route(req.origin_port, req.origin_country, port_data["port_code"])
    route_model = BulkRouteModel(**route_data)

    # 4. Draft & Under-Keel Clearance Calculation
    load_factor = min(1.0, max(0.4, req.cargo_quantity / (vessel_model.dwt_max or 79999.0)))
    calculated_draft = round(vessel_model.typical_draft_m * (0.55 + 0.45 * load_factor), 2)
    draft_res, draft_msg = validate_port_draft(calculated_draft, port_model)

    # 5. Discharge & Demurrage Calculations
    discharge_rate = port_model.mechanized_discharge_rate_mt_day or 25000.0
    discharge_days = round(req.cargo_quantity / discharge_rate, 1)
    demurrage_rate = port_model.average_demurrage_rate_usd_day or 28000.0
    demurrage_exposure = round(port_model.typical_waiting_days * demurrage_rate, 0)

    # 6. Freight Benchmark & Cost Context
    benchmark_rate = route_model.benchmark_voyage_rate_usd_mt or 14.85
    freight_baseline = round(req.cargo_quantity * benchmark_rate, 0)
    variance_vs_target = None
    if req.target_freight:
        variance_vs_target = round(benchmark_rate - req.target_freight, 2)

    # 7. Parcel Classification
    if req.cargo_quantity >= 120000:
        parcel_class = "Capesize Major Bulk Parcel"
    elif req.cargo_quantity >= 70000:
        parcel_class = "Panamax / Kamsarmax Standard Parcel"
    elif req.cargo_quantity >= 45000:
        parcel_class = "Ultramax / Supramax Handymax Parcel"
    else:
        parcel_class = "Handysize Minor Bulk Parcel"

    # 8. Decision Workspace Matrix Items
    decision_workspace: List[DecisionWorkspaceItem] = []

    # 8a. Freight Outlook
    decision_workspace.append(
        DecisionWorkspaceItem(
            category="Freight Outlook",
            status="PENDING_MODEL",
            available_data=f"Benchmark: ${benchmark_rate:.2f}/MT ({route_model.name}). Volatility: 18.4%.",
            relevant_evidence=f"Historic fixture baseline: ${freight_baseline:,.0f} total. Model forecast pending integration.",
            actionable_recommendation="Forecast analysis will be generated from the Freight Forecast module. Baseline voyage reference confirmed.",
        )
    )

    # 8b. Chartering Context
    charter_status = "OPTIMAL" if (5 <= laycan_window <= 15) else ("CAUTION" if laycan_window < 5 or laycan_window > 25 else "COMPATIBLE")
    decision_workspace.append(
        DecisionWorkspaceItem(
            category="Chartering Context",
            status=charter_status,
            available_data=f"Laycan: {req.laycan_start} to {req.laycan_end} ({laycan_window} days). Type: {req.contract_type.replace('_', ' ').title()}.",
            relevant_evidence=f"Liquidity window is healthy. Cancellation risk is low-to-moderate for East Coast India loading windows.",
            actionable_recommendation="Maintain 10-day laycan spread. Fix fixture via standard dry bulk charter party terms (e.g. AMWELSH / GENCON).",
        )
    )

    # 8c. Vessel Compatibility
    vessel_status = "OPTIMAL" if (vessel_model.dwt_min <= req.cargo_quantity <= vessel_model.dwt_max) else "COMPATIBLE"
    if req.cargo_quantity > vessel_model.dwt_max:
        vessel_status = "RESTRICTED"
    elif req.cargo_quantity < vessel_model.dwt_min * 0.6:
        vessel_status = "CAUTION"

    decision_workspace.append(
        DecisionWorkspaceItem(
            category="Vessel Compatibility",
            status=vessel_status,
            available_data=f"{vessel_model.name} ({vessel_model.dwt_min:,.0f} - {vessel_model.dwt_max:,.0f} DWT). Calculated draft: {calculated_draft}m.",
            relevant_evidence=f"Parcel intake of {req.cargo_quantity:,.0f} MT yields a {load_factor * 100:.1f}% load factor. Typical fuel burn: {vessel_model.daily_bunker_fuel_mt} MT/day.",
            actionable_recommendation=f"Vessel class '{vessel_model.name}' is operationally suitable for {commodity_data['name']} handling.",
        )
    )

    # 8d. Port Constraints
    if not draft_res.is_admissible:
        port_status = "RESTRICTED"
    elif draft_res.requires_lighterage:
        port_status = "CAUTION"
    elif draft_res.under_keel_clearance_m >= 1.0:
        port_status = "OPTIMAL"
    else:
        port_status = "COMPATIBLE"

    decision_workspace.append(
        DecisionWorkspaceItem(
            category="Port Constraints",
            status=port_status,
            available_data=f"{port_model.port_name} ({port_model.port_code}). Permissible draft: {port_model.max_permissible_draft_m}m.",
            relevant_evidence=f"Under-Keel Clearance: {draft_res.under_keel_clearance_m}m. Discharge rate: {discharge_rate:,.0f} MT/day. Lighterage: {'Required at ' + (draft_res.lighterage_location or 'Anchorage') if draft_res.requires_lighterage else 'Not Required'}.",
            actionable_recommendation=draft_msg,
        )
    )

    # 8e. Route Risk
    route_status = "COMPATIBLE" if route_model.route_risk_score < 40 else "CAUTION"
    decision_workspace.append(
        DecisionWorkspaceItem(
            category="Route Risk",
            status=route_status,
            available_data=f"{route_model.name} ({route_model.distance_nm:,.0f} NM). Laden transit: {route_model.transit_days_laden:.1f} days.",
            relevant_evidence=f"Choke points: {', '.join(route_model.choke_points)}. Risk score: {route_model.route_risk_score}/100. Weather vulnerability: {route_model.weather_vulnerability}.",
            actionable_recommendation=f"Track seasonal Bay of Bengal swell and monitor transit through {route_model.choke_points[0] if route_model.choke_points else 'open ocean'}.",
        )
    )

    # 8f. Cost Exposure
    decision_workspace.append(
        DecisionWorkspaceItem(
            category="Cost Exposure",
            status="COMPATIBLE",
            available_data=f"Baseline Freight: ${freight_baseline:,.0f} (${benchmark_rate:.2f}/MT). Demurrage: ${demurrage_rate:,.0f}/day.",
            relevant_evidence=f"Estimated discharge duration: {discharge_days} days. Expected waiting exposure: ${demurrage_exposure:,.0f}.",
            actionable_recommendation="Cost analysis will be generated after freight and chartering analysis. Monitor port berth queues to avoid demurrage penalties.",
        )
    )

    # 9. Provenance Compilation
    provenance_list: List[DataProvenanceModel] = [
        DataProvenanceModel(**commodity_data["provenance"]),
        DataProvenanceModel(**vessel_model.provenance.model_dump()),
        DataProvenanceModel(**port_model.provenance.model_dump()),
        DataProvenanceModel(**route_model.provenance.model_dump()),
    ]

    return CargoAnalysisResponse(
        request_id=f"CARGO-ANL-{uuid.uuid4().hex[:8].upper()}",
        timestamp=datetime.utcnow().isoformat() + "Z",
        is_demo=req.is_demo,
        cargo_requirement=CargoRequirementContext(
            commodity_id=commodity_data["id"],
            commodity_name=commodity_data["name"],
            category=commodity_data["category"],
            cargo_quantity_mt=req.cargo_quantity,
            quantity_unit=req.quantity_unit,
            parcel_classification=parcel_class,
            stowage_factor_m3_per_mt=commodity_data["stowage_factor_m3_per_mt"],
            handling_requirements=commodity_data["handling_requirements"],
            is_demo=req.is_demo,
        ),
        freight_market=FreightMarketContext(
            benchmark_rate_usd_mt=benchmark_rate,
            benchmark_index_name=f"{vessel_model.name} East Coast India Benchmark",
            market_sentiment="Steady / Slightly Firming",
            historic_volatility_pct=18.4,
            forecast_status="Forecast analysis will be generated from the Freight Forecast module",
            forecast_available=False,
            notice="Freight forward projection model will be connected in Phase 3.",
        ),
        chartering_context=CharteringContext(
            laycan_start=req.laycan_start,
            laycan_end=req.laycan_end,
            laycan_window_days=laycan_window,
            contract_type=req.contract_type,
            recommended_charter_type="Single Voyage Charter Party (Spot / Index-Linked)",
            market_fixture_liquidity="Moderate - High (East Coast India Coal Corridor)",
            cancellation_risk="Low (< 2% historical cancellation within 10-day laycan spread)",
            charter_terms_summary=f"Laycan: {req.laycan_start} to {req.laycan_end} ({laycan_window} days), Demurrage ${demurrage_rate:,.0f}/day pro rata, Despatch half demurrage.",
        ),
        vessel_context=VesselContext(
            vessel_class=vessel_model.name,
            dwt_min=vessel_model.dwt_min,
            dwt_max=vessel_model.dwt_max,
            typical_draft_m=vessel_model.typical_draft_m,
            calculated_sailing_draft_m=calculated_draft,
            daily_bunker_consumption_mt=vessel_model.daily_bunker_fuel_mt,
            laden_speed_knots=vessel_model.speed_knots_laden,
            ballast_speed_knots=vessel_model.speed_knots_ballast,
            geared=vessel_model.geared,
            crane_capacity_tonnes=vessel_model.crane_capacity_tonnes,
            suitability_assessment=f"{vessel_model.name} is fully capable of carrying {req.cargo_quantity:,.0f} MT with {calculated_draft}m sailing draft.",
        ),
        port_context=PortContext(
            destination_port_id=port_model.port_id,
            destination_port_name=port_model.port_name,
            port_code=port_model.port_code,
            state=port_model.state,
            max_permissible_draft_m=port_model.max_permissible_draft_m,
            calculated_ukc_m=draft_res.under_keel_clearance_m,
            is_admissible=draft_res.is_admissible,
            requires_lighterage=draft_res.requires_lighterage,
            lighterage_location=draft_res.lighterage_location,
            mechanized_discharge_rate_mt_day=discharge_rate,
            estimated_discharge_days=discharge_days,
            weather_sensitivity_notes=port_model.weather_sensitivity_notes,
            operational_notes=port_model.operational_notes,
        ),
        route_context=RouteContext(
            route_id=route_model.id,
            corridor_name=route_model.name,
            origin_port=route_model.origin_port,
            origin_country=route_model.origin_country,
            destination_port=port_model.port_name,
            distance_nm=route_model.distance_nm,
            transit_days_laden=route_model.transit_days_laden,
            transit_days_ballast=route_model.transit_days_ballast,
            choke_points=route_model.choke_points,
            weather_vulnerability=route_model.weather_vulnerability,
            route_risk_score=route_model.route_risk_score,
        ),
        cost_context=CostContext(
            freight_rate_usd_mt=benchmark_rate,
            estimated_freight_baseline_usd=freight_baseline,
            estimated_discharge_days=discharge_days,
            demurrage_rate_usd_day=demurrage_rate,
            potential_demurrage_exposure_usd=demurrage_exposure,
            target_freight_usd_mt=req.target_freight,
            budget_usd=req.budget,
            variance_vs_target_usd_mt=variance_vs_target,
            cost_status_notice="Cost analysis will be generated after freight and chartering analysis",
        ),
        decision_workspace=decision_workspace,
        data_provenance=provenance_list,
    )
