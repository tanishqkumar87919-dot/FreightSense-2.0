'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ScenarioCompareChart } from '@/components/charts/ScenarioCompareChart';
import { MetricCard } from '@/components/ui/MetricCard';
import { scenarioService } from '@/services';
import { ScenarioParameters, ScenarioResult } from '@/types';

export default function ScenarioPage() {
  const [params, setParams] = useState<ScenarioParameters>({
    demandChangePercent: 10,
    capacityChangePercent: -5,
    portCongestionLevel: 68,
    weatherSeverityIndex: 45,
    bunkerFuelPriceUsd: 615,
    tradeVolumeChangePercent: 5,
  });

  const [activePreset, setActivePreset] = useState<string>('Custom');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<ScenarioResult>(scenarioService.runScenario(params));

  const presets: Record<string, ScenarioParameters> = {
    'Base Case': {
      demandChangePercent: 0,
      capacityChangePercent: 0,
      portCongestionLevel: 50,
      weatherSeverityIndex: 30,
      bunkerFuelPriceUsd: 600,
      tradeVolumeChangePercent: 0,
    },
    'High Demand Spike': {
      demandChangePercent: 20,
      capacityChangePercent: -5,
      portCongestionLevel: 75,
      weatherSeverityIndex: 35,
      bunkerFuelPriceUsd: 630,
      tradeVolumeChangePercent: 15,
    },
    'Low Fleet Capacity (Suez Diversion)': {
      demandChangePercent: 5,
      capacityChangePercent: -20,
      portCongestionLevel: 80,
      weatherSeverityIndex: 40,
      bunkerFuelPriceUsd: 680,
      tradeVolumeChangePercent: 0,
    },
    'Port Labor Disruption': {
      demandChangePercent: 0,
      capacityChangePercent: -10,
      portCongestionLevel: 95,
      weatherSeverityIndex: 30,
      bunkerFuelPriceUsd: 610,
      tradeVolumeChangePercent: -5,
    },
    'Severe Winter Weather': {
      demandChangePercent: -5,
      capacityChangePercent: -15,
      portCongestionLevel: 70,
      weatherSeverityIndex: 90,
      bunkerFuelPriceUsd: 640,
      tradeVolumeChangePercent: -10,
    },
  };

  const handleApplyPreset = (presetName: string) => {
    setActivePreset(presetName);
    const newParams = presets[presetName];
    setParams(newParams);
    setResult(scenarioService.runScenario(newParams));
  };

  const handleSliderChange = (key: keyof ScenarioParameters, val: number) => {
    setActivePreset('Custom');
    setParams(prev => {
      const next = { ...prev, [key]: val };
      return next;
    });
  };

  const handleRunScenario = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setResult(scenarioService.runScenario(params));
    }, 450);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              What Happens If the Market Changes?
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
              Dynamic Elasticity Simulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate the impact of macro shocks, fuel spikes, port congestion surges, and fleet capacity reductions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleApplyPreset('Base Case')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to Baseline</span>
          </button>

          <button
            onClick={handleRunScenario}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-70"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Evaluating...' : 'Run Scenario Simulation'}</span>
          </button>
        </div>
      </div>

      {/* SCENARIO PRESETS BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        <span className="text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap mr-1">Quick Presets:</span>
        {Object.keys(presets).map((p) => (
          <button
            key={p}
            onClick={() => handleApplyPreset(p)}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
              activePreset === p
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* INTERACTIVE CONTROLS PANEL */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Shock & Parameter Sliders</h3>
          <span className="text-[11px] text-slate-400">Baseline Rate: $4,180 / FEU (Shanghai - Rotterdam)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Slider 1: Demand */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Container Booking Demand</span>
              <span className={`font-bold ${params.demandChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {params.demandChangePercent > 0 ? '+' : ''}{params.demandChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={params.demandChangePercent}
              onChange={(e) => handleSliderChange('demandChangePercent', Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-30% Drop</span>
              <span>Baseline (0%)</span>
              <span>+30% Spike</span>
            </div>
          </div>

          {/* Slider 2: Capacity */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Vessel Slot Capacity</span>
              <span className={`font-bold ${params.capacityChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {params.capacityChangePercent > 0 ? '+' : ''}{params.capacityChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={params.capacityChangePercent}
              onChange={(e) => handleSliderChange('capacityChangePercent', Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-30% Blank Sailings</span>
              <span>Baseline (0%)</span>
              <span>+30% Surplus</span>
            </div>
          </div>

          {/* Slider 3: Port Congestion */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Port Congestion Level</span>
              <span className="text-amber-600 font-bold">{params.portCongestionLevel} / 100</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={params.portCongestionLevel}
              onChange={(e) => handleSliderChange('portCongestionLevel', Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Fluid (10)</span>
              <span>Normal (50)</span>
              <span>Severe Gridlock (100)</span>
            </div>
          </div>

          {/* Slider 4: Weather Severity */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Weather Hazard Severity</span>
              <span className="text-rose-600 font-bold">{params.weatherSeverityIndex} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={params.weatherSeverityIndex}
              onChange={(e) => handleSliderChange('weatherSeverityIndex', Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Calm (0)</span>
              <span>Moderate (50)</span>
              <span>Category 4+ (100)</span>
            </div>
          </div>

          {/* Slider 5: Fuel Price */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Bunker Fuel Price (VLSFO)</span>
              <span className="text-slate-900 font-bold">${params.bunkerFuelPriceUsd} / mt</span>
            </div>
            <input
              type="range"
              min="400"
              max="1000"
              step="25"
              value={params.bunkerFuelPriceUsd}
              onChange={(e) => handleSliderChange('bunkerFuelPriceUsd', Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$400 / mt</span>
              <span>$600 (Current)</span>
              <span>$1,000 / mt</span>
            </div>
          </div>

          {/* Slider 6: Trade Volume */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Macro Trade Volume</span>
              <span className={`font-bold ${params.tradeVolumeChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {params.tradeVolumeChangePercent > 0 ? '+' : ''}{params.tradeVolumeChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="2"
              value={params.tradeVolumeChangePercent}
              onChange={(e) => handleSliderChange('tradeVolumeChangePercent', Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-20% Recession</span>
              <span>Baseline (0%)</span>
              <span>+20% Boom</span>
            </div>
          </div>
        </div>
      </div>

      {/* SIMULATED RESULTS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Simulated Freight Rate"
          value={`$${result.projectedRateUsd.toLocaleString()}`}
          unit="/ FEU"
          change={`${result.rateDeltaPercent > 0 ? '+' : ''}${result.rateDeltaPercent}%`}
          changeType={result.rateDeltaPercent > 0 ? 'negative' : 'positive'}
          trendDirection={result.rateDeltaPercent > 0 ? 'up' : 'down'}
          subtext={`Baseline $${result.baselineRateUsd}`}
          icon={DollarSign}
        />
        <MetricCard
          label="Projected Roundtrip Delay"
          value={`${result.expectedDelayDays} Days`}
          change={`${result.delayDeltaDays > 0 ? '+' : ''}${result.delayDeltaDays}d variance`}
          changeType="negative"
          subtext="Berth and Canal Dwell"
          icon={Clock}
        />
        <MetricCard
          label="Capacity Pressure"
          value={`${result.capacityPressurePercent}%`}
          change="Extreme"
          changeType="negative"
          subtext="Vessel Space Committed"
          icon={Layers}
        />
        <MetricCard
          label="Composite Risk Score"
          value={`${result.projectedRiskScore} / 100`}
          change={result.projectedRiskScore > 70 ? 'High' : 'Moderate'}
          changeType={result.projectedRiskScore > 70 ? 'negative' : 'positive'}
          subtext="Supply Chain Exposure"
          icon={AlertTriangle}
        />
      </div>

      {/* BEFORE / AFTER FORECAST COMPARISON CHART */}
      <ScenarioCompareChart
        series={result.series}
        rateDeltaPercent={result.rateDeltaPercent}
      />

      {/* IMPACT BREAKDOWN & AI SCENARIO SYNTHESIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Factor Breakdown */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Factor Contribution Attribution</h3>
          <p className="text-xs text-slate-500">Decomposition of the simulated rate movement:</p>

          <div className="space-y-3">
            {result.drivers.map((d, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{d.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Elasticity weight: {d.weight} pts</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                  d.contribution.startsWith('+') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {d.contribution}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Explanation Box */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Scenario Synthesis & Mitigation</h3>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed bg-sky-50/50 p-4 rounded-xl border border-sky-100 font-medium">
                {result.explanation}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Budget Impact Projection</span>
                <p className="text-slate-800 font-semibold text-xs">
                  Estimated procurement cost variance: <strong>{result.rateDeltaPercent > 0 ? '+' : ''}{result.rateDeltaPercent}%</strong> on 1,000 FEU annual volume ≈ <strong>${Math.round(Math.abs(result.projectedRateUsd - result.baselineRateUsd) * 1000).toLocaleString()} USD</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/reports" className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1">
              Export Scenario to Executive Report <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
