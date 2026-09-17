'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CloudLightning,
  Wind,
  Waves,
  Droplets,
  AlertTriangle,
  Clock,
  Navigation,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Info,
} from 'lucide-react';
import { EnvironmentalMap } from '@/components/maps/EnvironmentalMap';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskIndicator } from '@/components/ui/StatusBadge';
import { mockWeatherHazards } from '@/data/weatherData';
import { mockRoutes } from '@/data/routeData';
import { WeatherHazard } from '@/types';

export default function WeatherPage() {
  const [activeLayers, setActiveLayers] = useState({
    storms: true,
    wind: true,
    waves: true,
    precipitation: false,
  });

  const [selectedHazardId, setSelectedHazardId] = useState('wthr-typhoon-songda');
  const [selectedRouteId, setSelectedRouteId] = useState('route-szx-lax');

  const currentHazard = mockWeatherHazards.find(h => h.id === selectedHazardId) || mockWeatherHazards[0];
  const currentRoute = mockRoutes.find(r => r.id === selectedRouteId) || mockRoutes[0];

  const toggleLayer = (key: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Weather & Ocean Intelligence
            </h1>
            <RiskIndicator level={currentHazard.severity} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Marine meteorological hazards: tropical cyclone tracking, significant wave heights, and shipping lane detour risks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/alerts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Create Storm Alert</span>
          </Link>
        </div>
      </div>

      {/* MAP LAYER CONTROLS BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Hazard Overlays:</span>

          <button
            onClick={() => toggleLayer('storms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
              activeLayers.storms ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Cyclones & Storms</span>
          </button>

          <button
            onClick={() => toggleLayer('waves')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
              activeLayers.waves ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Wave Swell (&gt;4m)</span>
          </button>

          <button
            onClick={() => toggleLayer('wind')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
              activeLayers.wind ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Gale Wind Vectors</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Inspect Route Exposure:</span>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-sky-500"
          >
            {mockRoutes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5 KEY WEATHER METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Active Severe Threats"
          value={`${mockWeatherHazards.length} Systems`}
          change="Category 3"
          changeType="negative"
          subtext="West Pacific & N. Atlantic"
          icon={CloudLightning}
        />
        <MetricCard
          label="Peak Wave Height"
          value={`${currentHazard.significantWaveHeightMeters}m`}
          subtext="Significant Swell"
          icon={Waves}
        />
        <MetricCard
          label="Sustained Winds"
          value={`${currentHazard.maxWindSpeedKnots} kts`}
          subtext="Severe Gale"
          icon={Wind}
        />
        <MetricCard
          label="Est. Route Delay"
          value={`+${currentHazard.freightImpact.routeDelayDays} Days`}
          change="Mandatory Detour"
          changeType="negative"
          subtext="Eastbound Transpacific"
          icon={Clock}
        />
        <MetricCard
          label="Rerouting Risk"
          value={currentHazard.freightImpact.reroutingRisk}
          change="High"
          changeType="negative"
          subtext="300nm Southern Track"
          icon={AlertTriangle}
        />
      </div>

      {/* ENVIRONMENTAL MAP CANVAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Global Marine Hazard Geospatial Field</h3>
          <span className="text-xs text-slate-500">Click any hazard marker to open operational disruption profile</span>
        </div>
        <EnvironmentalMap
          activeLayers={activeLayers}
          selectedHazardId={selectedHazardId}
          onSelectHazard={(h) => setSelectedHazardId(h.id)}
          height="h-[520px]"
        />
      </div>

      {/* HAZARDS TIMELINE & FREIGHT IMPACT ASSESSMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Weather Hazards List */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Active Marine Weather Systems</h3>
          <p className="text-xs text-slate-500">Tracked meteorological fronts crossing international container corridors</p>

          <div className="space-y-3">
            {mockWeatherHazards.map((hazard) => {
              const isSelected = selectedHazardId === hazard.id;
              return (
                <div
                  key={hazard.id}
                  onClick={() => setSelectedHazardId(hazard.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500/20 shadow-xs'
                      : 'border-slate-200/80 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs">{hazard.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      hazard.severity === 'Severe' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {hazard.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{hazard.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                    <span>Waves: {hazard.significantWaveHeightMeters}m</span>
                    <span>•</span>
                    <span>Winds: {hazard.maxWindSpeedKnots} kts</span>
                    <span>•</span>
                    <span>Active until: {hazard.expectedEnd.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Freight Impact Synthesis */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Environmental Disruption Assessment</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Affected Maritime Corridors</span>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {currentHazard.affectedRouteIds.map(id => mockRoutes.find(r => r.id === id)?.name).join(' • ')}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Terminal Gateways Under Advisory</span>
                <p className="text-slate-700 font-medium mt-0.5">
                  Ports: {currentHazard.freightImpact.affectedPorts.join(', ')} (Slowed barge links & yard crane safety pauses)
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Freight Rate & Schedule Impact</span>
                <p className="text-slate-700 leading-relaxed">
                  Expected arrival delay of <strong>+{currentHazard.freightImpact.routeDelayDays} days</strong> on Transpacific loops, causing temporary backhaul equipment shortages in Shanghai and Ningbo.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">ECMWF Wave Model Calibrated</span>
            <Link href="/routes" className="text-sky-600 font-semibold hover:text-sky-800 flex items-center gap-1">
              Inspect Lane Alternatives <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
