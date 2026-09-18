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
  // ----------------------------------------------------------------------
  // EAST COAST INDIA BULK CORRIDORS (SIH PROBLEM STATEMENT)
  // ----------------------------------------------------------------------
  'route-aus-paradip': {
    '7D': {
      horizon: '7D',
      expectedRateUsd: 14.95,
      expectedChangePercent: 0.67,
      trend: 'up',
      confidencePercent: 95,
      riskScore: 32,
      series: [
        { date: 'Aug 25', actual: 14.65 },
        { date: 'Sep 01', actual: 14.72 },
        { date: 'Sep 08', actual: 14.80 },
        { date: 'Sep 14', actual: 14.85 },
        { date: 'Sep 17', forecast: 14.90, upperBound: 15.35, lowerBound: 14.45 },
        { date: 'Sep 21', forecast: 14.95, upperBound: 15.42, lowerBound: 14.48 },
      ],
    },
    '14D': {
      horizon: '14D',
      expectedRateUsd: 15.12,
      expectedChangePercent: 1.82,
      trend: 'up',
      confidencePercent: 95,
      riskScore: 34,
      series: [
        { date: 'Aug 25', actual: 14.65 },
        { date: 'Sep 01', actual: 14.72 },
        { date: 'Sep 08', actual: 14.80 },
        { date: 'Sep 14', actual: 14.85 },
        { date: 'Sep 21', forecast: 14.95, upperBound: 15.48, lowerBound: 14.42 },
        { date: 'Sep 28', forecast: 15.12, upperBound: 15.68, lowerBound: 14.56 },
      ],
    },
    '30D': {
      horizon: '30D',
      expectedRateUsd: 15.35,
      expectedChangePercent: 3.37,
      trend: 'up',
      confidencePercent: 92,
      riskScore: 36,
      series: [
        { date: 'Aug 01', actual: 14.50 },
        { date: 'Aug 15', actual: 14.62 },
        { date: 'Sep 01', actual: 14.72 },
        { date: 'Sep 14', actual: 14.85 },
        { date: 'Sep 28', forecast: 15.12, upperBound: 15.75, lowerBound: 14.50 },
        { date: 'Oct 14', forecast: 15.35, upperBound: 16.10, lowerBound: 14.60 },
      ],
    },
    '60D': {
      horizon: '60D',
      expectedRateUsd: 14.85,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 75,
      riskScore: 38,
      series: [
        { date: 'Jul 15', actual: 14.40 },
        { date: 'Aug 15', actual: 14.62 },
        { date: 'Sep 14', actual: 14.85 },
        { date: 'Oct 15', forecast: 15.35, upperBound: 16.20, lowerBound: 14.50 },
        { date: 'Nov 14', forecast: 14.85, upperBound: 16.50, lowerBound: 13.20 },
      ],
    },
    '90D': {
      horizon: '90D',
      expectedRateUsd: 14.85,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 68,
      riskScore: 40,
      series: [
        { date: 'Jun 15', actual: 14.30 },
        { date: 'Jul 15', actual: 14.40 },
        { date: 'Aug 15', actual: 14.62 },
        { date: 'Sep 14', actual: 14.85 },
        { date: 'Oct 15', forecast: 15.35, upperBound: 16.20, lowerBound: 14.50 },
        { date: 'Nov 15', forecast: 14.85, upperBound: 16.50, lowerBound: 13.20 },
        { date: 'Dec 14', forecast: 14.85, upperBound: 16.80, lowerBound: 12.90 },
      ],
    },
  },
  'route-indo-vizag': {
    '7D': {
      horizon: '7D',
      expectedRateUsd: 9.45,
      expectedChangePercent: 0.53,
      trend: 'stable',
      confidencePercent: 95,
      riskScore: 48,
      series: [
        { date: 'Aug 25', actual: 9.30 },
        { date: 'Sep 01', actual: 9.35 },
        { date: 'Sep 08', actual: 9.38 },
        { date: 'Sep 14', actual: 9.40 },
        { date: 'Sep 17', forecast: 9.42, upperBound: 9.75, lowerBound: 9.10 },
        { date: 'Sep 21', forecast: 9.45, upperBound: 9.80, lowerBound: 9.10 },
      ],
    },
    '14D': {
      horizon: '14D',
      expectedRateUsd: 9.55,
      expectedChangePercent: 1.60,
      trend: 'up',
      confidencePercent: 95,
      riskScore: 50,
      series: [
        { date: 'Aug 25', actual: 9.30 },
        { date: 'Sep 01', actual: 9.35 },
        { date: 'Sep 08', actual: 9.38 },
        { date: 'Sep 14', actual: 9.40 },
        { date: 'Sep 21', forecast: 9.45, upperBound: 9.82, lowerBound: 9.08 },
        { date: 'Sep 28', forecast: 9.55, upperBound: 9.98, lowerBound: 9.12 },
      ],
    },
    '30D': {
      horizon: '30D',
      expectedRateUsd: 9.70,
      expectedChangePercent: 3.19,
      trend: 'up',
      confidencePercent: 92,
      riskScore: 52,
      series: [
        { date: 'Aug 01', actual: 9.20 },
        { date: 'Aug 15', actual: 9.28 },
        { date: 'Sep 01', actual: 9.35 },
        { date: 'Sep 14', actual: 9.40 },
        { date: 'Sep 28', forecast: 9.55, upperBound: 10.02, lowerBound: 9.08 },
        { date: 'Oct 14', forecast: 9.70, upperBound: 10.25, lowerBound: 9.15 },
      ],
    },
    '60D': {
      horizon: '60D',
      expectedRateUsd: 9.40,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 75,
      riskScore: 52,
      series: [
        { date: 'Jul 15', actual: 9.15 },
        { date: 'Aug 15', actual: 9.28 },
        { date: 'Sep 14', actual: 9.40 },
        { date: 'Oct 15', forecast: 9.70, upperBound: 10.35, lowerBound: 9.05 },
        { date: 'Nov 14', forecast: 9.40, upperBound: 10.50, lowerBound: 8.30 },
      ],
    },
    '90D': {
      horizon: '90D',
      expectedRateUsd: 9.40,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 68,
      riskScore: 54,
      series: [
        { date: 'Jun 15', actual: 9.10 },
        { date: 'Jul 15', actual: 9.15 },
        { date: 'Aug 15', actual: 9.28 },
        { date: 'Sep 14', actual: 9.40 },
        { date: 'Oct 15', forecast: 9.70, upperBound: 10.35, lowerBound: 9.05 },
        { date: 'Nov 15', forecast: 9.40, upperBound: 10.50, lowerBound: 8.30 },
        { date: 'Dec 14', forecast: 9.40, upperBound: 10.70, lowerBound: 8.10 },
      ],
    },
  },
  'route-saf-haldia': {
    '7D': {
      horizon: '7D',
      expectedRateUsd: 16.30,
      expectedChangePercent: 0.62,
      trend: 'up',
      confidencePercent: 95,
      riskScore: 56,
      series: [
        { date: 'Aug 25', actual: 16.05 },
        { date: 'Sep 01', actual: 16.12 },
        { date: 'Sep 08', actual: 16.18 },
        { date: 'Sep 14', actual: 16.20 },
        { date: 'Sep 17', forecast: 16.25, upperBound: 16.75, lowerBound: 15.75 },
        { date: 'Sep 21', forecast: 16.30, upperBound: 16.82, lowerBound: 15.78 },
      ],
    },
    '14D': {
      horizon: '14D',
      expectedRateUsd: 16.48,
      expectedChangePercent: 1.73,
      trend: 'up',
      confidencePercent: 95,
      riskScore: 58,
      series: [
        { date: 'Aug 25', actual: 16.05 },
        { date: 'Sep 01', actual: 16.12 },
        { date: 'Sep 08', actual: 16.18 },
        { date: 'Sep 14', actual: 16.20 },
        { date: 'Sep 21', forecast: 16.30, upperBound: 16.88, lowerBound: 15.72 },
        { date: 'Sep 28', forecast: 16.48, upperBound: 17.12, lowerBound: 15.84 },
      ],
    },
    '30D': {
      horizon: '30D',
      expectedRateUsd: 16.75,
      expectedChangePercent: 3.40,
      trend: 'up',
      confidencePercent: 92,
      riskScore: 60,
      series: [
        { date: 'Aug 01', actual: 15.90 },
        { date: 'Aug 15', actual: 16.00 },
        { date: 'Sep 01', actual: 16.12 },
        { date: 'Sep 14', actual: 16.20 },
        { date: 'Sep 28', forecast: 16.48, upperBound: 17.20, lowerBound: 15.76 },
        { date: 'Oct 14', forecast: 16.75, upperBound: 17.60, lowerBound: 15.90 },
      ],
    },
    '60D': {
      horizon: '60D',
      expectedRateUsd: 16.20,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 75,
      riskScore: 60,
      series: [
        { date: 'Jul 15', actual: 15.80 },
        { date: 'Aug 15', actual: 16.00 },
        { date: 'Sep 14', actual: 16.20 },
        { date: 'Oct 15', forecast: 16.75, upperBound: 17.70, lowerBound: 15.80 },
        { date: 'Nov 14', forecast: 16.20, upperBound: 17.90, lowerBound: 14.50 },
      ],
    },
    '90D': {
      horizon: '90D',
      expectedRateUsd: 16.20,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 68,
      riskScore: 62,
      series: [
        { date: 'Jun 15', actual: 15.75 },
        { date: 'Jul 15', actual: 15.80 },
        { date: 'Aug 15', actual: 16.00 },
        { date: 'Sep 14', actual: 16.20 },
        { date: 'Oct 15', forecast: 16.75, upperBound: 17.70, lowerBound: 15.80 },
        { date: 'Nov 15', forecast: 16.20, upperBound: 17.90, lowerBound: 14.50 },
        { date: 'Dec 14', forecast: 16.20, upperBound: 18.20, lowerBound: 14.20 },
      ],
    },
  },
  'route-aus-vizag': {
    '7D': {
      horizon: '7D',
      expectedRateUsd: 11.80,
      expectedChangePercent: 0.43,
      trend: 'stable',
      confidencePercent: 95,
      riskScore: 35,
      series: [
        { date: 'Aug 25', actual: 11.65 },
        { date: 'Sep 01', actual: 11.70 },
        { date: 'Sep 08', actual: 11.72 },
        { date: 'Sep 14', actual: 11.75 },
        { date: 'Sep 17', forecast: 11.78, upperBound: 12.15, lowerBound: 11.41 },
        { date: 'Sep 21', forecast: 11.80, upperBound: 12.20, lowerBound: 11.40 },
      ],
    },
    '14D': {
      horizon: '14D',
      expectedRateUsd: 11.92,
      expectedChangePercent: 1.45,
      trend: 'up',
      confidencePercent: 95,
      riskScore: 37,
      series: [
        { date: 'Aug 25', actual: 11.65 },
        { date: 'Sep 01', actual: 11.70 },
        { date: 'Sep 08', actual: 11.72 },
        { date: 'Sep 14', actual: 11.75 },
        { date: 'Sep 21', forecast: 11.80, upperBound: 12.24, lowerBound: 11.36 },
        { date: 'Sep 28', forecast: 11.92, upperBound: 12.40, lowerBound: 11.44 },
      ],
    },
    '30D': {
      horizon: '30D',
      expectedRateUsd: 12.10,
      expectedChangePercent: 2.98,
      trend: 'up',
      confidencePercent: 92,
      riskScore: 38,
      series: [
        { date: 'Aug 01', actual: 11.50 },
        { date: 'Aug 15', actual: 11.58 },
        { date: 'Sep 01', actual: 11.70 },
        { date: 'Sep 14', actual: 11.75 },
        { date: 'Sep 28', forecast: 11.92, upperBound: 12.48, lowerBound: 11.36 },
        { date: 'Oct 14', forecast: 12.10, upperBound: 12.75, lowerBound: 11.45 },
      ],
    },
    '60D': {
      horizon: '60D',
      expectedRateUsd: 11.75,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 75,
      riskScore: 40,
      series: [
        { date: 'Jul 15', actual: 11.40 },
        { date: 'Aug 15', actual: 11.58 },
        { date: 'Sep 14', actual: 11.75 },
        { date: 'Oct 15', forecast: 12.10, upperBound: 12.85, lowerBound: 11.35 },
        { date: 'Nov 14', forecast: 11.75, upperBound: 13.00, lowerBound: 10.50 },
      ],
    },
    '90D': {
      horizon: '90D',
      expectedRateUsd: 11.75,
      expectedChangePercent: 0.0,
      trend: 'stable',
      confidencePercent: 68,
      riskScore: 42,
      series: [
        { date: 'Jun 15', actual: 11.35 },
        { date: 'Jul 15', actual: 11.40 },
        { date: 'Aug 15', actual: 11.58 },
        { date: 'Sep 14', actual: 11.75 },
        { date: 'Oct 15', forecast: 12.10, upperBound: 12.85, lowerBound: 11.35 },
        { date: 'Nov 15', forecast: 11.75, upperBound: 13.00, lowerBound: 10.50 },
        { date: 'Dec 14', forecast: 11.75, upperBound: 13.20, lowerBound: 10.30 },
      ],
    },
  },
};

