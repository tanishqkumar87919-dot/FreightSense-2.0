'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ship,
  Search,
  Filter,
  Navigation,
  Clock,
  Anchor,
  Compass,
  Sparkles,
  Bookmark,
  Bell,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MaritimeMap } from '@/components/maps/MaritimeMap';
import { mockVessels } from '@/data/vesselData';
import { VesselItem } from '@/types';
import { useWatchlist } from '@/context/WatchlistContext';

export default function VesselsPage() {
  const [selectedVesselId, setSelectedVesselId] = useState('ves-msc-irina');
  const [carrierFilter, setCarrierFilter] = useState('All Carriers');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem, isSaved, removeItem } = useWatchlist();

  const currentVessel = mockVessels.find(v => v.id === selectedVesselId) || mockVessels[0];
  const saved = isSaved(currentVessel.id);

  const filteredVessels = mockVessels.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.imo.includes(searchQuery) ||
      v.carrier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCarrier = carrierFilter === 'All Carriers' || v.carrier.includes(carrierFilter);
    const matchesStatus = statusFilter === 'All Statuses' || v.currentStatus === statusFilter;
    return matchesSearch && matchesCarrier && matchesStatus;
  });

  const handleWatchlistToggle = () => {
    if (saved) {
      removeItem(currentVessel.id);
    } else {
      addItem({
        id: currentVessel.id,
        name: `${currentVessel.name} (IMO ${currentVessel.imo})`,
        type: 'Vessels',
        status: `${currentVessel.currentStatus} (${currentVessel.currentSpeedKnots} kts)`,
        latestChange: `Destination: ${currentVessel.destinationPort}`,
        forecast: `ETA ${currentVessel.estimatedArrival}`,
        risk: currentVessel.currentStatus === 'Delayed' ? 'High' : 'Low',
        lastUpdated: 'Just now',
        targetPath: '/vessels',
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
              Vessel Fleet Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200">
              Demonstration AIS
            </span>
            <StatusBadge status={currentVessel.currentStatus} size="md" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Commercial containership fleet tracking: simulated & demonstration AIS telemetry, Doppler speeds, and voyage milestone progression
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
            <span>Set Schedule Alert</span>
          </Link>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vessel name, IMO, carrier..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold">Carrier:</label>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="All Carriers">All Carriers</option>
              <option value="MSC">MSC</option>
              <option value="Maersk">Maersk</option>
              <option value="CMA CGM">CMA CGM</option>
              <option value="Evergreen">Evergreen</option>
              <option value="COSCO">COSCO</option>
              <option value="ONE">ONE</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="At Sea">At Sea</option>
              <option value="At Port">At Port</option>
              <option value="Anchored">Anchored</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Last Pos: {currentVessel.lastReportedTimestamp}
        </div>
      </div>

      {/* 5 KEY VESSEL TELEMETRY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Cruising Speed"
          value={`${currentVessel.currentSpeedKnots} kts`}
          subtext="AIS Doppler Velocity"
          icon={Navigation}
        />
        <MetricCard
          label="Nominal Capacity"
          value={currentVessel.capacityTeu.toLocaleString()}
          unit="TEU"
          subtext="Megamax Tier-1"
          icon={Ship}
        />
        <MetricCard
          label="Deadweight Tonnage"
          value={`${(currentVessel.deadweightTonnage / 1000).toFixed(0)}k DWT`}
          subtext="Deep Laden"
          icon={Anchor}
        />
        <MetricCard
          label="Flag State"
          value={currentVessel.flag}
          subtext={`IMO: ${currentVessel.imo}`}
          icon={Compass}
        />
        <MetricCard
          label="Destination ETA"
          value={currentVessel.destinationPort.split(' ')[0]}
          subtext={currentVessel.estimatedArrival.split(' ')[0]}
          icon={Calendar}
        />
      </div>

      {/* GEOSPATIAL FLEET TRACK MAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Geospatial Fleet Positions</h3>
            <p className="text-xs text-slate-500">Commercial vessel positions and corridor traces on enterprise light basemap</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Active: <strong className="text-slate-900">{currentVessel.name}</strong> ({currentVessel.carrier})
          </span>
        </div>
        <MaritimeMap
          height="h-[440px]"
          activeLayers={{ routes: true, ports: true, vessels: true, weather: false, congestion: false }}
          onSelectVessel={(v) => setSelectedVesselId(v.id)}
        />
      </div>

      {/* ACTIVE VESSEL PROFILE & VOYAGE TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Vessel Profile Card */}
        <div className="lg:col-span-4 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400">Vessel Specification</span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{currentVessel.name}</h3>
            <p className="text-xs text-sky-700 font-semibold">{currentVessel.carrier}</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Vessel Class:</span>
              <span className="font-semibold text-slate-800">{currentVessel.type}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Origin Port:</span>
              <span className="font-semibold text-slate-800">{currentVessel.originPort}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Destination Port:</span>
              <span className="font-semibold text-slate-800">{currentVessel.destinationPort}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Departure Timestamp:</span>
              <span className="font-semibold text-slate-800">{currentVessel.departureDate}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Estimated Arrival:</span>
              <span className="font-semibold text-sky-700">{currentVessel.estimatedArrival}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Position Fix:</span>
              <span className="font-mono text-slate-800">{currentVessel.coordinates[0]}°N, {currentVessel.coordinates[1]}°E</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>AI Route Context:</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Vessel maintaining optimum economic fuel speed (17.8 kts). Clear sea conditions with negligible variance against arrival window.
            </p>
          </div>
        </div>

        {/* Right: Voyage Stage Timeline */}
        <div className="lg:col-span-8 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Voyage Track Progression Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated AIS milestone checkins from departure to berthing</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Status: <span className="text-emerald-600 font-bold">{currentVessel.currentStatus}</span>
            </span>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {currentVessel.timeline.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';

              return (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Dot */}
                  <div
                    className={`absolute -left-6 mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isCurrent
                        ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-500/30 ring-4 ring-sky-100'
                        : isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-300'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                    {isCurrent && <div className="w-2 h-2 rounded-full bg-white animate-ping" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{step.stage}: {step.location}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{step.timestamp}</span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase ${
                      isCompleted ? 'text-emerald-700' : isCurrent ? 'text-sky-700 font-bold' : 'text-slate-400'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FLEET INVENTORY TABLE */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Commercial Fleet AIS Manifest</h3>
        <p className="text-xs text-slate-500 mb-4">Click any vessel to inspect live voyage tracking</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2.5">Vessel Name</th>
                <th className="pb-2.5">IMO</th>
                <th className="pb-2.5">Carrier Line</th>
                <th className="pb-2.5">Capacity</th>
                <th className="pb-2.5">Speed</th>
                <th className="pb-2.5">Destination</th>
                <th className="pb-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVessels.map((vessel) => (
                <tr
                  key={vessel.id}
                  onClick={() => setSelectedVesselId(vessel.id)}
                  className={`hover:bg-sky-50/50 cursor-pointer transition-colors ${
                    selectedVesselId === vessel.id ? 'bg-sky-50/60 font-medium' : ''
                  }`}
                >
                  <td className="py-3 font-semibold text-slate-900">{vessel.name}</td>
                  <td className="py-3 font-mono text-slate-500">{vessel.imo}</td>
                  <td className="py-3 text-slate-700">{vessel.carrier}</td>
                  <td className="py-3 text-slate-800 font-bold">{vessel.capacityTeu.toLocaleString()} TEU</td>
                  <td className="py-3 text-slate-600">{vessel.currentSpeedKnots} kts</td>
                  <td className="py-3 text-slate-800">{vessel.destinationPort}</td>
                  <td className="py-3 text-right">
                    <StatusBadge status={vessel.currentStatus} />
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
