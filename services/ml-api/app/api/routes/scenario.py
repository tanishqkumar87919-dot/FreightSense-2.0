from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.domain.models import (
    ScenarioSimulationRequest,
    ScenarioSimulationResponse,
    ScenarioVoyageEconomicsModel,
    ScenarioVariableChangeModel,
    ScenarioSensitivityPointModel,
    ScenarioSensitivityTable,
    ScenarioDecisionFactorsModel,
    ScenarioPresetModel,
    DataProvenanceModel,
)
from app.api.routes.port_constraints import CANONICAL_PORT_CONSTRAINTS, PORT_CARGO_HANDLING_RULES, resolve_port_id

router = APIRouter()

CANONICAL_PRESETS: List[Dict[str, Any]] = [
    {
        "preset_id": "preset-base",
        "name": "Base Case",
        "description": "Standard benchmark parameters for Newcastle to Paradip 50,000 MT Coking Coal via Panamax.",
        "assumptions_summary": "Spot rate $15.50/MT, 1.8 days waiting queue, $620/MT bunker fuel, $18,000/day charter hire.",
        "variable_overrides": {},
    },
    {
        "preset_id": "preset-freight-surge",
        "name": "Freight Rate Surge (+15%)",
        "description": "Tight tonnage supply in Pacific basin drives spot freight rates up by 15%.",
        "assumptions_summary": "Spot freight adjusted from $15.50/MT to $17.83/MT.",
        "variable_overrides": {
            "simulated_freight_rate_usd_mt": 17.83,
        },
    },
    {
        "preset_id": "preset-freight-drop",
        "name": "Freight Rate Easing (-10%)",
        "description": "Surplus ballast tonnage softening Pacific dry bulk fixtures.",
        "assumptions_summary": "Spot freight lowered from $15.50/MT to $13.95/MT.",
        "variable_overrides": {
            "simulated_freight_rate_usd_mt": 13.95,
        },
    },
    {
        "preset_id": "preset-congestion",
        "name": "Destination Port Congestion (+3.5 Days)",
        "description": "Seasonal monsoon squalls create an anchorage arrival cluster and delay berthing.",
        "assumptions_summary": "Anchorage waiting queue extended from 1.8 days to 5.3 days.",
        "variable_overrides": {
            "simulated_port_waiting_days": 5.3,
        },
    },
    {
        "preset_id": "preset-vessel-cape",
        "name": "Vessel Class Shift (Capesize 180k DWT)",
        "description": "Test economies of scale by consolidating cargo into a Capesize bulk carrier.",
        "assumptions_summary": "Vessel changed to Capesize (180,000 DWT, draft 17.8m, daily hire $26,000).",
        "variable_overrides": {
            "simulated_vessel_class": "Capesize",
            "simulated_cargo_quantity_mt": 120000.0,
            "simulated_charter_hire_usd_day": 26000.0,
        },
    },
    {
        "preset_id": "preset-vessel-supra",
        "name": "Vessel Class Shift (Supramax 58k DWT Geared)",
        "description": "Self-discharging geared bulk carrier for secondary or shallow discharge berths.",
        "assumptions_summary": "Vessel changed to Supramax (58,000 DWT, draft 12.2m, 4x30T cranes).",
        "variable_overrides": {
            "simulated_vessel_class": "Supramax",
            "simulated_cargo_quantity_mt": 50000.0,
            "simulated_charter_hire_usd_day": 15500.0,
        },
    },
    {
        "preset_id": "preset-laycan-shift",
        "name": "Laycan Postponement (+7 Days)",
        "description": "Mine railing delay shifts delivery window by 7 days later into late October.",
        "assumptions_summary": "Laycan window shifted to 2026-10-22 through 2026-11-01.",
        "variable_overrides": {
            "simulated_laycan_start": "2026-10-22",
            "simulated_laycan_end": "2026-11-01",
        },
    },
    {
        "preset_id": "preset-bunker-spike",
        "name": "Bunker Fuel Spike (+25%)",
        "description": "Global crude price volatility pushes VLSFO bunker fuel up 25%.",
        "assumptions_summary": "VLSFO price increases from $620/MT to $775/MT.",
        "variable_overrides": {
            "simulated_bunker_price_usd_mt": 775.0,
        },
    },
]


