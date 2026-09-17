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
