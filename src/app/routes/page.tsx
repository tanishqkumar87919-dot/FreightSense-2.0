'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Navigation,
  ArrowRight,
  Clock,
  DollarSign,
  Layers,
  AlertTriangle,
  Sparkles,
  Compass,
  Bookmark,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { RouteMap } from '@/components/maps/RouteMap';
import { MarketChart } from '@/components/charts/MarketChart';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskIndicator } from '@/components/ui/StatusBadge';
import { mockRoutes } from '@/data/routeData';
import { useWatchlist } from '@/context/WatchlistContext';
import { routeService } from '@/services';
import { RouteItem } from '@/types';

export default function RoutesPage() {
  const [selectedRouteId, setSelectedRouteId] = useState('route-sha-rot');
  const [routes, setRoutes] = useState<RouteItem[]>(mockRoutes);
  const { addItem, isSaved, removeItem } = useWatchlist();

  React.useEffect(() => {
    routeService.getRoutes().then((res) => {
      if (res && res.length > 0) {
        setRoutes(res);
      }
    });
  }, []);

  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || mockRoutes[0];
  const saved = isSaved(currentRoute.id);

  const handleWatchlistToggle = () => {
    if (saved) {
      removeItem(currentRoute.id);
    } else {
      addItem({
        id: currentRoute.id,
        name: currentRoute.name,
        type: 'Routes',
        status: `Operational (${currentRoute.capacityUtilization}% booked)`,
        latestChange: `${currentRoute.weeklyChangePercent >= 0 ? '+' : ''}${currentRoute.weeklyChangePercent}% ($${currentRoute.spotRateUsd})`,
        forecast: 'Target $3,890 in 30d',
        risk: currentRoute.riskLevel,
        lastUpdated: 'Just now',
        targetPath: '/routes',
      });
    }
  };

  // Sample historical data for current route
  const historicalSeries = [
    { date: 'Aug 01', value: Math.round(currentRoute.spotRateUsd * 1.05) },
    { date: 'Aug 08', value: Math.round(currentRoute.spotRateUsd * 1.04) },
    { date: 'Aug 15', value: Math.round(currentRoute.spotRateUsd * 1.02) },
    { date: 'Aug 22', value: Math.round(currentRoute.spotRateUsd * 1.01) },
    { date: 'Sep 01', value: Math.round(currentRoute.spotRateUsd * 1.00) },
    { date: 'Sep 08', value: Math.round(currentRoute.spotRateUsd * 0.99) },
    { date: 'Sep 14', value: currentRoute.spotRateUsd },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Tradelane Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Route Intelligence
            </h1>
            <RiskIndicator level={currentRoute.riskLevel} score={currentRoute.riskScore} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Origin-to-destination transit efficiency, canal bottleneck diversions, and slot procurement analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleWatchlistToggle}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              saved
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{saved ? 'Saved to Watchlist' : 'Add to Watchlist'}</span>
          </button>

          <Link
            href="/alerts"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Set Route Alert</span>
          </Link>
        </div>
      </div>

      {/* ORIGIN & DESTINATION SELECTOR BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <label className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Select Active Lane:</label>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
          >
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.corridor})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <span>Corridor: <strong className="text-slate-800">{currentRoute.corridor}</strong></span>
          <span>•</span>
          <span>Active Vessels: <strong className="text-sky-700">{currentRoute.activeVesselsCount}</strong></span>
        </div>
      </div>

      {/* 5 KEY ROUTE METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Nautical Distance"
          value={currentRoute.distanceNm.toLocaleString()}
          unit="nm"
          subtext="Via Cape Bypass"
          icon={Navigation}
        />
        <MetricCard
          label="Average Transit"
          value={currentRoute.transitDays}
          unit="Days"
          change="On Schedule"
          changeType="positive"
          subtext="Port-to-Port"
          icon={Clock}
        />
        <MetricCard
          label="Spot Freight Rate"
          value={`$${currentRoute.spotRateUsd}`}
          unit="/ FEU"
          change={`${currentRoute.weeklyChangePercent >= 0 ? '+' : ''}${currentRoute.weeklyChangePercent}%`}
          changeType={currentRoute.weeklyChangePercent >= 0 ? 'positive' : 'negative'}
          trendDirection={currentRoute.weeklyChangePercent >= 0 ? 'up' : 'down'}
          subtext="40ft High Cube"
          icon={DollarSign}
        />
        <MetricCard
          label="Capacity Utilization"
          value={`${currentRoute.capacityUtilization}%`}
          change="Available"
          changeType="neutral"
          subtext="Liner Booking Fill"
          icon={Layers}
        />
        <MetricCard
          label="Disruption Risk"
          value={`${currentRoute.riskScore} / 100`}
          change={currentRoute.riskLevel}
          changeType={currentRoute.riskLevel === 'Low' ? 'positive' : 'negative'}
          subtext="Weather & Chokepoint"
          icon={AlertTriangle}
        />
      </div>

      {/* INTERACTIVE ROUTE MAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Active Corridor Geospatial Track</h3>
          <span className="text-xs text-slate-500 font-mono">Waypoints: {currentRoute.coordinates.waypoints.length} stations</span>
        </div>
        <RouteMap route={currentRoute} height="h-[460px]" />
      </div>

      {/* HISTORICAL CHART & AI ROUTE BRIEF */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <MarketChart
            title={`${currentRoute.name} - Spot Rate History`}
            data={historicalSeries}
            currency="USD"
            unit="per 40ft Container"
          />
        </div>

        {/* AI Route Brief */}
        <div className="lg:col-span-4 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Corridor Brief</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Condition</span>
                <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                  Liner services on {currentRoute.name} are maintaining consistent 34-day voyages around South Africa with minimal bunkering dwell.
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Operational Drivers</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Avoidance of the Suez war-risk zone remains 88.4% total fleet volume. Bunker fuel costs at Durban are adding $35/TEU.
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Tactical Recommendation</span>
                <p className="text-sky-800 font-medium bg-sky-50 p-2.5 rounded-xl border border-sky-100 leading-relaxed">
                  Secure vessel allocations 3 weeks in advance. Space remains 92% committed for late September sailings.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/forecast" className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1">
              Test Route Forecast <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ALTERNATIVE ROUTES COMPARISON TABLE */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Alternative Maritime & Intermodal Routing Options</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click an alternative to switch and compare operational profiles</p>
          </div>
          <Link href="/compare" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            Side-by-Side Comparison Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2.5">Route Option / Chokepoint</th>
                <th className="pb-2.5">Via Node</th>
                <th className="pb-2.5">Transit Time</th>
                <th className="pb-2.5">Indicative Spot Rate</th>
                <th className="pb-2.5">Disruption Risk</th>
                <th className="pb-2.5 text-right">Capacity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRoute.alternativeRoutes?.map((alt, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 font-semibold text-slate-900">{alt.name}</td>
                  <td className="py-3 text-slate-600">{alt.via}</td>
                  <td className="py-3 font-bold text-slate-800">{alt.transitDays} Days</td>
                  <td className="py-3 font-bold text-sky-700">${alt.spotRateUsd} / FEU</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      alt.riskScore < 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      Score {alt.riskScore}/100
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-600 font-medium">{alt.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
