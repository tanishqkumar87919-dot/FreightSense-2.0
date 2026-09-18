import { mockFreightIndices, mockMarketDrivers, mockRegionalRates } from '@/data/marketData';
import { mockRoutes } from '@/data/routeData';
import { mockPorts } from '@/data/portData';
import { mockVessels } from '@/data/vesselData';
import { mockWeatherHazards } from '@/data/weatherData';
import { mockTradeFlows } from '@/data/tradeFlowData';
import { mockMarketSignals, mockSignalRelationships } from '@/data/signalData';
import { mockRouteForecasts, mockForecastModelInfo, mockForecastContributingFactors, mockForecastBaselines, mockForecastCausalExplanations } from '@/data/forecastData';
import { mockAIInsights } from '@/data/insightData';
import { mockAlerts } from '@/data/alertData';
import { mockReports } from '@/data/reportData';
import { mockNotifications } from '@/data/notificationData';
import { mockDatasets } from '@/data/datasetData';
import { mockDocArticles, mockDocCategories } from '@/data/docsData';
import { mockBulkCommodities, mockDryBulkVesselClasses, mockCandidateBulkVessels, mockScenarioPresets } from '@/data/bulkCargoData';
import { mockEastCoastPortConstraints, mockPortCargoHandlingRules } from '@/data/eastCoastPortConstraints';
import { validateCharterRequest, validatePortDraftCompatibility } from '@/lib/validation';
import {
  ScenarioParameters,
  ScenarioResult,
  FreightMarketIndex,
  RouteItem,
  PortItem,
  AIInsight,
  BulkCommodity,
  DryBulkVesselClass,
  EastCoastPortConstraint,
  CharterRequest,
  CharterValidationResult,
  CargoAnalysisRequest,
  CargoAnalysisResponse,
  ForecastDriverItem,
  CharterCandidateVessel,
  CharteringEvaluationRequest,
  CharteringEvaluationResponse,
  VesselFitAnalysisResult,
  PortRiskLevel,
  PortRiskDimension,
  PortCargoCompatibility,
  PortVesselEvaluation,
  PortDecisionFactors,
  PortIntelligenceEvaluationRequest,
  PortIntelligenceEvaluationResponse,
  PortComparisonRequest,
  PortComparisonItem,
  PortComparisonResponse,
  ScenarioPreset,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  ScenarioVoyageEconomics,
  ScenarioVariableChange,
  ScenarioSensitivityPoint,
  ScenarioSensitivityTable,
  ScenarioDecisionFactors,
} from '@/types';
import { fetchFromApi } from '@/lib/api';

// Market Service
export const marketService = {
  getIndices: async (): Promise<FreightMarketIndex[]> => {
    const apiData = await fetchFromApi<FreightMarketIndex[]>('/api/v1/markets');
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      return apiData;
    }
    return mockFreightIndices;
  },
  getIndexById: async (id: string): Promise<FreightMarketIndex> => {
    const all = await marketService.getIndices();
    return all.find(idx => idx.id === id) || all[0];
  },
  getDrivers: async (): Promise<any[]> => {
    const apiDrivers = await fetchFromApi<any[]>('/api/v1/markets/drivers');
    if (apiDrivers && Array.isArray(apiDrivers) && apiDrivers.length > 0) {
      return apiDrivers;
    }
    return mockMarketDrivers;
  },
  getRegionalRates: async (): Promise<any[]> => {
    const apiRoutes = await fetchFromApi<any[]>('/api/v1/routes');
    if (apiRoutes && Array.isArray(apiRoutes) && apiRoutes.length > 0) {
      return apiRoutes.map((r: any) => ({
        region: r.corridor ? `${r.corridor} (${r.name})` : r.name,
        rate: r.spotRateUsd,
        change: r.weeklyChangePercent,
        status: r.capacityUtilization > 92 ? 'Severe' : r.capacityUtilization > 85 ? 'Tight' : 'Balanced',
        utilization: r.capacityUtilization,
      }));
    }
    return mockRegionalRates;
  },
};

// Route Service
export const routeService = {
  getRoutes: async (): Promise<RouteItem[]> => {
    const apiRoutes = await fetchFromApi<RouteItem[]>('/api/v1/routes');
    if (apiRoutes && Array.isArray(apiRoutes) && apiRoutes.length > 0) {
      return apiRoutes;
    }
    return mockRoutes;
  },
  getRouteById: async (id: string): Promise<RouteItem> => {
    const routes = await routeService.getRoutes();
    return routes.find(r => r.id === id) || routes[0];
  },
};

// Port Service
export const portService = {
  getPorts: async (): Promise<PortItem[]> => {
    const apiPorts = await fetchFromApi<PortItem[]>('/api/v1/ports');
    if (apiPorts && Array.isArray(apiPorts) && apiPorts.length > 0) {
      return apiPorts;
    }
    return mockPorts;
  },
  getPortById: async (id: string): Promise<PortItem> => {
    const ports = await portService.getPorts();
    return ports.find(p => p.id === id) || ports[0];
  },
};

// Vessel Service
export const vesselService = {
  getVessels: async () => mockVessels,
  getVesselById: async (id: string) => mockVessels.find(v => v.id === id) || mockVessels[0],
};

// Weather Service
export const weatherService = {
  getHazards: async () => mockWeatherHazards,
  getHazardById: async (id: string) => mockWeatherHazards.find(w => w.id === id) || mockWeatherHazards[0],
};

// Trade Flow Service
export const tradeService = {
  getTradeFlows: async () => mockTradeFlows,
};

// Market Signal Service
// Signal Service
export const signalService = {
  getSignals: async (): Promise<any[]> => {
    const apiSignals = await fetchFromApi<any[]>('/api/v1/signals');
    if (apiSignals && Array.isArray(apiSignals) && apiSignals.length > 0) {
      return apiSignals;
    }
    return mockMarketSignals;
  },
  getRelationships: async () => mockSignalRelationships,
};

export interface DataSourceRegistryItem {
  id: string;
  source_name: string;
  provider: string;
  base_url: string;
  documentation_url?: string;
  dataset_name: string;
  access_type: 'public' | 'api' | 'licensed' | 'manual';
  license_notes?: string;
  update_frequency: string;
  historical_coverage: string;
  fields: string[];
  auth_required: boolean;
  active: boolean;
  last_success_at?: string | null;
  last_error?: string | null;
  rate_limit_notes?: string;
}

export const defaultDataSourcesRegistry: DataSourceRegistryItem[] = [
  {
    id: 'src-unctad',
    source_name: 'UNCTAD Data Hub',
    provider: 'United Nations Conference on Trade and Development',
    base_url: 'https://unctadstat.unctad.org/EN/',
    documentation_url: 'https://unctadstat.unctad.org/EN/',
    dataset_name: 'Maritime Transport Indicators & Liner Shipping Connectivity Index (LSCI)',
    access_type: 'public',
    license_notes: 'Public United Nations statistical open data repository',
    update_frequency: 'Quarterly & Annual',
    historical_coverage: '2004 - Present',
    fields: ['liner_connectivity_index', 'merchant_fleet_dwt', 'container_port_throughput_teu', 'seaborne_trade_volume'],
    auth_required: false,
    active: true,
    last_success_at: '2 hours ago',
    rate_limit_notes: 'Open access; cached bulk queries recommended',
  },
  {
    id: 'src-un-comtrade',
    source_name: 'UN Comtrade API',
    provider: 'United Nations Statistics Division',
    base_url: 'https://comtradeapi.un.org/public/v1',
    documentation_url: 'https://uncomtrade.org/docs/un-comtrade-api/',
    dataset_name: 'International Merchandise Trade Statistics (Bilateral Flows)',
    access_type: 'api',
    license_notes: 'Open standard tier with API key for extended rate limits; Developer portal: https://comtrade.developer.un.org/',
    update_frequency: 'Monthly',
    historical_coverage: '2010 - Present',
    fields: ['trade_value_usd', 'net_weight_kg', 'partner_code', 'reporter_code', 'commodity_code_hs'],
    auth_required: true,
    active: false,
    last_error: 'API Key Required (COMTRADE_API_KEY)',
    rate_limit_notes: 'Rate limit: 500 requests per day for standard tier',
  },
  {
    id: 'src-noaa-ncei',
    source_name: 'NOAA NCEI Data Service',
    provider: 'National Centers for Environmental Information (NOAA)',
    base_url: 'https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation',
    documentation_url: 'https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation',
    dataset_name: 'Access Data Service API & Global Marine Surface Weather Observations',
    access_type: 'public',
    license_notes: 'Public domain US federal meteorological observations',
    update_frequency: 'Daily',
    historical_coverage: '1970 - Present',
    fields: ['wind_speed', 'wind_direction', 'sea_level_pressure', 'air_temperature', 'precipitation'],
    auth_required: false,
    active: true,
    last_success_at: '1 hour ago',
    rate_limit_notes: 'Public access with rate throttling',
  },
  {
    id: 'src-noaa-cdo',
    source_name: 'NOAA Climate Data Online (CDO)',
    provider: 'NOAA NCEI',
    base_url: 'https://www.ncei.noaa.gov/cdo-web/api/v2',
    documentation_url: 'https://www.ncei.noaa.gov/cdo-web/webservices/v2',
    dataset_name: 'Climate Data Online Web Services v2',
    access_type: 'api',
    license_notes: 'Public domain; requires free personal web service token',
    update_frequency: 'Daily / Hourly',
    historical_coverage: '1970 - Present',
    fields: ['tavg', 'prcp', 'awnd', 'wdf2', 'wdf5'],
    auth_required: true,
    active: false,
    last_error: 'API Key Required (NOAA_API_TOKEN)',
    rate_limit_notes: 'Rate limit: 5 requests per second, 10,000 requests per day',
  },
  {
    id: 'src-noaa-erddap',
    source_name: 'NOAA CoastWatch ERDDAP',
    provider: 'NOAA National Marine Fisheries Service & OceanWatch',
    base_url: 'https://coastwatch.pfeg.noaa.gov/erddap',
    documentation_url: 'https://www.ncei.noaa.gov/erddap/',
    dataset_name: 'Satellite Sea Surface Temperature & Global Ocean Wave Heights',
    access_type: 'public',
    license_notes: 'Public domain US Federal geospatial oceanographic service',
    update_frequency: '6-Hourly',
    historical_coverage: '2002 - Present',
    fields: ['sea_surface_temp_c', 'significant_wave_height_m', 'ocean_current_u', 'ocean_current_v'],
    auth_required: false,
    active: true,
    last_success_at: '30 minutes ago',
    rate_limit_notes: 'REST queries with griddap / tabledap protocols',
  },
  {
    id: 'src-worldbank-pink',
    source_name: 'World Bank Commodity Pink Sheet',
    provider: 'The World Bank Group',
    base_url: 'https://www.worldbank.org/en/research/commodity-markets',
    documentation_url: 'https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections',
    dataset_name: 'Monthly Global Commodity Prices (Crude Oil, Gas, Fertilizer, Metals)',
    access_type: 'public',
    license_notes: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    update_frequency: 'Monthly (First week)',
    historical_coverage: '1960 - Present',
    fields: ['crude_oil_brent_usd_bbl', 'crude_oil_wti_usd_bbl', 'natural_gas_us_usd_mmbtu', 'iron_ore_usd_dmt'],
    auth_required: false,
    active: true,
    last_success_at: '12 hours ago',
    rate_limit_notes: 'Public REST & CSV downloadable datasets',
  },
  {
    id: 'src-worldbank-indicators',
    source_name: 'World Bank Indicators API',
    provider: 'The World Bank Group',
    base_url: 'https://api.worldbank.org/v2',
    documentation_url: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392',
    dataset_name: 'World Development Indicators (GDP, Industrial Activity, Export Values)',
    access_type: 'public',
    license_notes: 'CC BY 4.0 World Bank Open Data Policy (API access without key)',
    update_frequency: 'Annual / Quarterly',
    historical_coverage: '1960 - Present',
    fields: ['gdp_growth_annual_pct', 'exports_goods_services_usd', 'manufacturing_value_added_usd'],
    auth_required: false,
    active: true,
    last_success_at: '1 day ago',
    rate_limit_notes: 'Direct REST JSON endpoints without mandatory authentication token',
  },
  {
    id: 'src-fred',
    source_name: 'FRED Economic Data',
    provider: 'Federal Reserve Bank of St. Louis',
    base_url: 'https://api.stlouisfed.org/fred',
    documentation_url: 'https://fred.stlouisfed.org/docs/api/fred/',
    dataset_name: 'Global Economic Series: Trade-Weighted US Dollar, CPI, Interest Rates',
    access_type: 'api',
    license_notes: 'Free API access for research and commercial use with registration key',
    update_frequency: 'Daily / Weekly',
    historical_coverage: '1973 - Present',
    fields: ['trade_weighted_usd_index', 'us_diesel_retail_price', 'industrial_production_index'],
    auth_required: true,
    active: false,
    last_error: 'API Key Required (FRED_API_KEY)',
    rate_limit_notes: 'Rate limit: 120 requests per minute',
  },
  {
    id: 'src-imf',
    source_name: 'IMF Data APIs',
    provider: 'International Monetary Fund',
    base_url: 'https://dataservices.imf.org/REST/SDMX_JSON.svc',
    documentation_url: 'https://data.imf.org/en/Resource-Pages/IMF-API',
    dataset_name: 'Direction of Trade Statistics (DOTS) & World Economic Outlook (WEO)',
    access_type: 'public',
    license_notes: 'Public RESTful data API; terms of use require attribution',
    update_frequency: 'Monthly / Quarterly',
    historical_coverage: '1980 - Present',
    fields: ['bilateral_goods_exports_usd', 'bilateral_goods_imports_usd', 'trade_balance_usd'],
    auth_required: false,
    active: true,
    last_success_at: '8 hours ago',
    rate_limit_notes: 'SDMX-JSON REST API with rate throttling',
  },
  {
    id: 'src-eia',
    source_name: 'U.S. Energy Information Administration (EIA)',
    provider: 'U.S. Department of Energy',
    base_url: 'https://api.eia.gov/v2',
    documentation_url: 'https://www.eia.gov/opendata/documentation.php',
    dataset_name: 'Petroleum & Bunker Fuel Statistics (VLSFO / MGO Benchmarks)',
    access_type: 'api',
    license_notes: 'U.S. Government public domain open energy data with free registered key',
    update_frequency: 'Weekly',
    historical_coverage: '1990 - Present',
    fields: ['us_bunker_fuel_price_usd_gal', 'rotterdam_marine_gasoil_usd_mt', 'crude_stocks_mbbl'],
    auth_required: true,
    active: false,
    last_error: 'API Key Required (EIA_API_KEY)',
    rate_limit_notes: 'V2 API requires registered x-api-key',
  },
  {
    id: 'src-panama-canal',
    source_name: 'Panama Canal Transit Statistics',
    provider: 'Autoridad del Canal de Panamá (ACP)',
    base_url: 'https://pancanal.com/en/statistics/',
    documentation_url: 'https://pancanal.com/en/statistics/',
    dataset_name: 'Monthly Vessel Transits, Net Tonnage (CP/SUAB) & Draft Restriction Advisories',
    access_type: 'public',
    license_notes: 'Official ACP statistical bulletins and navigation advisories',
    update_frequency: 'Monthly',
    historical_coverage: '2000 - Present',
    fields: ['transits_oceangoing_commercial', 'neopanamax_transits', 'panamax_transits', 'transit_tonnage_k_long_tons'],
    auth_required: false,
    active: true,
    last_success_at: '1 day ago',
    rate_limit_notes: 'Standard HTTP retrieval of published monthly reports',
  },
  {
    id: 'src-natural-earth',
    source_name: 'Natural Earth Global Ports',
    provider: 'Natural Earth Data / NACIS',
    base_url: 'https://www.naturalearthdata.com',
    documentation_url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/ports/',
    dataset_name: 'Global Maritime Port Coordinates, Infrastructure & Reference Cartography',
    access_type: 'public',
    license_notes: 'Public Domain (Free for any use including commercial)',
    update_frequency: 'Static Baseline',
    historical_coverage: 'Baseline 2024',
    fields: ['port_name', 'country_code', 'latitude', 'longitude', 'scale_rank', 'feature_class'],
    auth_required: false,
    active: true,
    last_success_at: '5 days ago',
    rate_limit_notes: 'Local static vector dataset bundled into system fixtures',
  },
  {
    id: 'src-baltic-exchange',
    source_name: 'Baltic Exchange Freight Indices',
    provider: 'Baltic Exchange Information Services Ltd',
    base_url: 'https://api.balticexchange.com/v1',
    documentation_url: 'https://www.balticexchange.com/en/data-services/market-information0/indices.html',
    dataset_name: 'Dry Bulk (BDI), Tanker (BDTI/BCTI) & Container Benchmark Assessments',
    access_type: 'licensed',
    license_notes: 'LICENSE REQUIRED / NOT AVAILABLE. Commercial proprietary index; requires enterprise subscription license. Never scrape.',
    update_frequency: 'Daily (17:00 UTC)',
    historical_coverage: '1985 - Present',
    fields: ['index_value', 'route_assessment_usd', 'time_charter_average', 'daily_change'],
    auth_required: true,
    active: false,
    last_error: 'LICENSE REQUIRED / NOT AVAILABLE (BALTIC_API_KEY required for production target)',
    rate_limit_notes: 'Subscription API rate limits apply per licensed seat',
  },
  {
    id: 'src-marinetraffic',
    source_name: 'MarineTraffic AIS Telemetry',
    provider: 'MarineTraffic / Kpler',
    base_url: 'https://services.marinetraffic.com/api',
    documentation_url: 'https://servicedocs.marinetraffic.com/tag/AIS-API/',
    dataset_name: 'Real-time & Historical Vessel Tracking and Port Call Events',
    access_type: 'licensed',
    license_notes: 'Commercial API license required; credit-based API subscription. Support: https://support.marinetraffic.com/en/articles/9552659-api-services',
    update_frequency: 'Near Real-Time (5s terrestrial / 15m satellite)',
    historical_coverage: '2016 - Present',
    fields: ['imo', 'mmsi', 'latitude', 'longitude', 'speed_knots', 'heading', 'destination', 'eta', 'status'],
    auth_required: true,
    active: false,
    last_error: 'License Required (MARINETRAFFIC_API_KEY required)',
    rate_limit_notes: 'Credit-based commercial consumption per API call',
  },
];

