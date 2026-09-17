'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  Sparkles,
  TrendingUp,
  Anchor,
  Ship,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  AlertTriangle,
  Clock,
  Compass,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { MarketChart } from '@/components/charts/MarketChart';
import { MaritimeMap } from '@/components/maps/MaritimeMap';
import { Drawer } from '@/components/ui/Drawer';
import { ConfidenceBadge } from '@/components/ui/StatusBadge';
import { mockFreightIndices, mockMarketDrivers } from '@/data/marketData';
import { mockRoutes } from '@/data/routeData';
import { mockAIInsights } from '@/data/insightData';
import { RouteItem, PortItem, VesselItem, FreightMarketIndex, AIInsight } from '@/types';
import { dashboardService, routeService, marketService, insightService } from '@/services';

export default function DashboardPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('2024-08-23 18:00 UTC');
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '3M' | '1Y'>('30D');
  const [supportingDataOpen, setSupportingDataOpen] = useState(false);
  const [selectedMapObject, setSelectedMapObject] = useState<{ type: string; data: any } | null>(null);

  const [summary, setSummary] = useState<any>({
    globalCompositeRate: 3761.3,
    globalRateChangePercent: 2.28,
    asiaEuropeRate: 4283.0,
    asiaEuropeChangePercent: 2.69,
    capacityUtilization: 92.0,
    avgIndianPortDwellDays: 2.3,
    activeVesselsCount: 194,
    championModel: 'v2.5',
  });
  const [indices, setIndices] = useState<FreightMarketIndex[]>(mockFreightIndices);
  const [routes, setRoutes] = useState<RouteItem[]>(mockRoutes);
  const [drivers, setDrivers] = useState<any[]>(mockMarketDrivers);
  const [marketBrief, setMarketBrief] = useState<AIInsight>(mockAIInsights[0]);

  const loadDashboardData = async () => {
    try {
      const [liveSummary, liveIndices, liveRoutes, liveDrivers, liveInsights] = await Promise.all([
        dashboardService.getSummary(),
        marketService.getIndices(),
        routeService.getRoutes(),
        marketService.getDrivers(),
        insightService.getInsights(),
      ]);
      if (liveSummary) setSummary(liveSummary);
      if (liveIndices && liveIndices.length > 0) setIndices(liveIndices);
      if (liveRoutes && liveRoutes.length > 0) setRoutes(liveRoutes);
      if (liveDrivers && liveDrivers.length > 0) setDrivers(liveDrivers);
      if (liveInsights && liveInsights.length > 0) setMarketBrief(liveInsights[0]);
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    }
  };

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const mainIndex = indices[0] || mockFreightIndices[0];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    setLastRefreshed(new Date().toLocaleTimeString() + ' UTC');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Global Freight Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Executive Command Center • Last telemetry sync: <span className="font-medium text-slate-700">{lastRefreshed}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            {(['7D', '30D', '3M', '1Y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  dateRange === range
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Refresh Button with Simulated State */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/scenario"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Simulate Scenario</span>
          </Link>
        </div>
      </div>

      {/* 6 KEY METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Global Freight Index"
          value={`$${summary.globalCompositeRate ? Math.round(summary.globalCompositeRate).toLocaleString() : '3,761'}`}
          unit="/ FEU"
          change={`${summary.globalRateChangePercent >= 0 ? '+' : ''}${summary.globalRateChangePercent}%`}
          changeType={summary.globalRateChangePercent >= 0 ? 'positive' : 'negative'}
          trendDirection={summary.globalRateChangePercent >= 0 ? 'up' : 'down'}
          subtext="FBX Benchmark"
          icon={TrendingUp}
          onClick={() => router.push('/market')}
        />
        <MetricCard
          label="Asia-Europe Rate"
          value={`$${summary.asiaEuropeRate ? Math.round(summary.asiaEuropeRate).toLocaleString() : '4,283'}`}
          unit="/ FEU"
          change={`${summary.asiaEuropeChangePercent >= 0 ? '+' : ''}${summary.asiaEuropeChangePercent}%`}
          changeType={summary.asiaEuropeChangePercent >= 0 ? 'positive' : 'negative'}
          trendDirection={summary.asiaEuropeChangePercent >= 0 ? 'up' : 'down'}
          subtext="SCFI Mainlane"
          icon={DollarSign}
          onClick={() => router.push('/routes')}
        />
        <MetricCard
          label="Capacity Utilization"
          value={`${summary.capacityUtilization || 92}%`}
          change="+1.8%"
          changeType="positive"
          trendDirection="up"
          subtext="Slot Absorption"
          icon={Layers}
          onClick={() => router.push('/signals')}
        />
        <MetricCard
          label="Port Congestion"
          value="42.8"
          unit="/ 100"
          change="Normal"
          changeType="positive"
          trendDirection="down"
          subtext="Major Indian & Global Hubs"
          icon={Anchor}
          onClick={() => router.push('/ports')}
        />
        <MetricCard
          label="Active Vessels"
          value={`${summary.activeVesselsCount || 194}`}
          unit="Tracked"
          change="17.8 kts"
          changeType="neutral"
          subtext="Corridor Fleets"
          icon={Ship}
          onClick={() => router.push('/vessels')}
        />
        <MetricCard
          label="Active ML Model"
          value={summary.championModel || "v2.5"}
          unit="XGBoost"
          change="Verified"
          changeType="positive"
          trendDirection="up"
          subtext="Multi-Horizon Champion"
          icon={Sparkles}
          onClick={() => router.push('/forecast')}
        />
      </div>

      {/* MAIN SECTION: CHART & AI BRIEF */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Historical & Trend Chart */}
        <div className="lg:col-span-8">
          <MarketChart
            title="Global Freight Market Composite Index (FBX-GL)"
            data={mainIndex.historical}
            currency="USD"
            unit="per 40ft Container (FEU)"
          />
        </div>

        {/* AI Market Brief Card */}
        <div className="lg:col-span-4 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI Market Brief</h3>
              </div>
              <ConfidenceBadge score={marketBrief.confidenceScore} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Observation</span>
                <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">{marketBrief.observation}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Primary Drivers</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{marketBrief.explanation}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Market Outlook</span>
                <p className="text-sky-800 font-medium bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 leading-relaxed">
                  {marketBrief.forecast}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{marketBrief.modelVersion}</span>
            <button
              onClick={() => setSupportingDataOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800"
            >
              View Supporting Data <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MARKET MOVERS & CAUSAL DRIVERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Movers Table */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Market Movers (Corridors)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any tradelane to inspect detailed routing analytics</p>
            </div>
            <Link href="/routes" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              All Routes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Tradelane</th>
                  <th className="pb-2.5">Spot Rate</th>
                  <th className="pb-2.5">Change</th>
                  <th className="pb-2.5">Transit</th>
                  <th className="pb-2.5">Capacity</th>
                  <th className="pb-2.5 text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((route) => (
                  <tr
                    key={route.id}
                    onClick={() => router.push(`/routes`)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 font-semibold text-slate-900 group-hover:text-sky-700">
                      {route.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{route.corridor}</span>
                    </td>
                    <td className="py-3 font-bold text-slate-800">${route.spotRateUsd}</td>
                    <td className={`py-3 font-semibold ${route.weeklyChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {route.weeklyChangePercent >= 0 ? '+' : ''}{route.weeklyChangePercent}%
                    </td>
                    <td className="py-3 text-slate-600">{route.transitDays} Days</td>
                    <td className="py-3 text-slate-600">{route.capacityUtilization}%</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        route.riskLevel === 'Low'
                          ? 'bg-emerald-50 text-emerald-700'
                          : route.riskLevel === 'Moderate'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {route.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Causal Market Drivers */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Key Leading Market Drivers</h3>
              <Link href="/signals" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                Signals <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {drivers.map((driver, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{driver.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{driver.impact}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    driver.severity === 'High' ? 'bg-rose-100 text-rose-800' : driver.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {driver.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated from 14 global indicators</span>
            <Link href="/methodology" className="text-sky-600 hover:underline">Methodology</Link>
          </div>
        </div>
      </div>

      {/* GLOBAL MARITIME MAP PREVIEW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Global Maritime Network Layer</h3>
            <p className="text-xs text-slate-500 mt-0.5">Interactive AIS vessel positions, mainlane paths, and port dwell nodes</p>
          </div>
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sky-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs"
          >
            <Compass className="w-4 h-4" />
            Open Fullscreen Map
          </Link>
        </div>

        <MaritimeMap
          height="h-[460px]"
          onSelectRoute={(route) => setSelectedMapObject({ type: 'Route', data: route })}
          onSelectPort={(port) => setSelectedMapObject({ type: 'Port', data: port })}
          onSelectVessel={(vessel) => setSelectedMapObject({ type: 'Vessel', data: vessel })}
        />
      </div>

      {/* SUPPORTING DATA DRAWER */}
      <Drawer
        isOpen={supportingDataOpen}
        onClose={() => setSupportingDataOpen(false)}
        title="Supporting Evidence & Telemetry Matrix"
        subtitle={marketBrief.title}
        width="lg"
      >
        <div className="space-y-6 text-xs">
          <div>
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Observation Detail</h4>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {marketBrief.observation}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Verified Metrics</h4>
            <div className="grid grid-cols-3 gap-3">
              {(marketBrief.supportingMetrics || []).map((m: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">{m.label}</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{m.value}</p>
                  {m.change && <p className="text-[10px] font-semibold text-emerald-600">{m.change}</p>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Data Sources Ingested</h4>
            <div className="space-y-1.5">
              {(marketBrief.dataSources || []).map((ds: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  {ds}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-400">Timestamp: {marketBrief.timestamp}</span>
            <Link
              href="/forecast"
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700"
            >
              Test Forecast Scenario
            </Link>
          </div>
        </div>
      </Drawer>

      {/* SELECTED MAP OBJECT DRAWER */}
      {selectedMapObject && (
        <Drawer
          isOpen={!!selectedMapObject}
          onClose={() => setSelectedMapObject(null)}
          title={`${selectedMapObject.type} Intelligence`}
          subtitle={selectedMapObject.data.name}
          width="md"
        >
          <div className="space-y-4 text-xs">
            {selectedMapObject.type === 'Route' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200">
                  <p className="text-xs text-slate-500">Spot Freight Rate</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">${selectedMapObject.data.spotRateUsd} <span className="text-xs font-normal text-slate-500">/ FEU</span></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Transit Duration</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedMapObject.data.transitDays} Days</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Slot Capacity</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedMapObject.data.capacityUtilization}%</p>
                  </div>
                </div>
                <Link
                  href="/routes"
                  className="block w-full py-2.5 text-center bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700"
                >
                  Open Full Route Analysis
                </Link>
              </div>
            )}

            {selectedMapObject.type === 'Port' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                  <p className="text-xs text-slate-500">Congestion Index</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{selectedMapObject.data.congestionIndex} <span className="text-xs font-normal text-slate-500">/ 100</span></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Average Dwell</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedMapObject.data.averageDwellDays} Days</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Waiting Vessels</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedMapObject.data.activeVesselsWaiting}</p>
                  </div>
                </div>
                <Link
                  href="/ports"
                  className="block w-full py-2.5 text-center bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700"
                >
                  Open Port Operations
                </Link>
              </div>
            )}

            {selectedMapObject.type === 'Vessel' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Carrier Line</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selectedMapObject.data.carrier}</p>
                  <p className="text-xs text-slate-500 mt-1">IMO: {selectedMapObject.data.imo} • Flag: {selectedMapObject.data.flag}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Speed</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedMapObject.data.currentSpeedKnots} Knots</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Status</span>
                    <p className="text-sm font-semibold text-emerald-600">{selectedMapObject.data.currentStatus}</p>
                  </div>
                </div>
                <Link
                  href="/vessels"
                  className="block w-full py-2.5 text-center bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700"
                >
                  View Vessel Voyage Track
                </Link>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
