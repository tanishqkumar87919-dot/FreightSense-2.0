export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface FreightMarketIndex {
  id: string;
  name: string;
  symbol: string;
  currentValue: number;
  changeValue: number;
  changePercent: number;
  currency: string;
  unit: string;
  updatedAt: string;
  historical: { date: string; value: number; upper?: number; lower?: number }[];
}

export interface RouteItem {
  id: string;
  name: string;
  origin: string;
  originCountry: string;
  destination: string;
  destinationCountry: string;
  distanceNm: number;
  transitDays: number;
  spotRateUsd: number;
  capacityUtilization: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  weeklyChangePercent: number;
  activeVesselsCount: number;
  corridor: string;
  alternativeRoutes?: {
    name: string;
    via: string;
    transitDays: number;
    spotRateUsd: number;
    riskScore: number;
    capacity: string;
  }[];
  coordinates: {
    origin: [number, number]; // lat, lng
    destination: [number, number];
    waypoints: [number, number][];
  };
}

export interface PortItem {
  id: string;
  name: string;
  country: string;
  code: string;
  coordinates: [number, number];
  annualThroughputMTeu: number;
  vesselArrivals7d: number;
  congestionIndex: number; // 0 - 100
  averageDwellDays: number;
  delayRisk: RiskLevel;
  activeVesselsWaiting: number;
  berthUtilizationPercent: number;
  recentEvents: {
    id: string;
    title: string;
    timestamp: string;
    type: 'weather' | 'labor' | 'operational' | 'capacity';
    description: string;
  }[];
  metricsHistory: {
    date: string;
    arrivals: number;
    congestion: number;
    dwellTime: number;
    throughput: number;
  }[];
}

export type VesselStatus = 'At Sea' | 'At Port' | 'Anchored' | 'Delayed' | 'Unknown';

export interface VesselItem {
  id: string;
  name: string;
  imo: string;
  type: string;
  carrier: string;
  flag: string;
  capacityTeu: number;
  deadweightTonnage: number;
  coordinates: [number, number];
  currentSpeedKnots: number;
  currentStatus: VesselStatus;
  originPort: string;
  destinationPort: string;
  departureDate: string;
  estimatedArrival: string;
  lastReportedTimestamp: string;
  routeId: string;
  timeline: {
    stage: string;
    location: string;
    timestamp: string;
    status: 'completed' | 'current' | 'upcoming';
  }[];
}

export interface WeatherHazard {
  id: string;
  name: string;
  type: 'Tropical Cyclone' | 'Gale' | 'High Swell' | 'Fog' | 'Monsoon';
  severity: RiskLevel;
  location: string;
  coordinates: [number, number];
  radiusKm: number;
  maxWindSpeedKnots: number;
  significantWaveHeightMeters: number;
  startedAt: string;
  expectedEnd: string;
  affectedRouteIds: string[];
  description: string;
  freightImpact: {
    routeDelayDays: number;
    reroutingRisk: 'High' | 'Medium' | 'Low';
    affectedPorts: string[];
  };
}

export interface TradeFlowItem {
  id: string;
  corridor: string;
  originRegion: string;
  destinationRegion: string;
  commodity: string;
  annualTeuVolume: number;
  monthlyGrowthPercent: number;
  freightRateAverage: number;
  riskLevel: RiskLevel;
  primaryPorts: string[];
  flowCoords: {
    from: [number, number];
    to: [number, number];
    mid: [number, number];
  };
}

export interface MarketSignal {
  id: string;
  name: string;
  category: 'Demand' | 'Capacity' | 'Congestion' | 'Vessel Activity' | 'Weather' | 'Fuel' | 'Seasonality' | 'Trade';
  currentValue: string;
  historicalChangePercent: number;
  direction: 'up' | 'down' | 'neutral';
  impactScore: number; // 0 - 100
  confidencePercent: number;
  description: string;
  supportingDataSummary: string;
  trendSeries: { date: string; value: number }[];
}