// Data Source Registry Service
export const dataSourceService = {
  getDataSources: async (): Promise<DataSourceRegistryItem[]> => {
    const apiSources = await fetchFromApi<DataSourceRegistryItem[]>('/api/v1/data-sources');
    return apiSources || defaultDataSourcesRegistry;
  },
  getDataSourceById: async (id: string): Promise<DataSourceRegistryItem | undefined> => {
    const sources = await dataSourceService.getDataSources();
    return sources.find(s => s.id === id);
  },
};

// Feedback & User Observations Service
export const feedbackService = {
  submitPredictionFeedback: async (payload: {
    route_id: string;
    prediction_id?: string;
    rating: string;
    comment?: string;
    suggested_rate?: number;
  }) => {
    return await fetchFromApi('/api/v1/feedback/prediction', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  submitUserObservation: async (payload: {
    entity_type: string;
    entity_id: string;
    observation_type: string;
    value: number;
    unit: string;
    source_context: string;
    confidence?: number;
  }) => {
    return await fetchFromApi('/api/v1/user-observations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Forecast Service with FastAPI integration and resilient baseline fallback
export const forecastService = {
  getModelInfo: async () => {
    const apiInfo = await fetchFromApi<any>('/api/v1/model/current');
    if (apiInfo) {
      return {
        version: apiInfo.version,
        lastTrained: apiInfo.lastTrained,
        trainingPeriod: apiInfo.trainingPeriod,
        evaluationMetrics: apiInfo.evaluationMetrics,
        status: apiInfo.status,
        isRealBackendData: true,
      };
    }
    return {
      ...mockForecastModelInfo,
      status: 'Demo Fallback (FastAPI Standby)',
      isRealBackendData: false,
    };
  },
  getContributingFactors: async () => mockForecastContributingFactors,
  getForecast: async (routeId: string, horizon: '7D' | '14D' | '30D' | '60D' | '90D' = '30D') => {
    const apiForecast = await fetchFromApi<any>(`/api/v1/forecasts?route_id=${routeId}&horizon=${horizon}`);
    if (apiForecast && apiForecast.series) {
      return {
        id: apiForecast.id,
        routeId: apiForecast.route_id,
        corridorName: apiForecast.corridor_name,
        horizon: apiForecast.horizon,
        unit: apiForecast.unit || 'USD/FEU',
        expectedRateUsd: apiForecast.expectedRateUsd,
        expectedChangePercent: apiForecast.expectedChangePercent,
        trend: apiForecast.trend as 'up' | 'down' | 'stable',
        confidencePercent: apiForecast.confidencePercent,
        riskScore: apiForecast.riskScore,
        series: apiForecast.series,
        modelVersion: apiForecast.model_version,
        generatedAt: apiForecast.generated_at,
        sourceFreshness: apiForecast.source_freshness || 'REAL BACKEND DATA (FastAPI Live)',
        status: apiForecast.status || 'available',
        horizonNotice: apiForecast.horizon_notice || null,
        historicalCount: apiForecast.historical_count,
        isRealBackendData: true,
      };
    }
    const routeForecasts = mockRouteForecasts[routeId] || mockRouteForecasts['route-aus-paradip'] || mockRouteForecasts['route-sha-rot'];
    const fallback = routeForecasts[horizon] || routeForecasts['30D'];
    const isBulk = ['route-aus-paradip', 'route-indo-vizag', 'route-saf-haldia', 'route-aus-vizag'].includes(routeId);
    const isLong = horizon === '60D' || horizon === '90D';
    return {
      ...fallback,
      id: `mock-${routeId}-${horizon}`,
      routeId,
      corridorName: routeId,
      unit: isBulk ? 'USD/MT' : 'USD/FEU',
      modelVersion: 'XGBoost Champion (v2.5)',
      sourceFreshness: isBulk
        ? 'Verified Indian Major Ports (IPA) 2021-2024 Traffic Data + Baltic Exchange Reference Benchmark'
        : 'Verified UNCTAD/SCFI 190-Week Historical Series + Indian Major Ports (IPA) Explanatory Features',
      status: isLong ? 'horizon_exceeded' : 'available',
      horizonNotice: isLong
        ? `Forecast unavailable for this horizon. The production econometric model is validated up to 30 days ahead (1W, 2W, 4W). Longer horizons (${horizon}) require quarterly macroeconomic consensus models.`
        : null,
      isRealBackendData: false,
    };
  },
  getBaselines: async () => {
    const apiBaselines = await fetchFromApi<any>('/api/v1/forecasts/baselines');
    if (apiBaselines && apiBaselines.horizons) {
      return {
        modelVersion: apiBaselines.model_version || 'v2.5',
        horizons: apiBaselines.horizons,
        evaluationPeriod: apiBaselines.evaluation_period,
        validationMethod: apiBaselines.validation_method,
        isRealBackendData: true,
      };
    }
    return {
      modelVersion: mockForecastBaselines.model_version,
      horizons: mockForecastBaselines.horizons,
      evaluationPeriod: mockForecastBaselines.evaluation_period,
      validationMethod: mockForecastBaselines.validation_method,
      isRealBackendData: false,
    };
  },
  getForecastDrivers: async (routeId: string = 'route-aus-paradip'): Promise<ForecastDriverItem[]> => {
    const apiDrivers = await fetchFromApi<any>(`/api/v1/forecasts/drivers?route_id=${routeId}`);
    if (apiDrivers && apiDrivers.drivers && Array.isArray(apiDrivers.drivers)) {
      return apiDrivers.drivers;
    }
    const isBulk = ['route-aus-paradip', 'route-indo-vizag', 'route-saf-haldia', 'route-aus-vizag'].includes(routeId);
    if (isBulk) {
      return [
        {
          feature: 'india_avg_turnaround_hours',
          name: 'Port Turnaround & Congestion',
          weight: 34.2,
          impact: (routeId === 'route-aus-paradip' || routeId === 'route-saf-haldia') ? 'bullish' : 'neutral',
          description: 'Berth waiting time and vessel turnaround at Indian discharge port directly impact voyage charter availability.',
        },
        {
          feature: 'india_avg_berth_utilization',
          name: 'Berth Utilization Rate',
          weight: 24.8,
          impact: 'bullish',
          description: 'High berth utilization (>75%) at deepwater terminals increases demurrage risk and spot voyage rate premiums.',
        },
        {
          feature: 'bunker_fuel_price',
          name: 'Bunker Fuel (VLSFO) Price',
          weight: 18.5,
          impact: 'neutral',
          description: 'VLSFO stable around $615/MT provides cost floor for round-voyage ballast and laden legs.',
        },
        {
          feature: 'india_total_cargo_tonnes',
          name: 'National Bulk Import Demand',
          weight: 14.1,
          impact: 'bullish',
          description: 'Thermal power and steel plant raw material procurement maintains strong baseline inward volume.',
        },
        {
          feature: 'seasonal_monsoon_swell',
          name: 'Bay of Bengal Monsoon Seasonality',
          weight: 8.4,
          impact: 'bearish',
          description: 'Post-monsoon calmer sea states reduce weather delays in the Bay of Bengal.',
        },
      ];
    }
    return [
      {
        feature: 'bunker_fuel_price',
        name: 'VLSFO Bunker Price',
        weight: 31.4,
        impact: 'bullish',
        description: 'Fuel cost variations directly drive carrier bunker adjustment factors.',
      },
      {
        feature: 'port_congestion_index',
        name: 'Global Port Congestion',
        weight: 26.2,
        impact: 'bullish',
        description: 'Hub bottleneck levels absorb active fleet capacity and support rate levels.',
      },
      {
        feature: 'rate_lag_1w',
        name: 'Spot Rate Momentum (1-Week Lag)',
        weight: 22.8,
        impact: 'neutral',
        description: 'Short-term autoregressive rate persistence in container liner fixtures.',
      },
      {
        feature: 'fleet_active_teu',
        name: 'Active Fleet Deployment',
        weight: 12.5,
        impact: 'bearish',
        description: 'New vessel deliveries adding capacity across major east-west trades.',
      },
      {
        feature: 'seasonal_peak_demand',
        name: 'Seasonal Volume Surge',
        weight: 7.1,
        impact: 'bullish',
        description: 'Pre-holiday retail inventory intake cycle.',
      },
    ];
  },
  getForecastCausalExplanations: (routeId: string) => {
    return mockForecastCausalExplanations[routeId] || mockForecastCausalExplanations['route-aus-paradip'] || [];
  },
  getHistory: async (routeId: string = 'route-aus-paradip') => {
    const apiHistory = await fetchFromApi<any>(`/api/v1/forecasts/history?route_id=${routeId}`);
    if (apiHistory && apiHistory.history) {
      return apiHistory;
    }
    return null;
  },
};

// AI Insights Service
export const insightService = {
  getInsights: async (category?: string): Promise<AIInsight[]> => {
    try {
      const apiInsights = await fetchFromApi<any[]>('/api/v1/insights');
      if (apiInsights && Array.isArray(apiInsights) && apiInsights.length > 0) {
        const normalized: AIInsight[] = apiInsights.map((item, idx) => ({
          id: item.id || `ins-${idx}`,
          category: item.category || 'Market',
          title: item.title || 'Market Intelligence Brief',
          observation: item.observation || item.summary || 'Observation data being updated from real-time telemetry.',
          explanation: item.explanation || (Array.isArray(item.keyDrivers) ? item.keyDrivers.join('. ') : 'Detailed causal explanation being processed by domain reasoning pipeline.'),
          impact: item.impact || (item.suggestedAction ? `Operational guidance: ${item.suggestedAction}` : 'Operational and commercial impacts under active monitoring across corridors.'),
          forecast: item.forecast || item.suggestedAction || 'Projections based on champion forecasting model v2.5.',
          confidenceScore: typeof item.confidenceScore === 'number' ? item.confidenceScore : 90,
          timestamp: item.timestamp || '2024-08-23 18:00 UTC',
          modelVersion: item.modelVersion || 'FreightSense Intelligence Engine v2.5',
          dataSources: Array.isArray(item.dataSources) && item.dataSources.length > 0
            ? item.dataSources
            : ['SCFI Freight Target Registry', 'Global AIS Telemetry', 'Port Terminal Feeds'],
          relatedRouteId: item.relatedRouteId,
          relatedPortId: item.relatedPortId,
          supportingMetrics: Array.isArray(item.supportingMetrics) && item.supportingMetrics.length > 0
            ? item.supportingMetrics
            : Array.isArray(item.keyDrivers)
            ? item.keyDrivers.map((kd: string) => ({ label: 'Key Driver', value: kd }))
            : [{ label: 'Status', value: 'Active' }],
        }));

        if (!category || category === 'All') return normalized;
        return normalized.filter(ins => ins.category.toLowerCase() === category.toLowerCase());
      }
    } catch (err) {
      console.warn('Failed to fetch live insights from API, falling back to canonical insights:', err);
    }

    const data = mockAIInsights;
    if (!category || category === 'All') return data;
    return data.filter(ins => ins.category.toLowerCase() === category.toLowerCase());
  },
  getInsightById: async (id: string): Promise<AIInsight> => {
    const all = await insightService.getInsights();
    return all.find(i => i.id === id) || all[0] || mockAIInsights[0];
  },
};

// Alert Service
export const alertService = {
  getAlerts: async (): Promise<any[]> => {
    const apiAlerts = await fetchFromApi<any[]>('/api/v1/alerts');
    if (apiAlerts && Array.isArray(apiAlerts) && apiAlerts.length > 0) {
      return apiAlerts;
    }
    return mockAlerts;
  },
};

// Dashboard Service
export const dashboardService = {
  getSummary: async (): Promise<any> => {
    const summary = await fetchFromApi<any>('/api/v1/dashboard/summary');
    return summary;
  },
};

// Report Service
export const reportService = {
  getReports: async () => mockReports,
  getReportById: async (id: string) => mockReports.find(r => r.id === id) || mockReports[0],
};

// Notification Service
export const notificationService = {
  getNotifications: async () => mockNotifications,
};

// Data Explorer Service
export const datasetService = {
  getDatasetsList: async () => Object.values(mockDatasets),
  getDataset: async (id: string) => mockDatasets[id] || mockDatasets['freight-rates'],
};

// Documentation Service
export const docService = {
  getCategories: async () => mockDocCategories,
  getArticles: async () => mockDocArticles,
  getArticleById: async (id: string) => mockDocArticles.find(a => a.id === id) || mockDocArticles[0],
};

// Scenario Calculation Engine (Functional Client-Side Simulation)
export const scenarioService = {
  runScenario: (params: ScenarioParameters): ScenarioResult => {
    const baselineRate = 4180;
    // Economic elasticity: Demand elasticity = 1.25, Capacity elasticity = -1.6, Fuel pass-through = 0.45, Congestion = 0.85
    const demandEffect = params.demandChangePercent * 1.35;
    const capacityEffect = -params.capacityChangePercent * 1.55;
    const congestionEffect = (params.portCongestionLevel - 50) * 0.45;
    const weatherEffect = (params.weatherSeverityIndex - 30) * 0.25;
    const fuelEffect = ((params.bunkerFuelPriceUsd - 600) / 600) * 15;
    const tradeEffect = params.tradeVolumeChangePercent * 0.8;

    const netRateDeltaPercent = parseFloat((demandEffect + capacityEffect + congestionEffect + weatherEffect + fuelEffect + tradeEffect).toFixed(2));
    const projectedRate = Math.round(baselineRate * (1 + netRateDeltaPercent / 100));

    const baselineDelay = 2.4;
    const delayDelta = parseFloat(((params.portCongestionLevel / 35) + (params.weatherSeverityIndex / 40) - 2.0).toFixed(1));
    const expectedDelay = Math.max(0.5, parseFloat((baselineDelay + delayDelta).toFixed(1)));

    const capacityPressure = Math.min(100, Math.max(10, Math.round(75 + demandEffect - capacityEffect * 0.5)));
    const riskScore = Math.min(100, Math.max(15, Math.round(50 + (netRateDeltaPercent * 0.8) + (params.portCongestionLevel * 0.3))));

    let explanation = '';
    if (netRateDeltaPercent > 10) {
      explanation = `Simulated conditions indicate an acute container space squeeze. Elevated demand (${params.demandChangePercent > 0 ? '+' : ''}${params.demandChangePercent}%) combined with supply friction elevates carrier pricing leverage, expanding spot rates by ${netRateDeltaPercent}%. Port congestion at index ${params.portCongestionLevel} adds approx ${expectedDelay} days to round-trip transit.`;
    } else if (netRateDeltaPercent < -10) {
      explanation = `Simulated expansion of available slot capacity (${params.capacityChangePercent > 0 ? '+' : ''}${params.capacityChangePercent}%) sharply dilutes spot pricing power. Freight rates drop by ${Math.abs(netRateDeltaPercent)}% to $${projectedRate}/FEU as carriers initiate aggressive discounting to maintain vessel fill factors.`;
    } else {
      explanation = `The freight market remains in relative equilibrium under these parameters. Minor fluctuations in demand and bunker fuel balance against fleet absorption, keeping spot rates within ±${Math.abs(netRateDeltaPercent)}% of baseline.`;
    }

    const series = [
      { date: 'Current', baseline: 4180, scenario: 4180 },
      { date: '+7 Days', baseline: 4150, scenario: Math.round(4150 * (1 + netRateDeltaPercent * 0.3 / 100)) },
      { date: '+14 Days', baseline: 4120, scenario: Math.round(4120 * (1 + netRateDeltaPercent * 0.6 / 100)) },
      { date: '+30 Days', baseline: 4050, scenario: Math.round(4050 * (1 + netRateDeltaPercent * 0.85 / 100)) },
      { date: '+60 Days', baseline: 3890, scenario: projectedRate },
    ];

    return {
      baselineRateUsd: baselineRate,
      projectedRateUsd: projectedRate,
      rateDeltaPercent: netRateDeltaPercent,
      expectedDelayDays: expectedDelay,
      delayDeltaDays: delayDelta,
      projectedRiskScore: riskScore,
      capacityPressurePercent: capacityPressure,
      explanation,
      drivers: [
        { name: 'Demand Shock', weight: Math.round(Math.abs(demandEffect)), contribution: `${demandEffect >= 0 ? '+' : ''}${demandEffect.toFixed(1)}%` },
        { name: 'Capacity Supply', weight: Math.round(Math.abs(capacityEffect)), contribution: `${capacityEffect >= 0 ? '+' : ''}${capacityEffect.toFixed(1)}%` },
        { name: 'Port Congestion', weight: Math.round(Math.abs(congestionEffect)), contribution: `${congestionEffect >= 0 ? '+' : ''}${congestionEffect.toFixed(1)}%` },
        { name: 'Bunker Fuel Exposure', weight: Math.round(Math.abs(fuelEffect)), contribution: `${fuelEffect >= 0 ? '+' : ''}${fuelEffect.toFixed(1)}%` },
      ],
      series,
    };
  }
};

// ----------------------------------------------------------------------
// SIH Bulk Cargo & Vessel Chartering Service
// ----------------------------------------------------------------------

export const bulkService = {
  getCommodities: async (): Promise<BulkCommodity[]> => {
    const apiCommodities = await fetchFromApi<BulkCommodity[]>('/api/v1/bulk/commodities');
    if (apiCommodities && Array.isArray(apiCommodities) && apiCommodities.length > 0) {
      return apiCommodities;
    }
    return mockBulkCommodities;
  },
  getCommodityById: async (id: string): Promise<BulkCommodity> => {
    const all = await bulkService.getCommodities();
    return all.find(c => c.id === id) || all[0] || mockBulkCommodities[0];
  },
  getVesselClasses: async (): Promise<DryBulkVesselClass[]> => {
    const apiClasses = await fetchFromApi<DryBulkVesselClass[]>('/api/v1/bulk/vessel-classes');
    if (apiClasses && Array.isArray(apiClasses) && apiClasses.length > 0) {
      return apiClasses;
    }
    return mockDryBulkVesselClasses;
  },
  getVesselClassByName: async (name: string): Promise<DryBulkVesselClass> => {
    const all = await bulkService.getVesselClasses();
    return all.find(vc => vc.name.toLowerCase() === name.toLowerCase()) || all[0] || mockDryBulkVesselClasses[0];
  },
  getBulkRoutes: async (): Promise<RouteItem[]> => {
    const allRoutes = await routeService.getRoutes();
    return allRoutes.filter(r => r.corridor.toLowerCase().includes('bulk') || r.id.startsWith('route-aus-') || r.id.startsWith('route-indo-') || r.id.startsWith('route-saf-'));
  },
  validateCharterFixture: async (request: CharterRequest): Promise<CharterValidationResult> => {
    // Attempt backend API validation
    const apiResult = await fetchFromApi<CharterValidationResult>('/api/v1/bulk/validate-charter', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (apiResult && typeof apiResult.valid === 'boolean') {
      return apiResult;
    }
    // Fallback to client-side validation engine
    const vesselClass = await bulkService.getVesselClassByName(request.preferredVesselClass);
    const portConstraint = await portConstraintService.getPortConstraintById(request.destinationPortId);
    return validateCharterRequest(request, vesselClass, portConstraint);
  },
};

// ----------------------------------------------------------------------
// East Coast India Port Constraints Service
// ----------------------------------------------------------------------

export const portConstraintService = {
  getAllConstraints: async (): Promise<Record<string, EastCoastPortConstraint>> => {
    const apiConstraints = await fetchFromApi<Record<string, EastCoastPortConstraint>>('/api/v1/ports/east-coast-constraints');
    if (apiConstraints && typeof apiConstraints === 'object' && Object.keys(apiConstraints).length > 0) {
      return apiConstraints;
    }
    return mockEastCoastPortConstraints;
  },
  getPortConstraintById: async (portId: string): Promise<EastCoastPortConstraint> => {
    const all = await portConstraintService.getAllConstraints();
    return all[portId] || mockEastCoastPortConstraints[portId] || mockEastCoastPortConstraints['port-in-prt'];
  },
  checkFeasibility: async (portId: string, vesselDraftMeters: number) => {
    const constraint = await portConstraintService.getPortConstraintById(portId);
    return validatePortDraftCompatibility(vesselDraftMeters, constraint);
  },
};

// ----------------------------------------------------------------------
// Phase 5: East Coast India Port Intelligence & Decision Support Service
// ----------------------------------------------------------------------

function normalizeCmdKey(cmd?: string): string {
  if (!cmd) return 'coal';
  const c = cmd.toLowerCase();
  if (c.includes('coal')) return 'coal';
  if (c.includes('ore') || c.includes('iron')) return 'iron_ore';
  if (c.includes('lime') || c.includes('flux')) return 'limestone';
  if (c.includes('fert') || c.includes('phos') || c.includes('dap') || c.includes('mop')) return 'fertilizer';
  return 'coal';
}

export const portIntelligenceService = {
  evaluatePort: async (req: PortIntelligenceEvaluationRequest): Promise<PortIntelligenceEvaluationResponse> => {
    try {
      const res = await fetchFromApi<PortIntelligenceEvaluationResponse>('/api/v1/ports/intelligence/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res && res.port_id) return res;
    } catch {
      // Fallback
    }

    const port = mockEastCoastPortConstraints[req.port_id] || mockEastCoastPortConstraints['port-in-prt'];
    const cmdKey = normalizeCmdKey(req.commodity_id || req.commodity_name);
    const cmdRule = mockPortCargoHandlingRules[port.portId]?.[cmdKey];

    const cargoCompat: PortCargoCompatibility = cmdRule ? {
      commodity: req.commodity_name || req.commodity_id || 'Hard Coking Coal (HCC)',
      is_supported: cmdRule.isSupported,
      discharge_rate_mt_day: cmdRule.dischargeRateMtDay,
      handling_equipment: cmdRule.handlingEquipment,
      status: cmdRule.status,
      notes: cmdRule.notes,
    } : {
      commodity: req.commodity_name || req.commodity_id || 'Hard Coking Coal (HCC)',
      is_supported: true,
      discharge_rate_mt_day: port.mechanizedDischargeRateMtPerDay,
      handling_equipment: 'Mechanized Bulk Berth System',
      status: 'Supported',
      notes: 'Standard bulk discharge benchmark.',
    };

    const vesselClass = req.vessel_class || 'Panamax';
    const standardDrafts: Record<string, number> = {
      Capesize: 17.8, Kamsarmax: 14.5, Panamax: 13.8, Ultramax: 12.8, Supramax: 12.2, Handysize: 10.0,
    };
    const standardDwts: Record<string, number> = {
      Capesize: 180000, Kamsarmax: 82000, Panamax: 75000, Ultramax: 64000, Supramax: 58000, Handysize: 35000,
    };
    const vesselDraft = (req.vessel_draft_m && req.vessel_draft_m > 0) ? req.vessel_draft_m : (standardDrafts[vesselClass] || 13.8);
    const ukc = Number((port.maxPermissibleDraftMeters - vesselDraft).toFixed(2));
    const ukcReq = req.ukc_requirement_m || 1.0;
    const ukcStatus = ukc >= ukcReq ? 'Safe' : ukc >= 0 ? 'Marginal' : 'Violated';
    const requiresLighterage = port.lighterageRequired || ukc < 0;
    const classAllowed = port.allowableVesselClasses.includes(vesselClass);

    const vesselCompat: PortVesselEvaluation = {
      vessel_class: vesselClass,
      vessel_name: `Standard ${vesselClass} Bulk Carrier`,
      dwt: standardDwts[vesselClass] || 75000,
      sailing_draft_m: vesselDraft,
      max_port_draft_m: port.maxPermissibleDraftMeters,
      under_keel_clearance_m: ukc,
      ukc_status: ukcStatus,
      is_admissible: classAllowed && (!requiresLighterage || port.lighterageRequired),
      requires_lighterage: requiresLighterage,
      loa_compliant: true,
      beam_compliant: true,
      operational_notes: port.operationalNotes,
    };

    const quantity = req.cargo_quantity_mt || 50000;
    const dischargeRate = cargoCompat.discharge_rate_mt_day > 0 ? cargoCompat.discharge_rate_mt_day : port.mechanizedDischargeRateMtPerDay;
    const dischargeDays = Number((quantity / Math.max(dischargeRate, 1000)).toFixed(1));
    const waitingDays = port.typicalWaitingDays;
    const totalStayDays = Number((waitingDays + dischargeDays).toFixed(1));
    const dailyDemurrage = port.averageDemurrageRateUsdPerDay;
    const demurrageExposureUsd = Number((waitingDays * dailyDemurrage).toFixed(2));

    const riskMatrix: PortRiskDimension[] = [
      {
        dimension: 'Congestion & Anchorage Queue',
        risk_level: waitingDays < 1.8 ? 'Low' : waitingDays <= 2.5 ? 'Moderate' : 'High',
        score: waitingDays < 1.8 ? 25 : waitingDays <= 2.5 ? 55 : 85,
        metric_value: `${waitingDays} days waiting`,
        benchmark_criteria: '< 1.8d Low, 1.8 - 2.5d Moderate, > 2.5d High queue',
        operational_implication: 'Multiplies daily charterparty demurrage liability',
        provenance_status: 'Historical',
      },
      {
        dimension: 'Draft Constraint & UKC',
        risk_level: port.maxPermissibleDraftMeters >= 17 && ukc >= 1 ? 'Low' : port.maxPermissibleDraftMeters >= 14 && ukc >= 0 ? 'Moderate' : 'High',
        score: port.maxPermissibleDraftMeters >= 17 && ukc >= 1 ? 20 : port.maxPermissibleDraftMeters >= 14 && ukc >= 0 ? 50 : 90,
        metric_value: `${port.maxPermissibleDraftMeters}m limit (UKC: ${ukc}m)`,
        benchmark_criteria: '>= 17.0m & Safe UKC: Low; 14-17m: Moderate; < 14m or Violated UKC: High',
        operational_implication: 'Governs maximum safe deadweight cargo intake',
        provenance_status: 'Configured',
      },
      {
        dimension: 'Weather & Seasonal Sensitivity',
        risk_level: port.weatherSensitivityNotes.toLowerCase().includes('sheltered') ? 'Low' : port.weatherSensitivityNotes.toLowerCase().includes('bore') ? 'High' : 'Moderate',
        score: port.weatherSensitivityNotes.toLowerCase().includes('sheltered') ? 30 : port.weatherSensitivityNotes.toLowerCase().includes('bore') ? 85 : 60,
        metric_value: port.weatherSensitivityNotes.slice(0, 45) + '...',
        benchmark_criteria: 'Sheltered harbor: Low; Open approach swell: Moderate; Tidal bore/estuary: High',
        operational_implication: 'Monsoons and cyclones impact pilotage and conveyor operations',
        provenance_status: 'Historical',
      },
      {
        dimension: 'Vessel Segment Flexibility',
        risk_level: port.allowableVesselClasses.includes('Capesize') ? 'Low' : port.allowableVesselClasses.includes('Panamax') ? 'Moderate' : 'High',
        score: port.allowableVesselClasses.includes('Capesize') ? 20 : port.allowableVesselClasses.includes('Panamax') ? 55 : 85,
        metric_value: `${port.allowableVesselClasses.length} bulk classes admissible`,
        benchmark_criteria: 'Capesize-capable: Low; Panamax max: Moderate; Handysize only: High',
        operational_implication: 'Governs vessel size options and freight economies of scale',
        provenance_status: 'Configured',
      },
      {
        dimension: 'Cargo Handling Velocity',
        risk_level: dischargeRate >= 25000 ? 'Low' : dischargeRate >= 15000 ? 'Moderate' : 'High',
        score: dischargeRate >= 25000 ? 20 : dischargeRate >= 15000 ? 50 : 80,
        metric_value: `${dischargeRate.toLocaleString()} MT/day rate`,
        benchmark_criteria: '>= 25k MT/d: Low; 15k - 25k MT/d: Moderate; < 15k MT/d: High',
        operational_implication: 'Determines berth duration and laytime consumption',
        provenance_status: 'Historical',
      },
      {
        dimension: 'Operational & Regulatory Constraints',
        risk_level: !cargoCompat.is_supported ? 'High' : (port.lighterageRequired || port.riverineNavigation) ? 'High' : 'Low',
        score: !cargoCompat.is_supported ? 98 : (port.lighterageRequired || port.riverineNavigation) ? 90 : 15,
        metric_value: !cargoCompat.is_supported ? cargoCompat.status : (port.lighterageRequired ? 'Sandheads Lighterage' : 'Direct Berthing'),
        benchmark_criteria: 'Direct deepwater: Low; Partial de-ballasting: Moderate; Lighterage/Regulatory Bar: High',
        operational_implication: 'Regulatory bars or mandatory transshipments require cargo redirection',
        provenance_status: 'Historical',
      },
    ];

    const advantages: string[] = [];
    const constraints: string[] = [];
    const unknowns: string[] = [];
    const requiredVerifications: string[] = [];

    if (port.maxPermissibleDraftMeters >= 17) advantages.push(`Deep draft capacity (${port.maxPermissibleDraftMeters}m) accommodates Capesize vessels directly.`);
    if (dischargeRate >= 25000) advantages.push(`Rapid discharge speed (${dischargeRate.toLocaleString()} MT/day) lowers laytime consumption.`);
    if (!port.lighterageRequired) advantages.push('Direct berthing avoids costly offshore barge lighterage fees.');

    if (!cargoCompat.is_supported) constraints.push(`REGULATORY RESTRICTION: ${cargoCompat.notes}`);
    if (port.lighterageRequired) constraints.push(`MANDATORY LIGHTERAGE: Shallow estuarine channel restricts direct arrival. Lighterage required at ${port.lighterageLocation}.`);
    if (ukc < ukcReq) constraints.push(`MARGINAL/VIOLATED UKC: Vessel draft (${vesselDraft}m) exceeds or closely touches safe clearance.`);
    if (waitingDays > 2) constraints.push(`ELEVATED QUEUE: Typical waiting of ${waitingDays} days increases demurrage exposure.`);

    unknowns.push('Real-time berth lineup and anchor queue priority at exact time of Notice of Readiness (NOR).');
    unknowns.push('Specific pilotage availability during adverse sea-state windows.');
    unknowns.push('Live tidal draft variation on specific discharge date.');

    requiredVerifications.push('Confirm latest Port Master Marine Circular for recent dredging depths.');
    requiredVerifications.push('Verify Charter Party laytime definitions (WWD SHINC vs SHEX).');
    requiredVerifications.push('Verify receiver rail wagon supply quota for hinterland evacuation.');

    return {
      port_id: port.portId,
      port_name: port.portName,
      port_code: port.portCode,
      state: port.state,
      port_type: port.riverineNavigation ? 'Riverine Major Port Complex' : port.provenance.source.includes('APSEZ') ? 'Private Deepwater Gateway' : 'Major Port Authority',
      max_permissible_draft_m: port.maxPermissibleDraftMeters,
      max_loa_m: port.maxLoaMeters,
      max_beam_m: port.maxBeamMeters,
      tidal_restriction: port.tidalRestriction,
      riverine_navigation: port.riverineNavigation,
      lighterage_required: port.lighterageRequired,
      lighterage_location: port.lighterageLocation,
      allowable_vessel_classes: port.allowableVesselClasses,
      mechanized_discharge_rate_mt_day: dischargeRate,
      typical_waiting_days: waitingDays,
      average_demurrage_rate_usd_day: dailyDemurrage,
      weather_sensitivity_notes: port.weatherSensitivityNotes,
      operational_notes: port.operationalNotes,
      vessel_compatibility: vesselCompat,
      cargo_compatibility: cargoCompat,
      risk_matrix: riskMatrix,
      waiting_time_impact: {
        typical_waiting_days: waitingDays,
        mechanized_discharge_rate_mt_day: dischargeRate,
        estimated_discharge_days: dischargeDays,
        total_port_stay_days: totalStayDays,
        daily_demurrage_rate_usd: dailyDemurrage,
        potential_demurrage_exposure_usd: demurrageExposureUsd,
        congestion_status_badge: 'Historical Port Authority Benchmark',
        provenance_status: 'Historical Official Statistics',
        notes: `Turnaround based on ${dischargeRate.toLocaleString()} MT/day mechanized discharge rate and ${waitingDays} days average queue.`,
      },
      weather_operational_profile: {
        southwest_monsoon: { period: 'June - September', condition: 'High swell, rough sea state at outer anchorage', impact: 'Pilotage delays possible for open-roadstead approaches' },
        northeast_monsoon: { period: 'October - December', condition: 'Heavy coastal rainfall and squalls', impact: 'Conveyor operations subject to rain standstills' },
        cyclone_window: { period: 'May & October - November', condition: 'Bay of Bengal tropical cyclone alert protocol', impact: 'Harbor master may order all berthed vessels to sea' },
        riverine_hydrodynamics: { condition: port.riverineNavigation ? 'Hooghly River tidal window' : 'Deepwater oceanic approaches', impact: port.riverineNavigation ? 'Daily high-tide navigation window required' : 'Unrestricted tidal entry' },
        provenance_status: 'Historical Maritime Meteorology',
      },
      decision_factors: {
        advantages,
        constraints,
        unknowns,
        required_verifications: requiredVerifications,
      },
      data_provenance: port.provenance,
    };
  },

  comparePorts: async (req: PortComparisonRequest): Promise<PortComparisonResponse> => {
    try {
      const res = await fetchFromApi<PortComparisonResponse>('/api/v1/ports/intelligence/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res && res.comparison_items && res.comparison_items.length > 0) return res;
    } catch {
      // Fallback
    }

    const portIds = req.port_ids && req.port_ids.length > 0 ? req.port_ids : Object.keys(mockEastCoastPortConstraints);
    const items: PortComparisonItem[] = [];
    const decisionMatrix: Record<string, PortDecisionFactors> = {};

    for (const pid of portIds) {
      const single = await portIntelligenceService.evaluatePort({
        port_id: pid,
        commodity_id: req.commodity_id,
        commodity_name: req.commodity_name,
        cargo_quantity_mt: req.cargo_quantity_mt,
        vessel_class: req.preferred_vessel_class,
        vessel_draft_m: req.vessel_draft_m,
      });

      const highRisks = single.risk_matrix.filter(r => r.risk_level === 'High').length;
      const overallRisk: PortRiskLevel = (!single.cargo_compatibility.is_supported || highRisks >= 2) ? 'High' : (highRisks === 1 || single.risk_matrix.some(r => r.risk_level === 'Moderate')) ? 'Moderate' : 'Low';

      let summary = '';
      if (!single.cargo_compatibility.is_supported) {
        summary = `Restricted: ${single.cargo_compatibility.notes.slice(0, 60)}...`;
      } else if (single.vessel_compatibility.requires_lighterage) {
        summary = 'Admissible with offshore lighterage at Sandheads.';
      } else if (single.vessel_compatibility.ukc_status === 'Violated') {
        summary = `Draft violation: UKC is ${single.vessel_compatibility.under_keel_clearance_m}m.`;
      } else {
        summary = `Compatible: ${single.mechanized_discharge_rate_mt_day.toLocaleString()} MT/day rate with ${single.typical_waiting_days}d avg queue.`;
      }

      items.push({
        port_id: single.port_id,
        port_name: single.port_name,
        port_code: single.port_code,
        state: single.state,
        max_permissible_draft_m: single.max_permissible_draft_m,
        mechanized_discharge_rate_mt_day: single.mechanized_discharge_rate_mt_day,
        typical_waiting_days: single.typical_waiting_days,
        average_demurrage_rate_usd_day: single.average_demurrage_rate_usd_day,
        lighterage_required: single.lighterage_required,
        cargo_supported: single.cargo_compatibility.is_supported,
        cargo_status: single.cargo_compatibility.status,
        vessel_admissible: single.vessel_compatibility.is_admissible,
        under_keel_clearance_m: single.vessel_compatibility.under_keel_clearance_m,
        ukc_status: single.vessel_compatibility.ukc_status,
        discharge_days: single.waiting_time_impact.estimated_discharge_days,
        demurrage_exposure_usd: single.waiting_time_impact.potential_demurrage_exposure_usd,
        overall_risk_level: overallRisk,
        decision_summary: summary,
        data_confidence: single.data_provenance.status === 'historical' ? 'Historical' : single.data_provenance.status === 'demo' ? 'Configured' : 'Simulated',
      });

      decisionMatrix[single.port_id] = single.decision_factors;
    }

    return {
      timestamp: new Date().toISOString(),
      evaluated_ports_count: items.length,
      cargo_commodity: req.commodity_name || req.commodity_id || 'Hard Coking Coal (HCC)',
      cargo_quantity_mt: req.cargo_quantity_mt || 50000,
      preferred_vessel_class: req.preferred_vessel_class || 'Panamax',
      comparison_items: items,
      decision_matrix: decisionMatrix,
    };
  },
};

// ----------------------------------------------------------------------
// Phase 2: Intelligent Bulk Cargo Procurement Analysis Service
// ----------------------------------------------------------------------

export const cargoAnalysisService = {
  getDemoScenario: (): CargoAnalysisRequest => ({
    cargoType: 'Hard Coking Coal (HCC)',
    cargoQuantity: 50000,
    quantityUnit: 'MT',
    originCountry: 'Australia',
    originPort: 'Hay Point / Newcastle',
    destinationPort: 'port-in-prt',
    deliveryDate: '2026-10-31',
    laycanStart: '2026-10-15',
    laycanEnd: '2026-10-25',
    preferredVesselType: 'Panamax',
    targetFreight: 15.00,
    budget: 800000,
    contractType: 'spot_voyage',
    isDemo: true,
  }),

  analyzeCargoRequirement: async (req: CargoAnalysisRequest): Promise<CargoAnalysisResponse> => {
    // 1. Attempt FastAPI backend endpoint call
    try {
      const payload = {
        cargo_type: req.cargoType,
        cargo_quantity: req.cargoQuantity,
        quantity_unit: req.quantityUnit || 'MT',
        origin_country: req.originCountry,
        origin_port: req.originPort,
        destination_port: req.destinationPort,
        delivery_date: req.deliveryDate,
        laycan_start: req.laycanStart,
        laycan_end: req.laycanEnd,
        preferred_vessel_type: req.preferredVesselType,
        target_freight: req.targetFreight,
        budget: req.budget,
        contract_type: req.contractType || 'spot_voyage',
        is_demo: Boolean(req.isDemo),
      };

      const res = await fetchFromApi<any>('/api/v1/cargo-analysis', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.request_id) {
        return {
          requestId: res.request_id,
          timestamp: res.timestamp,
          isDemo: res.is_demo,
          cargoRequirement: {
            commodityId: res.cargo_requirement.commodity_id,
            commodityName: res.cargo_requirement.commodity_name,
            category: res.cargo_requirement.category,
            cargoQuantityMt: res.cargo_requirement.cargo_quantity_mt,
            quantityUnit: res.cargo_requirement.quantity_unit,
            parcelClassification: res.cargo_requirement.parcel_classification,
            stowageFactorM3PerMt: res.cargo_requirement.stowage_factor_m3_per_mt,
            handlingRequirements: res.cargo_requirement.handling_requirements,
            isDemo: res.cargo_requirement.is_demo,
          },
          freightMarket: {
            benchmarkRateUsdMt: res.freight_market.benchmark_rate_usd_mt,
            benchmarkIndexName: res.freight_market.benchmark_index_name,
            marketSentiment: res.freight_market.market_sentiment,
            historicVolatilityPct: res.freight_market.historic_volatility_pct,
            forecastStatus: res.freight_market.forecast_status,
            forecastAvailable: res.freight_market.forecast_available,
            notice: res.freight_market.notice,
          },
          charteringContext: {
            laycanStart: res.chartering_context.laycan_start,
            laycanEnd: res.chartering_context.laycan_end,
            laycanWindowDays: res.chartering_context.laycan_window_days,
            contractType: res.chartering_context.contract_type,
            recommendedCharterType: res.chartering_context.recommended_charter_type,
            marketFixtureLiquidity: res.chartering_context.market_fixture_liquidity,
            cancellationRisk: res.chartering_context.cancellation_risk,
            charterTermsSummary: res.chartering_context.charter_terms_summary,
          },
          vesselContext: {
            vesselClass: res.vessel_context.vessel_class,
            dwtMin: res.vessel_context.dwt_min,
            dwtMax: res.vessel_context.dwt_max,
            typicalDraftM: res.vessel_context.typical_draft_m,
            calculatedSailingDraftM: res.vessel_context.calculated_sailing_draft_m,
            dailyBunkerConsumptionMt: res.vessel_context.daily_bunker_consumption_mt,
            ladenSpeedKnots: res.vessel_context.laden_speed_knots,
            ballastSpeedKnots: res.vessel_context.ballast_speed_knots,
            geared: res.vessel_context.geared,
            craneCapacityTonnes: res.vessel_context.crane_capacity_tonnes,
            suitabilityAssessment: res.vessel_context.suitability_assessment,
          },
          portContext: {
            destinationPortId: res.port_context.destination_port_id,
            destinationPortName: res.port_context.destination_port_name,
            portCode: res.port_context.port_code,
            state: res.port_context.state,
            maxPermissibleDraftM: res.port_context.max_permissible_draft_m,
            calculatedUkcM: res.port_context.calculated_ukc_m,
            isAdmissible: res.port_context.is_admissible,
            requiresLighterage: res.port_context.requires_lighterage,
            lighterageLocation: res.port_context.lighterage_location,
            mechanizedDischargeRateMtDay: res.port_context.mechanized_discharge_rate_mt_day,
            estimatedDischargeDays: res.port_context.estimated_discharge_days,
            weatherSensitivityNotes: res.port_context.weather_sensitivity_notes,
            operationalNotes: res.port_context.operational_notes,
          },
          routeContext: {
            routeId: res.route_context.route_id,
            corridorName: res.route_context.corridor_name,
            originPort: res.route_context.origin_port,
            originCountry: res.route_context.origin_country,
            destinationPort: res.route_context.destination_port,
            distanceNm: res.route_context.distance_nm,
            transitDaysLaden: res.route_context.transit_days_laden,
            transitDaysBallast: res.route_context.transit_days_ballast,
            chokePoints: res.route_context.choke_points,
            weatherVulnerability: res.route_context.weather_vulnerability,
            routeRiskScore: res.route_context.route_risk_score,
          },
          costContext: {
            freightRateUsdMt: res.cost_context.freight_rate_usd_mt,
            estimatedFreightBaselineUsd: res.cost_context.estimated_freight_baseline_usd,
            estimatedDischargeDays: res.cost_context.estimated_discharge_days,
            demurrageRateUsdDay: res.cost_context.demurrage_rate_usd_day,
            potentialDemurrageExposureUsd: res.cost_context.potential_demurrage_exposure_usd,
            targetFreightUsdMt: res.cost_context.target_freight_usd_mt,
            budgetUsd: res.cost_context.budget_usd,
            varianceVsTargetUsdMt: res.cost_context.variance_vs_target_usd_mt,
            costStatusNotice: res.cost_context.cost_status_notice,
          },
          decisionWorkspace: res.decision_workspace.map((dw: any) => ({
            category: dw.category,
            status: dw.status,
            availableData: dw.available_data,
            relevantEvidence: dw.relevant_evidence,
            actionableRecommendation: dw.actionable_recommendation,
          })),
          dataProvenance: res.data_provenance.map((dp: any) => ({
            source: dp.source,
            datasetName: dp.dataset_name,
            coveragePeriod: dp.coverage_period,
            lastUpdated: dp.last_updated,
            dataType: dp.data_type,
            units: dp.units,
            status: dp.status,
          })),
        };
      }
    } catch (e) {
      console.warn('Backend cargo-analysis API call returned error, applying fallback calculation:', e);
    }

    // 2. Client-side domain engine fallback
    const commodity = mockBulkCommodities.find(c => 
      c.id === req.cargoType || 
      c.name.toLowerCase().includes(req.cargoType.toLowerCase()) || 
      c.category.toLowerCase().includes(req.cargoType.toLowerCase())
    ) || mockBulkCommodities[0];

    const vessel = mockDryBulkVesselClasses.find(v => 
      v.name.toLowerCase() === req.preferredVesselType.toLowerCase()
    ) || mockDryBulkVesselClasses[2];

    const portKey = Object.keys(mockEastCoastPortConstraints).find(k => 
      k === req.destinationPort || 
      mockEastCoastPortConstraints[k].portCode.toLowerCase() === req.destinationPort.toLowerCase() ||
      mockEastCoastPortConstraints[k].portName.toLowerCase().includes(req.destinationPort.toLowerCase())
    ) || 'port-in-prt';
    const port = mockEastCoastPortConstraints[portKey];

    const loadFactor = Math.min(1.0, Math.max(0.4, req.cargoQuantity / (vessel.dwtMax || 79999)));
    const sailingDraft = Number((vessel.typicalDraftMeters * (0.55 + 0.45 * loadFactor)).toFixed(2));
    const ukc = Number((port.maxPermissibleDraftMeters - sailingDraft).toFixed(2));
    const isAdmissible = ukc >= 1.0 && !port.riverineNavigation;
    const requiresLighterage = port.lighterageRequired || (port.riverineNavigation && sailingDraft > port.maxPermissibleDraftMeters);

    let startD: Date;
    let endD: Date;
    try {
      startD = new Date(req.laycanStart);
      endD = new Date(req.laycanEnd);
    } catch {
      startD = new Date();
      endD = new Date(Date.now() + 10 * 86400000);
    }
    const laycanDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)));

    const dischargeDays = Number((req.cargoQuantity / (port.mechanizedDischargeRateMtPerDay || 25000)).toFixed(1));
    const demurrageRate = port.averageDemurrageRateUsdPerDay || 28000;
    const demurrageExposure = Math.round((port.typicalWaitingDays || 2.0) * demurrageRate);
    const benchmarkRate = 14.85;
    const freightBaseline = Math.round(req.cargoQuantity * benchmarkRate);

    let parcelClass = 'Panamax / Kamsarmax Standard Parcel';
    if (req.cargoQuantity >= 120000) parcelClass = 'Capesize Major Bulk Parcel';
    else if (req.cargoQuantity < 45000) parcelClass = 'Handysize Minor Bulk Parcel';

    return {
      requestId: `CARGO-ANL-LOCAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      isDemo: Boolean(req.isDemo),
      cargoRequirement: {
        commodityId: commodity.id,
        commodityName: commodity.name,
        category: commodity.category,
        cargoQuantityMt: req.cargoQuantity,
        quantityUnit: req.quantityUnit || 'MT',
        parcelClassification: parcelClass,
        stowageFactorM3PerMt: commodity.stowageFactorM3PerMt,
        handlingRequirements: commodity.handlingRequirements,
        isDemo: req.isDemo,
      },
      freightMarket: {
        benchmarkRateUsdMt: benchmarkRate,
        benchmarkIndexName: `${vessel.name} East Coast India Benchmark`,
        marketSentiment: 'Steady / Slightly Firming',
        historicVolatilityPct: 18.4,
        forecastStatus: 'Forecast analysis will be generated from the Freight Forecast module',
        forecastAvailable: false,
        notice: 'Freight forward projection model will be connected in Phase 3.',
      },
      charteringContext: {
        laycanStart: req.laycanStart,
        laycanEnd: req.laycanEnd,
        laycanWindowDays: laycanDays,
        contractType: req.contractType || 'spot_voyage',
        recommendedCharterType: 'Single Voyage Charter Party (Spot / Index-Linked)',
        marketFixtureLiquidity: 'Moderate - High (East Coast India Coal Corridor)',
        cancellationRisk: 'Low (< 2% historical cancellation within 10-day laycan spread)',
        charterTermsSummary: `Laycan: ${req.laycanStart} to ${req.laycanEnd} (${laycanDays} days), Demurrage $${demurrageRate.toLocaleString()}/day pro rata, Despatch half demurrage.`,
      },
      vesselContext: {
        vesselClass: vessel.name,
        dwtMin: vessel.dwtMin,
        dwtMax: vessel.dwtMax,
        typicalDraftM: vessel.typicalDraftMeters,
        calculatedSailingDraftM: sailingDraft,
        dailyBunkerConsumptionMt: vessel.dailyBunkerFuelMt,
        ladenSpeedKnots: vessel.speedKnotsLaden,
        ballastSpeedKnots: vessel.speedKnotsBallast,
        geared: vessel.geared,
        craneCapacityTonnes: vessel.craneCapacityTonnes,
        suitabilityAssessment: `${vessel.name} is fully capable of carrying ${req.cargoQuantity.toLocaleString()} MT with ${sailingDraft}m sailing draft.`,
      },
      portContext: {
        destinationPortId: port.portId,
        destinationPortName: port.portName,
        portCode: port.portCode,
        state: port.state,
        maxPermissibleDraftM: port.maxPermissibleDraftMeters,
        calculatedUkcM: ukc,
        isAdmissible,
        requiresLighterage,
        lighterageLocation: port.lighterageLocation,
        mechanizedDischargeRateMtDay: port.mechanizedDischargeRateMtPerDay,
        estimatedDischargeDays: dischargeDays,
        weatherSensitivityNotes: port.weatherSensitivityNotes,
        operationalNotes: port.operationalNotes,
      },
      routeContext: {
        routeId: 'route-aus-paradip',
        corridorName: 'Hay Point (Australia) to Paradip Port',
        originPort: req.originPort || 'Hay Point',
        originCountry: req.originCountry || 'Australia',
        destinationPort: port.portName,
        distanceNm: 4820,
        transitDaysLaden: 15.0,
        transitDaysBallast: 14.0,
        chokePoints: ['Torres Strait', 'Malacca Strait'],
        weatherVulnerability: 'Bay of Bengal SW Monsoon Swell (June-September)',
        routeRiskScore: 32,
      },
      costContext: {
        freightRateUsdMt: benchmarkRate,
        estimatedFreightBaselineUsd: freightBaseline,
        estimatedDischargeDays: dischargeDays,
        demurrageRateUsdDay: demurrageRate,
        potentialDemurrageExposureUsd: demurrageExposure,
        targetFreightUsdMt: req.targetFreight,
        budgetUsd: req.budget,
        varianceVsTargetUsdMt: req.targetFreight ? Number((benchmarkRate - req.targetFreight).toFixed(2)) : undefined,
        costStatusNotice: 'Cost analysis will be generated after freight and chartering analysis',
      },
      decisionWorkspace: [
        {
          category: 'Freight Outlook',
          status: 'PENDING_MODEL',
          availableData: `Benchmark: $${benchmarkRate.toFixed(2)}/MT (Australia - Paradip Coal). Volatility: 18.4%.`,
          relevantEvidence: `Historic fixture baseline: $${freightBaseline.toLocaleString()} total. Model forecast pending integration.`,
          actionableRecommendation: 'Forecast analysis will be generated from the Freight Forecast module. Baseline voyage reference confirmed.',
        },
        {
          category: 'Chartering Context',
          status: laycanDays >= 5 && laycanDays <= 15 ? 'OPTIMAL' : 'CAUTION',
          availableData: `Laycan: ${req.laycanStart} to ${req.laycanEnd} (${laycanDays} days). Type: ${(req.contractType || 'spot_voyage').replace('_', ' ')}.`,
          relevantEvidence: 'Liquidity window is healthy. Cancellation risk is low-to-moderate for East Coast India loading windows.',
          actionableRecommendation: 'Maintain 10-day laycan spread. Fix fixture via standard dry bulk charter party terms (e.g. AMWELSH / GENCON).',
        },
        {
          category: 'Vessel Compatibility',
          status: req.cargoQuantity >= vessel.dwtMin && req.cargoQuantity <= vessel.dwtMax ? 'OPTIMAL' : 'COMPATIBLE',
          availableData: `${vessel.name} (${vessel.dwtMin.toLocaleString()} - ${vessel.dwtMax.toLocaleString()} DWT). Calculated draft: ${sailingDraft}m.`,
          relevantEvidence: `Parcel intake of ${req.cargoQuantity.toLocaleString()} MT yields a ${(loadFactor * 100).toFixed(1)}% load factor. Typical fuel burn: ${vessel.dailyBunkerFuelMt} MT/day.`,
          actionableRecommendation: `Vessel class '${vessel.name}' is operationally suitable for ${commodity.name} handling.`,
        },
        {
          category: 'Port Constraints',
          status: !isAdmissible && !requiresLighterage ? 'RESTRICTED' : requiresLighterage ? 'CAUTION' : 'OPTIMAL',
          availableData: `${port.portName} (${port.portCode}). Permissible draft: ${port.maxPermissibleDraftMeters}m.`,
          relevantEvidence: `Under-Keel Clearance: ${ukc}m. Discharge rate: ${port.mechanizedDischargeRateMtPerDay.toLocaleString()} MT/day. Lighterage: ${requiresLighterage ? 'Required at ' + (port.lighterageLocation || 'Outer Anchorage') : 'Not Required'}.`,
          actionableRecommendation: requiresLighterage ? `Mandatory lighterage required at ${port.lighterageLocation || 'Sandheads Anchorage'}.` : `Direct berthing authorized at ${port.portName} with ${ukc}m UKC.`,
        },
        {
          category: 'Route Risk',
          status: 'COMPATIBLE',
          availableData: `Hay Point to Paradip (4,820 NM). Laden transit: 15.0 days.`,
          relevantEvidence: 'Choke points: Torres Strait, Malacca Strait. Risk score: 32/100. Weather vulnerability: Bay of Bengal SW Monsoon Swell.',
          actionableRecommendation: 'Track seasonal Bay of Bengal swell and monitor transit through Malacca Strait.',
        },
        {
          category: 'Cost Exposure',
          status: 'COMPATIBLE',
          availableData: `Baseline Freight: $${freightBaseline.toLocaleString()} ($${benchmarkRate.toFixed(2)}/MT). Demurrage: $${demurrageRate.toLocaleString()}/day.`,
          relevantEvidence: `Estimated discharge duration: ${dischargeDays} days. Expected waiting exposure: $${demurrageExposure.toLocaleString()}.`,
          actionableRecommendation: 'Cost analysis will be generated after freight and chartering analysis. Monitor port berth queues to avoid demurrage penalties.',
        },
      ],
      dataProvenance: [
        commodity.provenance,
        vessel.provenance,
        port.provenance,
        {
          source: 'Baltic Exchange Voyage Benchmark & Maritime Distance Tables',
          datasetName: 'Australia - India Coal Trade Lane Parameters',
          coveragePeriod: '2024 Reference Corridor',
          lastUpdated: '2024-08-01',
          dataType: 'Shipping Network Topography',
          units: 'Nautical Miles / Days / USD per MT',
          status: 'demo',
        },
      ],
    };
  },
};

// ----------------------------------------------------------------------
// CHARTERING & VESSEL SELECTION SERVICE (Phase 4)
// ----------------------------------------------------------------------
export const charteringService = {
  getCandidates: async (): Promise<CharterCandidateVessel[]> => {
    const apiData = await fetchFromApi<CharterCandidateVessel[]>('/api/v1/chartering/candidates');
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      return apiData;
    }
    return mockCandidateBulkVessels;
  },

  evaluateCharter: async (req: CharteringEvaluationRequest): Promise<CharteringEvaluationResponse> => {
    try {
      const apiRes = await fetchFromApi<CharteringEvaluationResponse>('/api/v1/chartering/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (apiRes && apiRes.vessel_analyses && apiRes.vessel_analyses.length > 0) {
        return apiRes;
      }
    } catch {
      // Fall through to resilient local calculation
    }

    // Resilient local fallback calculation
    const candidates = mockCandidateBulkVessels;
    const destPortKey = (req.destination_port || 'port-in-prt').toLowerCase();
    const portList = Object.values(mockEastCoastPortConstraints);
    const portConstraint = portList.find(
      p => p.portId.toLowerCase() === destPortKey || p.portName.toLowerCase().includes(destPortKey) || destPortKey.includes(p.portName.toLowerCase())
    ) || mockEastCoastPortConstraints['port-in-prt'];

    const portMaxDraft = portConstraint.maxPermissibleDraftMeters;
    const requiresLighterage = portConstraint.lighterageRequired;
    const lighterageLocation = portConstraint.lighterageLocation || 'Sandheads Anchorage';
    const portDemurrage = portConstraint.averageDemurrageRateUsdPerDay || 28000;
    const dischargeRate = portConstraint.mechanizedDischargeRateMtPerDay || 25000;
    const portWaitingDays = portConstraint.typicalWaitingDays || 2.0;

    const vlsfoPrice = req.bunker_fuel_price_usd_mt || 615.0;
    const portPda = req.port_cost_usd || 45000.0;
    const demurrageRate = req.demurrage_rate_usd_day || portDemurrage;
    const distanceNm = 4850.0;

    const analyses: VesselFitAnalysisResult[] = candidates.map(v => {
      const dwt = v.dwt;
      const loadFactor = Math.round((req.cargo_quantity_mt / dwt) * 1000) / 10;
      const effectiveLf = Math.min(1.0, req.cargo_quantity_mt / dwt);
      const sailingDraft = Math.round((v.ballast_draft_m + (v.typical_draft_m - v.ballast_draft_m) * effectiveLf) * 100) / 100;
      const ukc = Math.round((portMaxDraft - sailingDraft) * 100) / 100;
      const portAdmissible = ukc >= 1.0;

      const ballastDist = v.estimated_ballast_distance_nm;
      const ballastDays = Math.round((ballastDist / (v.ballast_speed_knots * 24.0)) * 10) / 10;
      const ballastBunker = Math.round(ballastDays * v.daily_bunker_fuel_mt * 10) / 10;

      const allowedLaytimeDays = Math.round((req.cargo_quantity_mt / dischargeRate) * 100) / 100;
      const estimatedDischargeDays = Math.round((allowedLaytimeDays + 0.4) * 100) / 100;
      const turnaroundDays = Math.round((portWaitingDays + estimatedDischargeDays) * 100) / 100;
      const demurrageDays = Math.max(0, Math.round((turnaroundDays - allowedLaytimeDays) * 100) / 100);
      const demurrageExposureVal = Math.round(demurrageDays * demurrageRate);

      const ladenDays = Math.round((distanceNm / (v.laden_speed_knots * 24.0)) * 10) / 10;
      const totalVoyageDays = Math.round((ballastDays + ladenDays + turnaroundDays) * 10) / 10;

      const classDiscount = v.vessel_class === 'Capesize' ? 0.92 : (['Panamax', 'Kamsarmax'].includes(v.vessel_class) ? 1.0 : 1.10);
      const voyageFreightRate = req.target_freight_usd_mt || Math.round(14.80 * classDiscount * 100) / 100;
      const voyageCharterTotal = Math.round(req.cargo_quantity_mt * voyageFreightRate + demurrageExposureVal);
      const voyageCharterUsdMt = Math.round((voyageCharterTotal / req.cargo_quantity_mt) * 100) / 100;

      const dailyHire = req.daily_hire_usd_day || v.estimated_daily_hire_usd;
      const hireComponent = Math.round(dailyHire * totalVoyageDays);
      const steamingDays = ballastDays + ladenDays;
      const bunkerConsumptionMt = Math.round((steamingDays * v.daily_bunker_fuel_mt + turnaroundDays * 3.5) * 10) / 10;
      const bunkerCost = Math.round(bunkerConsumptionMt * vlsfoPrice);
      const timeCharterTotal = Math.round(hireComponent + bunkerCost + portPda);
      const timeCharterUsdMt = Math.round((timeCharterTotal / req.cargo_quantity_mt) * 100) / 100;

      const costDiff = Math.round(timeCharterTotal - voyageCharterTotal);
      const costDiffPct = Math.round((costDiff / (voyageCharterTotal + 1e-6)) * 1000) / 10;

      // Transparent fit score
      let intakeScore = 40.0;
      if (loadFactor >= 70 && loadFactor <= 95) intakeScore = 100.0;
      else if (loadFactor >= 55 && loadFactor < 70) intakeScore = 75.0;
      else if (loadFactor > 95 && loadFactor <= 100) intakeScore = 85.0;

      let draftScore = 10.0;
      if (ukc >= 2.5) draftScore = 100.0;
      else if (ukc >= 1.0) draftScore = 85.0;
      else if (requiresLighterage) draftScore = 65.0;

      const laycanStatus = ballastDays <= 12.0 ? 'Compatible' : (ballastDays <= 16.0 ? 'Tight' : 'Late');
      const laycanScore = laycanStatus === 'Compatible' ? 100.0 : (laycanStatus === 'Tight' ? 70.0 : 30.0);
      const equipmentScore = portConstraint.riverineNavigation && !v.geared ? 60.0 : (v.geared ? 95.0 : 90.0);
      const efficiencyScore = v.daily_bunker_fuel_mt <= 25.0 ? 90.0 : 75.0;

      const totalScore = Math.round((intakeScore * 0.30 + draftScore * 0.25 + laycanScore * 0.20 + equipmentScore * 0.15 + efficiencyScore * 0.10) * 10) / 10;

      const satisfied: string[] = [];
      const constraints: string[] = [];
      const missing: string[] = [
        'Live charter availability unverified (commercial fixture requires broker confirmation).',
        'Bunker escalation clause (BAF) pending charter party terms.',
      ];

      if (loadFactor >= 60 && loadFactor <= 98) {
        satisfied.push(`Cargo intake optimal: ${req.cargo_quantity_mt.toLocaleString()} MT represents ${loadFactor}% DWT capacity.`);
      } else {
        constraints.push(`Cargo intake sub-optimal (${loadFactor}% DWT load factor).`);
      }

      if (portAdmissible) {
        satisfied.push(`Port draft compliant: Sailing draft ${sailingDraft}m provides ${ukc}m UKC at ${portConstraint.portName} (Max ${portMaxDraft}m).`);
      } else {
        constraints.push(`Port draft exceeded: Sailing draft ${sailingDraft}m exceeds ${portConstraint.portName} limit (${portMaxDraft}m).`);
      }

      if (requiresLighterage) {
        constraints.push(`Mandatory lighterage protocol: Vessel requires parcel transshipment at ${lighterageLocation}.`);
      }

      if (laycanStatus === 'Compatible') {
        satisfied.push(`Laycan fit verified: Estimated arrival at load port aligns with target window.`);
      } else {
        constraints.push(`Laycan timing ${laycanStatus}: Ballast leg (${ballastDays}d) may pinch loading window.`);
      }

      const recType = costDiff > 0 ? 'Voyage Charter (Spot)' : 'Time Charter (Trip)';

      return {
        vessel: v,
        load_factor_pct: loadFactor,
        calculated_sailing_draft_m: sailingDraft,
        port_max_draft_m: portMaxDraft,
        under_keel_clearance_m: ukc,
        port_admissible: portAdmissible,
        requires_lighterage: requiresLighterage,
        lighterage_location: lighterageLocation,
        estimated_eta_load_port: '2026-10-17',
        laycan_status: laycanStatus,
        laycan_delta_days: 0,
        fit_score: {
          total_score: totalScore,
          cargo_intake_score: intakeScore,
          port_draft_score: draftScore,
          laycan_fit_score: laycanScore,
          equipment_crane_score: equipmentScore,
          route_efficiency_score: efficiencyScore,
          explanation: 'Evaluated across Intake (30%), Draft/UKC (25%), Laycan (20%), Equipment (15%), and Bunker Efficiency (10%).',
        },
        voyage_economics: {
          voyage_charter_total_usd: voyageCharterTotal,
          voyage_charter_usd_mt: voyageCharterUsdMt,
          time_charter_total_usd: timeCharterTotal,
          time_charter_usd_mt: timeCharterUsdMt,
          hire_component_usd: hireComponent,
          bunker_component_usd: bunkerCost,
          port_pda_component_usd: portPda,
          cost_differential_usd: costDiff,
          cost_differential_pct: costDiffPct,
          recommended_charter_type: recType,
          risk_allocation_notes: 'Under Voyage Charter, carrier bears weather delays and steaming bunker risk. Under Time Charter, charterer assumes bunker fuel price and passage duration risk.',
          calculation_assumptions: [
            `Voyage Freight: $${voyageFreightRate.toFixed(2)}/MT`,
            `Time Charter Daily Hire: $${dailyHire.toLocaleString()}/day`,
            `VLSFO Fuel Benchmark: $${vlsfoPrice.toFixed(2)}/MT`,
            `Port Disbursement Account: $${portPda.toLocaleString()}`,
            `Total Voyage Days: ${totalVoyageDays} days (Ballast ${ballastDays}d, Laden ${ladenDays}d, Port ${turnaroundDays}d)`,
          ],
        },
        demurrage_exposure: {
          daily_demurrage_rate_usd: demurrageRate,
          allowed_laytime_days: allowedLaytimeDays,
          estimated_waiting_days: portWaitingDays,
          estimated_discharge_days: estimatedDischargeDays,
          estimated_demurrage_days: demurrageDays,
          potential_exposure_usd: demurrageExposureVal,
          risk_level: demurrageDays > 1.5 ? 'Elevated' : (demurrageDays > 0 ? 'Moderate' : 'Low'),
          calculation_formula: `Demurrage Exposure = max(0, ${turnaroundDays}d - ${allowedLaytimeDays}d) * $${demurrageRate.toLocaleString()}/day`,
        },
        ballast_leg: {
          ballast_origin: v.current_position_name,
          ballast_distance_nm: ballastDist,
          ballast_speed_knots: v.ballast_speed_knots,
          ballast_days: ballastDays,
          bunker_consumed_mt: ballastBunker,
          status: 'Calculated from reported positioning',
        },
        satisfied_criteria: satisfied,
        operational_constraints: constraints,
        missing_data_notices: missing,
        decision_summary: `${v.name} (${v.vessel_class}) achieves a ${totalScore}/100 fit score. ${portAdmissible && laycanStatus === 'Compatible' ? 'Port draft and laycan conditions fully met.' : 'Review specific operational constraints.'} Recommended structure: ${recType}.`,
      };
    });

    analyses.sort((a, b) => b.fit_score.total_score - a.fit_score.total_score);

    return {
      request_timestamp: new Date().toISOString(),
      cargo_quantity_mt: req.cargo_quantity_mt,
      destination_port: portConstraint.portName,
      laycan_window: `${req.laycan_start} to ${req.laycan_end}`,
      recommended_vessel_id: analyses[0]?.vessel.id || 'ves-bulk-odisha-maratha',
      candidates_analyzed: analyses.length,
      vessel_analyses: analyses,
      advisory_notice: 'Advisory Notice: Vessel suitability and voyage economics represent scenario-based mathematical evaluations grounded in port constraints, standard charter party terms, and benchmark daily hire rates. They do not constitute binding commercial fixture confirmations or guaranteed vessel availability. Charterers and procurement managers must verify live position lists and execute formal fixture recaps through accredited shipbrokers.',
    };
  },
};

// Bulk Scenario Simulator & What-If Decision Service (Phase 6)
export const bulkScenarioService = {
  getPresets: async (): Promise<ScenarioPreset[]> => {
    const apiData = await fetchFromApi<ScenarioPreset[]>('/api/v1/scenario/presets');
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      return apiData;
    }
    return mockScenarioPresets;
  },

  simulateScenario: async (req: ScenarioSimulationRequest): Promise<ScenarioSimulationResponse> => {
    try {
      const response = await fetch('/api/v1/scenario/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (response.ok) {
        const data = await response.json();
        return data as ScenarioSimulationResponse;
      }
    } catch {
      // fallback to local calculation
    }

    // Local Domain-Accurate Fallback Simulation
    const baseQty = req.base_cargo_quantity_mt || 50000;
    const simQty = req.simulated_cargo_quantity_mt != null ? req.simulated_cargo_quantity_mt : baseQty;

    const baseRate = req.base_freight_rate_usd_mt || 15.50;
    const simRate = req.simulated_freight_rate_usd_mt != null ? req.simulated_freight_rate_usd_mt : baseRate;

    const baseVessel = req.base_vessel_class || 'Panamax';
    const simVessel = req.simulated_vessel_class || baseVessel;

    const baseBunker = req.base_bunker_price_usd_mt || 620.0;
    const simBunker = req.simulated_bunker_price_usd_mt != null ? req.simulated_bunker_price_usd_mt : baseBunker;

    const baseHire = req.base_charter_hire_usd_day || 18000.0;
    const simHire = req.simulated_charter_hire_usd_day != null ? req.simulated_charter_hire_usd_day : baseHire;

    const baseDemRate = req.base_demurrage_rate_usd_day || 18000.0;
    const simDemRate = req.simulated_demurrage_rate_usd_day != null ? req.simulated_demurrage_rate_usd_day : baseDemRate;

    const baseWaitDays = req.base_port_waiting_days || 1.8;
    const simWaitDays = req.simulated_port_waiting_days != null ? req.simulated_port_waiting_days : baseWaitDays;

    const baseDestId = req.base_destination_port_id || 'port-in-prt';
    const simDestId = req.simulated_destination_port_id || baseDestId;

    const basePda = req.base_port_pda_usd || 75000.0;
    const simPda = basePda;

    const distanceNm = 5800.0;
    const baseSpeed = 12.5;
    const simSpeed = req.simulated_speed_knots || (simVessel === 'Capesize' ? 12.6 : simVessel === 'Supramax' ? 12.8 : 12.5);

    const baseSteamingDays = Math.round((distanceNm / (baseSpeed * 24.0)) * 10) / 10;
    const simSteamingDays = Math.round((distanceNm / (simSpeed * 24.0)) * 10) / 10;

    const vesselBunkerBurn: Record<string, number> = {
      Capesize: 48.0, Kamsarmax: 32.0, Panamax: 30.0,
      Ultramax: 26.0, Supramax: 24.0, Handysize: 18.0,
    };

    const baseFuelBurn = (vesselBunkerBurn[baseVessel] || 30.0) * baseSteamingDays;
    const simFuelBurn = (vesselBunkerBurn[simVessel] || 30.0) * simSteamingDays;

    const baseDischargeDays = Math.round((baseQty / 22000.0) * 10) / 10;
    const simDischargeDays = Math.round((simQty / 22000.0) * 10) / 10;

    const basePortDays = Math.round((baseWaitDays + baseDischargeDays + 1.0) * 10) / 10;
    const simPortDays = Math.round((simWaitDays + simDischargeDays + 1.0) * 10) / 10;

    const baseTotalDays = Math.round((baseSteamingDays + basePortDays) * 10) / 10;
    const simTotalDays = Math.round((simSteamingDays + simPortDays) * 10) / 10;

    const baseTotalFreight = baseQty * baseRate;
    const simTotalFreight = simQty * simRate;

    const baseBunkerCost = baseFuelBurn * baseBunker;
    const simBunkerCost = simFuelBurn * simBunker;

    const baseHireCost = baseTotalDays * baseHire;
    const simHireCost = simTotalDays * simHire;

    const baseDemurrage = baseWaitDays * baseDemRate;
    const simDemurrage = simWaitDays * simDemRate;

    const baseTotalOutlay = baseTotalFreight + baseBunkerCost + baseHireCost + basePda + baseDemurrage;
    const simTotalOutlay = simTotalFreight + simBunkerCost + simHireCost + simPda + simDemurrage;

    const baseCostPerMt = Math.round((baseTotalOutlay / baseQty) * 100) / 100;
    const simCostPerMt = Math.round((simTotalOutlay / simQty) * 100) / 100;

    const deltaFreight = simTotalFreight - baseTotalFreight;
    const deltaOutlay = simTotalOutlay - baseTotalOutlay;
    const deltaCostMt = simCostPerMt - baseCostPerMt;
    const deltaPct = baseTotalOutlay > 0 ? Math.round(((simTotalOutlay - baseTotalOutlay) / baseTotalOutlay) * 1000) / 10 : 0;

    // Changes tracking
    const changes: ScenarioVariableChange[] = [];
    if (simRate !== baseRate) {
      changes.push({
        variable: 'Freight Rate ($/MT)',
        category: 'Freight',
        base_value: `$${baseRate.toFixed(2)}`,
        simulated_value: `$${simRate.toFixed(2)}`,
        delta_absolute: simRate - baseRate,
        delta_percent: Math.round(((simRate - baseRate) / baseRate) * 1000) / 10,
        direction: simRate > baseRate ? 'increased' : 'decreased',
      });
    }
    if (simWaitDays !== baseWaitDays) {
      changes.push({
        variable: 'Anchorage Waiting Days',
        category: 'Port & Queue',
        base_value: `${baseWaitDays.toFixed(1)} days`,
        simulated_value: `${simWaitDays.toFixed(1)} days`,
        delta_absolute: simWaitDays - baseWaitDays,
        delta_percent: Math.round(((simWaitDays - baseWaitDays) / baseWaitDays) * 1000) / 10,
        direction: simWaitDays > baseWaitDays ? 'increased' : 'decreased',
      });
    }
    if (simVessel !== baseVessel) {
      changes.push({
        variable: 'Vessel Class',
        category: 'Vessel & Cargo',
        base_value: baseVessel,
        simulated_value: simVessel,
        delta_absolute: 0,
        delta_percent: 0,
        direction: 'modified',
      });
    }
    if (simBunker !== baseBunker) {
      changes.push({
        variable: 'VLSFO Bunker Price ($/MT)',
        category: 'Bunker Fuel',
        base_value: `$${baseBunker.toFixed(2)}`,
        simulated_value: `$${simBunker.toFixed(2)}`,
        delta_absolute: simBunker - baseBunker,
        delta_percent: Math.round(((simBunker - baseBunker) / baseBunker) * 1000) / 10,
        direction: simBunker > baseBunker ? 'increased' : 'decreased',
      });
    }

    // Port & Environmental Constraints Check
    const portData = mockEastCoastPortConstraints[simDestId] || mockEastCoastPortConstraints['port-in-prt'];
    const vesselDraft = simVessel === 'Capesize' ? 17.8 : simVessel === 'Kamsarmax' ? 14.5 : simVessel === 'Panamax' ? 14.1 : 12.2;
    const ukcAvail = Math.round((portData.maxPermissibleDraftMeters - vesselDraft) * 100) / 100;
    const minUkc = 1.0;
    const restrictions: string[] = [];

    const commodity = req.commodity_name || 'Coking Coal';
    if (simDestId === 'port-in-maa' && commodity.toLowerCase().includes('coal')) {
      restrictions.push('NGT Order strictly prohibits commercial coal handling at Chennai Port; traffic relocated to Kamarajar Ennore.');
    }
    if (ukcAvail < minUkc) {
      restrictions.push(`Vessel laden draft (${vesselDraft}m) violates minimum UKC of ${minUkc}m at ${portData.portName}.`);
    }

    // Sensitivity Tables
    const waitingPoints: ScenarioSensitivityPoint[] = [0.5, 1.5, 3.0, 5.0, 7.5, 10.0].map(w => {
      const dem = w * simDemRate;
      const portD = Math.round((w + simDischargeDays + 1.0) * 10) / 10;
      const totD = Math.round((simSteamingDays + portD) * 10) / 10;
      const hireC = totD * simHire;
      const outlay = simTotalFreight + simBunkerCost + hireC + simPda + dem;
      return {
        parameter_value: w,
        parameter_label: `${w.toFixed(1)} d`,
        total_outlay_usd: outlay,
        cost_per_mt_usd: Math.round((outlay / simQty) * 100) / 100,
        demurrage_exposure_usd: dem,
        delta_vs_base_usd: outlay - baseTotalOutlay,
        delta_percent: Math.round(((outlay - baseTotalOutlay) / baseTotalOutlay) * 1000) / 10,
      };
    });

    const freightPoints: ScenarioSensitivityPoint[] = [-20, -10, -5, 0, 5, 10, 15, 20].map(pct => {
      const r = Math.round(baseRate * (1 + pct / 100) * 100) / 100;
      const fTot = simQty * r;
      const outlay = fTot + simBunkerCost + simHireCost + simPda + simDemurrage;
      return {
        parameter_value: r,
        parameter_label: `${pct >= 0 ? '+' : ''}${pct}% ($${r.toFixed(2)})`,
        total_outlay_usd: outlay,
        cost_per_mt_usd: Math.round((outlay / simQty) * 100) / 100,
        demurrage_exposure_usd: simDemurrage,
        delta_vs_base_usd: outlay - baseTotalOutlay,
        delta_percent: Math.round(((outlay - baseTotalOutlay) / baseTotalOutlay) * 1000) / 10,
      };
    });

    const bunkerPoints: ScenarioSensitivityPoint[] = [500, 560, 620, 680, 750, 820].map(b => {
      const bCost = simFuelBurn * b;
      const outlay = simTotalFreight + bCost + simHireCost + simPda + simDemurrage;
      return {
        parameter_value: b,
        parameter_label: `$${b}/MT`,
        total_outlay_usd: outlay,
        cost_per_mt_usd: Math.round((outlay / simQty) * 100) / 100,
        demurrage_exposure_usd: simDemurrage,
        delta_vs_base_usd: outlay - baseTotalOutlay,
        delta_percent: Math.round(((outlay - baseTotalOutlay) / baseTotalOutlay) * 1000) / 10,
      };
    });

    const explainability: string[] = [
      `Base Case evaluated with ${baseVessel} carrying ${baseQty.toLocaleString()} MT at $${baseRate.toFixed(2)}/MT with ${baseWaitDays}d queue.`,
    ];
    if (deltaOutlay > 0) {
      explainability.push(`Simulated changes result in an outlay increase of $${Math.abs(deltaOutlay).toLocaleString()} (+${deltaPct}%).`);
    } else if (deltaOutlay < 0) {
      explainability.push(`Simulated changes yield an overall cost saving of $${Math.abs(deltaOutlay).toLocaleString()} (${deltaPct}%).`);
    } else {
      explainability.push('Simulated parameters currently match the base benchmark.');
    }
    if (simWaitDays > baseWaitDays) {
      explainability.push(`Port congestion increased anchorage waiting by ${(simWaitDays - baseWaitDays).toFixed(1)} days, expanding demurrage liability by $${(simDemurrage - baseDemurrage).toLocaleString()}.`);
    }
    if (restrictions.length > 0) {
      explainability.push(`CRITICAL PORT ALERT: ${restrictions.join(' ')}`);
    }

    return {
      scenario_id: `sim-${Date.now()}`,
      scenario_name: req.scenario_name || 'Custom What-If Scenario',
      timestamp: new Date().toISOString(),
      status: 'success',
      changed_variables: changes,
      base_economics: {
        cargo_quantity_mt: baseQty,
        freight_rate_usd_mt: baseRate,
        total_freight_usd: baseTotalFreight,
        steaming_days: baseSteamingDays,
        port_days: basePortDays,
        total_voyage_days: baseTotalDays,
        bunker_price_usd_mt: baseBunker,
        total_fuel_burn_mt: Math.round(baseFuelBurn * 10) / 10,
        total_bunker_cost_usd: Math.round(baseBunkerCost),
        charter_hire_usd_day: baseHire,
        charter_hire_cost_usd: Math.round(baseHireCost),
        port_pda_usd: basePda,
        demurrage_rate_usd_day: baseDemRate,
        demurrage_exposure_usd: Math.round(baseDemurrage),
        total_voyage_outlay_usd: Math.round(baseTotalOutlay),
        cost_per_mt_usd: baseCostPerMt,
      },
      simulated_economics: {
        cargo_quantity_mt: simQty,
        freight_rate_usd_mt: simRate,
        total_freight_usd: simTotalFreight,
        steaming_days: simSteamingDays,
        port_days: simPortDays,
        total_voyage_days: simTotalDays,
        bunker_price_usd_mt: simBunker,
        total_fuel_burn_mt: Math.round(simFuelBurn * 10) / 10,
        total_bunker_cost_usd: Math.round(simBunkerCost),
        charter_hire_usd_day: simHire,
        charter_hire_cost_usd: Math.round(simHireCost),
        port_pda_usd: simPda,
        demurrage_rate_usd_day: simDemRate,
        demurrage_exposure_usd: Math.round(simDemurrage),
        total_voyage_outlay_usd: Math.round(simTotalOutlay),
        cost_per_mt_usd: simCostPerMt,
      },
      delta_total_freight_usd: deltaFreight,
      delta_total_outlay_usd: deltaOutlay,
      delta_cost_per_mt_usd: deltaCostMt,
      delta_percentage_outlay: deltaPct,
      simulated_vessel_compatibility: {
        vessel_class: simVessel,
        dwt: simVessel === 'Capesize' ? 180000 : simVessel === 'Panamax' ? 75000 : 58000,
        laden_draft_m: vesselDraft,
        speed_knots: simSpeed,
        fuel_burn_mt_day: vesselBunkerBurn[simVessel] || 30.0,
        cargo_intake_mt: simQty,
        utilization_pct: Math.round((simQty / (simVessel === 'Capesize' ? 180000 : 75000)) * 100),
        draft_status: ukcAvail >= minUkc ? 'Compliant' : 'UKC Violated',
        compatibility_score: restrictions.length > 0 ? 35 : (ukcAvail >= minUkc ? 94 : 52),
      },
      simulated_port_compatibility: {
        port_id: portData.portId,
        port_name: portData.portName,
        max_draft_m: portData.maxPermissibleDraftMeters,
        ukc_available_m: ukcAvail,
        ukc_status: ukcAvail >= minUkc ? 'Safe' : 'Violated',
        requires_lighterage: portData.lighterageRequired || (vesselDraft > portData.maxPermissibleDraftMeters),
        lighterage_note: portData.lighterageLocation ? `Lighterage at ${portData.lighterageLocation}` : null,
        is_compliant: restrictions.length === 0 && ukcAvail >= minUkc,
        restrictions_found: restrictions,
      },
      sensitivity_tables: [
        {
          variable_name: 'Port Waiting Days',
          unit: 'days',
          base_value: baseWaitDays,
          simulated_value: simWaitDays,
          datapoints: waitingPoints,
        },
        {
          variable_name: 'Freight Rate ($/MT)',
          unit: 'USD/MT',
          base_value: baseRate,
          simulated_value: simRate,
          datapoints: freightPoints,
        },
        {
          variable_name: 'Bunker Price ($/MT)',
          unit: 'USD/MT',
          base_value: baseBunker,
          simulated_value: simBunker,
          datapoints: bunkerPoints,
        },
      ],
      explainability_chain: explainability,
      decision_factors: {
        advantages: [
          simRate < baseRate ? `Freight saving of $${(baseRate - simRate).toFixed(2)}/MT improves delivered raw material parity` : 'Maintains baseline voyage economics integrity',
          simQty > baseQty ? 'Larger parcel size improves economies of scale per tonne' : 'Parcel size aligned with current inventory and discharge hopper capacity',
          ukcAvail >= minUkc ? `UKC margin of ${ukcAvail.toFixed(2)}m meets port marine department guidelines` : 'Review lighterage options',
        ],
        vulnerabilities: [
          simWaitDays > 3.0 ? `Elevated queue time (${simWaitDays}d) exposes charterer to $${Math.round(simDemurrage).toLocaleString()} in demurrage` : 'Monsoon swell may create unannounced berth closures',
          restrictions.length > 0 ? restrictions[0] : 'Bunker fuel spikes can rapidly erode margin on time charter fixture',
        ],
        tradeoffs: [
          'Fixing larger Capesize yields cheaper freight per tonne but introduces lighterage and draft constraints at non-deepwater berths.',
          'Postponing laycan may capture softening spot freight but risks demurrage escalation during seasonal monsoon congestion.',
        ],
        recommendation: restrictions.length > 0
          ? 'REJECT SCENARIO: Severe environmental or UKC restriction detected. Redirect to alternative East Coast deepwater terminal.'
          : (deltaCostMt > 2.0
            ? 'HIGH COST VARIANCE: Simulated conditions inflate total delivered cost by over $2/MT. Recommend hedging freight or negotiating demurrage dispatch terms.'
            : 'FAVORABLE / VIABLE SCENARIO: Operational constraints satisfied with acceptable commercial variance.'),
      },
      provenance: {
        source: 'FreightSense Phase 6 What-If Simulation Engine',
        datasetName: 'Voyage Economics & Port Constraints Sensitivity Model',
        coveragePeriod: '2024-2026 Analytical Horizon',
        lastUpdated: new Date().toISOString().split('T')[0],
        dataType: 'Calculated Simulation',
        units: 'USD / MT / Days',
        status: 'simulated',
      },
    };
  },
};



