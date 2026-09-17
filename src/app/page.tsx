'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Compass,
  TrendingUp,
  Navigation,
  Anchor,
  Ship,
  CloudLightning,
  ShieldAlert,
  Sparkles,
  Layers,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { OceanVesselHero } from '@/components/3d/OceanVesselHero';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { mockRouteForecasts } from '@/data/forecastData';

export default function LandingPage() {
  const [activeSignal, setActiveSignal] = useState('rates');

  const signals = [
    { id: 'rates', name: 'Freight Rates', icon: TrendingUp, val: '$4,180 / FEU', desc: 'Real-time spot quotes & index fluctuations across global mainlanes.' },
    { id: 'vessels', name: 'Vessel Movement', icon: Ship, val: '5,800+ Active Vessels', desc: 'AIS satellite coordinates, speed changes, and carrier tracking.' },
    { id: 'congestion', name: 'Port Congestion', icon: Anchor, val: '82/100 Tuas Singapore', desc: 'Automated berth queues, yard container dwell, and turnaround times.' },
    { id: 'weather', name: 'Weather Hazards', icon: CloudLightning, val: '8.8m Waves (Songda)', desc: 'Oceanic storms, gale fronts, and tropical wave height forecasts.' },
    { id: 'routes', name: 'Route Activity', icon: Navigation, val: '88.4% Cape Bypass', desc: 'Real-time transit times, route diversions, and canal bottlenecks.' },
    { id: 'patterns', name: 'Historical Patterns', icon: Activity, val: '7-Year Backtesting', desc: 'Seasonal cycles, holiday frontloading, and shipyard orderbooks.' },
  ];

  const sampleForecast = mockRouteForecasts['route-sha-rot']['30D'];

  return (
    <div className="space-y-24 py-6">
      {/* HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[75vh]">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/90 text-sky-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
            FREIGHTSENSE 2.0 ENTERPRISE INTELLIGENCE
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            See Where Global Freight <span className="ocean-gradient-text">Is Going.</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
            AI-powered maritime intelligence for understanding markets, routes, ports and freight demand. Observe live AIS flows, predict spot pricing with Bayesian ensembles, and stress-test global supply chain disruptions.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
            >
              Explore Intelligence
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/forecast"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-all hover:border-slate-300"
            >
              See How It Works
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold text-slate-900">$3,240</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Global FBX Index</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">142,000</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Daily AIS Signals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-700">91.8%</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Forecast Directional Acc.</p>
            </div>
          </div>
        </div>

        {/* 3D Container Ship & Ocean Visualization */}
        <div className="lg:col-span-6 h-[480px] lg:h-[580px]">
          <OceanVesselHero />
        </div>
      </section>

      {/* STORY SECTION 1: EVERY SHIPMENT LEAVES A SIGNAL */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase font-bold tracking-wider text-sky-600">The Maritime Signal Ecosystem</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Every shipment leaves a signal.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Freight markets do not shift in vacuum. FreightSense continuously ingests billions of telemetry points across ports, vessels, weather hazards, and bookings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((sig) => {
            const Icon = sig.icon;
            const isSelected = activeSignal === sig.id;
            return (
              <div
                key={sig.id}
                onClick={() => setActiveSignal(sig.id)}
                className={`glass-card rounded-2xl p-6 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 shadow-md bg-sky-50/30 ring-1 ring-sky-500/20'
                    : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    {sig.val}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{sig.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{sig.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* STORY SECTION 2: FREIGHTSENSE CONNECTS THEM */}
      <section className="glass-card rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs uppercase font-bold tracking-wider text-sky-600">Unified Knowledge Graph</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              FreightSense connects them.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Raw data alone creates noise. FreightSense maps disjointed telemetry into an interconnected causal network:
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-800">Port Congestion ↑</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-700">Vessel Turnaround Delay</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-sky-700">Slot Supply Absorption</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-800">Typhoon Songda Wave Alert</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-700">Transpacific Southern Diversion</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-sky-700">+48h ETA Slip</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="font-semibold text-slate-800">Bunker Fuel Index +$22/mt</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-700">Emergency Fuel Adjustment</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-sky-700">Contract Rate Floor Lift</span>
              </div>
            </div>

            <Link
              href="/signals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 pt-2"
            >
              Explore all 8 market signals & causal relationships <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-slate-200">Freight Graph Synthesis Matrix</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">LIVE GRAPH ACTIVE</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase">Asia-EU Corridor</p>
                <p className="text-base font-bold text-white mt-1">$4,180 / FEU</p>
                <p className="text-[11px] text-rose-400 mt-0.5">-1.99% weekly</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase">Transpacific Eastbound</p>
                <p className="text-base font-bold text-white mt-1">$4,890 / FEU</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">+4.49% weekly</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase">Singapore Hub Dwell</p>
                <p className="text-base font-bold text-white mt-1">4.6 Days</p>
                <p className="text-[11px] text-amber-400 mt-0.5">+0.7d surge</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase">Active ULCVs Tracked</p>
                <p className="text-base font-bold text-white mt-1">1,248 Vessels</p>
                <p className="text-[11px] text-sky-400 mt-0.5">17.8 kts avg speed</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase">VLSFO Bunker Fuel</p>
                <p className="text-base font-bold text-white mt-1">$615 / mt</p>
                <p className="text-[11px] text-slate-400 mt-0.5">+$22/mt m-o-m</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase">Market Risk Gauge</p>
                <p className="text-base font-bold text-amber-400 mt-1">Moderate (68)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">High volatility</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY SECTION 3: TURNS INTELLIGENCE INTO FORECASTS */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase font-bold tracking-wider text-sky-600">Predictive Econometrics</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            And turns intelligence into forecasts.
          </h2>
          <p className="text-slate-600 text-sm">
            Transition from lagging indicators to forward-looking decision support. Test scenarios across demand spikes, blank sailings, and weather routing.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <ForecastChart
            series={sampleForecast.series}
            expectedRateUsd={sampleForecast.expectedRateUsd}
            expectedChangePercent={sampleForecast.expectedChangePercent}
            confidencePercent={sampleForecast.confidencePercent}
            riskScore={sampleForecast.riskScore}
          />
        </div>
      </section>

      {/* COMPREHENSIVE CAPABILITIES GRID */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Commercial Intelligence Suite</h2>
          <p className="text-slate-500 text-xs sm:text-sm">28 specialized workspaces built for maritime supply chain leaders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/market" className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-200/80 block group">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 w-fit mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Market Intelligence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Benchmark spot freight indices across all global trade corridors with custom date ranges and volatility bands.</p>
          </Link>

          <Link href="/routes" className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-200/80 block group">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 w-fit mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Route Intelligence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Inspect origin-to-destination transit times, Red Sea diversions, Cape alternatives, and slot availability.</p>
          </Link>

          <Link href="/ports" className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-200/80 block group">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 w-fit mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Anchor className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Port Intelligence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Monitor vessel anchorage queues, container yard dwell days, berth productivity, and transshipment bottlenecks.</p>
          </Link>

          <Link href="/vessels" className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-200/80 block group">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 w-fit mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Ship className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Vessel Intelligence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Search commercial fleets by IMO, carrier, and flag with real-time waypoint progression timelines and ETA risk.</p>
          </Link>

          <Link href="/scenario" className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-200/80 block group">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 w-fit mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Scenario Analysis</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Simulate the impact of demand spikes, capacity drops, port strikes, and bunker fuel shifts on freight budgets.</p>
          </Link>

          <Link href="/insights" className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-200/80 block group">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 w-fit mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">AI Intelligence Briefs</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Deep domain analysis connecting observations, root causes, impacts, and confidence ratings without chatbot gimmicks.</p>
          </Link>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="glass-card rounded-3xl border border-sky-200/80 bg-gradient-to-br from-white via-sky-50/50 to-blue-50/60 p-12 text-center shadow-lg space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Observe. Understand. Predict. Decide.
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Join leading maritime logistics operators, cargo owners, and freight forwarders using FreightSense 2.0 to navigate market volatility.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
          >
            Launch Command Center
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
