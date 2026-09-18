from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DataProvenanceModel(BaseModel):
    source: str = Field(..., description="Reporting agency or provider")
    dataset_name: str = Field(..., description="Title of official dataset")
    coverage_period: str = Field(..., description="Temporal coverage")
    last_updated: str = Field(..., description="Date of last revision")
    data_type: str = Field(..., description="Data classification")
    units: str = Field(..., description="Measurement units")
    status: str = Field(..., description="historical | demo | simulated | live")


class BulkCommodityModel(BaseModel):
    id: str
    name: str
    category: str
    stowage_factor_m3_per_mt: float
    typical_parcel_size_tonnes: float
    handling_requirements: List[str]
    major_import_ports: List[str]
    major_export_origins: List[str]
    provenance: DataProvenanceModel


class DryBulkVesselClassModel(BaseModel):
    id: str
    name: str
    dwt_min: float
    dwt_max: float
    typical_draft_m: float
    beam_m: float
    loa_m: float
    geared: bool
    crane_capacity_tonnes: Optional[float] = None
    daily_bunker_fuel_mt: float
    speed_knots_ballast: float
    speed_knots_laden: float
    provenance: DataProvenanceModel


class EastCoastPortConstraintModel(BaseModel):
    port_id: str
    port_name: str
    port_code: str
    state: str
    max_permissible_draft_m: float
    max_loa_m: float
    max_beam_m: float
    tidal_restriction: bool
    riverine_navigation: bool
    lighterage_required: bool
    lighterage_location: Optional[str] = None
    allowable_vessel_classes: List[str]
    mechanized_discharge_rate_mt_day: float
    typical_waiting_days: float
    average_demurrage_rate_usd_day: float
    weather_sensitivity_notes: str
    operational_notes: str
    provenance: DataProvenanceModel


class BulkRouteModel(BaseModel):
    id: str
    name: str
    origin_port: str
    origin_country: str
    destination_port: str
    destination_country: str
    distance_nm: float
    transit_days_laden: float
    transit_days_ballast: float
    cargo_type: str
    allowable_vessel_classes: List[str]
    benchmark_voyage_rate_usd_mt: float
    route_risk_score: float
    choke_points: List[str]
    weather_vulnerability: str
    coordinates: Dict[str, Any]
    provenance: DataProvenanceModel


class CharterValidationRequest(BaseModel):
    commodity_id: str
    commodity_name: str
    cargo_quantity_mt: float
    origin_port_id: str
    destination_port_id: str
    preferred_vessel_class: str
    laycan_start: str
    laycan_end: str
    charter_type: str = "spot_voyage"
    max_draft_tolerance_m: Optional[float] = None


class DraftFeasibilityResult(BaseModel):
    vessel_draft_m: float
    max_port_draft_m: float
    under_keel_clearance_m: float
    is_admissible: bool
    requires_lighterage: bool
    lighterage_location: Optional[str] = None


class CharterValidationResponse(BaseModel):
    valid: bool
    errors: List[str]
    warnings: List[str]
    draft_feasibility: DraftFeasibilityResult
    estimated_discharge_days: float
    estimated_demurrage_exposure_usd: float


class PortFeasibilityRequest(BaseModel):
    port_id: str
    vessel_draft_m: float
    ukc_requirement_m: float = 1.0


class PortFeasibilityResponse(BaseModel):
    port_id: str
    port_name: str
    vessel_draft_m: float
    max_permissible_draft_m: float
    under_keel_clearance_m: float
    is_admissible: bool
    requires_lighterage: bool
    lighterage_location: Optional[str] = None
    message: str


class DecisionWorkspaceItem(BaseModel):
    category: str = Field(..., description="Category name (e.g. Freight Outlook, Port Constraints)")
    status: str = Field(..., description="OPTIMAL | COMPATIBLE | CAUTION | RESTRICTED | PENDING_MODEL")
    available_data: str = Field(..., description="Summary of confirmed input & benchmark data")
    relevant_evidence: str = Field(..., description="Calculated metric, rule, or constraint basis")
    actionable_recommendation: str = Field(..., description="Advisory for charterer or procurement team")


class CargoRequirementContext(BaseModel):
    commodity_id: str
    commodity_name: str
    category: str
    cargo_quantity_mt: float
    quantity_unit: str = "MT"
    parcel_classification: str
    stowage_factor_m3_per_mt: float
    handling_requirements: List[str]
    is_demo: bool = False


class FreightMarketContext(BaseModel):
    benchmark_rate_usd_mt: float
    benchmark_index_name: str
    market_sentiment: str
    historic_volatility_pct: float
    forecast_status: str
    forecast_available: bool = False
    notice: str