@router.get("/scenario/presets", response_model=List[ScenarioPresetModel])
def get_scenario_presets():
    """Returns canonical preset scenario profiles for what-if sensitivity analysis."""
    return [ScenarioPresetModel(**p) for p in CANONICAL_PRESETS]


@router.post("/scenario/simulate", response_model=ScenarioSimulationResponse)
def simulate_scenario(req: ScenarioSimulationRequest):
    """Orchestrates comprehensive multi-variable what-if simulation across freight, vessel, port, and voyage economics."""
    # 1. Resolve Base Port & Constraints
    base_dest_id = resolve_port_id(req.base_destination_port_id)
    base_port_raw = CANONICAL_PORT_CONSTRAINTS[base_dest_id]

    # Resolve Simulated Port & Constraints
    sim_dest_id = resolve_port_id(req.simulated_destination_port_id) if req.simulated_destination_port_id else base_dest_id
    sim_port_raw = CANONICAL_PORT_CONSTRAINTS[sim_dest_id]

    # 2. Extract Effective Values
    base_qty = req.base_cargo_quantity_mt
    sim_qty = req.simulated_cargo_quantity_mt if req.simulated_cargo_quantity_mt is not None else base_qty

    base_rate = req.base_freight_rate_usd_mt
    sim_rate = req.simulated_freight_rate_usd_mt if req.simulated_freight_rate_usd_mt is not None else base_rate

    base_vessel = req.base_vessel_class
    sim_vessel = req.simulated_vessel_class if req.simulated_vessel_class else base_vessel

    base_bunker = req.base_bunker_price_usd_mt
    sim_bunker = req.simulated_bunker_price_usd_mt if req.simulated_bunker_price_usd_mt is not None else base_bunker

    base_hire = req.base_charter_hire_usd_day
    sim_hire = req.simulated_charter_hire_usd_day if req.simulated_charter_hire_usd_day is not None else base_hire

    base_demurrage_rate = req.base_demurrage_rate_usd_day
    sim_demurrage_rate = req.simulated_demurrage_rate_usd_day if req.simulated_demurrage_rate_usd_day is not None else base_demurrage_rate

    base_wait_days = req.base_port_waiting_days
    sim_wait_days = req.simulated_port_waiting_days if req.simulated_port_waiting_days is not None else base_wait_days

    base_pda = req.base_port_pda_usd
    sim_pda = base_pda if sim_dest_id == base_dest_id else (base_pda * (sim_port_raw["max_permissible_draft_m"] / base_port_raw["max_permissible_draft_m"]))

    base_laycan_start = req.base_laycan_start
    base_laycan_end = req.base_laycan_end
    sim_laycan_start = req.simulated_laycan_start or base_laycan_start
    sim_laycan_end = req.simulated_laycan_end or base_laycan_end

    # 3. Compute Voyage Economics for Base and Simulated
    distance_nm = 5800.0  # Approx Newcastle to East Coast India via Lombok/Malacca
    base_speed = 12.5
    sim_speed = req.simulated_speed_knots or (12.6 if sim_vessel == "Capesize" else 12.8 if sim_vessel == "Supramax" else 12.5)

    base_steaming_days = round(distance_nm / (base_speed * 24.0), 1)
    sim_steaming_days = round(distance_nm / (sim_speed * 24.0), 1)

    vessel_bunker_burn_mt_day = {
        "Capesize": 48.0, "Kamsarmax": 32.0, "Panamax": 30.0,
        "Ultramax": 26.0, "Supramax": 24.0, "Handysize": 18.0,
    }
    base_fuel_burn = vessel_bunker_burn_mt_day.get(base_vessel, 30.0) * base_steaming_days
    sim_fuel_burn = vessel_bunker_burn_mt_day.get(sim_vessel, 30.0) * sim_steaming_days

    # Base Economics
    base_freight_usd = round(base_rate * base_qty, 2)
    base_bunker_usd = round(base_fuel_burn * base_bunker, 2)
    base_demurrage_usd = round(base_wait_days * base_demurrage_rate, 2)
    base_total_cost_usd = round(base_freight_usd + base_demurrage_usd + base_pda, 2)
    base_cost_per_mt = round(base_total_cost_usd / max(base_qty, 1.0), 2)
    base_tce_usd = round((base_freight_usd - base_bunker_usd - base_pda) / max(base_steaming_days, 1.0), 2)

    base_economics = ScenarioVoyageEconomicsModel(
        freight_rate_usd_mt=base_rate,
        total_freight_usd=base_freight_usd,
        bunker_cost_usd=base_bunker_usd,
        port_pda_usd=base_pda,
        demurrage_exposure_usd=base_demurrage_usd,
        total_voyage_cost_usd=base_total_cost_usd,
        cost_per_mt_usd=base_cost_per_mt,
        daily_hire_tce_usd=base_tce_usd,
    )

    # Simulated Economics
    sim_freight_usd = round(sim_rate * sim_qty, 2)
    sim_bunker_usd = round(sim_fuel_burn * sim_bunker, 2)
    sim_demurrage_usd = round(sim_wait_days * sim_demurrage_rate, 2)
    sim_total_cost_usd = round(sim_freight_usd + sim_demurrage_usd + sim_pda, 2)
    sim_cost_per_mt = round(sim_total_cost_usd / max(sim_qty, 1.0), 2)
    sim_tce_usd = round((sim_freight_usd - sim_bunker_usd - sim_pda) / max(sim_steaming_days, 1.0), 2)

    sim_economics = ScenarioVoyageEconomicsModel(
        freight_rate_usd_mt=sim_rate,
        total_freight_usd=sim_freight_usd,
        bunker_cost_usd=sim_bunker_usd,
        port_pda_usd=sim_pda,
        demurrage_exposure_usd=sim_demurrage_usd,
        total_voyage_cost_usd=sim_total_cost_usd,
        cost_per_mt_usd=sim_cost_per_mt,
        daily_hire_tce_usd=sim_tce_usd,
    )

    # 4. Attribute Variable Changes
    variable_changes: List[ScenarioVariableChangeModel] = []

    if sim_rate != base_rate:
        d = round(sim_rate - base_rate, 2)
        pct = round((d / base_rate) * 100.0, 1)
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Freight Rate",
            base_value=f"${base_rate:.2f}",
            simulated_value=f"${sim_rate:.2f}",
            absolute_delta=d,
            percentage_delta=pct,
            unit="USD/MT",
            provenance_status="User Input",
        ))

    if sim_qty != base_qty:
        d = round(sim_qty - base_qty, 0)
        pct = round((d / base_qty) * 100.0, 1)
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Cargo Quantity",
            base_value=f"{base_qty:,.0f} MT",
            simulated_value=f"{sim_qty:,.0f} MT",
            absolute_delta=d,
            percentage_delta=pct,
            unit="MT",
            provenance_status="User Input",
        ))

    if sim_wait_days != base_wait_days:
        d = round(sim_wait_days - base_wait_days, 1)
        pct = round((d / max(base_wait_days, 0.1)) * 100.0, 1)
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Port Waiting Time",
            base_value=f"{base_wait_days} days",
            simulated_value=f"{sim_wait_days} days",
            absolute_delta=d,
            percentage_delta=pct,
            unit="Days",
            provenance_status="User Input",
        ))

    if sim_vessel != base_vessel:
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Vessel Class",
            base_value=base_vessel,
            simulated_value=sim_vessel,
            absolute_delta=0.0,
            percentage_delta=None,
            unit="Class",
            provenance_status="User Input",
        ))

    if sim_dest_id != base_dest_id:
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Destination Port",
            base_value=base_port_raw["port_name"],
            simulated_value=sim_port_raw["port_name"],
            absolute_delta=0.0,
            percentage_delta=None,
            unit="Port Gateway",
            provenance_status="User Input",
        ))

    if sim_bunker != base_bunker:
        d = round(sim_bunker - base_bunker, 1)
        pct = round((d / base_bunker) * 100.0, 1)
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Bunker Fuel Price",
            base_value=f"${base_bunker:.1f}",
            simulated_value=f"${sim_bunker:.1f}",
            absolute_delta=d,
            percentage_delta=pct,
            unit="USD/MT",
            provenance_status="User Input",
        ))

    if sim_demurrage_rate != base_demurrage_rate:
        d = round(sim_demurrage_rate - base_demurrage_rate, 0)
        pct = round((d / base_demurrage_rate) * 100.0, 1)
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Demurrage Daily Rate",
            base_value=f"${base_demurrage_rate:,.0f}",
            simulated_value=f"${sim_demurrage_rate:,.0f}",
            absolute_delta=d,
            percentage_delta=pct,
            unit="USD/Day",
            provenance_status="User Input",
        ))

    if sim_laycan_start != base_laycan_start or sim_laycan_end != base_laycan_end:
        variable_changes.append(ScenarioVariableChangeModel(
            variable_name="Laycan Window",
            base_value=f"{base_laycan_start} to {base_laycan_end}",
            simulated_value=f"{sim_laycan_start} to {sim_laycan_end}",
            absolute_delta=0.0,
            percentage_delta=None,
            unit="Dates",
            provenance_status="User Input",
        ))

    # 5. Vessel & Port Compatibility Recalculations
    vessel_drafts = {
        "Capesize": 17.8, "Kamsarmax": 14.5, "Panamax": 13.8,
        "Ultramax": 12.8, "Supramax": 12.2, "Handysize": 10.0,
    }
    vessel_dwts = {
        "Capesize": 180000.0, "Kamsarmax": 82000.0, "Panamax": 75000.0,
        "Ultramax": 64000.0, "Supramax": 58000.0, "Handysize": 35000.0,
    }
    sim_vessel_draft = vessel_drafts.get(sim_vessel, 13.8)
    sim_port_max_draft = sim_port_raw["max_permissible_draft_m"]
    sim_ukc = round(sim_port_max_draft - sim_vessel_draft, 2)
    sim_ukc_status = "Safe" if sim_ukc >= 1.0 else ("Marginal" if sim_ukc >= 0 else "Violated")

    vessel_allowed_at_port = sim_vessel in sim_port_raw["allowable_vessel_classes"]
    requires_lighterage = sim_port_raw["lighterage_required"] or sim_ukc < 0

    # Cargo check
    port_cargo_rules = PORT_CARGO_HANDLING_RULES.get(sim_dest_id, {})
    coal_rule = port_cargo_rules.get("coal", {})
    cargo_supported = coal_rule.get("is_supported", True)
    cargo_restriction_note = coal_rule.get("notes", "Standard cargo handling supported.")

    vessel_evaluation = {
        "vessel_class": sim_vessel,
        "sailing_draft_m": sim_vessel_draft,
        "port_max_draft_m": sim_port_max_draft,
        "under_keel_clearance_m": sim_ukc,
        "ukc_status": sim_ukc_status,
        "class_admissible": vessel_allowed_at_port,
        "requires_lighterage": requires_lighterage,
        "dwt": vessel_dwts.get(sim_vessel, 75000.0),
    }

    port_evaluation = {
        "port_id": sim_dest_id,
        "port_name": sim_port_raw["port_name"],
        "state": sim_port_raw["state"],
        "max_permissible_draft_m": sim_port_max_draft,
        "cargo_supported": cargo_supported,
        "cargo_restriction_note": cargo_restriction_note,
        "lighterage_required": sim_port_raw["lighterage_required"],
        "lighterage_location": sim_port_raw.get("lighterage_location"),
    }

    demurrage_comparison = {
        "base_waiting_days": base_wait_days,
        "simulated_waiting_days": sim_wait_days,
        "base_demurrage_rate_usd": base_demurrage_rate,
        "simulated_demurrage_rate_usd": sim_demurrage_rate,
        "base_exposure_usd": base_demurrage_usd,
        "simulated_exposure_usd": sim_demurrage_usd,
        "delta_demurrage_usd": round(sim_demurrage_usd - base_demurrage_usd, 2),
    }

    # 6. Generate 3 Sensitivity Tables
    # Curve 1: Waiting Days Sensitivity (1d to 6d)
    wait_points: List[ScenarioSensitivityPointModel] = []
    for w in [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]:
        dem = round(w * sim_demurrage_rate, 2)
        tot = round(sim_freight_usd + dem + sim_pda, 2)
        cpm = round(tot / max(sim_qty, 1.0), 2)
        wait_points.append(ScenarioSensitivityPointModel(
            step_label=f"{w:.0f} Days Wait",
            parameter_value=w,
            demurrage_exposure_usd=dem,
            total_voyage_cost_usd=tot,
            cost_per_mt_usd=cpm,
        ))

    # Curve 2: Freight Rate Sensitivity (-20% to +20%)
    freight_points: List[ScenarioSensitivityPointModel] = []
    for pct in [-20.0, -10.0, 0.0, 10.0, 20.0]:
        rate_step = round(sim_rate * (1.0 + pct / 100.0), 2)
        frt = round(rate_step * sim_qty, 2)
        tot = round(frt + sim_demurrage_usd + sim_pda, 2)
        cpm = round(tot / max(sim_qty, 1.0), 2)
        freight_points.append(ScenarioSensitivityPointModel(
            step_label=f"{pct:+.0f}% (${rate_step:.2f})",
            parameter_value=rate_step,
            demurrage_exposure_usd=sim_demurrage_usd,
            total_voyage_cost_usd=tot,
            cost_per_mt_usd=cpm,
        ))

    # Curve 3: Bunker Price Sensitivity ($500 to $900)
    bunker_points: List[ScenarioSensitivityPointModel] = []
    for b in [500.0, 600.0, 700.0, 800.0, 900.0]:
        bnk = round(sim_fuel_burn * b, 2)
        tot = round(sim_freight_usd + sim_demurrage_usd + sim_pda, 2)  # In spot voyage, charterer pays freight; bunker affects owner TCE
        cpm = round((tot + bnk) / max(sim_qty, 1.0), 2)
        bunker_points.append(ScenarioSensitivityPointModel(
            step_label=f"${b:.0f} / MT",
            parameter_value=b,
            demurrage_exposure_usd=sim_demurrage_usd,
            total_voyage_cost_usd=round(tot + bnk, 2),
            cost_per_mt_usd=cpm,
        ))

    sensitivity_analyses = [
        ScenarioSensitivityTable(parameter_name="Port Waiting Days", unit="Days", points=wait_points),
        ScenarioSensitivityTable(parameter_name="Spot Freight Rate", unit="USD/MT", points=freight_points),
        ScenarioSensitivityTable(parameter_name="VLSFO Bunker Fuel Price", unit="USD/MT", points=bunker_points),
    ]

    # 7. Decision Factors & Explainability Chain
    cost_delta = round(sim_total_cost_usd - base_total_cost_usd, 2)
    cost_delta_pct = round((cost_delta / max(base_total_cost_usd, 1.0)) * 100.0, 1)
    cost_per_mt_delta = round(sim_cost_per_mt - base_cost_per_mt, 2)

    positive_changes: List[str] = []
    negative_changes: List[str] = []
    operational_constraints: List[str] = []
    unknowns: List[str] = []

    if cost_delta < 0:
        positive_changes.append(f"Total estimated voyage cost reduced by ${abs(cost_delta):,.0f} ({abs(cost_delta_pct):.1f}% savings).")
    if sim_rate < base_rate:
        positive_changes.append(f"Lower freight fixture (${sim_rate:.2f}/MT) saves ${(base_rate - sim_rate) * sim_qty:,.0f} in ocean carriage.")
    if sim_wait_days < base_wait_days:
        positive_changes.append(f"Turnaround time improvement (-{base_wait_days - sim_wait_days:.1f}d) lowers demurrage liability.")

    if cost_delta > 0:
        negative_changes.append(f"Total estimated voyage cost increased by ${cost_delta:,.0f} (+{cost_delta_pct:.1f}% expansion).")
    if sim_wait_days > base_wait_days:
        negative_changes.append(f"Additional port waiting (+{sim_wait_days - base_wait_days:.1f}d) creates ${(sim_wait_days - base_wait_days) * sim_demurrage_rate:,.0f} in extra demurrage risk.")
    if sim_bunker > base_bunker:
        negative_changes.append(f"Bunker fuel cost spike (+${sim_bunker - base_bunker:.0f}/MT) elevates voyage operating costs.")

    if not cargo_supported:
        operational_constraints.append(f"REGULATORY PROHIBITION: {cargo_restriction_note}")
    if requires_lighterage:
        operational_constraints.append(f"DRAFT CONSTRAINT / LIGHTERAGE: Shallow berth limit ({sim_port_max_draft}m) triggers mandatory ocean lighterage.")
    if sim_ukc < 1.0 and sim_ukc >= 0:
        operational_constraints.append(f"MARGINAL UNDER-KEEL CLEARANCE: UKC is {sim_ukc}m, below the recommended 1.0m safety buffer.")

    unknowns.append("Real-time berth lineup and anchor queue priority at exact time of Notice of Readiness (NOR).")
    unknowns.append("Future bunker fuel spot volatility between fixture date and bunkering call.")
    unknowns.append("Precipitation squall downtime during monsoon vessel discharge.")

    decision_factors = ScenarioDecisionFactorsModel(
        positive_changes=positive_changes,
        negative_changes=negative_changes,
        operational_constraints=operational_constraints,
        unknowns=unknowns,
    )

    explanation_chain: List[str] = [
        f"Baseline parcel: {base_qty:,.0f} MT {req.base_commodity_name} from {req.base_origin_port} to {base_port_raw['port_name']} via {base_vessel} at ${base_rate:.2f}/MT ($ {base_total_cost_usd:,.0f} total).",
    ]

    for vc in variable_changes:
        explanation_chain.append(
            f"Variable modified: {vc.variable_name} shifted from {vc.base_value} to {vc.simulated_value} (delta: {vc.absolute_delta:+.2f} {vc.unit})."
        )

    if sim_wait_days != base_wait_days:
        explanation_chain.append(
            f"Demurrage mechanism: Waiting time changed by {sim_wait_days - base_wait_days:+.1f} days at ${sim_demurrage_rate:,.0f}/day, producing a demurrage variance of ${sim_demurrage_usd - base_demurrage_usd:+,.0f}."
        )

    explanation_chain.append(
        f"Net outcome: Total voyage outlay moved from ${base_total_cost_usd:,.0f} to ${sim_total_cost_usd:,.0f} ({cost_delta:+,.0f} USD, or {cost_delta_pct:+.1f}%), yielding a final landed cost of ${sim_cost_per_mt:.2f}/MT."
    )

    forecast_context = {
        "status": "Forecast model does not currently support custom simulated variables." if (sim_bunker != base_bunker or sim_dest_id != base_dest_id) else "Active Corridor Model Connected",
        "baseline_projection_usd_mt": base_rate,
        "scenario_rate_usd_mt": sim_rate,
        "delta_vs_forecast_usd_mt": round(sim_rate - base_rate, 2),
        "advisory": "Decision-support simulation context only; not a guaranteed market projection.",
    }

    return ScenarioSimulationResponse(
        timestamp=datetime.utcnow().isoformat(),
        scenario_name=req.scenario_name or "Simulated Scenario",
        base_scenario_summary={
            "origin": req.base_origin_port,
            "destination": base_port_raw["port_name"],
            "commodity": req.base_commodity_name,
            "quantity_mt": base_qty,
            "vessel_class": base_vessel,
            "laycan": f"{base_laycan_start} to {base_laycan_end}",
            "steaming_days": base_steaming_days,
            "waiting_days": base_wait_days,
        },
        simulated_scenario_summary={
            "origin": req.base_origin_port,
            "destination": sim_port_raw["port_name"],
            "commodity": req.base_commodity_name,
            "quantity_mt": sim_qty,
            "vessel_class": sim_vessel,
            "laycan": f"{sim_laycan_start} to {sim_laycan_end}",
            "steaming_days": sim_steaming_days,
            "waiting_days": sim_wait_days,
        },
        base_economics=base_economics,
        simulated_economics=sim_economics,
        variable_changes=variable_changes,
        total_cost_delta_usd=cost_delta,
        total_cost_delta_pct=cost_delta_pct,
        cost_per_mt_delta_usd=cost_per_mt_delta,
        vessel_evaluation=vessel_evaluation,
        port_evaluation=port_evaluation,
        demurrage_comparison=demurrage_comparison,
        sensitivity_analyses=sensitivity_analyses,
        decision_factors=decision_factors,
        explanation_chain=explanation_chain,
        forecast_context=forecast_context,
        data_provenance=[
            DataProvenanceModel(
                source="FreightSense Scenario Orchestration Engine",
                dataset_name="Deterministic Bulk Voyage Economics & Port Constraint Model",
                coverage_period="Active Multi-Variable Simulation",
                last_updated=datetime.utcnow().strftime("%Y-%m-%d"),
                data_type="Calculated / User Input Assumptions",
                units="USD / MT / Days / Metres",
                status="demo",
            )
        ],
        advisory_disclaimer="Decision-support information only; not a guaranteed financial projection or commercial charter fixture.",
    )
