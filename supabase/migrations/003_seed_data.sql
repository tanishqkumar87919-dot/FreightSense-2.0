-- ==============================================================================
-- FreightSense 2.0 - Seed Data Migration
-- Migration: 003_seed_data.sql
-- Description: Authoritative Data Source Registry, ML Models, Canonical Routes,
--              Ports, and Datasets.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AUTHORITATIVE DATA SOURCES REGISTRY (Section 17)
-- ------------------------------------------------------------------------------

INSERT INTO data_sources (
    id, source_name, provider, base_url, documentation_url, dataset_name,
    access_type, license_notes, update_frequency, historical_coverage,
    fields, auth_required, active, last_success_at, last_error, rate_limit_notes
) VALUES
(
    'src-unctad',
    'UNCTAD Data Hub',
    'United Nations Conference on Trade and Development',
    'https://unctadstat.unctad.org/EN/',
    'https://unctadstat.unctad.org/EN/',
    'Maritime Transport Indicators & Liner Connectivity (LSCI)',
    'public',
    'Public United Nations statistical open data repository',
    'Quarterly & Annual',
    '2004 - Present',
    '["liner_connectivity_index", "merchant_fleet_dwt", "container_port_throughput_teu", "seaborne_trade_volume"]'::jsonb,
    false,
    true,
    NOW() - INTERVAL '2 hours',
    NULL,
    'Open access; cached bulk queries recommended'
),
(
    'src-un-comtrade',
    'UN Comtrade API',
    'United Nations Statistics Division',
    'https://comtradeapi.un.org/public/v1',
    'https://uncomtrade.org/docs/un-comtrade-api/',
    'International Merchandise Trade Statistics (Bilateral Flows)',
    'api',
    'Open standard tier with API key for extended rate limits',
    'Monthly',
    '2010 - Present',
    '["trade_value_usd", "net_weight_kg", "partner_code", "reporter_code", "commodity_code_hs"]'::jsonb,
    true,
    true,
    NOW() - INTERVAL '4 hours',
    NULL,
    'Rate limit: 500 requests per day for standard tier'
),
(
    'src-baltic-exchange',
    'Baltic Exchange Freight Indices',
    'Baltic Exchange Information Services Ltd',
    'https://api.balticexchange.com/v1',
    'https://www.balticexchange.com/en/data-services/market-information0/indices.html',
    'Dry Bulk (BDI), Tanker (BDTI/BCTI) & Container Benchmark Assessments',
    'licensed',
    'Commercial proprietary index; requires enterprise subscription license. Never scrape.',
    'Daily (17:00 UTC)',
    '1985 - Present',
    '["index_value", "route_assessment_usd", "time_charter_average", "daily_change"]'::jsonb,
    true,
    false,
    NULL,
    'Configuration pending: BALTIC_API_KEY required',
    'Subscription API rate limits apply per licensed seat'
),
(
    'src-marinetraffic',
    'MarineTraffic AIS Telemetry',
    'MarineTraffic / Kpler',
    'https://services.marinetraffic.com/api',
    'https://servicedocs.marinetraffic.com/tag/AIS-API/',
    'Real-time & Historical Vessel Tracking and Port Call Events',
    'licensed',
    'Commercial API license required. Mocked adapter active for local test environments.',
    'Near Real-Time (5s terrestrial / 15m satellite)',
    '2016 - Present',
    '["imo", "mmsi", "latitude", "longitude", "speed_knots", "heading", "destination", "eta", "status"]'::jsonb,
    true,
    false,
    NULL,
    'Configuration pending: MARINETRAFFIC_API_KEY required',
    'Credit-based commercial consumption per API call'
),
(
    'src-noaa-ncei',
    'NOAA NCEI Climate Data Online',
    'National Centers for Environmental Information (NOAA)',
    'https://www.ncei.noaa.gov/cdo-web/api/v2',
    'https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation',
    'Global Marine Surface Weather Observations & Coastal Stations',
    'api',
    'Public domain NOAA data; free token required for web service access',
    'Daily / Hourly',
    '1970 - Present',
    '["wind_speed", "wind_direction", "sea_level_pressure", "air_temperature", "wave_height"]'::jsonb,
    true,
    true,
    NOW() - INTERVAL '1 hour',
    NULL,
    'Rate limit: 5 requests per second, 10,000 requests per day'
),
(
    'src-noaa-cdo',
    'NOAA Climate Data Online (CDO)',
    'NOAA NCEI',
    'https://www.ncei.noaa.gov/cdo-web/api/v2',
    'https://www.ncei.noaa.gov/cdo-web/webservices/v2',
    'Climate Data Online Web Services v2',
    'api',
    'Public domain; requires free personal web service token',
    'Daily / Hourly',
    '1970 - Present',
    '["tavg", "prcp", "awnd", "wdf2", "wdf5"]'::jsonb,
    true,
    false,
    NULL,
    'API Key Required (NOAA_API_TOKEN)',
    'Rate limit: 5 requests per second, 10,000 requests per day'
),
(
    'src-noaa-erddap',
    'NOAA CoastWatch ERDDAP',
    'NOAA National Marine Fisheries Service & OceanWatch',
    'https://coastwatch.pfeg.noaa.gov/erddap',
    'https://www.ncei.noaa.gov/erddap/',
    'Satellite Sea Surface Temperature & Global Ocean Wave Heights',
    'public',
    'Public domain US Federal geospatial oceanographic service',
    '6-Hourly',
    '2002 - Present',
    '["sea_surface_temp_c", "significant_wave_height_m", "ocean_current_u", "ocean_current_v"]'::jsonb,
    false,
    true,
    NOW() - INTERVAL '30 minutes',
    NULL,
    'REST queries with griddap / tabledap protocols'
),
(
    'src-worldbank-pink',
    'World Bank Commodity Pink Sheet',
    'The World Bank Group',
    'https://www.worldbank.org/en/research/commodity-markets',
    'https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections',
    'Monthly Global Commodity Prices (Brent Crude, Gas, Fertilizer, Metals)',
    'public',
    'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    'Monthly (First week)',
    '1960 - Present',
    '["crude_oil_brent_usd_bbl", "crude_oil_wti_usd_bbl", "natural_gas_us_usd_mmbtu", "iron_ore_usd_dmt"]'::jsonb,
    false,
    true,
    NOW() - INTERVAL '12 hours',
    NULL,
    'Public REST & CSV downloadable datasets'
),
(
    'src-worldbank-indicators',
    'World Bank Indicators API',
    'The World Bank Group',
    'https://api.worldbank.org/v2',
    'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392',
    'Macroeconomic Indicators: GDP Growth, Inflation, Manufacturing Exports',
    'public',
    'CC BY 4.0 World Bank Open Data Policy',
    'Annual / Quarterly',
    '1960 - Present',
    '["gdp_growth_annual_pct", "exports_goods_services_usd", "manufacturing_value_added_usd"]'::jsonb,
    false,
    true,
    NOW() - INTERVAL '1 day',
    NULL,
    'Direct REST JSON endpoints without mandatory authentication token'
),
(
    'src-fred',
    'FRED Economic Data',
    'Federal Reserve Bank of St. Louis',
    'https://api.stlouisfed.org/fred',
    'https://fred.stlouisfed.org/docs/api/fred/',
    'Global Economic Series: Trade-Weighted US Dollar, CPI, Interest Rates',
    'api',
    'Free API access for research and commercial use with registration key',
    'Daily / Weekly',
    '1973 - Present',
    '["trade_weighted_usd_index", "us_diesel_retail_price", "industrial_production_index"]'::jsonb,
    true,
    false,
    NULL,
    'API Key Required (FRED_API_KEY)',
    'Rate limit: 120 requests per minute'
),
(
    'src-imf',
    'IMF Data APIs',
    'International Monetary Fund',
    'https://dataservices.imf.org/REST/SDMX_JSON.svc',
    'https://data.imf.org/en/Resource-Pages/IMF-API',
    'Direction of Trade Statistics (DOTS) & World Economic Outlook (WEO)',
    'public',
    'Public RESTful data API; terms of use require attribution',
    'Monthly / Quarterly',
    '1980 - Present',
    '["bilateral_goods_exports_usd", "bilateral_goods_imports_usd", "trade_balance_usd"]'::jsonb,
    false,
    true,
    NOW() - INTERVAL '8 hours',
    NULL,
    'SDMX-JSON REST API with rate throttling'
),
(
    'src-eia',
    'U.S. Energy Information Administration (EIA)',
    'U.S. Department of Energy',
    'https://api.eia.gov/v2',
    'https://www.eia.gov/opendata/documentation.php',
    'Petroleum & Bunker Fuel Statistics (VLSFO / MGO Benchmarks)',
    'api',
    'U.S. Government public domain open energy data with free registered key',
    'Weekly',
    '1990 - Present',
    '["us_bunker_fuel_price_usd_gal", "rotterdam_marine_gasoil_usd_mt", "crude_stocks_mbbl"]'::jsonb,
    true,
    true,
    NOW() - INTERVAL '6 hours',
    NULL,
    'V2 API requires registered x-api-key'
),
(
    'src-panama-canal',
    'Panama Canal Transit Statistics',
    'Autoridad del Canal de Panamá (ACP)',
    'https://pancanal.com/en/statistics/',
    'https://pancanal.com/en/statistics/',
    'Monthly Vessel Transits, Net Tonnage (CP/SUAB) & Draft Restriction Advisories',
    'public',
    'Official ACP statistical bulletins and navigation advisories',
    'Monthly',
    '2000 - Present',
    '["transits_oceangoing_commercial", "neopanamax_transits", "panamax_transits", "transit_tonnage_k_long_tons"]'::jsonb,
    false,
    true,
    NOW() - INTERVAL '1 day',
    NULL,
    'Standard HTTP retrieval of published monthly reports'
),
(
    'src-natural-earth',
    'Natural Earth Global Ports',
    'Natural Earth Data / NACIS',
    'https://www.naturalearthdata.com',
    'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/ports/',
    'Global Maritime Port Coordinates, Infrastructure & Reference Cartography',
    'public',
    'Public Domain (Free for any use including commercial)',
    'Static Baseline',
    'Baseline 2024',
    '["port_name", "country_code", "latitude", "longitude", "scale_rank", "feature_class"]'::jsonb,
    false,
    true,
    NOW() - INTERVAL '5 days',
    NULL,
    'Local static vector dataset bundled into system fixtures'
)
ON CONFLICT (id) DO UPDATE SET
    last_success_at = EXCLUDED.last_success_at,
    active = EXCLUDED.active;