export interface AIInsight {
  id: string;
  category: 'Market' | 'Route' | 'Port' | 'Vessel' | 'Risk' | 'Forecast';
  title: string;
  observation: string;
  explanation: string;
  impact: string;
  forecast: string;
  confidenceScore: number; // 0-100
  timestamp: string;
  modelVersion: string;
  dataSources: string[];
  relatedRouteId?: string;
  relatedPortId?: string;
  supportingMetrics: { label: string; value: string; change?: string }[];
}

export interface AlertItem {
  id: string;
  title: string;
  type: 'freight_price' | 'route_disruption' | 'port_congestion' | 'weather_event' | 'forecast_change' | 'risk_increase' | 'vessel_delay';
  targetObject: string;
  condition: string;
  currentValue: string;
  thresholdValue: string;
  status: 'active' | 'triggered' | 'paused';
  severity: RiskLevel;
  createdDate: string;
  lastTriggered?: string;
  notificationChannels: ('email' | 'in-app' | 'push')[];
}

export interface ReportItem {
  id: string;
  title: string;
  category: 'Market' | 'Route' | 'Port' | 'Forecast' | 'Risk';
  coverage: string;
  generatedDate: string;
  keyInsight: string;
  readTimeMinutes: number;
  sourceCount: number;
  isSaved?: boolean;
  sections?: {
    id: string;
    title: string;
    content: string;
    metrics?: { label: string; value: string; delta?: string }[];
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  group: 'today' | 'earlier' | 'system' | 'alerts';
  type: 'market' | 'forecast' | 'route' | 'port' | 'weather' | 'report' | 'system';
  severity: 'info' | 'warning' | 'critical' | 'success';
  isRead: boolean;
  relatedPath?: string;
}

export interface ScenarioParameters {
  demandChangePercent: number;     // -30 to +30
  capacityChangePercent: number;   // -30 to +30
  portCongestionLevel: number;     // 0 to 100
  weatherSeverityIndex: number;    // 0 to 100
  bunkerFuelPriceUsd: number;      // 400 to 1000
  tradeVolumeChangePercent: number;// -20 to +20
}

export interface ScenarioResult {
  baselineRateUsd: number;
  projectedRateUsd: number;
  rateDeltaPercent: number;
  expectedDelayDays: number;
  delayDeltaDays: number;
  projectedRiskScore: number;
  capacityPressurePercent: number;
  explanation: string;
  drivers: { name: string; weight: number; contribution: string }[];
  series: { date: string; baseline: number; scenario: number }[];
}

// ----------------------------------------------------------------------
// SIH DOMAIN FOUNDATION: DRY BULK, PORTS & CHARTERING
// ----------------------------------------------------------------------

export type ProvenanceStatus = 'historical' | 'demo' | 'simulated' | 'live';

export interface DataProvenance {
  source: string;
  datasetName: string;
  coveragePeriod: string;
  lastUpdated: string;
  dataType: string;
  units: string;
  status: ProvenanceStatus;
}

export interface BulkCommodity {
  id: string;
  name: string;
  category: 'Coking Coal' | 'Thermal Coal' | 'Iron Ore' | 'Limestone' | 'Fertilizer' | 'Bauxite' | 'Grain';
  stowageFactorM3PerMt: number;
  typicalParcelSizeTonnes: number;
  handlingRequirements: string[];
  majorImportPorts: string[];
  majorExportOrigins: string[];
  provenance: DataProvenance;
}

export type DryBulkVesselClassName = 'Capesize' | 'Kamsarmax' | 'Panamax' | 'Ultramax' | 'Supramax' | 'Handysize';

export interface DryBulkVesselClass {
  id: string;
  name: DryBulkVesselClassName;
  dwtMin: number;
  dwtMax: number;
  typicalDraftMeters: number;
  beamMeters: number;
  loaMeters: number;
  geared: boolean; // Whether ship has onboard cranes/grabs
  craneCapacityTonnes?: number;
  dailyBunkerFuelMt: number;
  speedKnotsBallast: number;
  speedKnotsLaden: number;
  provenance: DataProvenance;
}

export interface EastCoastPortConstraint {
  portId: string;
  portName: string;
  portCode: string;
  state: string;
  maxPermissibleDraftMeters: number;
  maxLoaMeters: number;
  maxBeamMeters: number;
  tidalRestriction: boolean;
  riverineNavigation: boolean;
  lighterageRequired: boolean;
  lighterageLocation?: string;
  allowableVesselClasses: DryBulkVesselClassName[];
  mechanizedDischargeRateMtPerDay: number;
  typicalWaitingDays: number;
  averageDemurrageRateUsdPerDay: number;
  weatherSensitivityNotes: string;
  operationalNotes: string;
  provenance: DataProvenance;
}

export interface BulkRouteItem {
  id: string;
  name: string;
  originPort: string;
  originCountry: string;
  destinationPort: string;
  destinationCountry: string;
  distanceNm: number;
  transitDaysLaden: number;
  transitDaysBallast: number;
  cargoType: string;
  allowableVesselClasses: DryBulkVesselClassName[];
  benchmarkVoyageRateUsdPerMt: number;
  routeRiskScore: number;
  chokePoints: string[];
  weatherVulnerability: string;
  coordinates: {
    origin: [number, number];
    destination: [number, number];
    waypoints: [number, number][];
  };
  provenance: DataProvenance;
}

export interface CharterRequest {
  commodityId: string;
  commodityName: string;
  cargoQuantityMt: number;
  originPortId: string;
  destinationPortId: string;
  preferredVesselClass: DryBulkVesselClassName;
  laycanStart: string; // YYYY-MM-DD
  laycanEnd: string;   // YYYY-MM-DD
  charterType: 'spot_voyage' | 'time_charter' | 'coa';
  maxDraftToleranceMeters?: number;
}

export interface CharterValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  draftFeasibility: {
    vesselDraftMeters: number;
    maxPortDraftMeters: number;
    underKeelClearanceMeters: number;
    isAdmissible: boolean;
    requiresLighterage: boolean;
    lighterageLocation?: string;
  };
  estimatedDischargeDays: number;
  estimatedDemurrageExposureUsd: number;
}

