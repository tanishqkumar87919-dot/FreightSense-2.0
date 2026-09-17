export interface DatasetField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'badge';
}

export interface DatasetInfo {
  id: string;
  name: string;
  category: string;
  recordsCount: number;
  lastUpdated: string;
  source: string;
  coverage: string;
  description: string;
  fields: DatasetField[];
  rows: Record<string, any>[];
}

export const mockDatasets: Record<string, DatasetInfo> = {
  'freight-rates': {
    id: 'freight-rates',
    name: 'Global Container Freight Benchmark Index (Daily)',
    category: 'Market Intelligence',
    recordsCount: 1420,
    lastUpdated: '2026-09-14 18:00 UTC',
    source: 'Freightos Baltic Index & Shanghai Shipping Exchange',
    coverage: '12 Global Mainlanes (2020 - Present)',
    description: 'Standardized 40ft container spot rates including bunker surcharges and terminal handling fees.',
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'corridor', label: 'Corridor', type: 'string' },
      { key: 'origin', label: 'Origin Port', type: 'string' },
      { key: 'destination', label: 'Destination Port', type: 'string' },
      { key: 'spotRateUsd', label: 'Rate (USD/FEU)', type: 'number' },
      { key: 'weeklyChange', label: 'Weekly Change (%)', type: 'number' },
      { key: 'capacityStatus', label: 'Space Status', type: 'badge' },
    ],
    rows: [
      { id: '1', date: '2026-09-14', corridor: 'Transpacific Eastbound', origin: 'Shanghai', destination: 'Los Angeles', spotRateUsd: 4890, weeklyChange: 4.49, capacityStatus: 'Tight' },
      { id: '2', date: '2026-09-14', corridor: 'Asia - North Europe', origin: 'Shanghai', destination: 'Rotterdam', spotRateUsd: 4180, weeklyChange: -1.99, capacityStatus: 'Balanced' },
      { id: '3', date: '2026-09-14', corridor: 'Asia - Mediterranean', origin: 'Ningbo', destination: 'Genoa', spotRateUsd: 4420, weeklyChange: 1.20, capacityStatus: 'Tight' },
      { id: '4', date: '2026-09-14', corridor: 'Transatlantic Westbound', origin: 'Rotterdam', destination: 'New York', spotRateUsd: 1980, weeklyChange: 1.54, capacityStatus: 'Normal' },
      { id: '5', date: '2026-09-14', corridor: 'Asia - Middle East', origin: 'Singapore', destination: 'Jebel Ali', spotRateUsd: 2350, weeklyChange: -3.80, capacityStatus: 'Surplus' },
      { id: '6', date: '2026-09-14', corridor: 'Asia - South America', origin: 'Shanghai', destination: 'Santos', spotRateUsd: 5850, weeklyChange: 6.20, capacityStatus: 'Severe' },
      { id: '7', date: '2026-09-07', corridor: 'Transpacific Eastbound', origin: 'Shanghai', destination: 'Los Angeles', spotRateUsd: 4680, weeklyChange: 2.10, capacityStatus: 'Tight' },
      { id: '8', date: '2026-09-07', corridor: 'Asia - North Europe', origin: 'Shanghai', destination: 'Rotterdam', spotRateUsd: 4265, weeklyChange: -1.05, capacityStatus: 'Balanced' },
      { id: '9', date: '2026-09-07', corridor: 'Transatlantic Westbound', origin: 'Rotterdam', destination: 'New York', spotRateUsd: 1950, weeklyChange: 0.80, capacityStatus: 'Normal' },
      { id: '10', date: '2026-09-07', corridor: 'Asia - South America', origin: 'Shanghai', destination: 'Santos', spotRateUsd: 5510, weeklyChange: 4.30, capacityStatus: 'Severe' },
    ],
  },
  'port-congestion': {
    id: 'port-congestion',
    name: 'Port Operational Congestion & Dwell Telemetry',
    category: 'Port Intelligence',
    recordsCount: 840,
    lastUpdated: '2026-09-14 12:00 UTC',
    source: 'Port Terminal Operating Systems (TOS) & Terrestrial AIS',
    coverage: 'Top 30 Global Container Gateways',
    description: 'Vessel anchorage queue times, container yard dwell, and berth productivity.',
    fields: [
      { key: 'port', label: 'Port Name', type: 'string' },
      { key: 'country', label: 'Country', type: 'string' },
      { key: 'waitingVessels', label: 'Anchored Vessels', type: 'number' },
      { key: 'dwellDays', label: 'Average Dwell (Days)', type: 'number' },
      { key: 'berthUtilization', label: 'Berth Util (%)', type: 'number' },
      { key: 'congestionScore', label: 'Congestion Score', type: 'number' },
      { key: 'status', label: 'Operational Risk', type: 'badge' },
    ],
    rows: [
      { id: 'p1', port: 'Singapore', country: 'Singapore', waitingVessels: 56, dwellDays: 4.6, berthUtilization: 94, congestionScore: 82, status: 'High' },
      { id: 'p2', port: 'Shanghai (Yangshan)', country: 'China', waitingVessels: 34, dwellDays: 3.2, berthUtilization: 88, congestionScore: 68, status: 'Moderate' },
      { id: 'p3', port: 'Los Angeles / Long Beach', country: 'USA', waitingVessels: 18, dwellDays: 3.8, berthUtilization: 86, congestionScore: 64, status: 'Moderate' },
      { id: 'p4', port: 'Rotterdam', country: 'Netherlands', waitingVessels: 14, dwellDays: 2.8, berthUtilization: 78, congestionScore: 52, status: 'Low' },
      { id: 'p5', port: 'Jebel Ali (Dubai)', country: 'UAE', waitingVessels: 8, dwellDays: 2.4, berthUtilization: 74, congestionScore: 44, status: 'Low' },
      { id: 'p6', port: 'Santos', country: 'Brazil', waitingVessels: 29, dwellDays: 5.1, berthUtilization: 96, congestionScore: 89, status: 'Severe' },
      { id: 'p7', port: 'Antwerp-Bruges', country: 'Belgium', waitingVessels: 16, dwellDays: 3.1, berthUtilization: 82, congestionScore: 61, status: 'Moderate' },
      { id: 'p8', port: 'Busan', country: 'South Korea', waitingVessels: 12, dwellDays: 2.6, berthUtilization: 79, congestionScore: 49, status: 'Low' },
    ],
  },
  'vessel-tracking': {
    id: 'vessel-tracking',
    name: 'Commercial Container Fleet AIS Movement Telemetry',
    category: 'Vessel Intelligence',
    recordsCount: 3820,
    lastUpdated: '2026-09-14 20:30 UTC',
    source: 'Satellite & Terrestrial AIS Constellation',
    coverage: 'Global Containerships > 10,000 TEU',
    description: 'Current vessel positioning, heading, operational speed, route association, and ETA variance.',
    fields: [
      { key: 'vesselName', label: 'Vessel Name', type: 'string' },
      { key: 'imo', label: 'IMO Number', type: 'string' },
      { key: 'carrier', label: 'Carrier Line', type: 'string' },
      { key: 'capacityTeu', label: 'Capacity (TEU)', type: 'number' },
      { key: 'speedKnots', label: 'Speed (knots)', type: 'number' },
      { key: 'destination', label: 'Destination', type: 'string' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    rows: [
      { id: 'v1', vesselName: 'MSC Irina', imo: '9929429', carrier: 'MSC', capacityTeu: 24346, speedKnots: 17.8, destination: 'Rotterdam', status: 'At Sea' },
      { id: 'v2', vesselName: 'Madrid Maersk', imo: '9778791', carrier: 'Maersk', capacityTeu: 20568, speedKnots: 18.4, destination: 'Los Angeles', status: 'At Sea' },
      { id: 'v3', vesselName: 'CMA CGM Palais Royal', imo: '9839181', carrier: 'CMA CGM', capacityTeu: 23112, speedKnots: 0.1, destination: 'Hamburg', status: 'At Port' },
      { id: 'v4', vesselName: 'Ever Given', imo: '9811000', carrier: 'Evergreen', capacityTeu: 20124, speedKnots: 15.6, destination: 'New York', status: 'At Sea' },
      { id: 'v5', vesselName: 'COSCO Shipping Universe', imo: '9795610', carrier: 'COSCO', capacityTeu: 21237, speedKnots: 0.0, destination: 'Jebel Ali', status: 'Anchored' },
      { id: 'v6', vesselName: 'ONE Apus', imo: '9806079', carrier: 'ONE', capacityTeu: 14052, speedKnots: 11.2, destination: 'Oakland', status: 'Delayed' },
    ],
  },
};