-- ------------------------------------------------------------------------------
-- 2. FORECAST MODELS & VERSIONS (Champion & Challenger)
-- ------------------------------------------------------------------------------

INSERT INTO forecast_models (id, name, family, description, default_horizon)
VALUES
(
    'model-ensemble-m3',
    'FreightSense Ensemble-M3',
    'ensemble',
    'Multi-tier ensemble blending Bayesian Prophet seasonal decomposition, Temporal Bi-LSTM, and Gradient Boosting features.',
    '30D'
),
(
    'model-baseline-naive',
    'Historical Persistence Baseline',
    'baseline',
    'Zero-leakage naive baseline carrying forward the latest verified spot price observation.',
    '7D'
),
(
    'model-lgbm-candidate',
    'FreightSense LightGBM Challenger',
    'gradient_boosting',
    'Non-linear decision tree regressor trained on rolling volatility, macro indicators, and canal transit metrics.',
    '30D'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO training_datasets (
    id, version, target_name, feature_list, time_window_start, time_window_end,
    rows_count, train_split_ratio, test_split_ratio, dataset_hash
) VALUES
(
    'ds-2026-v2',
    'v2.4-production',
    'spot_rate_usd_t_plus_h',
    '["rate_lag_1d", "rate_lag_7d", "rate_lag_14d", "rate_lag_30d", "rolling_mean_7d", "rolling_std_7d", "bunker_fuel_usd", "canal_transit_anomaly", "port_congestion_index"]'::jsonb,
    '2019-01-01',
    '2026-08-31',
    42800,
    0.80,
    0.20,
    'sha256_e891c98f7b2a65d0a1b899e4f5'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_versions (
    id, model_id, version, algorithm, features_hash, training_dataset_id,
    training_window, status, artifact_uri, created_at
) VALUES
(
    '88888888-8888-8888-8888-888888888881',
    'model-ensemble-m3',
    'v2.4',
    'Bayesian Prophet + LightGBM + Bi-LSTM',
    'hash_f890a2',
    'ds-2026-v2',
    '{"start": "2019-01-01", "end": "2026-08-31"}'::jsonb,
    'champion',
    'artifacts/models/ensemble_m3_v2.4.joblib',
    NOW() - INTERVAL '2 days'
),
(
    '88888888-8888-8888-8888-888888888882',
    'model-baseline-naive',
    'v1.0',
    'Naive Last-Value Carrier',
    'hash_naive_01',
    'ds-2026-v2',
    '{"start": "2019-01-01", "end": "2026-08-31"}'::jsonb,
    'candidate',
    'artifacts/models/naive_v1.0.joblib',
    NOW() - INTERVAL '30 days'
),
(
    '88888888-8888-8888-8888-888888888883',
    'model-lgbm-candidate',
    'v2.5-rc1',
    'HistGradientBoostingRegressor',
    'hash_f890a2',
    'ds-2026-v2',
    '{"start": "2019-01-01", "end": "2026-08-31"}'::jsonb,
    'challenger',
    'artifacts/models/lgbm_v2.5rc1.joblib',
    NOW() - INTERVAL '6 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_metrics (
    id, model_version_id, split_type, horizon, mae, rmse, smape, wape,
    directional_accuracy, interval_coverage, calibration_metrics
) VALUES
(
    gen_random_uuid(),
    '88888888-8888-8888-8888-888888888881',
    'backtest',
    '7D',
    64.20,
    88.50,
    2.15,
    2.05,
    94.5,
    96.2,
    '{"coverage_95": 96.2, "sharpness": 120.0}'::jsonb
),
(
    gen_random_uuid(),
    '88888888-8888-8888-8888-888888888881',
    'backtest',
    '30D',
    114.50,
    168.20,
    3.62,
    3.48,
    91.8,
    94.8,
    '{"coverage_95": 94.8, "sharpness": 210.0}'::jsonb
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. CANONICAL ROUTES SEED DATA
-- ------------------------------------------------------------------------------

INSERT INTO routes (
    id, name, corridor, origin, origin_country, destination, destination_country,
    distance_nm, transit_days, spot_rate_usd, capacity_utilization, risk_level,
    risk_score, trend, weekly_change_percent, active_vessels_count, coordinates, alternative_routes
) VALUES
(
    'route-sha-rot',
    'Shanghai to Rotterdam',
    'Asia - North Europe',
    'Shanghai',
    'China',
    'Rotterdam',
    'Netherlands',
    13850,
    34,
    4180,
    92,
    'High',
    78,
    'down',
    -1.99,
    64,
    '{"origin": [31.2304, 121.4737], "destination": [51.9244, 4.4777], "waypoints": [[31.2, 121.5], [22.2, 120.0], [1.3, 103.8], [-34.5, 20.0], [51.9, 4.5]]}'::jsonb,
    '[{"name": "Via Cape of Good Hope", "transitDays": 34, "spotRateUsd": 4180, "riskScore": 42}]'::jsonb
),
(
    'route-sha-lax',
    'Shanghai to Los Angeles',
    'Transpacific Eastbound',
    'Shanghai',
    'China',
    'Los Angeles',
    'United States',
    5700,
    14,
    4890,
    95,
    'Moderate',
    54,
    'up',
    4.49,
    88,
    '{"origin": [31.2304, 121.4737], "destination": [33.7432, -118.2673], "waypoints": [[31.2, 121.5], [34.0, 160.0], [33.7, -118.3]]}'::jsonb,
    '[{"name": "Via Oakland Divert", "transitDays": 17, "spotRateUsd": 4920, "riskScore": 46}]'::jsonb
),
(
    'route-rot-nyc',
    'Rotterdam to New York',
    'Transatlantic Westbound',
    'Rotterdam',
    'Netherlands',
    'New York',
    'United States',
    3400,
    9,
    1980,
    78,
    'Low',
    28,
    'up',
    1.54,
    42,
    '{"origin": [51.9244, 4.4777], "destination": [40.7128, -74.0060], "waypoints": [[51.9, 4.5], [48.0, -10.0], [40.7, -74.0]]}'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    spot_rate_usd = EXCLUDED.spot_rate_usd,
    weekly_change_percent = EXCLUDED.weekly_change_percent;
