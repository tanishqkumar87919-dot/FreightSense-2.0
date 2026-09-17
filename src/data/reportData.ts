import { ReportItem } from '@/types';

export const mockReports: ReportItem[] = [
  {
    id: 'rep-q3-global-freight-outlook',
    title: 'Global Maritime Freight Intelligence Quarterly Outlook (Q3-Q4 2026)',
    category: 'Market',
    coverage: 'Global Mainlanes: Asia-EU, Transpacific, Transatlantic, Latin America',
    generatedDate: 'September 12, 2026',
    keyInsight: 'Effective slot supply contraction caused by Africa circumnavigation is colliding with early US inventory frontloading, creating an autumn rate plateau before newbuild deliveries trigger late Q4 soft-landing.',
    readTimeMinutes: 14,
    sourceCount: 18,
    isSaved: true,
    sections: [
      {
        id: 'sec-exec-summary',
        title: 'Executive Summary',
        content: `The global maritime container freight market is operating in a structurally altered regime in late 2026. Despite macroeconomic cooling across consumer durables in Western Europe, spot and short-term index freight rates remain roughly 85% above 2019 pre-pandemic baselines.

The overriding structural determinant remains the protracted avoidance of the southern Red Sea and Bab-el-Mandeb Strait by tier-one liner alliances (MSC, Ocean Alliance, Premier Alliance). By circumnavigating the Cape of Good Hope, carriers absorb between 1.6 and 1.9 million TEU of nominal nominal capacity simply to sustain weekly service schedules. Consequently, even mild fluctuations in North American purchase orders generate disproportionate spot rate spikes.`,
        metrics: [
          { label: 'Global Composite Rate', value: '$3,240/FEU', delta: '+4.68%' },
          { label: 'Effective Slot Absorption', value: '13.8%', delta: '+1.2%' },
          { label: 'Carrier Schedule Reliability', value: '54.2%', delta: '-3.1%' },
        ],
      },
      {
        id: 'sec-market-overview',
        title: 'Market Overview & Corridor Dynamics',
        content: `Cross-corridor analysis reveals stark divergences between the Transpacific and Far East-Europe tradelanes:

1. **Transpacific Eastbound**: Benefiting from robust US consumer demand and importer risk mitigation against potential East Coast dockworker labor negotiations. Shanghai to Los Angeles/Long Beach spot pricing has strengthened to $4,890/FEU, with vessel slot utilization surpassing 96%.
2. **Asia - North Europe**: Showing moderate softening down to $4,180/FEU as European industrial inventories stabilize. However, equipment imbalances are emerging in Northern European return corridors.
3. **Asia - Latin America (ECSA)**: Emerged as the highest-yielding long-haul trade globally, with rates reaching $5,850/FEU driven by electric vehicle shipments and container repositioning shortages.`,
      },
      {
        id: 'sec-historical-analysis',
        title: 'Historical Volatility & Shock Absorption',
        content: `Examining the 24-month rate trajectory demonstrates that carrier capacity discipline—manifested through coordinated blank sailings and slow steaming—has significantly heightened market sensitivity to geopolitical and meteorological shocks. When Typhoon Songda disrupted East China Sea departures in early September, spot booking premiums responded within 48 hours, highlighting near-zero slack in regional equipment reserves.`,
      },
      {
        id: 'sec-forecast',
        title: 'AI Econometric Forecast & Scenarios',
        content: `FreightSense econometric models project that Transpacific rates will peak at $5,240/FEU by mid-October 2026 before entering a controlled descending channel. On the Asia-Europe lane, rates are forecasted to drift downward toward $3,620/FEU by November as 640,000 TEU of newbuild megamax vessels are integrated into maritime strings.`,
        metrics: [
          { label: '30-Day Transpacific Target', value: '$5,240/FEU', delta: '+7.16%' },
          { label: '30-Day Asia-EU Target', value: '$3,890/FEU', delta: '-6.94%' },
          { label: 'Model Confidence Bound', value: '88.4%', delta: '±$210' },
        ],
      },
      {
        id: 'sec-risk',
        title: 'Operational & Geopolitical Risk Assessment',
        content: `Key operational risks monitored across our telemetry network:
• **Transshipment Yard Congestion**: Severe pinch points at Singapore and Port Klang risking cascading rollovers.
• **Environmental Disruption**: North Atlantic autumn gale activity and West Pacific tropical storm tracks.
• **Bunker Fuel Exposure**: VLSFO crude-linked premiums adding up to $45/TEU to voyage voyage operational costs.`,
      },
      {
        id: 'sec-ai-interpretation',
        title: 'AI Synthesis & Recommended Actions',
        content: `**Strategic Recommendation for BCOs & NVOCCs**:
1. Lock in 60-day index-linked contract caps rather than pure spot agreements for Transpacific freight to hedge against pre-holiday volatility.
2. Direct non-time-critical European cargo through alternative Mediterranean gateways (e.g. Valencia, Genoa) where berth congestion remains 30% lower than Northern European hubs.
3. Maintain 5-day safety inventory buffers at inland distribution centers to absorb schedule reliability slippage.`,
      },
      {
        id: 'sec-sources',
        title: 'Data Sources & Verification Metadata',
        content: `Telemetry inputs synthesized in this report:
• Real-time AIS satellite & terrestrial vessel tracking (142,000 daily vessel messages)
• Container port automated terminal operating system (TOS) feeds: Shanghai (SIPG), Singapore (PSA), Rotterdam (Havenbedrijf)
• Freightos Baltic Daily Index (FBX) & Shanghai Shipping Exchange (SSE)
• European Centre for Medium-Range Weather Forecasts (ECMWF) Marine Ocean Wave Ensemble`,
      },
    ],
  },
  {
    id: 'rep-red-sea-rerouting-impact',
    title: 'The Cape Circumvention Benchmark: Route Costs & Transit Times',
    category: 'Route',
    coverage: 'Asia-Europe & Mediterranean Corridors',
    generatedDate: 'September 08, 2026',
    keyInsight: 'Detailed cost breakdown demonstrating why Suez Canal transit remains commercially uneconomical despite lower mileage due to 450% war risk insurance spikes.',
    readTimeMinutes: 10,
    sourceCount: 14,
    isSaved: false,
    sections: [
      {
        id: 'sec-exec',
        title: 'Executive Summary',
        content: 'Comprehensive analysis of fuel expenditures, slot efficiency, and port rotation alterations across the 13,850 nautical mile Shanghai-Rotterdam route via South Africa.',
      },
      {
        id: 'sec-cost-breakdown',
        title: 'Cost Differential: Cape vs Suez',
        content: 'While sailing around the Cape adds 12 to 14 days and $380,000 in fuel burn per vessel trip, Suez transit tolls ($750k) combined with war-risk premiums ($850k) render the direct path $1.2M more costly per round voyage.',
      },
    ],
  },
  {
    id: 'rep-port-congestion-index-2026',
    title: 'Global Hub Dwell & Congestion Benchmark (September 2026)',
    category: 'Port',
    coverage: 'Top 25 Global Container Ports',
    generatedDate: 'September 10, 2026',
    keyInsight: 'Singapore and Port of Los Angeles experience elevated dwell times as transshipment concentration and intermodal rail delays compound throughput cycles.',
    readTimeMinutes: 12,
    sourceCount: 22,
    isSaved: true,
    sections: [
      {
        id: 'sec-summary',
        title: 'Global Port Congestion Summary',
        content: 'Deep dive into yard density, berth productivity, and rail head connection bottlenecks across the primary maritime hubs.',
      },
    ],
  },
  {
    id: 'rep-transpacific-peak-season',
    title: 'Transpacific Peak Season Surge Analysis & Booking Trends',
    category: 'Forecast',
    coverage: 'East Asia to US West Coast & US East Coast',
    generatedDate: 'September 05, 2026',
    keyInsight: 'US retail inventory restocking velocity indicates peak demand will extend two weeks longer than typical seasonal patterns.',
    readTimeMinutes: 9,
    sourceCount: 11,
    isSaved: false,
    sections: [
      {
        id: 'sec-summary',
        title: 'Peak Season Trajectory',
        content: 'Detailed econometric projections for Transpacific container volume flows through December 2026.',
      },
    ],
  },
];
