'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Anchor,
  Clock,
  Ship,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Search,
  Bookmark,
  Bell,
  Activity,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskIndicator } from '@/components/ui/StatusBadge';
import { Drawer } from '@/components/ui/Drawer';
import { mockPorts } from '@/data/portData';
import { PortItem } from '@/types';
import { useWatchlist } from '@/context/WatchlistContext';
import { portService } from '@/services';
import { MaritimeMap } from '@/components/maps/MaritimeMap';

export default function PortsPage() {
  const [selectedPortId, setSelectedPortId] = useState('port-sha');
  const [ports, setPorts] = useState<PortItem[]>(mockPorts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const { addItem, isSaved, removeItem } = useWatchlist();

  React.useEffect(() => {
    portService.getPorts().then((res) => {
      if (res && res.length > 0) {
        setPorts(res);
      }
    });
  }, []);

  const currentPort = ports.find(p => p.id === selectedPortId) || ports[0] || mockPorts[0];
  const saved = isSaved(currentPort.id);

  const filteredPorts = ports.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWatchlistToggle = () => {
    if (saved) {
      removeItem(currentPort.id);
    } else {
      addItem({
        id: currentPort.id,
        name: currentPort.name,
        type: 'Ports',
        status: `Congestion: ${currentPort.congestionIndex}/100`,
        latestChange: `${currentPort.averageDwellDays}d dwell`,
        forecast: 'Peak Transshipment Yard Dwell',
        risk: currentPort.delayRisk,
        lastUpdated: 'Just now',
        targetPath: '/ports',
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Port Intelligence
            </h1>
            <RiskIndicator level={currentPort.delayRisk} score={currentPort.congestionIndex} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global gateway operational monitoring: anchorage waiting queues, container yard dwell days, and crane turnaround
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
            <span>Set Dwell Alert</span>
          </Link>
        </div>
      </div>

      {/* PORT SELECTOR & SEARCH BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Selected Port Gateway:</label>
            <select
              value={selectedPortId}
              onChange={(e) => setSelectedPortId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
            >
              {ports.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ports by code or city..."
              className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="text-slate-500 text-[11px] flex items-center gap-4">
          <span>Country: <strong className="text-slate-800">{currentPort.country}</strong></span>
          <span>•</span>
          <span>Berth Util: <strong className="text-sky-700">{currentPort.berthUtilizationPercent}%</strong></span>
        </div>
      </div>

      {/* 5 KEY PORT METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Congestion Score"
          value={`${currentPort.congestionIndex} / 100`}
          change={currentPort.delayRisk}
          changeType={currentPort.delayRisk === 'Low' ? 'positive' : 'negative'}
          subtext="Anchorage & Yard"
          icon={Activity}
        />
        <MetricCard
          label="Average Yard Dwell"
          value={`${currentPort.averageDwellDays} Days`}
          change="+0.7d vs target"
          changeType="negative"
          trendDirection="up"
          subtext="Container Stacking"
          icon={Clock}
        />
        <MetricCard
          label="Anchored Queue"
          value={`${currentPort.activeVesselsWaiting} Vessels`}
          subtext="Awaiting Terminal Berth"
          icon={Ship}
        />
        <MetricCard
          label="7-Day Arrivals"
          value={currentPort.vesselArrivals7d}
          unit="Calls"
          change="High Frequency"
          changeType="neutral"
          subtext="Scheduled Services"
          icon={Anchor}
        />
        <MetricCard
          label="Annual Throughput"
          value={`${currentPort.annualThroughputMTeu}M`}
          unit="TEU / Year"
          subtext="Total Capacity"
          icon={Layers}
        />
      </div>

      {/* GEOSPATIAL PORT GATEWAY NETWORK */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Geospatial Gateway Network</h3>
            <p className="text-xs text-slate-500">Global container terminals and Indian major ports with live congestion heatmap overlays</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Selected: <strong className="text-slate-900">{currentPort.name}</strong> ({currentPort.code})
          </span>
        </div>
        <MaritimeMap
          height="h-[440px]"
          activeLayers={{ routes: true, ports: true, vessels: false, weather: false, congestion: true }}
          onSelectPort={(p) => setSelectedPortId(p.id)}
        />
      </div>

      {/* OPERATIONAL CHARTS (ARRIVALS, CONGESTION, DWELL TIME) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Congestion & Dwell History */}
        <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Weekly Congestion & Yard Dwell Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Anchorage queue score (0-100) vs container dwell duration</p>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Score: {currentPort.congestionIndex}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentPort.metricsHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" name="Congestion Index" dataKey="congestion" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" name="Dwell Days" dataKey="dwellTime" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vessel Arrivals & Daily Throughput */}
        <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Daily Vessel Arrivals & Terminal Throughput</h3>
              <p className="text-xs text-slate-500 mt-0.5">Vessel calls serviced per 24-hour cycle</p>
            </div>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {currentPort.vesselArrivals7d} Calls / Wk
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentPort.metricsHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar name="Vessel Arrivals" dataKey="arrivals" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI PORT BRIEF & RECENT EVENTS TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* AI Port Brief */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Port Operations Synthesis</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Bottlenecks</span>
              <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                {currentPort.name} is experiencing elevated dwell levels (4.6 days) as off-schedule arrivals from the Cape bypass arrive in uneven clusters.
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Operational Impact</span>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Feeder connections to secondary regional ports face 18% rollover risk due to high container stacking density at terminal berths.
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">7-Day Outlook</span>
              <p className="text-sky-800 font-medium bg-sky-50 p-2.5 rounded-xl border border-sky-100 leading-relaxed">
                PSA/Terminal operators are expanding off-dock yard staging areas. Congestion expected to ease slightly by late next week.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Port Events Timeline */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Recent Port Events & Advisories</h3>
          <p className="text-xs text-slate-500 mb-4">Official notices, terminal updates, and weather logs</p>

          <div className="space-y-3">
            {currentPort.recentEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900">{evt.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{evt.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EVENT DETAIL DRAWER */}
      {selectedEvent && (
        <Drawer
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Terminal Advisory Detail"
          subtitle={selectedEvent.title}
          width="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Category</span>
              <p className="text-sm font-semibold text-slate-900 capitalize mt-0.5">{selectedEvent.type}</p>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Notice Overview</span>
              <p className="text-slate-700 leading-relaxed mt-1">{selectedEvent.description}</p>
            </div>

            <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-800">
              <p className="font-bold">Freight Impact Action:</p>
              <p className="text-[11px] mt-1">Carriers advised to submit advance manifest data 48 hours prior to arrival to expedite clearance.</p>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