class CharteringContext(BaseModel):
    laycan_start: str
    laycan_end: str
    laycan_window_days: int
    contract_type: str
    recommended_charter_type: str
    market_fixture_liquidity: str
    cancellation_risk: str
    charter_terms_summary: str


class VesselContext(BaseModel):
    vessel_class: str
    dwt_min: float
    dwt_max: float
    typical_draft_m: float
    calculated_sailing_draft_m: float
    daily_bunker_consumption_mt: float
    laden_speed_knots: float
    ballast_speed_knots: float
    geared: bool
    crane_capacity_tonnes: Optional[float] = None
    suitability_assessment: str


class PortContext(BaseModel):
    destination_port_id: str
    destination_port_name: str
    port_code: str
    state: str
    max_permissible_draft_m: float
    calculated_ukc_m: float
    is_admissible: bool
    requires_lighterage: bool
    lighterage_location: Optional[str] = None
    mechanized_discharge_rate_mt_day: float
    estimated_discharge_days: float
    weather_sensitivity_notes: str
    operational_notes: str


class RouteContext(BaseModel):
    route_id: str
    corridor_name: str
    origin_port: str
    origin_country: str
    destination_port: str
    distance_nm: float
    transit_days_laden: float
    transit_days_ballast: float
    choke_points: List[str]
    weather_vulnerability: str
    route_risk_score: float


class CostContext(BaseModel):
    freight_rate_usd_mt: float
    estimated_freight_baseline_usd: float
    estimated_discharge_days: float
    demurrage_rate_usd_day: float
    potential_demurrage_exposure_usd: float
    target_freight_usd_mt: Optional[float] = None
    budget_usd: Optional[float] = None
    variance_vs_target_usd_mt: Optional[float] = None
    cost_status_notice: str


class CargoAnalysisRequest(BaseModel):
    cargo_type: str = Field(..., description="Commodity ID or name, e.g. cmd-coking-coal or Hard Coking Coal")
    cargo_quantity: float = Field(..., description="Parcel quantity in MT")
    quantity_unit: str = Field("MT", description="Measurement unit (default MT)")
    origin_country: str = Field(..., description="Country of loading")
    origin_port: str = Field(..., description="Port of loading")
    destination_port: str = Field(..., description="Indian port ID or name")
    delivery_date: str = Field(..., description="Target delivery date YYYY-MM-DD")
    laycan_start: str = Field(..., description="Laycan window start YYYY-MM-DD")
    laycan_end: str = Field(..., description="Laycan window end YYYY-MM-DD")
    preferred_vessel_type: str = Field(..., description="Panamax, Capesize, Supramax, etc.")
    target_freight: Optional[float] = Field(None, description="Target freight in USD/MT")
    budget: Optional[float] = Field(None, description="Total freight budget in USD")
    contract_type: str = Field("spot_voyage", description="spot_voyage, time_charter, coa")
    is_demo: bool = Field(False, description="Flag indicating SIH demo scenario")


class CargoAnalysisResponse(BaseModel):
    request_id: str
    timestamp: str
    is_demo: bool
    cargo_requirement: CargoRequirementContext
    freight_market: FreightMarketContext
    chartering_context: CharteringContext
    vessel_context: VesselContext
    port_context: PortContext
    route_context: RouteContext
    cost_context: CostContext
    decision_workspace: List[DecisionWorkspaceItem]
    data_provenance: List[DataProvenanceModel]


# ----------------------------------------------------------------------
# Phase 5: East Coast India Port Intelligence & Constraint Engine Models
# ----------------------------------------------------------------------

class PortRiskDimensionModel(BaseModel):
    dimension: str
    risk_level: str  # "Low", "Moderate", "High", "Unknown"
    score: float  # 0 to 100
    metric_value: str
    benchmark_criteria: str
    operational_implication: str
    provenance_status: str  # "Historical", "Live", "Demo", "Simulated", "Calculated", "Configured", "Unavailable"


class PortCargoCompatibilityModel(BaseModel):
    commodity: str
    is_supported: bool
    discharge_rate_mt_day: float
    handling_equipment: str
    status: str  # "Supported", "Restricted", "Prohibited", "Requires Lighterage"
    notes: str


class PortVesselCompatibilityModel(BaseModel):
    vessel_class: str
    vessel_name: Optional[str] = None
    dwt: float
    sailing_draft_m: float
    max_port_draft_m: float
    under_keel_clearance_m: float
    ukc_status: str  # "Safe", "Marginal", "Violated"
    is_admissible: bool
    requires_lighterage: bool
    loa_compliant: bool
    beam_compliant: bool
    operational_notes: str