// ----------------------------------------------------------------------
// VERIFIED BASELINE COMPARISON BENCHMARKS (from registry_manifest.json)
// ----------------------------------------------------------------------
export const mockForecastBaselines = {
  horizons: {
    '1W_7D': {
      Baseline_Naive: { mae: 106.52, rmse: 129.56, mape: 3.26, r2: 0.9828, directional_accuracy: 0.0 },
      Baseline_MovingAverage: { mae: 185.20, rmse: 221.19, mape: 5.67, r2: 0.9498, directional_accuracy: 10.34 },
      Baseline_ExpSmoothing: { mae: 143.06, rmse: 172.95, mape: 4.38, r2: 0.9693, directional_accuracy: 5.75 },
      ML_Ridge: { mae: 116.48, rmse: 129.35, mape: 4.00, r2: 0.9828, directional_accuracy: 47.13 },
      ML_RandomForest: { mae: 38.16, rmse: 51.63, mape: 1.20, r2: 0.9973, directional_accuracy: 94.25 },
      ML_XGBoost: { mae: 43.41, rmse: 61.22, mape: 1.33, r2: 0.9962, directional_accuracy: 95.40, smape: 1.33, interval_coverage: 95.0 },
      ML_LightGBM: { mae: 40.94, rmse: 55.64, mape: 1.27, r2: 0.9968, directional_accuracy: 93.10 },
    },
    '2W_14D': {
      Baseline_Naive: { mae: 158.74, rmse: 191.77, mape: 4.86, r2: 0.9623, directional_accuracy: 1.15 },
      Baseline_MovingAverage: { mae: 238.44, rmse: 282.80, mape: 7.31, r2: 0.9179, directional_accuracy: 10.34 },
      Baseline_ExpSmoothing: { mae: 195.43, rmse: 234.54, mape: 5.98, r2: 0.9435, directional_accuracy: 10.34 },
      ML_Ridge: { mae: 172.72, rmse: 195.32, mape: 5.87, r2: 0.9608, directional_accuracy: 43.68 },
      ML_RandomForest: { mae: 74.09, rmse: 99.27, mape: 2.33, r2: 0.9899, directional_accuracy: 91.95 },
      ML_XGBoost: { mae: 71.05, rmse: 97.37, mape: 2.19, r2: 0.9903, directional_accuracy: 95.40, smape: 2.19, interval_coverage: 95.0 },
      ML_LightGBM: { mae: 72.59, rmse: 98.51, mape: 2.27, r2: 0.9900, directional_accuracy: 88.51 },
    },
    '4W_28D': {
      Baseline_Naive: { mae: 264.68, rmse: 314.61, mape: 8.12, r2: 0.8984, directional_accuracy: 0.0 },
      Baseline_MovingAverage: { mae: 347.43, rmse: 406.96, mape: 10.68, r2: 0.8300, directional_accuracy: 6.90 },
      Baseline_ExpSmoothing: { mae: 302.90, rmse: 357.74, mape: 9.31, r2: 0.8687, directional_accuracy: 6.90 },
      ML_Ridge: { mae: 296.86, rmse: 336.04, mape: 10.02, r2: 0.8841, directional_accuracy: 36.78 },
      ML_RandomForest: { mae: 174.77, rmse: 228.51, mape: 5.33, r2: 0.9464, directional_accuracy: 71.26 },
      ML_XGBoost: { mae: 124.48, rmse: 178.42, mape: 3.87, r2: 0.9673, directional_accuracy: 97.70, smape: 3.87, interval_coverage: 95.0 },
      ML_LightGBM: { mae: 131.54, rmse: 185.95, mape: 4.12, r2: 0.9645, directional_accuracy: 100.0 },
    },
  },
  model_version: 'v2.5',
  evaluation_period: '2021 - 2024 (190 weeks / 564 rows)',
  validation_method: 'Temporal Train/Val/Test Split with Strict Backward-Looking Feature Pipeline',
};

