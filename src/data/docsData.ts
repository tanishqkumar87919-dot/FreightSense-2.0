export interface DocArticle {
  id: string;
  category: string;
  title: string;
  description: string;
  readTime: string;
  updatedDate: string;
  content: string;
  codeSnippet?: string;
  tags: string[];
}

export const mockDocCategories = [
  'Getting Started',
  'Dashboard & Command Center',
  'Forecasting & Models',
  'Route Intelligence',
  'Port Operations',
  'Vessel Tracking (AIS)',
  'Alerts & Triggers',
  'Reports & Analytics',
  'Data Explorer',
  'API & Webhooks',
  'Troubleshooting & Support',
];

export const mockDocArticles: DocArticle[] = [
  {
    id: 'doc-quickstart',
    category: 'Getting Started',
    title: 'Platform Overview & Quickstart Guide',
    description: 'Learn how to navigate the 28 intelligence workspaces and configure custom monitoring telemetry.',
    readTime: '4 min read',
    updatedDate: 'September 2026',
    tags: ['overview', 'quickstart', 'navigation'],
    content: `FreightSense 2.0 is an enterprise intelligence application designed for maritime supply chain leaders, shipping lines, freight forwarders, and commodity traders.

### Core Navigation Model
1. **Command Center (Dashboard)**: Provides high-level synthesis across spot rates, port congestion, active vessels, and macroeconomic indicators.
2. **Predictive Workspaces (Forecast & Scenario)**: Leverages econometric ensemble models to simulate market reactions up to 90 days out.
3. **Operational Layers (Routes, Ports, Vessels, Weather)**: Interactive geospatial tools tracking container slots, berth queues, AIS telemetry, and tropical hazards.
4. **Actionable Governance (Alerts, Reports, Watchlist)**: Automated event triggers and PDF/CSV reporting pipelines.`,
  },
  {
    id: 'doc-forecast-methodology',
    category: 'Forecasting & Models',
    title: 'Understanding the AI Forecast Engine & Confidence Bands',
    description: 'A deep dive into the Ensemble-M3 architecture (LSTM + Graph Transformer + Prophet).',
    readTime: '7 min read',
    updatedDate: 'September 2026',
    tags: ['forecast', 'model', 'machine learning', 'lstm'],
    content: `The FreightSense forecasting engine combines statistical autoregressive models with deep recurrent and spatial graph networks.

### Model Inputs
• **Lagged Spot Indices**: Daily FBX, SCFI, and Drewry WCI spot time series.
• **Capacity Absorption**: Cape of Good Hope rerouting indicators and scheduled shipyard deliveries.
• **Port Dwell Metrics**: Anchorage queuing days at the top 30 global gateways.
• **Bunker Fuel Benchmarks**: VLSFO Rotterdam and Singapore daily prices.

### Interpretation of Confidence Intervals
The shaded confidence ribbon represents the 95% Bayesian posterior predictive interval. When geopolitical risks surge (e.g. Red Sea diversions), the envelope expands to reflect elevated tail risk.`,
  },
  {
    id: 'doc-scenario-analysis',
    category: 'Forecasting & Models',
    title: 'How to Run Scenario Analyses & Stress Tests',
    description: 'Simulate the impact of demand spikes, capacity drops, and fuel cost swings on freight budgets.',
    readTime: '5 min read',
    updatedDate: 'September 2026',
    tags: ['scenario', 'simulation', 'budget', 'stress-test'],
    content: `Scenario Analysis allows supply chain executives to stress-test their procurement budgets against hypothetical disruptions.

### Using the Parameters
1. Adjust the **Freight Demand Slider** to simulate holiday restocking (+10% to +30%).
2. Modify the **Capacity Slider** to model sudden blank sailings or Suez reopenings.
3. Adjust **Port Congestion** to preview dwell-driven spot rate premiums.
4. Click **Run Scenario Simulation** to calculate the projected rate deltas and cost impact.`,
  },
  {
    id: 'doc-api-integration',
    category: 'API & Webhooks',
    title: 'Connecting Enterprise Webhooks & AIS Ingestion',
    description: 'How to configure push notifications and webhook endpoints for automated alerts.',
    readTime: '6 min read',
    updatedDate: 'September 2026',
    tags: ['api', 'webhooks', 'integration', 'developers'],
    codeSnippet: `// Example Webhook Payload
{
  "event": "alert.triggered",
  "timestamp": "2026-09-14T20:15:00Z",
  "alertId": "alt-sha-rot-surge",
  "severity": "High",
  "data": {
    "route": "Shanghai to Rotterdam",
    "spotRate": 4180,
    "threshold": 4000,
    "deltaPercent": 4.5
  }
}`,
    content: `FreightSense supports outbound webhook notifications for enterprise systems (SAP TMS, Oracle OTM, CargoWise). You can configure your endpoint in the Integrations portal.`,
  },
  {
    id: 'doc-alerts-setup',
    category: 'Alerts & Triggers',
    title: 'Configuring Proactive Anomaly Alerts',
    description: 'Set up multi-condition threshold monitors across freight rates, dwell times, and storm tracks.',
    readTime: '3 min read',
    updatedDate: 'September 2026',
    tags: ['alerts', 'monitoring', 'thresholds'],
    content: `Stay ahead of volatile freight swings by creating targeted alerts. Alerts evaluate inbound telemetry every 15 minutes and notify teams via Email, In-App badges, or Mobile Push notifications.`,
  },
];
