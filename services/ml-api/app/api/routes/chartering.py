from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import math
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.domain.models import DataProvenanceModel
from app.api.routes.port_constraints import CANONICAL_PORT_CONSTRAINTS
from app.api.routes.bulk import CANONICAL_VESSEL_CLASSES, CANONICAL_BULK_ROUTES

router = APIRouter()

# ----------------------------------------------------------------------
# CANONICAL CANDIDATE BULK VESSELS (Realistic Baltic Benchmark Profiles)
# ----------------------------------------------------------------------
CANONICAL_CANDIDATE_VESSELS: List[Dict[str, Any]] = [
    {
        "id": "ves-bulk-odisha-maratha",
        "name": "MV Odisha Maratha",
        "imo": "9688142",
        "vessel_class": "Panamax",
        "dwt": 74500.0,
        "built_year": 2018,
        "flag": "India",
        "typical_draft_m": 13.8,
        "ballast_draft_m": 7.2,
        "beam_m": 32.2,
        "loa_m": 225.0,
        "geared": False,
        "crane_capacity_tonnes": None,
        "daily_bunker_fuel_mt": 23.0,
        "laden_speed_knots": 12.8,
        "ballast_speed_knots": 13.6,
        "current_position_name": "Bay of Bengal (Ballast to Newcastle)",
        "coordinates": [8.5, 88.2],
        "estimated_ballast_distance_nm": 4200.0,
        "estimated_daily_hire_usd": 15500.0,
        "provenance": {
            "source": "Simulated Charter Candidate Profile (Baltic BPI Standard)",
            "dataset_name": "Indian East Coast Bulk Carrier Roster",
            "coverage_period": "2024 Demonstration Profile",
            "last_updated": "2024-09-15",
            "data_type": "Candidate Specification",
            "units": "DWT / Metres / Knots / USD per Day",
            "status": "demo",
        },
    },
    {
        "id": "ves-bulk-coromandel-miner",
        "name": "MV Coromandel Miner",
        "imo": "9742380",
        "vessel_class": "Capesize",
        "dwt": 181000.0,
        "built_year": 2019,
        "flag": "Singapore",
        "typical_draft_m": 18.2,
        "ballast_draft_m": 8.8,
        "beam_m": 45.0,
        "loa_m": 292.0,
        "geared": False,
        "crane_capacity_tonnes": None,
        "daily_bunker_fuel_mt": 38.5,
        "laden_speed_knots": 12.6,
        "ballast_speed_knots": 14.0,
        "current_position_name": "Off Port Hedland (Waiting Berth)",
        "coordinates": [-20.1, 118.2],
        "estimated_ballast_distance_nm": 1850.0,
        "estimated_daily_hire_usd": 24800.0,
        "provenance": {
            "source": "Simulated Charter Candidate Profile (Baltic BCI Standard)",
            "dataset_name": "Capesize Raw Material Carrier Roster",
            "coverage_period": "2024 Demonstration Profile",
            "last_updated": "2024-09-15",
            "data_type": "Candidate Specification",
            "units": "DWT / Metres / Knots / USD per Day",
            "status": "demo",
        },
    },
    {
        "id": "ves-bulk-bengal-pioneer",
        "name": "MV Bengal Pioneer",
        "imo": "9551239",
        "vessel_class": "Supramax",
        "dwt": 56800.0,
        "built_year": 2016,
        "flag": "Panama",
        "typical_draft_m": 12.8,
        "ballast_draft_m": 6.8,
        "beam_m": 32.2,
        "loa_m": 190.0,
        "geared": True,
        "crane_capacity_tonnes": 30.0,
        "daily_bunker_fuel_mt": 18.0,
        "laden_speed_knots": 12.8,
        "ballast_speed_knots": 13.5,
        "current_position_name": "Singapore Anchorage (Bunkering completed)",
        "coordinates": [1.25, 103.8],
        "estimated_ballast_distance_nm": 3400.0,
        "estimated_daily_hire_usd": 13800.0,
        "provenance": {
            "source": "Simulated Charter Candidate Profile (Baltic BSI Standard)",
            "dataset_name": "Geared Supramax Regional Fleet",
            "coverage_period": "2024 Demonstration Profile",
            "last_updated": "2024-09-15",
            "data_type": "Candidate Specification",
            "units": "DWT / Metres / Knots / USD per Day",
            "status": "demo",
        },
    },
    {
        "id": "ves-bulk-kalinga-star",
        "name": "MV Kalinga Star",
        "imo": "9814421",
        "vessel_class": "Kamsarmax",
        "dwt": 82200.0,
        "built_year": 2021,
        "flag": "Marshall Islands",
        "typical_draft_m": 14.5,
        "ballast_draft_m": 7.5,
        "beam_m": 32.26,
        "loa_m": 229.0,
        "geared": False,
        "crane_capacity_tonnes": None,
        "daily_bunker_fuel_mt": 24.5,
        "laden_speed_knots": 13.0,
        "ballast_speed_knots": 14.0,
        "current_position_name": "Strait of Malacca Northbound",
        "coordinates": [4.2, 99.8],
        "estimated_ballast_distance_nm": 3800.0,
        "estimated_daily_hire_usd": 17200.0,
        "provenance": {
            "source": "Simulated Charter Candidate Profile (Baltic BPI 82k Standard)",
            "dataset_name": "Modern Eco-Kamsarmax Carrier Roster",
            "coverage_period": "2024 Demonstration Profile",
            "last_updated": "2024-09-15",
            "data_type": "Candidate Specification",
            "units": "DWT / Metres / Knots / USD per Day",
            "status": "demo",
        },
    },
    {
        "id": "ves-bulk-vizag-enterprise",
        "name": "MV Vizag Enterprise",
        "imo": "9426815",
        "vessel_class": "Handysize",
        "dwt": 38500.0,
        "built_year": 2015,
        "flag": "India",
        "typical_draft_m": 10.2,
        "ballast_draft_m": 5.8,
        "beam_m": 28.0,
        "loa_m": 180.0,
        "geared": True,
        "crane_capacity_tonnes": 30.0,
        "daily_bunker_fuel_mt": 14.5,
        "laden_speed_knots": 12.0,
        "ballast_speed_knots": 13.0,
        "current_position_name": "Off Colombo (Outer Anchorage)",
        "coordinates": [6.95, 79.8],
        "estimated_ballast_distance_nm": 4600.0,
        "estimated_daily_hire_usd": 11500.0,
        "provenance": {
            "source": "Simulated Charter Candidate Profile (Baltic BHSI Standard)",
            "dataset_name": "Geared Handysize Coastal & Regional Roster",
            "coverage_period": "2024 Demonstration Profile",
            "last_updated": "2024-09-15",
            "data_type": "Candidate Specification",
            "units": "DWT / Metres / Knots / USD per Day",
            "status": "demo",
        },
    },
]

