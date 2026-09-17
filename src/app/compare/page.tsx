'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  ArrowRight,
  Bookmark,
  Bell,
  CheckCircle2,
  Navigation,
  Anchor,
  TrendingUp,
  Ship,
  Sparkles,
  Layers,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { mockRoutes } from '@/data/routeData';
import { mockPorts } from '@/data/portData';
import { mockFreightIndices } from '@/data/marketData';

export default function ComparePage() {
  const [compareMode, setCompareMode] = useState<'routes' | 'ports' | 'markets'>('routes');

  // Route compare selectors
  const [routeIdA, setRouteIdA] = useState('route-sha-rot');
  const [routeIdB, setRouteIdB] = useState('route-szx-lax');

  // Port compare selectors
  const [portIdA, setPortIdA] = useState('port-sin');
  const [portIdB, setPortIdB] = useState('port-rot');

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const routeA = mockRoutes.find(r => r.id === routeIdA) || mockRoutes[0];
  const routeB = mockRoutes.find(r => r.id === routeIdB) || mockRoutes[1];

  const portA = mockPorts.find(p => p.id === portIdA) || mockPorts[0];
  const portB = mockPorts.find(p => p.id === portIdB) || mockPorts[2];

  const handleSaveComparison = () => {
    setSavedNotice('Comparison saved to your intelligence workspace.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Compare Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-sky-600" />
              Side-by-Side Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Differential benchmarking across container corridors, terminal dwell bottlenecks, and rate indexes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveComparison}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Comparison</span>
          </button>

          <Link
            href="/alerts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Create Alert</span>
          </Link>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* MODE SELECTOR TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {[
          { id: 'routes', label: 'Shipping Corridors (Routes)', icon: Navigation },
          { id: 'ports', label: 'Port Gateways (Operations)', icon: Anchor },
          { id: 'markets', label: 'Freight Indices (Markets)', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = compareMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCompareMode(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isSelected ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ROUTE COMPARISON WORKSPACE */}
      {compareMode === 'routes' && (
        <div className="space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Primary Route (Lane A)</label>
              <select
                value={routeIdA}
                onChange={(e) => setRouteIdA(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                {mockRoutes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.corridor})</option>
                ))}
              </select>
            </div>

            <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Benchmark Route (Lane B)</label>
              <select
                value={routeIdB}
                onChange={(e) => setRouteIdB(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                {mockRoutes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.corridor})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column A */}
            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">Lane A Profile</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{routeA.name}</h3>
                <p className="text-xs text-slate-500">{routeA.corridor}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Spot Freight Rate:</span>
                  <span className="font-extrabold text-slate-900 text-sm">${routeA.spotRateUsd} / FEU</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Transit Duration:</span>
                  <span className="font-bold text-slate-800">{routeA.transitDays} Days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nautical Distance:</span>
                  <span className="font-semibold text-slate-700">{routeA.distanceNm.toLocaleString()} nm</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Slot Capacity Booked:</span>
                  <span className="font-semibold text-slate-800">{routeA.capacityUtilization}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Weekly Shift:</span>
                  <span className={`font-bold ${routeA.weeklyChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {routeA.weeklyChangePercent >= 0 ? '+' : ''}{routeA.weeklyChangePercent}%
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Disruption Risk:</span>
                  <span className="font-bold text-amber-600">{routeA.riskLevel} ({routeA.riskScore}/100)</span>
                </div>
              </div>
            </div>

            {/* Column B */}
            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Lane B Profile</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{routeB.name}</h3>
                <p className="text-xs text-slate-500">{routeB.corridor}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Spot Freight Rate:</span>
                  <span className="font-extrabold text-slate-900 text-sm">${routeB.spotRateUsd} / FEU</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Transit Duration:</span>
                  <span className="font-bold text-slate-800">{routeB.transitDays} Days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nautical Distance:</span>
                  <span className="font-semibold text-slate-700">{routeB.distanceNm.toLocaleString()} nm</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Slot Capacity Booked:</span>
                  <span className="font-semibold text-slate-800">{routeB.capacityUtilization}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Weekly Shift:</span>
                  <span className={`font-bold ${routeB.weeklyChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {routeB.weeklyChangePercent >= 0 ? '+' : ''}{routeB.weeklyChangePercent}%
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Disruption Risk:</span>
                  <span className="font-bold text-amber-600">{routeB.riskLevel} ({routeB.riskScore}/100)</span>
                </div>
              </div>
            </div>
          </div>

          {/* KEY DIFFERENCES CALLOUT */}
          <div className="glass-card rounded-2xl border border-sky-200 bg-sky-50/40 p-6 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-sky-900 font-bold">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Key Operational Differences & Tradeoff Analysis</span>
            </div>
            <ul className="space-y-2 text-slate-700 list-disc list-inside leading-relaxed">
              <li>
                <strong>Rate Premium:</strong> {routeB.name} is currently <strong>${Math.abs(routeB.spotRateUsd - routeA.spotRateUsd)} / FEU</strong> {routeB.spotRateUsd > routeA.spotRateUsd ? 'more expensive' : 'cheaper'} than {routeA.name}.
              </li>
              <li>
                <strong>Transit Velocity:</strong> {routeB.transitDays < routeA.transitDays ? `${routeB.name} delivers cargo ${routeA.transitDays - routeB.transitDays} days faster.` : `${routeA.name} saves ${routeB.transitDays - routeA.transitDays} days of open ocean sailing.`}
              </li>
              <li>
                <strong>Risk Exposure:</strong> {routeA.riskScore > routeB.riskScore ? `${routeA.name} carries higher vulnerability to Red Sea Cape diversions.` : `${routeB.name} faces seasonal Pacific cyclone risks.`}
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* PORT COMPARISON WORKSPACE */}
      {compareMode === 'ports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Port Gateway A</label>
              <select
                value={portIdA}
                onChange={(e) => setPortIdA(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                {mockPorts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Port Gateway B</label>
              <select
                value={portIdB}
                onChange={(e) => setPortIdB(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                {mockPorts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-900">{portA.name}</h3>
              <p className="text-xs text-slate-500">{portA.country} • Code: {portA.code}</p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Congestion Score:</span>
                  <span className="font-bold text-amber-600">{portA.congestionIndex} / 100</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Average Yard Dwell:</span>
                  <span className="font-bold text-slate-800">{portA.averageDwellDays} Days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Waiting Vessels:</span>
                  <span className="font-semibold text-slate-800">{portA.activeVesselsWaiting} Ships</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Weekly Arrivals:</span>
                  <span className="font-semibold text-slate-800">{portA.vesselArrivals7d} Calls</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Annual Throughput:</span>
                  <span className="font-bold text-sky-700">{portA.annualThroughputMTeu}M TEU</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-900">{portB.name}</h3>
              <p className="text-xs text-slate-500">{portB.country} • Code: {portB.code}</p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Congestion Score:</span>
                  <span className="font-bold text-emerald-600">{portB.congestionIndex} / 100</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Average Yard Dwell:</span>
                  <span className="font-bold text-slate-800">{portB.averageDwellDays} Days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Waiting Vessels:</span>
                  <span className="font-semibold text-slate-800">{portB.activeVesselsWaiting} Ships</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Weekly Arrivals:</span>
                  <span className="font-semibold text-slate-800">{portB.vesselArrivals7d} Calls</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Annual Throughput:</span>
                  <span className="font-bold text-sky-700">{portB.annualThroughputMTeu}M TEU</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARKETS COMPARISON WORKSPACE */}
      {compareMode === 'markets' && (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Freight Indices Comparative Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5">Index Name</th>
                  <th className="pb-2.5">Symbol</th>
                  <th className="pb-2.5">Current Value</th>
                  <th className="pb-2.5">Weekly Shift</th>
                  <th className="pb-2.5 text-right">Standard Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockFreightIndices.map((idx) => (
                  <tr key={idx.id} className="hover:bg-slate-50">
                    <td className="py-3 font-semibold text-slate-900">{idx.name}</td>
                    <td className="py-3 font-mono text-slate-500">{idx.symbol}</td>
                    <td className="py-3 font-bold text-slate-900">${idx.currentValue}</td>
                    <td className={`py-3 font-bold ${idx.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent}%
                    </td>
                    <td className="py-3 text-right text-slate-500">{idx.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
