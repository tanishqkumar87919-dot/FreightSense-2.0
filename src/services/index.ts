import { mockFreightIndices, mockMarketDrivers, mockRegionalRates } from '@/data/marketData';
import { mockRoutes } from '@/data/routeData';
import { mockPorts } from '@/data/portData';
import { mockVessels } from '@/data/vesselData';
import { mockWeatherHazards } from '@/data/weatherData';
import { mockTradeFlows } from '@/data/tradeFlowData';
import { mockMarketSignals, mockSignalRelationships } from '@/data/signalData';
import { mockRouteForecasts, mockForecastModelInfo, mockForecastContributingFactors } from '@/data/forecastData';
import { mockAIInsights } from '@/data/insightData';
import { mockAlerts } from '@/data/alertData';
import { mockReports } from '@/data/reportData';
import { mockNotifications } from '@/data/notificationData';
import { mockDatasets } from '@/data/datasetData';
import { mockDocArticles, mockDocCategories } from '@/data/docsData';
import { ScenarioParameters, ScenarioResult, FreightMarketIndex, RouteItem, PortItem, AIInsight } from '@/types';
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
        horizon: apiForecast.horizon,
        expectedRateUsd: apiForecast.expectedRateUsd,
        expectedChangePercent: apiForecast.expectedChangePercent,
        trend: apiForecast.trend as 'up' | 'down' | 'stable',
        confidencePercent: apiForecast.confidencePercent,
        riskScore: apiForecast.riskScore,
        series: apiForecast.series,
        modelVersion: apiForecast.model_version,
        generatedAt: apiForecast.generated_at,
        sourceFreshness: apiForecast.source_freshness || 'REAL BACKEND DATA (FastAPI Live)',
        isRealBackendData: true,
      };
    }
    const routeForecasts = mockRouteForecasts[routeId] || mockRouteForecasts['route-sha-rot'];
    const fallback = routeForecasts[horizon] || routeForecasts['30D'];
    return {
      ...fallback,
      modelVersion: 'Baseline Demo Fixture',
      sourceFreshness: 'DEMO / FALLBACK DATA (FastAPI Standby)',
      isRealBackendData: false,
    };
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