# ----------------------------------------------------------------------
# REQUEST & RESPONSE SCHEMAS
# ----------------------------------------------------------------------

class CharterCandidateVesselModel(BaseModel):
    id: str
    name: str
    imo: str
    vessel_class: str
    dwt: float
    built_year: int
    flag: str
    typical_draft_m: float
    ballast_draft_m: float
    beam_m: float
    loa_m: float
    geared: bool
    crane_capacity_tonnes: Optional[float] = None
    daily_bunker_fuel_mt: float
    laden_speed_knots: float
    ballast_speed_knots: float
    current_position_name: str
    coordinates: List[float]
    estimated_ballast_distance_nm: float
    estimated_daily_hire_usd: float
    provenance: DataProvenanceModel

class CharteringEvaluationRequest(BaseModel):
    commodity_id: str = Field(..., description="Commodity ID or name")
    cargo_quantity_mt: float = Field(..., description="Cargo quantity in metric tonnes")
    origin_port: str = Field(..., description="Loading port name or code")
    destination_port: str = Field(..., description="Discharge port ID or name")
    laycan_start: str = Field(..., description="Laycan window start YYYY-MM-DD")
    laycan_end: str = Field(..., description="Laycan window end YYYY-MM-DD")
    target_freight_usd_mt: Optional[float] = Field(None, description="User target voyage freight in USD/MT")
    daily_hire_usd_day: Optional[float] = Field(None, description="User or simulated time charter daily hire")
    bunker_fuel_price_usd_mt: Optional[float] = Field(615.0, description="VLSFO bunker fuel price benchmark")
    demurrage_rate_usd_day: Optional[float] = Field(None, description="User or port average demurrage rate")
    port_cost_usd: Optional[float] = Field(45000.0, description="Estimated total port disbursement account (PDA)")