// ----------------------------------------------------------------------
// CAUSAL EVIDENCE & FORECAST EXPLANATIONS
// ----------------------------------------------------------------------
export const mockForecastCausalExplanations: Record<string, {
  observedSignal: string;
  marketEffect: string;
  freightImpact: string;
  evidenceCategory: 'Observed Data' | 'Model Output' | 'Calculated Interpretation';
  sourceContext: string;
}[]> = {
  'route-aus-paradip': [
    {
      observedSignal: 'Paradip Port average vessel turnaround time is 46.0 hours with berth utilization at 78.0%.',
      marketEffect: 'Deepwater mechanized bulk berths experiencing steady queuing during seasonal pre-winter thermal power restocking.',
      freightImpact: 'Short-term spot voyage rates upward pressure (+1.8% over 14 days) on Capesize/Panamax parcels.',
      evidenceCategory: 'Observed Data',
      sourceContext: 'Indian Ports Association (IPA) Monthly Major Port Bulletin (2021-2024 Series)',
    },
    {
      observedSignal: 'Global VLSFO bunker fuel benchmark stabilized at $615/MT with low 30-day volatility.',
      marketEffect: 'Vessel round-trip operating costs anchored; carriers not discounting ballast return legs.',
      freightImpact: 'Establishes a firm price floor around $14.60/MT for Australia to East Coast India coal fixtures.',
      evidenceCategory: 'Model Output',
      sourceContext: 'Model Feature Pipeline: bunker_fuel_price & volatility_ratio_4_12',
    },
    {
      observedSignal: 'Bay of Bengal post-monsoon weather window approaching (reduced cyclone and rough swell frequency).',
      marketEffect: 'Open-sea transit delays and waiting risks at Paradip outer anchorage drop to standard operational levels.',
      freightImpact: 'Limits excessive risk surcharges while sustaining steady commodity intake.',
      evidenceCategory: 'Calculated Interpretation',
      sourceContext: 'Route Topography & India Meteorological Department Post-Monsoon Advisory',
    },
  ],
  'route-indo-vizag': [
    {
      observedSignal: 'Visakhapatnam Outer Harbor VGCB berth output averages 21,000 MT/day with 56.0 hours turnaround.',
      marketEffect: 'High evacuation rate on electrified rail corridor to inland steel plants maintains steady ship turnaround.',
      freightImpact: 'Short haul transit (8.0 days) keeps spot freight stable around $9.40 - $9.55/MT.',
      evidenceCategory: 'Observed Data',
      sourceContext: 'Visakhapatnam Port Authority Operational Records & IPA',
    },
    {
      observedSignal: 'Malacca Strait squall frequency decreases transitioning into October dry window.',
      marketEffect: 'Smooth passage for Panamax and Supramax vessels without weather re-routing.',
      freightImpact: 'Tight 95% forecast confidence band (+/- $0.40/MT spread).',
      evidenceCategory: 'Model Output',
      sourceContext: 'XGBoost Horizon Estimator & Strait of Malacca Navigational Bulletin',
    },
  ],
  'route-saf-haldia': [
    {
      observedSignal: 'Haldia Dock Complex riverine channel draft restricted to 8.2m with tidal bore windows.',
      marketEffect: 'Laden bulk vessels mandatory lighterage protocol at Sandheads Anchorage prior to river navigation.',
      freightImpact: 'Higher baseline voyage freight ($16.20/MT) incorporating transshipment barge and demurrage risk.',
      evidenceCategory: 'Observed Data',
      sourceContext: 'Syama Prasad Mookerjee Port River Marine Directorate Guidelines',
    },
    {
      observedSignal: 'Agulhas current winter sea states dissipating on South Africa departure leg.',
      marketEffect: 'Normal bunker consumption on 4,920 NM voyage without heavy-weather fuel surcharges.',
      freightImpact: 'Forecast shows mild upward firming (+1.7% over 14 days) in line with seasonal domestic demand.',
      evidenceCategory: 'Calculated Interpretation',
      sourceContext: 'Model Feature: weather_vulnerability & South African Maritime Safety Authority',
    },
  ],
};

