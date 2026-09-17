'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Layers,
  Search,
  SlidersHorizontal,
  Navigation,
  Anchor,
  Ship,
  CloudLightning,
  AlertTriangle,
  ArrowRight,
  Compass,
  X,
  TrendingUp,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { mockRoutes } from '@/data/routeData';
import { mockPorts } from '@/data/portData';
import { mockVessels } from '@/data/vesselData';
import { mockWeatherHazards } from '@/data/weatherData';
import { RouteItem, PortItem, VesselItem, WeatherHazard } from '@/types';

const MaritimeMap = dynamic(
  () => import('@/components/maps/MaritimeMap').then((mod) => mod.MaritimeMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[680px] rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col items-center justify-center text-slate-600 gap-3 shadow-sm">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wide text-slate-600 font-semibold">Initializing Maritime Mapbox GL...</span>
      </div>
    ),
  }
);

export default function GlobalMapPage() {
  const [layers, setLayers] = useState({
    routes: true,
    ports: true,
    vessels: true,
    weather: true,
    congestion: true,
  });

  const [mapStatus, setMapStatus] = useState<'loading' | 'online' | 'unavailable'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObject, setSelectedObject] = useState<{
    type: 'route' | 'port' | 'vessel' | 'hazard';
    data: any;
  } | null>(null);

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectRoute = (r: RouteItem) => setSelectedObject({ type: 'route', data: r });
  const handleSelectPort = (p: PortItem) => setSelectedObject({ type: 'port', data: p });
  const handleSelectVessel = (v: VesselItem) => setSelectedObject({ type: 'vessel', data: v });
  const handleSelectHazard = (h: WeatherHazard) => setSelectedObject({ type: 'hazard', data: h });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Global Maritime Geospatial Map
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geospatial intelligence combining live AIS telemetry, corridor waypoints, and meteorological hazard envelopes
          </p>
        </div>

        {/* Search object on map */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter map by port, route, or vessel..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Map Container with Left Controls Floating Panel */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200">
        
        {/* Left Floating Intelligence Layers Panel */}
        <div className="absolute top-4 left-4 z-20 w-64 glass-card rounded-2xl border border-slate-200/90 p-4 shadow-xl hidden sm:block bg-white/90 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Map Telemetry Layers</h3>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <Navigation className="w-3.5 h-3.5 text-sky-600" /> Shipping Routes
              </span>
              <input
                type="checkbox"
                checked={layers.routes}
                onChange={() => toggleLayer('routes')}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <Anchor className="w-3.5 h-3.5 text-blue-600" /> Major Ports ({mockPorts.length})
              </span>
              <input
                type="checkbox"
                checked={layers.ports}
                onChange={() => toggleLayer('ports')}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <Ship className="w-3.5 h-3.5 text-emerald-600" /> Vessels (AIS)
              </span>
              <input
                type="checkbox"
                checked={layers.vessels}
                onChange={() => toggleLayer('vessels')}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <CloudLightning className="w-3.5 h-3.5 text-rose-500" /> Weather & Storms
              </span>
              <input
                type="checkbox"
                checked={layers.weather}
                onChange={() => toggleLayer('weather')}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Congestion Heat
              </span>
              <input
                type="checkbox"
                checked={layers.congestion}
                onChange={() => toggleLayer('congestion')}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Projection: Web Mercator</span>
            <span
              className={`font-semibold capitalize flex items-center gap-1.5 ${
                mapStatus === 'online'
                  ? 'text-emerald-600'
                  : mapStatus === 'loading'
                  ? 'text-amber-500'
                  : 'text-rose-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  mapStatus === 'online'
                    ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                    : mapStatus === 'loading'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              {mapStatus === 'online' ? 'Online' : mapStatus === 'loading' ? 'Loading' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* The Interactive Maritime Map */}
        <MaritimeMap
          height="h-[680px]"
          activeLayers={layers}
          onStatusChange={(status) => setMapStatus(status)}
          onSelectRoute={handleSelectRoute}
          onSelectPort={handleSelectPort}
          onSelectVessel={handleSelectVessel}
          onSelectHazard={handleSelectHazard}
        />
      </div>

      {/* OBJECT SELECTION DRAWER */}
      {selectedObject && (
        <Drawer
          isOpen={!!selectedObject}
          onClose={() => setSelectedObject(null)}
          title={
            selectedObject.type === 'route'
              ? 'Route Analytics'
              : selectedObject.type === 'port'
              ? 'Port Telemetry'
              : selectedObject.type === 'vessel'
              ? 'Vessel Tracking'
              : 'Meteorological Hazard'
          }
          subtitle={selectedObject.data.name}
          width="lg"
        >
          <div className="space-y-6 text-xs">
            {/* ROUTE DETAIL */}
            {selectedObject.type === 'route' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Spot Freight Rate</p>
                      <p className="text-2xl font-bold text-slate-900 mt-0.5">${selectedObject.data.spotRateUsd} <span className="text-xs font-normal text-slate-500">/ FEU</span></p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${selectedObject.data.weeklyChangePercent >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {selectedObject.data.weeklyChangePercent >= 0 ? '+' : ''}{selectedObject.data.weeklyChangePercent}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Distance</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.distanceNm.toLocaleString()} nm</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Transit Days</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.transitDays} Days</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Slot Capacity</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.capacityUtilization}%</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 text-xs mb-2">Available Tradelane Routing Alternatives</h4>
                  <div className="space-y-2">
                    {selectedObject.data.alternativeRoutes?.map((alt: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{alt.name}</p>
                          <p className="text-[11px] text-slate-500">{alt.via} • {alt.transitDays} days</p>
                        </div>
                        <span className="text-xs font-bold text-slate-900">${alt.spotRateUsd}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/routes"
                  className="block w-full py-3 text-center rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Open Full Route Intelligence Workspace
                </Link>
              </div>
            )}

            {/* PORT DETAIL */}
            {selectedObject.type === 'port' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Congestion Index</p>
                      <p className="text-2xl font-bold text-slate-900 mt-0.5">{selectedObject.data.congestionIndex} <span className="text-xs font-normal text-slate-500">/ 100</span></p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {selectedObject.data.delayRisk} Risk
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Anchored Queue</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.activeVesselsWaiting} Ships</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Avg Yard Dwell</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.averageDwellDays} Days</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Annual Volume</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.annualThroughputMTeu}M TEU</p>
                  </div>
                </div>

                <Link
                  href="/ports"
                  className="block w-full py-3 text-center rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Inspect Port Operations & Dwell History
                </Link>
              </div>
            )}

            {/* VESSEL DETAIL */}
            {selectedObject.type === 'vessel' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedObject.data.name}</p>
                      <p className="text-[11px] text-slate-500">IMO {selectedObject.data.imo} • Flag: {selectedObject.data.flag}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedObject.data.currentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Current Speed</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.currentSpeedKnots} Knots</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Destination Port</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.destinationPort}</p>
                  </div>
                </div>

                <Link
                  href="/vessels"
                  className="block w-full py-3 text-center rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Open Vessel Voyage Log & AIS Timeline
                </Link>
              </div>
            )}

            {/* HAZARD DETAIL */}
            {selectedObject.type === 'hazard' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <p className="text-[10px] text-rose-500 uppercase font-semibold">Severe Environmental Threat</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{selectedObject.data.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{selectedObject.data.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Max Wind Speed</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObject.data.maxWindSpeedKnots} Knots</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Significant Wave Height</span>
                    <p className="text-sm font-bold text-rose-600 mt-0.5">{selectedObject.data.significantWaveHeightMeters} Meters</p>
                  </div>
                </div>

                <Link
                  href="/weather"
                  className="block w-full py-3 text-center rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  View Route Weather Impact Assessment
                </Link>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
