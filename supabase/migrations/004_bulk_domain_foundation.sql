-- ==============================================================================
-- FreightSense 2.0 - SIH Enhancement Program: Dry Bulk Domain Foundation
-- Migration: 004_bulk_domain_foundation.sql
-- Description: Establishes schema and seed structures for overseas dry bulk cargo
--              procurement, vessel chartering classes, East Coast India port
--              draft/lighterage constraints, and charter party evaluations.
-- ==============================================================================

-- 1. BULK COMMODITIES SPECIFICATION TABLE
CREATE TABLE IF NOT EXISTS bulk_commodities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Coking Coal, Thermal Coal, Iron Ore, Limestone, Fertilizer, Grain
    stowage_factor_m3_per_mt NUMERIC NOT NULL CHECK (stowage_factor_m3_per_mt > 0),
    typical_parcel_size_tonnes NUMERIC NOT NULL CHECK (typical_parcel_size_tonnes > 0),
    handling_requirements JSONB DEFAULT '[]'::JSONB,
    major_import_ports JSONB DEFAULT '[]'::JSONB,
    major_export_origins JSONB DEFAULT '[]'::JSONB,
    provenance JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DRY BULK VESSEL CLASSES TABLE
CREATE TABLE IF NOT EXISTS dry_bulk_vessel_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Capesize, Kamsarmax, Panamax, Ultramax, Supramax, Handysize
    dwt_min NUMERIC NOT NULL CHECK (dwt_min > 0),
    dwt_max NUMERIC NOT NULL CHECK (dwt_max >= dwt_min),
    typical_draft_m NUMERIC NOT NULL CHECK (typical_draft_m > 0),
    beam_m NUMERIC NOT NULL CHECK (beam_m > 0),
    loa_m NUMERIC NOT NULL CHECK (loa_m > 0),
    geared BOOLEAN DEFAULT FALSE,
    crane_capacity_tonnes NUMERIC,
    daily_bunker_fuel_mt NUMERIC NOT NULL CHECK (daily_bunker_fuel_mt > 0),
    speed_knots_ballast NUMERIC NOT NULL CHECK (speed_knots_ballast > 0),
    speed_knots_laden NUMERIC NOT NULL CHECK (speed_knots_laden > 0),
    provenance JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EAST COAST INDIA PORT CONSTRAINTS TABLE
CREATE TABLE IF NOT EXISTS east_coast_port_constraints (
    port_id TEXT PRIMARY KEY,
    port_name TEXT NOT NULL,
    port_code TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    max_permissible_draft_m NUMERIC NOT NULL CHECK (max_permissible_draft_m > 0),
    max_loa_m NUMERIC NOT NULL CHECK (max_loa_m > 0),
    max_beam_m NUMERIC NOT NULL CHECK (max_beam_m > 0),
    tidal_restriction BOOLEAN DEFAULT FALSE,
    riverine_navigation BOOLEAN DEFAULT FALSE,
    lighterage_required BOOLEAN DEFAULT FALSE,
    lighterage_location TEXT,
    allowable_vessel_classes JSONB NOT NULL,
    mechanized_discharge_rate_mt_day NUMERIC NOT NULL CHECK (mechanized_discharge_rate_mt_day > 0),
    typical_waiting_days NUMERIC NOT NULL DEFAULT 2.0 CHECK (typical_waiting_days >= 0),
    average_demurrage_rate_usd_day NUMERIC NOT NULL DEFAULT 25000 CHECK (average_demurrage_rate_usd_day >= 0),
    weather_sensitivity_notes TEXT,
    operational_notes TEXT,
    provenance JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OVERSEAS TO EAST COAST INDIA BULK SHIPPING CORRIDORS
CREATE TABLE IF NOT EXISTS bulk_routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    origin_port TEXT NOT NULL,
    origin_country TEXT NOT NULL,
    destination_port TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    distance_nm NUMERIC NOT NULL CHECK (distance_nm > 0),
    transit_days_laden NUMERIC NOT NULL CHECK (transit_days_laden > 0),
    transit_days_ballast NUMERIC NOT NULL CHECK (transit_days_ballast > 0),
    cargo_type TEXT NOT NULL,
    allowable_vessel_classes JSONB NOT NULL,
    benchmark_voyage_rate_usd_mt NUMERIC NOT NULL CHECK (benchmark_voyage_rate_usd_mt > 0),
    route_risk_score NUMERIC NOT NULL CHECK (route_risk_score >= 0 AND route_risk_score <= 100),
    choke_points JSONB DEFAULT '[]'::JSONB,
    weather_vulnerability TEXT,
    coordinates JSONB NOT NULL,
    provenance JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHARTER EVALUATIONS & PRE-FIXTURE AUDIT LOG
CREATE TABLE IF NOT EXISTS charter_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    commodity_id TEXT REFERENCES bulk_commodities(id) ON DELETE SET NULL,
    cargo_quantity_mt NUMERIC NOT NULL CHECK (cargo_quantity_mt > 0),
    origin_port TEXT NOT NULL,
    destination_port_id TEXT REFERENCES east_coast_port_constraints(port_id),
    preferred_vessel_class TEXT NOT NULL,
    laycan_start DATE NOT NULL,
    laycan_end DATE NOT NULL,
    charter_type TEXT NOT NULL, -- spot_voyage, time_charter, coa
    is_admissible BOOLEAN NOT NULL,
    requires_lighterage BOOLEAN NOT NULL,
    estimated_discharge_days NUMERIC NOT NULL,
    estimated_demurrage_exposure_usd NUMERIC NOT NULL,
    validation_details JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ec_port_constraints_code ON east_coast_port_constraints(port_code);
CREATE INDEX IF NOT EXISTS idx_bulk_routes_corridor ON bulk_routes(origin_country, destination_port);
CREATE INDEX IF NOT EXISTS idx_charter_eval_user ON charter_evaluations(user_id, created_at);
