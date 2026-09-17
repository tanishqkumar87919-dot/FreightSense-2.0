export interface ForecastHorizonData {
  horizon: '7D' | '14D' | '30D' | '60D' | '90D';
  expectedRateUsd: number;
  expectedChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  confidencePercent: number;
  riskScore: number;
  series: {
    date: string;
    actual?: number;
    forecast?: number;
    upperBound?: number;
    lowerBound?: number;
  }[];
}

export const mockForecastModelInfo = {
  version: 'Ensemble-M3 (Prophet-LSTM-GraphTransformer v2.4)',
  lastTrained: '2026-09-14 04:00 UTC',
  trainingPeriod: '2019 - Present (18M maritime data points)',
  evaluationMetrics: {
    mape: '3.62%',
    rmse: '$114.50',
    directionalAccuracy: '91.8%',
  },
  status: 'Production Validated (Calibrated)',
};

export const mockForecastContributingFactors = [
  { name: 'Red Sea Routing & Cape Transit Time', impactScore: '+38%', sentiment: 'bullish', description: 'Continued rerouting absorbing 12-14% of global container slots.' },
  { name: 'US Retailer Inventory Re-stocking', impactScore: '+24%', sentiment: 'bullish', description: 'Robust consumer spending sustaining high booking volume.' },
  { name: 'Newbuild Containership Deliveries', impactScore: '-19%', sentiment: 'bearish', description: '240k TEU of new capacity scheduled for Q4 delivery.' },
  { name: 'Transshipment Hub Dwell at Singapore', impactScore: '+12%', sentiment: 'bullish', description: 'Congestion delaying feeder connections and empty container repositioning.' },
  { name: 'Bunker Fuel Price Volatility', impactScore: '+7%', sentiment: 'bullish', description: 'VLSFO stable around $615/mt providing a cost floor.' },
];

