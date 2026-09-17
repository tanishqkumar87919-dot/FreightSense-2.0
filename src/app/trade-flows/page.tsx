'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  TrendingUp,
  ArrowRight,
  Filter,
  DollarSign,
  Layers,
  Sparkles,
  Package,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { TradeFlowMap } from '@/components/maps/TradeFlowMap';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskIndicator } from '@/components/ui/StatusBadge';
import { mockTradeFlows } from '@/data/tradeFlowData';
import { TradeFlowItem } from '@/types';

export default function TradeFlowsPage() {
  const [selectedFlowId, setSelectedFlowId] = useState('flow-asia-na');
  const [commodityFilter, setCommodityFilter] = useState('All Commodities');
  const [corridorFilter, setCorridorFilter] = useState('All Corridors');

  const currentFlow = mockTradeFlows.find(f => f.id === selectedFlowId) || mockTradeFlows[0];

  const filteredFlows = mockTradeFlows.filter(flow => {
    const matchesCommodity = commodityFilter === 'All Commodities' || flow.commodity.toLowerCase().includes(commodityFilter.toLowerCase());
    const matchesCorridor = corridorFilter === 'All Corridors' || flow.corridor.includes(corridorFilter);
    return matchesCommodity && matchesCorridor;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Global Trade Flows
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              Annual TEU Flow Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Macro trade volume dynamics: vector corridor density, commodity concentrations, and container imbalance flows
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Inspect Spot Indices</span>
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold">Commodity Sector:</label>
            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="All Commodities">All Commodities</option>
              <option value="Consumer Electronics">Consumer Electronics</option>
              <option value="Automotive">EV & Automotive</option>
              <option value="Machinery">Heavy Machinery</option>
              <option value="Chemicals">Chemicals & Plastics</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold">Trade Corridor:</label>
            <select
              value={corridorFilter}
              onChange={(e) => setCorridorFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="All Corridors">All Corridors</option>
              <option value="Transpacific">Transpacific</option>
              <option value="Europe">Asia - Northern Europe</option>
              <option value="Transatlantic">Transatlantic</option>
              <option value="South America">Asia - Latin America</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Showing <strong className="text-slate-900">{filteredFlows.length}</strong> major global trade arteries
        </div>
      </div>

      {/* ANIMATED TRADE FLOW MAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Interactive Trade Volume Flow Canvas</h3>
          <span className="text-xs text-slate-500">Click any flow vector to inspect corridor analytics</span>
        </div>
        <TradeFlowMap
          selectedFlowId={selectedFlowId}
          onSelectFlow={(flow) => setSelectedFlowId(flow.id)}
          height="h-[520px]"
        />
      </div>

      {/* SELECTED FLOW DETAIL METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Annual Cargo Volume"
          value={`${(currentFlow.annualTeuVolume / 1000000).toFixed(1)}M`}
          unit="TEU / Year"
          subtext="Mainlane Throughput"
          icon={Package}
        />
        <MetricCard
          label="Monthly Growth Rate"
          value={`+${currentFlow.monthlyGrowthPercent}%`}
          change="Sustained"
          changeType="positive"
          trendDirection="up"
          subtext="MoM Expansion"
          icon={TrendingUp}
        />
        <MetricCard
          label="Average Corridor Rate"
          value={`$${currentFlow.freightRateAverage}`}
          unit="/ FEU"
          subtext="Composite Benchmark"
          icon={DollarSign}
        />
        <MetricCard
          label="Risk Assessment"
          value={currentFlow.riskLevel}
          change="Monitored"
          changeType={currentFlow.riskLevel === 'Low' ? 'positive' : 'negative'}
          subtext="Chokepoint Sensitivity"
          icon={Layers}
        />
        <MetricCard
          label="Primary Hubs"
          value={`${currentFlow.primaryPorts.length} Gateways`}
          subtext={currentFlow.primaryPorts.slice(0, 2).join(', ')}
          icon={Globe}
        />
      </div>

      {/* DETAILED BREAKDOWN & AI TRADE BRIEF */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Selected Flow Overview */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Selected Corridor</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{currentFlow.corridor}</h3>
            </div>
            <RiskIndicator level={currentFlow.riskLevel} />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Origin Macro Region:</span>
              <span className="font-semibold text-slate-800">{currentFlow.originRegion}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Destination Region:</span>
              <span className="font-semibold text-slate-800">{currentFlow.destinationRegion}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Key Commodities:</span>
              <span className="font-semibold text-slate-800 text-right max-w-xs">{currentFlow.commodity}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Major Port Gateways:</span>
              <span className="font-semibold text-sky-700">{currentFlow.primaryPorts.join(' • ')}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/routes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800"
            >
              Open matching Route Intelligence profile <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* AI Trade Brief */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Macro Trade Brief</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Trade Flow Shift</span>
              <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                Strong frontloading on Transpacific ({currentFlow.corridor}) is expanding container imbalance ratios, creating empty box repositioning shortages in Asia.
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Freight Implications</span>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Carriers are applying premium surcharges for westbound equipment moves to incentivize fast container turnaround.
              </p>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-sky-800">
              <p className="font-semibold">Procurement Recommendation:</p>
              <p className="text-[11px] mt-0.5">Prioritize direct carrier contracts with equipment availability guarantees for Q4 shipments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TOP TRADE MOVEMENTS TABLE */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Top Global Trade Movements</h3>
        <p className="text-xs text-slate-500 mb-4">Click any row to bind the map and detail views</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2.5">Trade Corridor</th>
                <th className="pb-2.5">Annual Volume</th>
                <th className="pb-2.5">MoM Growth</th>
                <th className="pb-2.5">Avg Rate (FEU)</th>
                <th className="pb-2.5 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockTradeFlows.map((flow) => (
                <tr
                  key={flow.id}
                  onClick={() => setSelectedFlowId(flow.id)}
                  className={`hover:bg-sky-50/50 cursor-pointer transition-colors ${
                    selectedFlowId === flow.id ? 'bg-sky-50/60 font-medium' : ''
                  }`}
                >
                  <td className="py-3 font-semibold text-slate-900">{flow.corridor}</td>
                  <td className="py-3 text-slate-800 font-bold">{(flow.annualTeuVolume / 1000000).toFixed(1)}M TEU</td>
                  <td className="py-3 font-semibold text-emerald-600">+{flow.monthlyGrowthPercent}%</td>
                  <td className="py-3 font-bold text-sky-700">${flow.freightRateAverage}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      flow.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700' : flow.riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {flow.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