class PortDecisionFactorsModel(BaseModel):
    advantages: List[str]
    constraints: List[str]
    unknowns: List[str]
    required_verifications: List[str]


class PortIntelligenceEvaluationRequest(BaseModel):
    port_id: str
    commodity_id: Optional[str] = None
    commodity_name: Optional[str] = None
    cargo_quantity_mt: Optional[float] = 50000.0
    vessel_class: Optional[str] = "Panamax"
    vessel_draft_m: Optional[float] = None
    ukc_requirement_m: float = 1.0


class PortIntelligenceEvaluationResponse(BaseModel):
    port_id: str
    port_name: str
    port_code: str
    state: str
    port_type: str
    max_permissible_draft_m: float
    max_loa_m: float
    max_beam_m: float
    tidal_restriction: bool
    riverine_navigation: bool
    lighterage_required: bool
    lighterage_location: Optional[str] = None
    allowable_vessel_classes: List[str]
    mechanized_discharge_rate_mt_day: float
    typical_waiting_days: float
    average_demurrage_rate_usd_day: float
    weather_sensitivity_notes: str
    operational_notes: str
    vessel_compatibility: PortVesselCompatibilityModel
    cargo_compatibility: PortCargoCompatibilityModel
    risk_matrix: List[PortRiskDimensionModel]
    waiting_time_impact: Dict[str, Any]
    weather_operational_profile: Dict[str, Any]
    decision_factors: PortDecisionFactorsModel
    data_provenance: DataProvenanceModel


class PortComparisonRequest(BaseModel):
    port_ids: Optional[List[str]] = None
    commodity_id: Optional[str] = "cmd-coking-coal"
    commodity_name: Optional[str] = "Hard Coking Coal (HCC)"
    cargo_quantity_mt: float = 50000.0
    preferred_vessel_class: Optional[str] = "Panamax"
    vessel_draft_m: Optional[float] = None


class PortComparisonItemModel(BaseModel):
    port_id: str
    port_name: str
    port_code: str
    state: str
    max_permissible_draft_m: float
    mechanized_discharge_rate_mt_day: float
    typical_waiting_days: float
    average_demurrage_rate_usd_day: float
    lighterage_required: bool
    cargo_supported: bool
    cargo_status: str
    vessel_admissible: bool
    under_keel_clearance_m: float
    ukc_status: str
    discharge_days: float
    demurrage_exposure_usd: float
    overall_risk_level: str
    decision_summary: str
    data_confidence: str


class PortComparisonResponse(BaseModel):
    timestamp: str
    evaluated_ports_count: int
    cargo_commodity: str
    cargo_quantity_mt: float
    preferred_vessel_class: str
    comparison_items: List[PortComparisonItemModel]
    decision_matrix: Dict[str, PortDecisionFactorsModel]


# ----------------------------------------------------------------------
# Phase 6: Scenario Simulator & What-If Decision Engine Models
# ----------------------------------------------------------------------

class ScenarioVariableChangeModel(BaseModel):
    variable_name: str
    base_value: str
    simulated_value: str
    absolute_delta: float
    percentage_delta: Optional[float] = None
    unit: str
    provenance_status: str  # "User Input", "Calculated", "Configured", "Simulated"


class ScenarioVoyageEconomicsModel(BaseModel):
    freight_rate_usd_mt: float
    total_freight_usd: float
    bunker_cost_usd: float
    port_pda_usd: float
    demurrage_exposure_usd: float
    total_voyage_cost_usd: float
    cost_per_mt_usd: float
    daily_hire_tce_usd: float


class ScenarioSensitivityPointModel(BaseModel):
    step_label: str
    parameter_value: float
    demurrage_exposure_usd: float
    total_voyage_cost_usd: float
    cost_per_mt_usd: float


class ScenarioSensitivityTable(BaseModel):
    parameter_name: str
    unit: str
    points: List[ScenarioSensitivityPointModel]


class ScenarioDecisionFactorsModel(BaseModel):
    positive_changes: List[str]
    negative_changes: List[str]
    operational_constraints: List[str]
    unknowns: List[str]


class ScenarioPresetModel(BaseModel):
    preset_id: str
    name: str
    description: str
    assumptions_summary: str
    variable_overrides: Dict[str, Any]