// ----------------------------------------------------------------------
// PHASE 2: INTELLIGENT BULK CARGO PROCUREMENT ANALYSIS
// ----------------------------------------------------------------------

export interface DecisionWorkspaceItem {
  category: 'Freight Outlook' | 'Chartering Context' | 'Vessel Compatibility' | 'Port Constraints' | 'Route Risk' | 'Cost Exposure' | string;
  status: 'OPTIMAL' | 'COMPATIBLE' | 'CAUTION' | 'RESTRICTED' | 'PENDING_MODEL';
  availableData: string;
  relevantEvidence: string;
  actionableRecommendation: string;
}

export interface CargoRequirementContext {
  commodityId: string;
  commodityName: string;
  category: string;
  cargoQuantityMt: number;
  quantityUnit: string;
  parcelClassification: string;
  stowageFactorM3PerMt: number;
  handlingRequirements: string[];
  isDemo?: boolean;
}

export interface FreightMarketContext {
  benchmarkRateUsdMt: number;
  benchmarkIndexName: string;
  marketSentiment: string;
  historicVolatilityPct: number;
  forecastStatus: string;
  forecastAvailable: boolean;
  notice: string;
}

export interface CharteringContext {
  laycanStart: string;
  laycanEnd: string;
  laycanWindowDays: number;
  contractType: string;
  recommendedCharterType: string;
  marketFixtureLiquidity: string;
  cancellationRisk: string;
  charterTermsSummary: string;
}

export interface VesselContext {
  vesselClass: string;
  dwtMin: number;
  dwtMax: number;
  typicalDraftM: number;
  calculatedSailingDraftM: number;
  dailyBunkerConsumptionMt: number;
  ladenSpeedKnots: number;
  ballastSpeedKnots: number;
  geared: boolean;
  craneCapacityTonnes?: number | null;
  suitabilityAssessment: string;
}

