'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Filter,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
import { MarketChart } from '@/components/charts/MarketChart';
import { MetricCard } from '@/components/ui/MetricCard';
import { Drawer } from '@/components/ui/Drawer';
import { ConfidenceBadge } from '@/components/ui/StatusBadge';
import { mockFreightIndices, mockMarketDrivers, mockRegionalRates } from '@/data/marketData';
import { marketService } from '@/services';
import { FreightMarketIndex } from '@/types';

export default function MarketPage() {
  const [selectedIndexId, setSelectedIndexId] = useState('idx-fbx-global');
  const [selectedContainerType, setSelectedContainerType] = useState('40ft High Cube (FEU)');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [supportingDataOpen, setSupportingDataOpen] = useState(false);
  const [indices, setIndices] = useState<FreightMarketIndex[]>(mockFreightIndices);
  const [regionalRates, setRegionalRates] = useState<any[]>(mockRegionalRates);
  const [marketDrivers, setMarketDrivers] = useState<any[]>(mockMarketDrivers);
  const [isLive, setIsLive] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const loadMarketData = async () => {
      try {
        const [liveIndices, liveRegional, liveDrivers] = await Promise.all([
          marketService.getIndices(),
          marketService.getRegionalRates(),
          marketService.getDrivers(),
        ]);
        if (isMounted) {
          if (liveIndices && liveIndices.length > 0) {
            setIndices(liveIndices);
            setIsLive(true);
          }
          if (liveRegional && liveRegional.length > 0) {
            setRegionalRates(liveRegional);
          }
          if (liveDrivers && liveDrivers.length > 0) {
            setMarketDrivers(liveDrivers);
          }
        }
      } catch (err) {
        console.warn('Market data loading error:', err);
      }
    };
    loadMarketData();
    return () => { isMounted = false; };
  }, []);

  const activeIndex = indices.find(idx => idx.id === selectedIndexId) || indices[0] || mockFreightIndices[0];

  // Multiplier based on container type
  const containerMultiplier = selectedContainerType.includes('20ft') ? 0.62 : 1.0;
  const historical = activeIndex?.historical || [];
  const adjustedHistorical = historical.map(h => ({
    date: h.date,
    value: Math.round(h.value * containerMultiplier),
  }));

  const currentRate = Math.round((activeIndex?.currentValue || 0) * containerMultiplier);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Freight Market Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized container index benchmarks, multi-corridor spot rates, capacity utilization, and macroeconomic drivers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Verified Telemetry
            </span>
          )}
          <Link
            href="/forecast"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate 90D Forecast</span>
          </Link>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
          <Filter className="w-4 h-4 text-sky-600" />
          <span>Filters:</span>
        </div>

        {/* Index Selector */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-500 font-medium">Index Benchmark:</label>
          <select
            value={selectedIndexId}
            onChange={(e) => setSelectedIndexId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
          >
            {indices.map(idx => (
              <option key={idx.id} value={idx.id}>{idx.name}</option>
            ))}
          </select>
        </div>

        {/* Container Type */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-500 font-medium">Equipment Type:</label>
          <select
            value={selectedContainerType}
            onChange={(e) => setSelectedContainerType(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
          >
            <option value="40ft High Cube (FEU)">40ft High Cube (FEU)</option>
            <option value="40ft Standard (FEU)">40ft Standard (FEU)</option>
            <option value="20ft Standard (TEU)">20ft Standard (TEU)</option>
          </select>
        </div>

        {/* Region */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-500 font-medium">Region:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
          >
            <option value="All Regions">All Global Corridors</option>
            <option value="East Asia to North America">East Asia - North America</option>
            <option value="East Asia to North Europe">East Asia - North Europe</option>
            <option value="Transatlantic">Transatlantic</option>
            <option value="Latin America">Asia - South America</option>
          </select>
        </div>
      </div>

      {/* SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Current Spot Rate"
          value={`$${currentRate.toLocaleString()}`}
          unit={selectedContainerType.includes('20ft') ? 'per TEU' : 'per FEU'}
          change={`${activeIndex.changePercent >= 0 ? '+' : ''}${activeIndex.changePercent}%`}
          changeType={activeIndex.changePercent >= 0 ? 'positive' : 'negative'}
          trendDirection={activeIndex.changePercent >= 0 ? 'up' : 'down'}
          subtext="Latest daily quote"
          icon={DollarSign}
        />
        <MetricCard
          label="Weekly Variance"
          value={`${activeIndex.changeValue >= 0 ? '+' : ''}$${Math.round(activeIndex.changeValue * containerMultiplier)}`}
          change={`${activeIndex.changePercent}%`}
          changeType="neutral"
          subtext="7-day net shift"
          icon={Activity}
        />
        <MetricCard
          label="Monthly Volatility"
          value="18.4%"
          subtext="Annualized 30D"
          icon={TrendingUp}
        />
        <MetricCard
          label="Market Direction"
          value="Firm Bullish"
          change="Sustained"
          changeType="positive"
          subtext="Carrier GRI support"
          icon={BarChart3}
        />
        <MetricCard
          label="Space Availability"
          value="92% Booked"
          change="Tight"
          changeType="negative"
          subtext="Cape routing lag"
          icon={Layers}
        />
      </div>

      {/* MAIN HISTORICAL CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <MarketChart
            title={`${activeIndex.name} Trend`}
            data={adjustedHistorical}
            currency="USD"
            unit={selectedContainerType}
          />
        </div>

        {/* AI INTERPRETATION SECTION */}
        <div className="lg:col-span-4 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">What is driving this market?</h3>
              </div>
              <ConfidenceBadge score={94} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Key Observation</span>
                <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                  Spot quotes for {activeIndex.name} have maintained resilient pricing support despite softening European consumer retail volume.
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Underlying Drivers</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  The primary driver is the long transit loop around Africa absorbing roughly 1.8M TEU of global capacity, preventing carrier price wars.
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Quarterly Outlook</span>
                <p className="text-sky-800 font-medium bg-sky-50 p-2.5 rounded-xl border border-sky-100 leading-relaxed">
                  Rates expected to hold within $3,800 - $4,300/FEU range before Q4 mega-vessel deliveries arrive.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Updated today 18:00 UTC</span>
            <button
              onClick={() => setSupportingDataOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800"
            >
              View Data Behind This Insight <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* REGIONAL RATES HEATMAP & CAPACITY METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Regional Rates Heatmap Table */}
        <div className="lg:col-span-8 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Regional Spot Benchmark Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Comparative spot freight levels across global tradelanes</p>
            </div>
            <Link href="/compare" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              Compare Lanes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Global Tradelane</th>
                  <th className="pb-2.5">Spot Rate (FEU)</th>
                  <th className="pb-2.5">Weekly Shift</th>
                  <th className="pb-2.5">Capacity Pressure</th>
                  <th className="pb-2.5 text-right">Space Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionalRates.map((reg, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">{reg.region}</td>
                    <td className="py-3 font-bold text-slate-800">${reg.rate}</td>
                    <td className={`py-3 font-semibold ${reg.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {reg.change >= 0 ? '+' : ''}{reg.change}%
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${reg.utilization > 90 ? 'bg-rose-500' : reg.utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${reg.utilization}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">{reg.utilization}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        reg.status === 'Tight' ? 'bg-amber-50 text-amber-800' : reg.status === 'Severe' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Driver Factors */}
        <div className="lg:col-span-4 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Market Factor Impacts</h3>
          <p className="text-xs text-slate-500 mb-4">Correlation weight on pricing trajectory</p>

          <div className="space-y-3">
            {marketDrivers.map((driver, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{driver.name}</span>
                  <span className={`text-[10px] font-bold ${driver.direction === 'up' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {driver.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{driver.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DRAWER: SUPPORTING DATA BEHIND INSIGHT */}
      <Drawer
        isOpen={supportingDataOpen}
        onClose={() => setSupportingDataOpen(false)}
        title="Market Telemetry & Factor Signals"
        subtitle={activeIndex.name}
        width="lg"
      >
        <div className="space-y-6 text-xs">
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
            <h4 className="font-bold text-sky-900 text-xs">Econometric Factor Breakdown</h4>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Synthesized from 18,000 carrier booking manifests and historical rate seasonal adjustments.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">Active Correlation Drivers</h4>
            {marketDrivers.map((d, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{d.name}</span>
                  <span className="font-semibold text-sky-700">{d.severity}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{d.impact}</p>
              </div>
            ))}
          </div>

          <Link
            href="/signals"
            className="block w-full py-3 text-center rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            View All 8 Leading Signals & Causality Network
          </Link>
        </div>
      </Drawer>
    </div>
  );
}
