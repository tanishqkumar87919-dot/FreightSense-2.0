-- ==============================================================================
-- FreightSense 2.0 - Core Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Complete schema for maritime intelligence, authoritative data
--              ingestion, feature stores, ML champion/challenger tracking,
--              user observations, and collaboration.
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS & WORKSPACES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'Procurement Director',
    company TEXT DEFAULT 'Vanguard Global Freight Group',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'light',
    currency TEXT DEFAULT 'USD ($)',
    speed_unit TEXT DEFAULT 'Knots (kts)',
    distance_unit TEXT DEFAULT 'Nautical Miles (nm)',
    default_region TEXT DEFAULT 'Global Mainlanes',
    timezone TEXT DEFAULT 'UTC (Greenwich Mean Time)',
    default_dashboard TEXT DEFAULT 'Executive Overview',
    default_date_range TEXT DEFAULT '30D',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    market_alerts BOOLEAN DEFAULT TRUE,
    route_alerts BOOLEAN DEFAULT TRUE,
    port_alerts BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 2. DATA GOVERNANCE & PROVENANCE REGISTRY
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    base_url TEXT NOT NULL,
    documentation_url TEXT,
    dataset_name TEXT NOT NULL,
    access_type TEXT NOT NULL, -- public, api, licensed, manual
    license_notes TEXT,
    update_frequency TEXT,
    historical_coverage TEXT,
    fields JSONB DEFAULT '[]'::JSONB,
    auth_required BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    rate_limit_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    records_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL,
    coverage TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id TEXT REFERENCES datasets(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL, -- string, number, date, badge
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT REFERENCES data_sources(id),
    status TEXT NOT NULL, -- running, completed, failed, partial
    records_ingested INTEGER DEFAULT 0,
    records_quarantined INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS raw_data_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT REFERENCES data_sources(id),
    ingestion_run_id UUID REFERENCES ingestion_runs(id),
    payload JSONB NOT NULL,
    checksum TEXT,
    retrieval_timestamp TIMESTAMPTZ DEFAULT NOW(),
    source_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historical_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT REFERENCES data_sources(id),
    entity_type TEXT NOT NULL, -- route, port, vessel, market_index, commodity, weather
    entity_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    observation_timestamp TIMESTAMPTZ NOT NULL,
    raw_object_id UUID REFERENCES raw_data_objects(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validated_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historical_observation_id UUID REFERENCES historical_observations(id),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    observation_timestamp TIMESTAMPTZ NOT NULL,
    validation_status TEXT DEFAULT 'valid', -- valid, flagged, quarantined
    quality_score NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingestion_run_id UUID REFERENCES ingestion_runs(id),
    check_name TEXT NOT NULL,
    check_type TEXT NOT NULL, -- schema, range, nullness, duplicate, outlier, spatial
    passed BOOLEAN NOT NULL,
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_source_reliability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT REFERENCES data_sources(id) UNIQUE,
    reliability_score NUMERIC DEFAULT 95.0,
    completeness_score NUMERIC DEFAULT 98.0,
    historical_accuracy NUMERIC DEFAULT 94.0,
    last_evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. MARITIME DOMAIN (ROUTES, PORTS, VESSELS, WEATHER, SIGNALS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    corridor TEXT NOT NULL,
    origin TEXT NOT NULL,
    origin_country TEXT NOT NULL,
    destination TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    distance_nm NUMERIC NOT NULL,
    transit_days NUMERIC NOT NULL,
    spot_rate_usd NUMERIC NOT NULL,
    capacity_utilization NUMERIC NOT NULL,
    risk_level TEXT NOT NULL, -- Low, Moderate, High, Severe
    risk_score NUMERIC NOT NULL,
    trend TEXT NOT NULL, -- up, down, stable
    weekly_change_percent NUMERIC NOT NULL,
    active_vessels_count INTEGER NOT NULL,
    coordinates JSONB NOT NULL,
    alternative_routes JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    annual_throughput_m_teu NUMERIC NOT NULL,
    vessel_arrivals_7d INTEGER NOT NULL,
    congestion_index NUMERIC NOT NULL,
    average_dwell_days NUMERIC NOT NULL,
    delay_risk TEXT NOT NULL,
    active_vessels_waiting INTEGER NOT NULL,
    berth_utilization_percent NUMERIC NOT NULL,
    recent_events JSONB DEFAULT '[]'::JSONB,
    metrics_history JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vessels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    imo TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    carrier TEXT NOT NULL,
    flag TEXT NOT NULL,
    capacity_teu INTEGER NOT NULL,
    deadweight_tonnage NUMERIC NOT NULL,
    current_speed_knots NUMERIC NOT NULL,
    current_status TEXT NOT NULL, -- At Sea, At Port, Anchored, Delayed, Unknown
    origin_port TEXT NOT NULL,
    destination_port TEXT NOT NULL,
    departure_date TIMESTAMPTZ NOT NULL,
    estimated_arrival TIMESTAMPTZ NOT NULL,
    last_reported_timestamp TIMESTAMPTZ NOT NULL,
    route_id TEXT REFERENCES routes(id),
    timeline JSONB DEFAULT '[]'::JSONB,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vessel_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id TEXT REFERENCES vessels(id) ON DELETE CASCADE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    speed_knots NUMERIC NOT NULL,
    heading NUMERIC,
    status TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS port_congestion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id TEXT REFERENCES ports(id) ON DELETE CASCADE,
    congestion_index NUMERIC NOT NULL,
    average_dwell_days NUMERIC NOT NULL,
    vessels_waiting INTEGER NOT NULL,
    berth_utilization NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS trade_flows (
    id TEXT PRIMARY KEY,
    corridor TEXT NOT NULL,
    origin_region TEXT NOT NULL,
    destination_region TEXT NOT NULL,
    commodity TEXT NOT NULL,
    annual_teu_volume NUMERIC NOT NULL,
    monthly_growth_percent NUMERIC NOT NULL,
    freight_rate_average NUMERIC NOT NULL,
    risk_level TEXT NOT NULL,
    primary_ports JSONB DEFAULT '[]'::JSONB,
    flow_coords JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    wind_speed_knots NUMERIC,
    wave_height_meters NUMERIC,
    storm_indicator BOOLEAN DEFAULT FALSE,
    temperature_c NUMERIC,
    observed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS weather_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    radius_km NUMERIC NOT NULL,
    max_wind_speed_knots NUMERIC NOT NULL,
    wave_height_meters NUMERIC NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    expected_end TIMESTAMPTZ NOT NULL,
    affected_route_ids JSONB DEFAULT '[]'::JSONB,
    freight_impact JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_signals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Demand, Capacity, Congestion, Vessel Activity, Weather, Fuel, Seasonality, Trade
    current_value TEXT NOT NULL,
    historical_change_percent NUMERIC NOT NULL,
    direction TEXT NOT NULL, -- up, down, neutral
    impact_score NUMERIC NOT NULL,
    confidence_percent NUMERIC NOT NULL,
    description TEXT NOT NULL,
    supporting_data_summary TEXT NOT NULL,
    trend_series JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS freight_market_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id TEXT REFERENCES routes(id),
    date DATE NOT NULL,
    rate_usd NUMERIC NOT NULL,
    weekly_change NUMERIC,
    capacity_status TEXT,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(route_id, date, source)
);

-- ------------------------------------------------------------------------------
-- 4. MACHINE LEARNING, MODELS & CONTINUOUS LEARNING
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feature_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    as_of_date DATE NOT NULL,
    features JSONB NOT NULL,
    feature_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, as_of_date)
);

CREATE TABLE IF NOT EXISTS training_datasets (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    target_name TEXT NOT NULL,
    feature_list JSONB NOT NULL,
    time_window_start DATE NOT NULL,
    time_window_end DATE NOT NULL,
    rows_count INTEGER NOT NULL,
    train_split_ratio NUMERIC DEFAULT 0.8,
    test_split_ratio NUMERIC DEFAULT 0.2,
    dataset_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecast_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    family TEXT NOT NULL, -- baseline, gradient_boosting, time_series, ensemble
    description TEXT,
    default_horizon TEXT DEFAULT '30D',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT REFERENCES forecast_models(id),
    version TEXT NOT NULL UNIQUE,
    algorithm TEXT NOT NULL,
    features_hash TEXT NOT NULL,
    training_dataset_id TEXT REFERENCES training_datasets(id),
    training_window JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'candidate', -- champion, challenger, candidate, retired, failed
    artifact_uri TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID REFERENCES model_versions(id) ON DELETE CASCADE,
    split_type TEXT NOT NULL, -- validation, test, backtest
    horizon TEXT NOT NULL, -- 7D, 14D, 30D, 60D, 90D
    mae NUMERIC NOT NULL,
    rmse NUMERIC NOT NULL,
    smape NUMERIC NOT NULL,
    wape NUMERIC NOT NULL,
    directional_accuracy NUMERIC NOT NULL,
    interval_coverage NUMERIC NOT NULL,
    calibration_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID REFERENCES model_versions(id),
    environment TEXT DEFAULT 'production',
    status TEXT DEFAULT 'active',
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    deployed_by TEXT DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS training_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version TEXT,
    model_family TEXT NOT NULL,
    parameters JSONB,
    metrics JSONB,
    status TEXT NOT NULL, -- running, completed, failed
    logs_uri TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS retraining_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_reason TEXT NOT NULL, -- scheduled, drift_detected, performance_degradation, manual
    status TEXT NOT NULL, -- pending, running, completed, rejected, failed
    champion_version_id UUID REFERENCES model_versions(id),
    candidate_version_id UUID REFERENCES model_versions(id),
    promotion_decision TEXT, -- promoted, rejected_worse_metrics, rejected_safety_check
    metrics_comparison JSONB,
    logs TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS freight_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id TEXT REFERENCES routes(id),
    model_version_id UUID REFERENCES model_versions(id),
    horizon TEXT NOT NULL, -- 7D, 14D, 30D, 60D, 90D
    expected_rate_usd NUMERIC NOT NULL,
    expected_change_percent NUMERIC NOT NULL,
    trend TEXT NOT NULL,
    confidence_percent NUMERIC NOT NULL,
    risk_score NUMERIC NOT NULL,
    series JSONB NOT NULL,
    source_freshness TEXT DEFAULT 'Real-time telemetry verified',
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecast_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_id UUID REFERENCES freight_forecasts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    impact_score TEXT NOT NULL,
    sentiment TEXT NOT NULL, -- bullish, bearish
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID REFERENCES model_versions(id),
    route_id TEXT REFERENCES routes(id),
    prediction_timestamp TIMESTAMPTZ NOT NULL,
    target_date DATE NOT NULL,
    horizon TEXT NOT NULL,
    predicted_value NUMERIC NOT NULL,
    lower_bound NUMERIC NOT NULL,
    upper_bound NUMERIC NOT NULL,
    input_feature_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prediction_actuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES model_predictions(id) ON DELETE CASCADE,
    actual_value NUMERIC NOT NULL,
    actual_timestamp TIMESTAMPTZ NOT NULL,
    absolute_error NUMERIC NOT NULL,
    percentage_error NUMERIC NOT NULL,
    direction_correct BOOLEAN NOT NULL,
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. USER COLLABORATION, OBSERVATIONS & FEEDBACK
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    entity_type TEXT NOT NULL, -- route, port, vessel, corridor
    entity_id TEXT NOT NULL,
    observation_type TEXT NOT NULL, -- rate, dwell_time, delay, fuel_surcharge, blank_sailing
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    source_context TEXT NOT NULL,
    confidence NUMERIC DEFAULT 85.0,
    moderation_status TEXT DEFAULT 'pending', -- pending, verified, rejected
    moderation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    target_type TEXT NOT NULL, -- forecast, observation, model
    target_id TEXT NOT NULL,
    rating TEXT NOT NULL, -- helpful, unhelpful, incorrect
    feedback_type TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. APPLICATION UTILITIES, SCENARIOS, REPORTS, ALERTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_insights (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    observation TEXT NOT NULL,
    explanation TEXT NOT NULL,
    impact TEXT NOT NULL,
    forecast TEXT NOT NULL,
    confidence_score NUMERIC NOT NULL,
    model_version TEXT NOT NULL,
    data_sources JSONB DEFAULT '[]'::JSONB,
    related_route_id TEXT,
    related_port_id TEXT,
    supporting_metrics JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insight_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id TEXT REFERENCES ai_insights(id) ON DELETE CASCADE,
    source_id TEXT REFERENCES data_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    target_object TEXT NOT NULL,
    condition TEXT NOT NULL,
    current_value TEXT NOT NULL,
    threshold_value TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, triggered, paused
    severity TEXT NOT NULL,
    notification_channels JSONB DEFAULT '["in-app"]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id TEXT REFERENCES alerts(id) ON DELETE CASCADE,
    triggered_value TEXT NOT NULL,
    event_details JSONB,
    triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- route, port, vessel, index
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    corridor TEXT,
    change_percent NUMERIC,
    risk_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    notification_group TEXT NOT NULL, -- today, earlier, system, alerts
    notification_type TEXT NOT NULL,
    severity TEXT NOT NULL, -- info, warning, critical, success
    is_read BOOLEAN DEFAULT FALSE,
    related_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    coverage TEXT NOT NULL,
    generated_date DATE NOT NULL,
    key_insight TEXT NOT NULL,
    read_time_minutes INTEGER NOT NULL,
    source_count INTEGER NOT NULL,
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_sections (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metrics JSONB DEFAULT '[]'::JSONB,
    section_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scenario_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE,
    demand_change_percent NUMERIC NOT NULL,
    capacity_change_percent NUMERIC NOT NULL,
    port_congestion_level NUMERIC NOT NULL,
    weather_severity_index NUMERIC NOT NULL,
    bunker_fuel_price_usd NUMERIC NOT NULL,
    trade_volume_change_percent NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS scenario_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE,
    baseline_rate_usd NUMERIC NOT NULL,
    projected_rate_usd NUMERIC NOT NULL,
    rate_delta_percent NUMERIC NOT NULL,
    expected_delay_days NUMERIC NOT NULL,
    delay_delta_days NUMERIC NOT NULL,
    projected_risk_score NUMERIC NOT NULL,
    capacity_pressure_percent NUMERIC NOT NULL,
    explanation TEXT NOT NULL,
    drivers JSONB NOT NULL,
    series JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    comparison_type TEXT NOT NULL,
    entity_ids JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL, -- Connected, Not Connected, Error, Updating
    last_sync TIMESTAMPTZ,
    data_coverage TEXT NOT NULL,
    api_key_masked TEXT,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documentation_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    read_time TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_hist_obs_lookup ON historical_observations(entity_type, entity_id, observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_val_obs_lookup ON validated_observations(entity_type, entity_id, observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_freight_obs_date ON freight_market_observations(route_id, date);
CREATE INDEX IF NOT EXISTS idx_predictions_target ON model_predictions(route_id, target_date, horizon);
CREATE INDEX IF NOT EXISTS idx_forecasts_route ON freight_forecasts(route_id, horizon);
CREATE INDEX IF NOT EXISTS idx_user_obs_status ON user_observations(moderation_status, created_at);
CREATE INDEX IF NOT EXISTS idx_vessel_positions ON vessel_positions(vessel_id, recorded_at);
