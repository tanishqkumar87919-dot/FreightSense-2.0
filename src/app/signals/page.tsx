'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Layers,
  Anchor,
  Ship,
  CloudLightning,
  Flame,
  Calendar,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { mockMarketSignals, mockSignalRelationships } from '@/data/signalData';
import { MarketSignal } from '@/types';
import { signalService } from '@/services';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function SignalsPage() {
  const [signals, setSignals] = useState<MarketSignal[]>(mockMarketSignals);
  const [selectedSignal, setSelectedSignal] = useState<MarketSignal | null>(null);

  React.useEffect(() => {
    signalService.getSignals().then((res) => {
      if (res && res.length > 0) {
        setSignals(res);
      }
    });
  }, []);

  // Freight Market Pressure Index (Composite 78/100 -> High)
  const pressureScore = 78;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Market Signals & Factors
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              High Upward Pricing Pressure
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time leading indicator decomposition: causality trees, factor weights, and composite freight pressure
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/scenario"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Test Factors in Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* MAIN VISUALIZATION: FREIGHT MARKET PRESSURE GAUGE */}
      <div className="glass-card rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Composite Freight Market Pressure</h2>
            <p className="text-xs text-slate-500">Multi-factor aggregate index measuring upward spot rate momentum</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Level:</span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
              High Pressure ({pressureScore} / 100)
            </span>
          </div>
        </div>

        {/* Gradient Multi-zone Pressure Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/80 p-0.5 flex">
            {/* Low Zone (0-35) */}
            <div className="w-[35%] h-full bg-emerald-400 rounded-l-full" />
            {/* Moderate Zone (35-70) */}
            <div className="w-[35%] h-full bg-amber-400" />
            {/* High Zone (70-100) */}
            <div className="w-[30%] h-full bg-rose-500 rounded-r-full" />
          </div>

          {/* Indicator Pointer */}
          <div className="relative w-full h-4">
            <div
              className="absolute -top-3 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
              style={{ left: `${pressureScore}%` }}
            >
              <div className="w-2.5 h-2.5 rotate-45 bg-slate-900 shadow-md" />
              <span className="text-[10px] font-bold text-slate-900 mt-1">78.0</span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-400 pt-1">
            <span>Low Pressure (&lt; 35)</span>
            <span>Balanced / Moderate (35 - 70)</span>
            <span className="text-rose-600">High / Severe (&gt; 70)</span>
          </div>
        </div>
      </div>

      {/* CAUSALITY RELATIONSHIP CHAIN VISUALIZATION */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Inter-Signal Causality & Transmission Chain</h3>
        </div>

        <p className="text-xs text-slate-500">How upstream maritime events propagate into bottom-line spot container pricing:</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Step 1: Catalyst</span>
              <Anchor className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Port Congestion ↑</p>
            <p className="text-[11px] text-slate-500">Tuas & Shanghai yard dwell extends beyond 4 days.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Step 2: Operational Drift</span>
              <Clock className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Vessel Schedule Delay ↑</p>
            <p className="text-[11px] text-slate-500">Vessels queue at anchorage, missing rotation berths.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Step 3: Supply Contraction</span>
              <Layers className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Effective Slot Capacity ↓</p>
            <p className="text-[11px] text-slate-500">13.8% of global container slots absorbed in transit.</p>
          </div>

          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-sky-600 text-[10px] uppercase font-bold">
              <span>Step 4: Market Outcome</span>
              <TrendingUp className="w-3.5 h-3.5 text-sky-700" />
            </div>
            <p className="font-bold text-sky-900 text-sm">Spot Freight Rate Surge ↑</p>
            <p className="text-[11px] text-sky-800 font-medium">Carriers execute General Rate Increases (GRI).</p>
          </div>
        </div>
      </div>

      {/* THE 8 CORE MARKET SIGNALS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">8 Primary Leading Market Signals</h3>
          <span className="text-xs text-slate-500">Click any card to inspect historical signal telemetry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {signals.map((signal) => {
            return (
              <div
                key={signal.id}
                onClick={() => setSelectedSignal(signal)}
                className="glass-card glass-card-hover rounded-2xl border border-slate-200/90 p-5 shadow-sm cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {signal.category}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                    signal.direction === 'up' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {signal.direction === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {signal.historicalChangePercent > 0 ? '+' : ''}{signal.historicalChangePercent}%
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{signal.name}</h4>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">{signal.currentValue}</p>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{signal.description}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Impact: <strong className="text-slate-700">{signal.impactScore}/100</strong></span>
                  <span>Confidence: <strong className="text-sky-700">{signal.confidencePercent}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIGNAL DETAIL DRAWER */}
      {selectedSignal && (
        <Drawer
          isOpen={!!selectedSignal}
          onClose={() => setSelectedSignal(null)}
          title={selectedSignal.name}
          subtitle={`Category: ${selectedSignal.category} • Impact: ${selectedSignal.impactScore}/100`}
          width="md"
        >
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Current Metric Value</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{selectedSignal.currentValue}</p>
              <p className="text-[11px] text-slate-500 mt-1">Change: {selectedSignal.historicalChangePercent}% over trailing 14 days</p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Signal Historical Trend</h4>
              <div className="h-44 w-full bg-white p-2 rounded-xl border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSignal.trendSeries}>
                    <XAxis dataKey="date" fontSize={10} stroke="#94A3B8" />
                    <YAxis fontSize={10} stroke="#94A3B8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#0284C7" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Supporting Data Source Summary</h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {selectedSignal.supportingDataSummary}
              </p>
            </div>

            <Link
              href="/market"
              className="block w-full py-3 text-center rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              Open Correlated Market Indices
            </Link>
          </div>
        </Drawer>
      )}
    </div>
  );
}