class VesselFitScoreBreakdown(BaseModel):
    total_score: float = Field(..., description="Overall score 0-100")
    cargo_intake_score: float = Field(..., description="Weight 30%")
    port_draft_score: float = Field(..., description="Weight 25%")
    laycan_fit_score: float = Field(..., description="Weight 20%")
    equipment_crane_score: float = Field(..., description="Weight 15%")
    route_efficiency_score: float = Field(..., description="Weight 10%")
    explanation: str

class VoyageEconomicsComparison(BaseModel):
    voyage_charter_total_usd: float
    voyage_charter_usd_mt: float
    time_charter_total_usd: float
    time_charter_usd_mt: float
    hire_component_usd: float
    bunker_component_usd: float
    port_pda_component_usd: float
    cost_differential_usd: float
    cost_differential_pct: float
    recommended_charter_type: str
    risk_allocation_notes: str
    calculation_assumptions: List[str]

class DemurrageExposureResult(BaseModel):
    daily_demurrage_rate_usd: float
    allowed_laytime_days: float
    estimated_waiting_days: float
    estimated_discharge_days: float
    estimated_demurrage_days: float
    potential_exposure_usd: float
    risk_level: str
    calculation_formula: str

class BallastLegResult(BaseModel):
    ballast_origin: str
    ballast_distance_nm: float
    ballast_speed_knots: float
    ballast_days: float
    bunker_consumed_mt: float
    status: str

class VesselFitAnalysisResult(BaseModel):
    vessel: CharterCandidateVesselModel
    load_factor_pct: float
    calculated_sailing_draft_m: float
    port_max_draft_m: float
    under_keel_clearance_m: float
    port_admissible: bool
    requires_lighterage: bool
    lighterage_location: Optional[str]
    estimated_eta_load_port: str
    laycan_status: str  # 'Compatible' | 'Early' | 'Late' | 'Tight'
    laycan_delta_days: float
    fit_score: VesselFitScoreBreakdown
    voyage_economics: VoyageEconomicsComparison
    demurrage_exposure: DemurrageExposureResult
    ballast_leg: BallastLegResult
    satisfied_criteria: List[str]
    operational_constraints: List[str]
    missing_data_notices: List[str]
    decision_summary: str

class CharteringEvaluationResponse(BaseModel):
    request_timestamp: str
    cargo_quantity_mt: float
    destination_port: str
    laycan_window: str
    recommended_vessel_id: str
    candidates_analyzed: int
    vessel_analyses: List[VesselFitAnalysisResult]
    advisory_notice: str

# ----------------------------------------------------------------------
# HELPER FUNCTIONS
# ----------------------------------------------------------------------