export interface PortContext {
  destinationPortId: string;
  destinationPortName: string;
  portCode: string;
  state: string;
  maxPermissibleDraftM: number;
  calculatedUkcM: number;
  isAdmissible: boolean;
  requiresLighterage: boolean;
  lighterageLocation?: string | null;
  mechanizedDischargeRateMtDay: number;
  estimatedDischargeDays: number;
  weatherSensitivityNotes: string;
  operationalNotes: string;
}

export interface RouteContext {
  routeId: string;
  corridorName: string;
  originPort: string;
  originCountry: string;
  destinationPort: string;
  distanceNm: number;
  transitDaysLaden: number;
  transitDaysBallast: number;
  chokePoints: string[];
  weatherVulnerability: string;
  routeRiskScore: number;
}

export interface CostContext {
  freightRateUsdMt: number;
  estimatedFreightBaselineUsd: number;
  estimatedDischargeDays: number;
  demurrageRateUsdDay: number;
  potentialDemurrageExposureUsd: number;
  targetFreightUsdMt?: number | null;
  budgetUsd?: number | null;
  varianceVsTargetUsdMt?: number | null;
  costStatusNotice: string;
}

export interface CargoAnalysisRequest {
  cargoType: string;
  cargoQuantity: number;
  quantityUnit?: string;
  originCountry: string;
  originPort: string;
  destinationPort: string;
  deliveryDate: string;
  laycanStart: string;
  laycanEnd: string;
  preferredVesselType: string;
  targetFreight?: number | null;
  budget?: number | null;
  contractType?: 'spot_voyage' | 'time_charter' | 'coa';
  isDemo?: boolean;
}

export interface CargoAnalysisResponse {
  requestId: string;
  timestamp: string;
  isDemo: boolean;
  cargoRequirement: CargoRequirementContext;
  freightMarket: FreightMarketContext;
  charteringContext: CharteringContext;
  vesselContext: VesselContext;
  portContext: PortContext;
  routeContext: RouteContext;
  costContext: CostContext;
  decisionWorkspace: DecisionWorkspaceItem[];
  dataProvenance: DataProvenance[];
}

// ----------------------------------------------------------------------
// PHASE 3: INTELLIGENT FREIGHT FORECASTING ENGINE TYPES
// ----------------------------------------------------------------------

export interface ForecastContext {
  cargoType: string;
  cargoQuantity: number;
  originCountry: string;
  originPort: string;
  destinationPort: string;
  vesselType: string;
  laycan: string;
  isImportedFromAnalysis: boolean;
}

export interface BaselineMetricSet {
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  directional_accuracy: number;
  smape?: number;
  interval_coverage?: number;
}

export interface HorizonBaselineComparison {
  Baseline_Naive: BaselineMetricSet;
  Baseline_MovingAverage: BaselineMetricSet;
  Baseline_ExpSmoothing: BaselineMetricSet;
  ML_Ridge: BaselineMetricSet;
  ML_RandomForest: BaselineMetricSet;
  ML_XGBoost: BaselineMetricSet;
  ML_LightGBM: BaselineMetricSet;
}