class ScenarioSimulationRequest(BaseModel):
    scenario_name: Optional[str] = "Simulated Scenario"
    base_commodity_id: str = "cmd-coking-coal"
    base_commodity_name: str = "Hard Coking Coal (HCC)"
    base_cargo_quantity_mt: float = 50000.0
    base_origin_port: str = "Hay Point / Newcastle, Australia"
    base_destination_port_id: str = "port-in-prt"
    base_vessel_class: str = "Panamax"
    base_laycan_start: str = "2026-10-15"
    base_laycan_end: str = "2026-10-25"
    base_freight_rate_usd_mt: float = 15.50
    base_bunker_price_usd_mt: float = 620.0
    base_charter_hire_usd_day: float = 18000.0
    base_demurrage_rate_usd_day: float = 30000.0
    base_port_waiting_days: float = 1.8
    base_port_pda_usd: float = 65000.0
    # Overrides:
    simulated_freight_rate_usd_mt: Optional[float] = None
    simulated_cargo_quantity_mt: Optional[float] = None
    simulated_destination_port_id: Optional[str] = None
    simulated_vessel_class: Optional[str] = None
    simulated_laycan_start: Optional[str] = None
    simulated_laycan_end: Optional[str] = None
    simulated_bunker_price_usd_mt: Optional[float] = None
    simulated_charter_hire_usd_day: Optional[float] = None
    simulated_demurrage_rate_usd_day: Optional[float] = None
    simulated_port_waiting_days: Optional[float] = None
    simulated_speed_knots: Optional[float] = None


class ScenarioSimulationResponse(BaseModel):
    timestamp: str
    scenario_name: str
    base_scenario_summary: Dict[str, Any]
    simulated_scenario_summary: Dict[str, Any]
    base_economics: ScenarioVoyageEconomicsModel
    simulated_economics: ScenarioVoyageEconomicsModel
    variable_changes: List[ScenarioVariableChangeModel]
    total_cost_delta_usd: float
    total_cost_delta_pct: float
    cost_per_mt_delta_usd: float
    vessel_evaluation: Dict[str, Any]
    port_evaluation: Dict[str, Any]
    demurrage_comparison: Dict[str, Any]
    sensitivity_analyses: List[ScenarioSensitivityTable]
    decision_factors: ScenarioDecisionFactorsModel
    explanation_chain: List[str]
    forecast_context: Dict[str, Any]
    data_provenance: List[DataProvenanceModel]
    advisory_disclaimer: str


# ==============================================================================
# Phase 7: Explainability, Uncertainty & AI Decision Support Models
# ==============================================================================

class DecisionTraceNodeModel(BaseModel):
    node_id: str
    phase_number: int
    title: str
    subtitle: str
    key_metric_label: str
    key_metric_value: str
    status: str
    source_attribution: str
    details: Dict[str, Any]


class AssumptionItemModel(BaseModel):
    parameter: str
    category: str
    value: str
    source: str
    data_status: str
    sensitivity_impact: str
    notes: str


class ModelCardModel(BaseModel):
    model_name: str
    version: str
    algorithm: str
    training_data_period: str
    feature_set: List[str]
    target_variable: str
    forecast_horizons_supported: List[str]
    evaluation_method: str
    metrics: Dict[str, Any]
    last_updated: str
    status: str


class DataQualityEvidenceModel(BaseModel):
    evidence_state: str  # 'HIGH EVIDENCE', 'MODERATE EVIDENCE', 'LIMITED EVIDENCE', 'INSUFFICIENT DATA'
    state_rationale: str
    historical_observations_count: int
    data_coverage_period: str
    verified_sources_count: int
    unobserved_variables_count: int
    criteria_evaluated: List[Dict[str, Any]]


class IntelligenceQueryRequest(BaseModel):
    query: str
    commodity_name: Optional[str] = "Hard Coking Coal (HCC)"
    origin_port: Optional[str] = "Newcastle, Australia"
    destination_port_id: Optional[str] = "port-in-prt"
    cargo_quantity_mt: Optional[float] = 50000.0
    vessel_class: Optional[str] = "Panamax"
    laycan_start: Optional[str] = "2026-10-15"
    laycan_end: Optional[str] = "2026-10-25"
    forecast_rate_usd_mt: Optional[float] = 15.50
    waiting_days: Optional[float] = 1.8
    bunker_price_usd_mt: Optional[float] = 620.0
    charter_hire_usd_day: Optional[float] = 18000.0


class IntelligenceQueryResponse(BaseModel):
    query: str
    intent_category: str
    timestamp: str
    answer: str
    evidence: List[str]
    impact: str
    uncertainty: str
    data_status: str
    decision_factors: List[str]
    assumptions: List[AssumptionItemModel]
    limitations: List[str]
    trace_nodes: List[DecisionTraceNodeModel]
    data_provenance: List[DataProvenanceModel]