def _resolve_port_constraint(port_identifier: str) -> Dict[str, Any]:
    # Match by key or port name or common aliases
    p_id = port_identifier.strip().lower()
    alias_map = {
        "hld": "port-in-ccu",
        "haldia": "port-in-ccu",
        "port-in-hld": "port-in-ccu",
        "kolkata": "port-in-ccu",
        "prt": "port-in-prt",
        "paradip": "port-in-prt",
        "port-in-prt": "port-in-prt",
        "viz": "port-in-viz",
        "vizag": "port-in-viz",
        "visakhapatnam": "port-in-viz",
        "port-in-viz": "port-in-viz",
        "enr": "port-in-enr",
        "ennore": "port-in-enr",
        "kamarajar": "port-in-enr",
        "port-in-enr": "port-in-enr",
        "maa": "port-in-maa",
        "chennai": "port-in-maa",
        "port-in-maa": "port-in-maa",
        "kri": "port-in-kri",
        "krishnapatnam": "port-in-kri",
        "port-in-kri": "port-in-kri",
        "tut": "port-in-tut",
        "tuticorin": "port-in-tut",
        "voc": "port-in-tut",
        "dhm": "port-in-dhm",
        "dhamra": "port-in-dhm",
    }
    for alias, target_key in alias_map.items():
        if alias in p_id:
            if target_key in CANONICAL_PORT_CONSTRAINTS:
                return CANONICAL_PORT_CONSTRAINTS[target_key]

    for k, v in CANONICAL_PORT_CONSTRAINTS.items():
        if k.lower() == p_id or v["port_name"].lower() in p_id or p_id in v["port_name"].lower():
            return v
    # Fallback to Paradip Port
    return CANONICAL_PORT_CONSTRAINTS["port-in-prt"]

def _estimate_distance_nm(origin: str, destination: str) -> float:
    # Check if a matching route exists
    for r in CANONICAL_BULK_ROUTES:
        if r["origin_port"].lower() in origin.lower() or origin.lower() in r["origin_port"].lower():
            return float(r["distance_nm"])
    return 4850.0

# ----------------------------------------------------------------------
# ENDPOINTS
# ----------------------------------------------------------------------

@router.get("/chartering/candidates", response_model=List[CharterCandidateVesselModel])
def get_charter_candidates():
    """Returns candidate dry bulk vessel profiles with realistic Baltic specifications."""
    return [CharterCandidateVesselModel(**v) for v in CANONICAL_CANDIDATE_VESSELS]