export interface ForecastDriverItem {
  feature: string;
  name: string;
  weight: number;
  impact: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

export interface ForecastExplanationSignal {
  observedSignal: string;
  marketEffect: string;
  freightImpact: string;
  evidenceCategory: 'Observed Data' | 'Model Output' | 'Calculated Interpretation';
  sourceContext: string;
}

export interface CharteringImplication {
  freightOutlook: string;
  laycanWindow: string;
  marketContext: string;
  decisionConsideration: string;
  riskCaution: string;
}

// ----------------------------------------------------------------------
// PHASE 4: VESSEL SELECTION & CHARTERING OPTIMIZATION TYPES
// ----------------------------------------------------------------------

export interface CharterCandidateVessel {
  id: string;
  name: string;
  imo: string;
  vessel_class: string;
  dwt: number;
  built_year: number;
  flag: string;
  typical_draft_m: number;
  ballast_draft_m: number;
  beam_m: number;
  loa_m: number;
  geared: boolean;
  crane_capacity_tonnes?: number | null;
  daily_bunker_fuel_mt: number;
  laden_speed_knots: number;
  ballast_speed_knots: number;
  current_position_name: string;
  coordinates: [number, number];
  estimated_ballast_distance_nm: number;
  estimated_daily_hire_usd: number;
  provenance: DataProvenance;
}

export interface VesselFitScoreBreakdown {
  total_score: number;
  cargo_intake_score: number;
  port_draft_score: number;
  laycan_fit_score: number;
  equipment_crane_score: number;
  route_efficiency_score: number;
  explanation: string;
}

export interface VoyageEconomicsComparison {
  voyage_charter_total_usd: number;
  voyage_charter_usd_mt: number;
  time_charter_total_usd: number;
  time_charter_usd_mt: number;
  hire_component_usd: number;
  bunker_component_usd: number;
  port_pda_component_usd: number;
  cost_differential_usd: number;
  cost_differential_pct: number;
  recommended_charter_type: string;
  risk_allocation_notes: string;
  calculation_assumptions: string[];
}

export interface DemurrageExposureResult {
  daily_demurrage_rate_usd: number;
  allowed_laytime_days: number;
  estimated_waiting_days: number;
  estimated_discharge_days: number;
  estimated_demurrage_days: number;
  potential_exposure_usd: number;
  risk_level: string;
  calculation_formula: string;
}

export interface BallastLegResult {
  ballast_origin: string;
  ballast_distance_nm: number;
  ballast_speed_knots: number;
  ballast_days: number;
  bunker_consumed_mt: number;
  status: string;
}

export interface VesselFitAnalysisResult {
  vessel: CharterCandidateVessel;
  load_factor_pct: number;
  calculated_sailing_draft_m: number;
  port_max_draft_m: number;
  under_keel_clearance_m: number;
  port_admissible: boolean;
  requires_lighterage: boolean;
  lighterage_location?: string | null;
  estimated_eta_load_port: string;
  laycan_status: string;
  laycan_delta_days: number;
  fit_score: VesselFitScoreBreakdown;
  voyage_economics: VoyageEconomicsComparison;
  demurrage_exposure: DemurrageExposureResult;
  ballast_leg: BallastLegResult;
  satisfied_criteria: string[];
  operational_constraints: string[];
  missing_data_notices: string[];
  decision_summary: string;
}

export interface CharteringEvaluationRequest {
  commodity_id: string;
  cargo_quantity_mt: number;
  origin_port: string;
  destination_port: string;
  laycan_start: string;
  laycan_end: string;
  target_freight_usd_mt?: number;
  daily_hire_usd_day?: number;
  bunker_fuel_price_usd_mt?: number;
  demurrage_rate_usd_day?: number;
  port_cost_usd?: number;
}

export interface CharteringEvaluationResponse {
  request_timestamp: string;
  cargo_quantity_mt: number;
  destination_port: string;
  laycan_window: string;
  recommended_vessel_id: string;
  candidates_analyzed: number;
  vessel_analyses: VesselFitAnalysisResult[];
  advisory_notice: string;
}

// ----------------------------------------------------------------------
// Phase 5: East Coast India Port Intelligence & Constraint Engine
// ----------------------------------------------------------------------

export type PortRiskLevel = 'Low' | 'Moderate' | 'High' | 'Unknown';

export interface PortRiskDimension {
  dimension: string;
  risk_level: PortRiskLevel;
  score: number; // 0 - 100
  metric_value: string;
  benchmark_criteria: string;
  operational_implication: string;
  provenance_status: 'Historical' | 'Live' | 'Demo' | 'Simulated' | 'Calculated' | 'Configured' | 'Unavailable';
}

export interface PortCargoCompatibility {
  commodity: string;
  is_supported: boolean;
  discharge_rate_mt_day: number;
  handling_equipment: string;
  status: 'Supported' | 'Restricted' | 'Prohibited' | 'Requires Lighterage';
  notes: string;
}

export interface PortVesselEvaluation {
  vessel_class: DryBulkVesselClassName;
  vessel_name?: string;
  dwt: number;
  sailing_draft_m: number;
  max_port_draft_m: number;
  under_keel_clearance_m: number;
  ukc_status: 'Safe' | 'Marginal' | 'Violated';
  is_admissible: boolean;
  requires_lighterage: boolean;
  loa_compliant: boolean;
  beam_compliant: boolean;
  operational_notes: string;
}

export interface PortDecisionFactors {
  advantages: string[];
  constraints: string[];
  unknowns: string[];
  required_verifications: string[];
}

export interface PortIntelligenceEvaluationRequest {
  port_id: string;
  commodity_id?: string;
  commodity_name?: string;
  cargo_quantity_mt?: number;
  vessel_class?: DryBulkVesselClassName;
  vessel_draft_m?: number;
  ukc_requirement_m?: number;
}

export interface PortIntelligenceEvaluationResponse {
  port_id: string;
  port_name: string;
  port_code: string;
  state: string;
  port_type: string;
  max_permissible_draft_m: number;
  max_loa_m: number;
  max_beam_m: number;
  tidal_restriction: boolean;
  riverine_navigation: boolean;
  lighterage_required: boolean;
  lighterage_location?: string | null;
  allowable_vessel_classes: DryBulkVesselClassName[];
  mechanized_discharge_rate_mt_day: number;
  typical_waiting_days: number;
  average_demurrage_rate_usd_day: number;
  weather_sensitivity_notes: string;
  operational_notes: string;
  vessel_compatibility: PortVesselEvaluation;
  cargo_compatibility: PortCargoCompatibility;
  risk_matrix: PortRiskDimension[];
  waiting_time_impact: {
    typical_waiting_days: number;
    mechanized_discharge_rate_mt_day: number;
    estimated_discharge_days: number;
    total_port_stay_days: number;
    daily_demurrage_rate_usd: number;
    potential_demurrage_exposure_usd: number;
    congestion_status_badge: string;
    provenance_status: string;
    notes: string;
  };
  weather_operational_profile: {
    southwest_monsoon: { period: string; condition: string; impact: string };
    northeast_monsoon: { period: string; condition: string; impact: string };
    cyclone_window: { period: string; condition: string; impact: string };
    riverine_hydrodynamics: { condition: string; impact: string };
    provenance_status: string;
  };
  decision_factors: PortDecisionFactors;
  data_provenance: DataProvenance;
}

export interface PortComparisonRequest {
  port_ids?: string[];
  commodity_id?: string;
  commodity_name?: string;
  cargo_quantity_mt?: number;
  preferred_vessel_class?: DryBulkVesselClassName;
  vessel_draft_m?: number;
}

export interface PortComparisonItem {
  port_id: string;
  port_name: string;
  port_code: string;
  state: string;
  max_permissible_draft_m: number;
  mechanized_discharge_rate_mt_day: number;
  typical_waiting_days: number;
  average_demurrage_rate_usd_day: number;
  lighterage_required: boolean;
  cargo_supported: boolean;
  cargo_status: string;
  vessel_admissible: boolean;
  under_keel_clearance_m: number;
  ukc_status: 'Safe' | 'Marginal' | 'Violated';
  discharge_days: number;
  demurrage_exposure_usd: number;
  overall_risk_level: PortRiskLevel;
  decision_summary: string;
  data_confidence: string;
}

export interface PortComparisonResponse {
  timestamp: string;
  evaluated_ports_count: number;
  cargo_commodity: string;
  cargo_quantity_mt: number;
  preferred_vessel_class: string;
  comparison_items: PortComparisonItem[];
  decision_matrix: Record<string, PortDecisionFactors>;
}

// ============================================================================
// Phase 6: Scenario Simulator & What-If Decision Engine Models
// ============================================================================

export interface ScenarioVariableChange {
  variable: string;
  category: 'Freight' | 'Port & Queue' | 'Vessel & Cargo' | 'Bunker Fuel' | 'Schedule' | 'Costs';
  base_value: string;
  simulated_value: string;
  delta_absolute: number;
  delta_percent: number;
  direction: 'increased' | 'decreased' | 'unchanged' | 'modified';
}

export interface ScenarioVoyageEconomics {
  cargo_quantity_mt: number;
  freight_rate_usd_mt: number;
  total_freight_usd: number;
  steaming_days: number;
  port_days: number;
  total_voyage_days: number;
  bunker_price_usd_mt: number;
  total_fuel_burn_mt: number;
  total_bunker_cost_usd: number;
  charter_hire_usd_day: number;
  charter_hire_cost_usd: number;
  port_pda_usd: number;
  demurrage_rate_usd_day: number;
  demurrage_exposure_usd: number;
  total_voyage_outlay_usd: number;
  cost_per_mt_usd: number;
}

export interface ScenarioSensitivityPoint {
  parameter_value: number;
  parameter_label: string;
  total_outlay_usd: number;
  cost_per_mt_usd: number;
  demurrage_exposure_usd: number;
  delta_vs_base_usd: number;
  delta_percent: number;
}

export interface ScenarioSensitivityTable {
  variable_name: string;
  unit: string;
  base_value: number;
  simulated_value: number;
  datapoints: ScenarioSensitivityPoint[];
}

export interface ScenarioDecisionFactors {
  advantages: string[];
  vulnerabilities: string[];
  tradeoffs: string[];
  recommendation: string;
}

export interface ScenarioPreset {
  preset_id: string;
  name: string;
  description: string;
  assumptions_summary: string;
  variable_overrides: Record<string, any>;
}

export interface ScenarioSimulationRequest {
  scenario_name?: string;
  commodity_name?: string;
  origin_port?: string;
  base_cargo_quantity_mt: number;
  base_freight_rate_usd_mt: number;
  base_vessel_class: DryBulkVesselClassName;
  base_destination_port_id: string;
  base_bunker_price_usd_mt: number;
  base_charter_hire_usd_day: number;
  base_demurrage_rate_usd_day: number;
  base_port_waiting_days: number;
  base_port_pda_usd?: number;
  base_laycan_start?: string;
  base_laycan_end?: string;
  simulated_cargo_quantity_mt?: number | null;
  simulated_freight_rate_usd_mt?: number | null;
  simulated_vessel_class?: DryBulkVesselClassName | null;
  simulated_destination_port_id?: string | null;
  simulated_bunker_price_usd_mt?: number | null;
  simulated_charter_hire_usd_day?: number | null;
  simulated_demurrage_rate_usd_day?: number | null;
  simulated_port_waiting_days?: number | null;
  simulated_speed_knots?: number | null;
  simulated_laycan_start?: string | null;
  simulated_laycan_end?: string | null;
}

export interface ScenarioSimulationResponse {
  scenario_id: string;
  scenario_name: string;
  timestamp: string;
  status: string;
  changed_variables: ScenarioVariableChange[];
  base_economics: ScenarioVoyageEconomics;
  simulated_economics: ScenarioVoyageEconomics;
  delta_total_freight_usd: number;
  delta_total_outlay_usd: number;
  delta_cost_per_mt_usd: number;
  delta_percentage_outlay: number;
  simulated_vessel_compatibility: {
    vessel_class: string;
    dwt: number;
    laden_draft_m: number;
    speed_knots: number;
    fuel_burn_mt_day: number;
    cargo_intake_mt: number;
    utilization_pct: number;
    draft_status: string;
    compatibility_score: number;
  };
  simulated_port_compatibility: {
    port_id: string;
    port_name: string;
    max_draft_m: number;
    ukc_available_m: number;
    ukc_status: string;
    requires_lighterage: boolean;
    lighterage_note?: string | null;
    is_compliant: boolean;
    restrictions_found: string[];
  };
  sensitivity_tables: ScenarioSensitivityTable[];
  explainability_chain: string[];
  decision_factors: ScenarioDecisionFactors;
  provenance: DataProvenance;
}