export const mockRouteForecasts: Record<string, Record<'7D' | '14D' | '30D' | '60D' | '90D', ForecastHorizonData>> = {
  'route-sha-rot': {
    '7D': {
      horizon: '7D',
      expectedRateUsd: 4120,
      expectedChangePercent: -1.44,
      trend: 'down',
      confidencePercent: 96,
      riskScore: 68,
      series: [
        { date: 'Aug 25', actual: 4350 },
        { date: 'Sep 01', actual: 4265 },
        { date: 'Sep 08', actual: 4210 },
        { date: 'Sep 14', actual: 4180 },
        { date: 'Sep 17', forecast: 4150, upperBound: 4220, lowerBound: 4080 },
        { date: 'Sep 21', forecast: 4120, upperBound: 4210, lowerBound: 4030 },
      ],
    },
    '14D': {
      horizon: '14D',
      expectedRateUsd: 4050,
      expectedChangePercent: -3.11,
      trend: 'down',
      confidencePercent: 93,
      riskScore: 71,
      series: [
        { date: 'Aug 25', actual: 4350 },
        { date: 'Sep 01', actual: 4265 },
        { date: 'Sep 08', actual: 4210 },
        { date: 'Sep 14', actual: 4180 },
        { date: 'Sep 21', forecast: 4120, upperBound: 4230, lowerBound: 4010 },
        { date: 'Sep 28', forecast: 4050, upperBound: 4190, lowerBound: 3910 },
      ],
    },
    '30D': {
      horizon: '30D',
      expectedRateUsd: 3890,
      expectedChangePercent: -6.94,
      trend: 'down',
      confidencePercent: 88,
      riskScore: 74,
      series: [
        { date: 'Aug 01', actual: 4380 },
        { date: 'Aug 15', actual: 4310 },
        { date: 'Sep 01', actual: 4265 },
        { date: 'Sep 14', actual: 4180 },
        { date: 'Sep 28', forecast: 4050, upperBound: 4210, lowerBound: 3890 },
        { date: 'Oct 14', forecast: 3890, upperBound: 4120, lowerBound: 3660 },
      ],
    },
    '60D': {
      horizon: '60D',
      expectedRateUsd: 3620,
      expectedChangePercent: -13.40,
      trend: 'down',
      confidencePercent: 82,
      riskScore: 76,
      series: [
        { date: 'Jul 15', actual: 4450 },
        { date: 'Aug 15', actual: 4310 },
        { date: 'Sep 14', actual: 4180 },
        { date: 'Oct 15', forecast: 3880, upperBound: 4190, lowerBound: 3570 },
        { date: 'Nov 14', forecast: 3620, upperBound: 4010, lowerBound: 3230 },
      ],
    },
    '90D': {
      horizon: '90D',
      expectedRateUsd: 3450,
      expectedChangePercent: -17.46,
      trend: 'down',
      confidencePercent: 76,
      riskScore: 79,
      series: [
        { date: 'Jun 15', actual: 4320 },
        { date: 'Jul 15', actual: 4450 },
        { date: 'Aug 15', actual: 4310 },
        { date: 'Sep 14', actual: 4180 },
        { date: 'Oct 15', forecast: 3880, upperBound: 4220, lowerBound: 3540 },
        { date: 'Nov 15', forecast: 3620, upperBound: 4050, lowerBound: 3190 },
        { date: 'Dec 14', forecast: 3450, upperBound: 3950, lowerBound: 2950 },
      ],
    },
  },
  'route-szx-lax': {
    '7D': {
      horizon: '7D',
      expectedRateUsd: 4980,
      expectedChangePercent: 1.84,
      trend: 'up',
      confidencePercent: 95,
      riskScore: 56,
      series: [
        { date: 'Aug 25', actual: 4720 },
        { date: 'Sep 01', actual: 4780 },
        { date: 'Sep 08', actual: 4830 },
        { date: 'Sep 14', actual: 4890 },
        { date: 'Sep 17', forecast: 4935, upperBound: 5010, lowerBound: 4860 },
        { date: 'Sep 21', forecast: 4980, upperBound: 5090, lowerBound: 4870 },
      ],
    },
    '14D': {
      horizon: '14D',
      expectedRateUsd: 5080,
      expectedChangePercent: 3.88,
      trend: 'up',
      confidencePercent: 92,
      riskScore: 59,
      series: [
        { date: 'Aug 25', actual: 4720 },
        { date: 'Sep 01', actual: 4780 },
        { date: 'Sep 08', actual: 4830 },
        { date: 'Sep 14', actual: 4890 },
        { date: 'Sep 21', forecast: 4980, upperBound: 5120, lowerBound: 4840 },
        { date: 'Sep 28', forecast: 5080, upperBound: 5260, lowerBound: 4900 },
      ],
    },
    '30D': {
      horizon: '30D',
      expectedRateUsd: 5240,
      expectedChangePercent: 7.16,
      trend: 'up',
      confidencePercent: 86,
      riskScore: 62,
      series: [
        { date: 'Aug 01', actual: 4580 },
        { date: 'Aug 15', actual: 4690 },
        { date: 'Sep 01', actual: 4780 },
        { date: 'Sep 14', actual: 4890 },
        { date: 'Sep 28', forecast: 5080, upperBound: 5290, lowerBound: 4870 },
        { date: 'Oct 14', forecast: 5240, upperBound: 5510, lowerBound: 4970 },
      ],
    },
    '60D': {
      horizon: '60D',
      expectedRateUsd: 4800,
      expectedChangePercent: -1.84,
      trend: 'down',
      confidencePercent: 80,
      riskScore: 65,
      series: [
        { date: 'Jul 15', actual: 4620 },
        { date: 'Aug 15', actual: 4690 },
        { date: 'Sep 14', actual: 4890 },
        { date: 'Oct 15', forecast: 5240, upperBound: 5540, lowerBound: 4940 },
        { date: 'Nov 14', forecast: 4800, upperBound: 5200, lowerBound: 4400 },
      ],
    },
    '90D': {
      horizon: '90D',
      expectedRateUsd: 4350,
      expectedChangePercent: -11.04,
      trend: 'down',
      confidencePercent: 74,
      riskScore: 67,
      series: [
        { date: 'Jun 15', actual: 4400 },
        { date: 'Jul 15', actual: 4620 },
        { date: 'Aug 15', actual: 4690 },
        { date: 'Sep 14', actual: 4890 },
        { date: 'Oct 15', forecast: 5240, upperBound: 5580, lowerBound: 4900 },
        { date: 'Nov 15', forecast: 4800, upperBound: 5250, lowerBound: 4350 },
        { date: 'Dec 14', forecast: 4350, upperBound: 4850, lowerBound: 3850 },
      ],
    },
  },
};