@router.post("/chartering/evaluate", response_model=CharteringEvaluationResponse)
def evaluate_chartering(req: CharteringEvaluationRequest):
    """
    Evaluates candidate vessels against cargo requirement, destination port draft constraints,
    laycan window, and computes comparative voyage economics (Voyage vs Time Charter).
    """
    port_constraint = _resolve_port_constraint(req.destination_port)
    port_max_draft = float(port_constraint["max_permissible_draft_m"])
    port_name = port_constraint["port_name"]
    requires_lighterage = port_constraint.get("lighterage_required", False)
    lighterage_location = port_constraint.get("lighterage_location")
    port_demurrage_default = float(port_constraint.get("average_demurrage_rate_usd_day", 28000.0))
    port_waiting_days = float(port_constraint.get("typical_waiting_days", 2.0))
    discharge_rate = float(port_constraint.get("mechanized_discharge_rate_mt_day", 25000.0))

    distance_nm = _estimate_distance_nm(req.origin_port, req.destination_port)
    vlsfo_price = req.bunker_fuel_price_usd_mt or 615.0
    port_pda = req.port_cost_usd or 45000.0
    demurrage_rate = req.demurrage_rate_usd_day or port_demurrage_default

    try:
        laycan_start_dt = datetime.strptime(req.laycan_start, "%Y-%m-%d")
        laycan_end_dt = datetime.strptime(req.laycan_end, "%Y-%m-%d")
    except Exception:
        # Fallback to demo window 15 Oct to 25 Oct 2026
        laycan_start_dt = datetime(2026, 10, 15)
        laycan_end_dt = datetime(2026, 10, 25)

    laycan_span_days = max(1, (laycan_end_dt - laycan_start_dt).days)

    analyses: List[VesselFitAnalysisResult] = []

    for v_data in CANONICAL_CANDIDATE_VESSELS:
        v = CharterCandidateVesselModel(**v_data)
        dwt = v.dwt
        load_factor = round((req.cargo_quantity_mt / dwt) * 100.0, 1)

        # Calculate dynamic sailing draft
        # Formula: ballast_draft + (typical_draft - ballast_draft) * min(1.0, (cargo_quantity / dwt))
        effective_lf = min(1.0, req.cargo_quantity_mt / dwt)
        sailing_draft = round(v.ballast_draft_m + (v.typical_draft_m - v.ballast_draft_m) * effective_lf, 2)
        ukc = round(port_max_draft - sailing_draft, 2)
        port_admissible = ukc >= 1.0

        # Ballast leg calculation
        ballast_dist = v.estimated_ballast_distance_nm
        ballast_days = round(ballast_dist / (v.ballast_speed_knots * 24.0), 1)
        ballast_bunker = round(ballast_days * v.daily_bunker_fuel_mt, 1)

        # ETA calculation: assume vessel sets sail 10 days before laycan start
        estimated_eta_dt = laycan_start_dt + timedelta(days=math.floor(ballast_days - 11.0))
        if estimated_eta_dt < laycan_start_dt:
            # Arrives early
            delta_days = round((laycan_start_dt - estimated_eta_dt).days, 1)
            laycan_status = "Compatible" if delta_days <= 3.0 else "Early"
        elif estimated_eta_dt <= laycan_end_dt:
            delta_days = 0.0
            laycan_status = "Compatible"
        else:
            delta_days = round((estimated_eta_dt - laycan_end_dt).days, 1)
            laycan_status = "Late"

        # Demurrage calculation
        allowed_laytime_days = round(req.cargo_quantity_mt / discharge_rate, 2)
        estimated_discharge_days = round(allowed_laytime_days + 0.4, 2)
        turnaround_days = round(port_waiting_days + estimated_discharge_days, 2)
        demurrage_days = max(0.0, round(turnaround_days - allowed_laytime_days, 2))
        demurrage_exposure_val = round(demurrage_days * demurrage_rate, 2)

        # Voyage calculations
        laden_days = round(distance_nm / (v.laden_speed_knots * 24.0), 1)
        total_voyage_days = round(ballast_days + laden_days + turnaround_days, 1)

        # Voyage charter costs
        # Baseline voyage rate: Australia to Paradip baseline ~$14.80/MT, scaled by vessel class efficiency
        class_discount = 0.92 if v.vessel_class == "Capesize" else (1.0 if v.vessel_class in ["Panamax", "Kamsarmax"] else 1.10)
        voyage_freight_rate = req.target_freight_usd_mt or round(14.80 * class_discount, 2)
        voyage_charter_total = round(req.cargo_quantity_mt * voyage_freight_rate + demurrage_exposure_val, 2)
        voyage_charter_usd_mt = round(voyage_charter_total / req.cargo_quantity_mt, 2)

        # Time charter costs
        daily_hire = req.daily_hire_usd_day or v.estimated_daily_hire_usd
        hire_component = round(daily_hire * total_voyage_days, 2)
        steaming_days = ballast_days + laden_days
        bunker_consumption_mt = round(steaming_days * v.daily_bunker_fuel_mt + turnaround_days * 3.5, 1)
        bunker_cost = round(bunker_consumption_mt * vlsfo_price, 2)
        time_charter_total = round(hire_component + bunker_cost + port_pda, 2)
        time_charter_usd_mt = round(time_charter_total / req.cargo_quantity_mt, 2)

        cost_diff = round(time_charter_total - voyage_charter_total, 2)
        cost_diff_pct = round((cost_diff / (voyage_charter_total + 1e-6)) * 100.0, 1)

        # Criteria-based fit score calculation (strictly transparent weights)
        # 1. Cargo Intake Fit (30% weight)
        if 70.0 <= load_factor <= 95.0:
            intake_score = 100.0
        elif 55.0 <= load_factor < 70.0:
            intake_score = 75.0
        elif 95.0 < load_factor <= 100.0:
            intake_score = 85.0
        else:
            intake_score = 40.0

        # 2. Port Draft / UKC Compatibility (25% weight)
        if ukc >= 2.5:
            draft_score = 100.0
        elif ukc >= 1.0:
            draft_score = 85.0
        elif requires_lighterage:
            draft_score = 65.0
        else:
            draft_score = 10.0

        # 3. Laycan Window Fit (20% weight)
        if laycan_status == "Compatible":
            laycan_score = 100.0
        elif laycan_status == "Early":
            laycan_score = 70.0
        else:
            laycan_score = 30.0

        # 4. Equipment & Crane Suitability (15% weight)
        # Paradip and Vizag have high-throughput mechanization, gearless is fine; Haldia benefits from geared
        if port_constraint.get("riverine_navigation", False) and not v.geared:
            equipment_score = 60.0
        elif v.geared:
            equipment_score = 95.0
        else:
            equipment_score = 90.0

        # 5. Route & Bunker Efficiency (10% weight)
        efficiency_score = 90.0 if v.daily_bunker_fuel_mt <= 25.0 else 75.0

        total_score = round(
            (intake_score * 0.30)
            + (draft_score * 0.25)
            + (laycan_score * 0.20)
            + (equipment_score * 0.15)
            + (efficiency_score * 0.10),
            1,
        )

        # Build satisfied criteria and constraints
        satisfied = []
        constraints = []
        missing = []

        if 60.0 <= load_factor <= 98.0:
            satisfied.append(f"Cargo intake optimal: {req.cargo_quantity_mt:,.0f} MT represents {load_factor}% DWT capacity.")
        else:
            constraints.append(f"Cargo intake sub-optimal ({load_factor}% DWT load factor).")

        if port_admissible:
            satisfied.append(f"Port draft compliant: Sailing draft {sailing_draft}m provides {ukc}m UKC at {port_name} (Max {port_max_draft}m).")
        else:
            constraints.append(f"Port draft exceeded: Sailing draft {sailing_draft}m exceeds {port_name} limit ({port_max_draft}m).")

        if requires_lighterage:
            constraints.append(f"Mandatory lighterage protocol: Vessel requires parcel transshipment at {lighterage_location or 'Sandheads Anchorage'}.")

        if laycan_status == "Compatible":
            satisfied.append(f"Laycan fit verified: ETA {estimated_eta_dt.strftime('%d %b %Y')} aligns with target window {req.laycan_start} to {req.laycan_end}.")
        else:
            constraints.append(f"Laycan timing {laycan_status}: Vessel ETA deviates by {abs(delta_days)} days from preferred laycan.")

        missing.append("Live charter availability unverified (commercial fixture requires broker confirmation).")
        missing.append("Bunker escalation clause (BAF) pending charter party terms.")

        rec_type = "Voyage Charter (Spot)" if cost_diff > 0 else "Time Charter (Trip)"

        analyses.append(
            VesselFitAnalysisResult(
                vessel=v,
                load_factor_pct=load_factor,
                calculated_sailing_draft_m=sailing_draft,
                port_max_draft_m=port_max_draft,
                under_keel_clearance_m=ukc,
                port_admissible=port_admissible,
                requires_lighterage=requires_lighterage,
                lighterage_location=lighterage_location,
                estimated_eta_load_port=estimated_eta_dt.strftime("%Y-%m-%d"),
                laycan_status=laycan_status,
                laycan_delta_days=delta_days,
                fit_score=VesselFitScoreBreakdown(
                    total_score=total_score,
                    cargo_intake_score=intake_score,
                    port_draft_score=draft_score,
                    laycan_fit_score=laycan_score,
                    equipment_crane_score=equipment_score,
                    route_efficiency_score=efficiency_score,
                    explanation=f"Evaluated across Intake (30%), Draft/UKC (25%), Laycan (20%), Equipment (15%), and Bunker Efficiency (10%).",
                ),
                voyage_economics=VoyageEconomicsComparison(
                    voyage_charter_total_usd=voyage_charter_total,
                    voyage_charter_usd_mt=voyage_charter_usd_mt,
                    time_charter_total_usd=time_charter_total,
                    time_charter_usd_mt=time_charter_usd_mt,
                    hire_component_usd=hire_component,
                    bunker_component_usd=bunker_cost,
                    port_pda_component_usd=port_pda,
                    cost_differential_usd=cost_diff,
                    cost_differential_pct=cost_diff_pct,
                    recommended_charter_type=rec_type,
                    risk_allocation_notes=(
                        "Under Voyage Charter, carrier bears weather delays and steaming bunker risk. "
                        "Under Time Charter, charterer assumes bunker fuel price and passage duration risk."
                    ),
                    calculation_assumptions=[
                        f"Voyage Freight: ${voyage_freight_rate:.2f}/MT",
                        f"Time Charter Daily Hire: ${daily_hire:,.0f}/day",
                        f"VLSFO Fuel Benchmark: ${vlsfo_price:.2f}/MT",
                        f"Port Disbursement Account: ${port_pda:,.0f}",
                        f"Total Voyage Days: {total_voyage_days:.1f} days (Ballast {ballast_days}d, Laden {laden_days}d, Port {turnaround_days}d)",
                    ],
                ),
                demurrage_exposure=DemurrageExposureResult(
                    daily_demurrage_rate_usd=demurrage_rate,
                    allowed_laytime_days=allowed_laytime_days,
                    estimated_waiting_days=port_waiting_days,
                    estimated_discharge_days=estimated_discharge_days,
                    estimated_demurrage_days=demurrage_days,
                    potential_exposure_usd=demurrage_exposure_val,
                    risk_level="Elevated" if demurrage_days > 1.5 else ("Moderate" if demurrage_days > 0 else "Low"),
                    calculation_formula=f"Demurrage Exposure = max(0, {turnaround_days}d - {allowed_laytime_days}d) * ${demurrage_rate:,.0f}/day",
                ),
                ballast_leg=BallastLegResult(
                    ballast_origin=v.current_position_name,
                    ballast_distance_nm=ballast_dist,
                    ballast_speed_knots=v.ballast_speed_knots,
                    ballast_days=ballast_days,
                    bunker_consumed_mt=ballast_bunker,
                    status="Calculated from reported positioning",
                ),
                satisfied_criteria=satisfied,
                operational_constraints=constraints,
                missing_data_notices=missing,
                decision_summary=(
                    f"{v.name} ({v.vessel_class}) achieves a {total_score}/100 fit score. "
                    f"{'Port draft and laycan conditions fully met.' if port_admissible and laycan_status == 'Compatible' else 'Review specific operational constraints.'} "
                    f"Recommended structure: {rec_type}."
                ),
            )
        )

    # Sort candidates by fit score descending
    analyses.sort(key=lambda x: x.fit_score.total_score, reverse=True)
    best_vessel_id = analyses[0].vessel.id if analyses else "ves-bulk-odisha-maratha"

    return CharteringEvaluationResponse(
        request_timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        cargo_quantity_mt=req.cargo_quantity_mt,
        destination_port=port_name,
        laycan_window=f"{req.laycan_start} to {req.laycan_end}",
        recommended_vessel_id=best_vessel_id,
        candidates_analyzed=len(analyses),
        vessel_analyses=analyses,
        advisory_notice=(
            "Advisory Notice: Vessel suitability and voyage economics represent scenario-based mathematical evaluations "
            "grounded in port constraints, standard charter party terms, and benchmark daily hire rates. "
            "They do not constitute binding commercial fixture confirmations or guaranteed vessel availability. "
            "Charterers and procurement managers must verify live position lists and execute formal fixture recaps through accredited shipbrokers."
        ),
    )
