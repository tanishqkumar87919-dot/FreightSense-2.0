'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  TrendingDown,
  Ship,
  Anchor,
  Fuel,
  Calendar,
  ArrowRight,
  Printer,
  Download,
  FileText,
  HelpCircle,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  Info,
  Copy,
  BookmarkPlus,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ScenarioCompareChart } from '@/components/charts/ScenarioCompareChart';
import { MetricCard } from '@/components/ui/MetricCard';
import { scenarioService, bulkScenarioService } from '@/services';
import { mockEastCoastPortConstraints } from '@/data/eastCoastPortConstraints';
import { mockBulkCommodities } from '@/data/bulkCargoData';
import { useCurrency } from '@/context/CurrencyContext';
import {
  ScenarioParameters,
  ScenarioResult,
  ScenarioPreset,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  DryBulkVesselClassName,
} from '@/types';

function ScenarioSimulatorInner() {
  const searchParams = useSearchParams();
  const { formatUsdConverted, currency, rates } = useCurrency();

  // Active top-level tab: 'bulk' (Phase 6 SIH Primary) vs 'container' (Existing Macro Shocks)
  const [activeTab, setActiveTab] = useState<'bulk' | 'container'>('bulk');

  // ============================================================================
  // BULK CARGO & CHARTERING WHAT-IF STATE (PHASE 6)
  // ============================================================================
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('preset-base');
  const [isSimulatingBulk, setIsSimulatingBulk] = useState<boolean>(false);
  const [simulationResponse, setSimulationResponse] = useState<ScenarioSimulationResponse | null>(null);

  // Base parameters
  const [baseParams, setBaseParams] = useState<ScenarioSimulationRequest>({
    scenario_name: 'Newcastle to Paradip Coking Coal Base',
    commodity_name: 'Coking Coal',
    origin_port: 'Newcastle, Australia',
    base_cargo_quantity_mt: 50000,
    base_freight_rate_usd_mt: 15.50,
    base_vessel_class: 'Panamax',
    base_destination_port_id: 'port-in-prt',
    base_bunker_price_usd_mt: 620.0,
    base_charter_hire_usd_day: 18000.0,
    base_demurrage_rate_usd_day: 18000.0,
    base_port_waiting_days: 1.8,
    base_port_pda_usd: 75000.0,
    base_laycan_start: '2026-10-15',
    base_laycan_end: '2026-10-25',
  });

  // Simulated overrides
  const [simOverrides, setSimOverrides] = useState<{
    cargo_quantity_mt: number;
    freight_rate_usd_mt: number;
    vessel_class: DryBulkVesselClassName;
    destination_port_id: string;
    bunker_price_usd_mt: number;
    charter_hire_usd_day: number;
    demurrage_rate_usd_day: number;
    port_waiting_days: number;
  }>({
    cargo_quantity_mt: 50000,
    freight_rate_usd_mt: 15.50,
    vessel_class: 'Panamax',
    destination_port_id: 'port-in-prt',
    bunker_price_usd_mt: 620.0,
    charter_hire_usd_day: 18000.0,
    demurrage_rate_usd_day: 18000.0,
    port_waiting_days: 1.8,
  });

  // Sensitivity Chart Tab
  const [sensitivityMetric, setSensitivityMetric] = useState<'waiting' | 'freight' | 'bunker'>('waiting');

  // Multi-scenario saved pin for side-by-side comparison
  const [savedScenario, setSavedScenario] = useState<{
    name: string;
    response: ScenarioSimulationResponse;
  } | null>(null);

  // Printable Report Modal state
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // ============================================================================
  // CONTAINER MACROECONOMIC SHOCKS STATE (PRESERVED 100%)
  // ============================================================================
  const [macroParams, setMacroParams] = useState<ScenarioParameters>({
    demandChangePercent: 10,
    capacityChangePercent: -5,
    portCongestionLevel: 68,
    weatherSeverityIndex: 45,
    bunkerFuelPriceUsd: 615,
    tradeVolumeChangePercent: 5,
  });

  const [activeMacroPreset, setActiveMacroPreset] = useState<string>('Custom');
  const [isSimulatingMacro, setIsSimulatingMacro] = useState(false);
  const [macroResult, setMacroResult] = useState<ScenarioResult>(scenarioService.runScenario(macroParams));

  const macroPresets: Record<string, ScenarioParameters> = {
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

  // Load presets & initial simulation on mount
  useEffect(() => {
    bulkScenarioService.getPresets().then((data) => {
      setPresets(data);
    });

    // Check if query params or localStorage has analysis context
    try {
      const pCargo = searchParams.get('cargo');
      const pOrigin = searchParams.get('origin');
      const pDest = searchParams.get('destination') || searchParams.get('port');
      const pVessel = searchParams.get('vessel') as DryBulkVesselClassName | null;
      const pQty = parseFloat(searchParams.get('quantity') || '');
      const pFreight = parseFloat(searchParams.get('freight') || '');
      const pBunker = parseFloat(searchParams.get('bunker') || '');

      if (pCargo || pDest || pVessel || !isNaN(pQty) || !isNaN(pFreight)) {
        setBaseParams((prev) => ({
          ...prev,
          commodity_name: pCargo || prev.commodity_name,
          origin_port: pOrigin || prev.origin_port,
          base_cargo_quantity_mt: !isNaN(pQty) ? pQty : prev.base_cargo_quantity_mt,
          base_freight_rate_usd_mt: !isNaN(pFreight) ? pFreight : prev.base_freight_rate_usd_mt,
          base_vessel_class: pVessel || prev.base_vessel_class,
          base_destination_port_id: pDest && mockEastCoastPortConstraints[pDest] ? pDest : prev.base_destination_port_id,
          base_bunker_price_usd_mt: !isNaN(pBunker) ? pBunker : prev.base_bunker_price_usd_mt,
        }));
        setSimOverrides((prev) => ({
          ...prev,
          cargo_quantity_mt: !isNaN(pQty) ? pQty : prev.cargo_quantity_mt,
          freight_rate_usd_mt: !isNaN(pFreight) ? pFreight : prev.freight_rate_usd_mt,
          vessel_class: pVessel || prev.vessel_class,
          destination_port_id: pDest && mockEastCoastPortConstraints[pDest] ? pDest : prev.destination_port_id,
          bunker_price_usd_mt: !isNaN(pBunker) ? pBunker : prev.bunker_price_usd_mt,
        }));
      } else {
        const stored = localStorage.getItem('freightsense_cargo_analysis');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.cargo_quantity_mt) {
            setBaseParams((prev) => ({
              ...prev,
              commodity_name: parsed.commodity_name || prev.commodity_name,
              base_cargo_quantity_mt: parsed.cargo_quantity_mt || prev.base_cargo_quantity_mt,
              base_destination_port_id: parsed.destination_port_id || prev.base_destination_port_id,
              base_vessel_class: (parsed.preferred_vessel_class as DryBulkVesselClassName) || prev.base_vessel_class,
            }));
            setSimOverrides((prev) => ({
              ...prev,
              cargo_quantity_mt: parsed.cargo_quantity_mt || prev.cargo_quantity_mt,
              destination_port_id: parsed.destination_port_id || prev.destination_port_id,
              vessel_class: (parsed.preferred_vessel_class as DryBulkVesselClassName) || prev.vessel_class,
            }));
          }
        }
      }
    } catch {
      // ignore
    }

    runBulkSimulation();
  }, []);

  // Run Bulk Simulation
  const runBulkSimulation = async (overrides = simOverrides, presetName?: string) => {
    setIsSimulatingBulk(true);
    const req: ScenarioSimulationRequest = {
      ...baseParams,
      scenario_name: presetName || (activePresetId !== 'custom' ? presets.find(p => p.preset_id === activePresetId)?.name : 'Custom What-If Scenario'),
      simulated_cargo_quantity_mt: overrides.cargo_quantity_mt,
      simulated_freight_rate_usd_mt: overrides.freight_rate_usd_mt,
      simulated_vessel_class: overrides.vessel_class,
      simulated_destination_port_id: overrides.destination_port_id,
      simulated_bunker_price_usd_mt: overrides.bunker_price_usd_mt,
      simulated_charter_hire_usd_day: overrides.charter_hire_usd_day,
      simulated_demurrage_rate_usd_day: overrides.demurrage_rate_usd_day,
      simulated_port_waiting_days: overrides.port_waiting_days,
    };

    const res = await bulkScenarioService.simulateScenario(req);
    setSimulationResponse(res);
    setIsSimulatingBulk(false);
  };

  // Preset Selection Handler
  const handleSelectPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.preset_id);
    const overrides = {
      cargo_quantity_mt: preset.variable_overrides.simulated_cargo_quantity_mt ?? baseParams.base_cargo_quantity_mt,
      freight_rate_usd_mt: preset.variable_overrides.simulated_freight_rate_usd_mt ?? baseParams.base_freight_rate_usd_mt,
      vessel_class: preset.variable_overrides.simulated_vessel_class ?? baseParams.base_vessel_class,
      destination_port_id: preset.variable_overrides.simulated_destination_port_id ?? baseParams.base_destination_port_id,
      bunker_price_usd_mt: preset.variable_overrides.simulated_bunker_price_usd_mt ?? baseParams.base_bunker_price_usd_mt,
      charter_hire_usd_day: preset.variable_overrides.simulated_charter_hire_usd_day ?? baseParams.base_charter_hire_usd_day,
      demurrage_rate_usd_day: preset.variable_overrides.simulated_demurrage_rate_usd_day ?? baseParams.base_demurrage_rate_usd_day,
      port_waiting_days: preset.variable_overrides.simulated_port_waiting_days ?? baseParams.base_port_waiting_days,
    };
    setSimOverrides(overrides);
    runBulkSimulation(overrides, preset.name);
  };

  // Quick Action Handler
  const handleQuickAction = (action: string) => {
    setActivePresetId('custom');
    let next = { ...simOverrides };
    if (action === 'freight_plus_10') {
      next.freight_rate_usd_mt = Math.round(next.freight_rate_usd_mt * 1.10 * 100) / 100;
    } else if (action === 'freight_minus_10') {
      next.freight_rate_usd_mt = Math.round(next.freight_rate_usd_mt * 0.90 * 100) / 100;
    } else if (action === 'waiting_plus_3') {
      next.port_waiting_days = Math.round((next.port_waiting_days + 3.0) * 10) / 10;
    } else if (action === 'shift_cape') {
      next.vessel_class = 'Capesize';
      next.cargo_quantity_mt = 120000;
      next.charter_hire_usd_day = 26000;
    } else if (action === 'shift_supra') {
      next.vessel_class = 'Supramax';
      next.cargo_quantity_mt = 50000;
      next.charter_hire_usd_day = 15500;
    } else if (action === 'bunker_plus_15') {
      next.bunker_price_usd_mt = Math.round(next.bunker_price_usd_mt * 1.15);
    } else if (action === 'reset_base') {
      next = {
        cargo_quantity_mt: baseParams.base_cargo_quantity_mt,
        freight_rate_usd_mt: baseParams.base_freight_rate_usd_mt,
        vessel_class: baseParams.base_vessel_class,
        destination_port_id: baseParams.base_destination_port_id,
        bunker_price_usd_mt: baseParams.base_bunker_price_usd_mt,
        charter_hire_usd_day: baseParams.base_charter_hire_usd_day,
        demurrage_rate_usd_day: baseParams.base_demurrage_rate_usd_day,
        port_waiting_days: baseParams.base_port_waiting_days,
      };
      setActivePresetId('preset-base');
    }
    setSimOverrides(next);
    runBulkSimulation(next);
  };

  // Load Current Cargo Analysis
  const handleLoadCurrentCargoAnalysis = () => {
    try {
      const stored = localStorage.getItem('freightsense_cargo_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        const newBase: ScenarioSimulationRequest = {
          ...baseParams,
          commodity_name: parsed.commodity_name || baseParams.commodity_name,
          base_cargo_quantity_mt: parsed.cargo_quantity_mt || 50000,
          base_destination_port_id: parsed.destination_port_id || 'port-in-prt',
          base_vessel_class: (parsed.preferred_vessel_class as DryBulkVesselClassName) || 'Panamax',
          base_freight_rate_usd_mt: parsed.indicative_freight_rate_usd_mt || 15.50,
        };
        const newOverrides = {
          ...simOverrides,
          cargo_quantity_mt: newBase.base_cargo_quantity_mt,
          destination_port_id: newBase.base_destination_port_id,
          vessel_class: newBase.base_vessel_class,
          freight_rate_usd_mt: newBase.base_freight_rate_usd_mt,
        };
        setBaseParams(newBase);
        setSimOverrides(newOverrides);
        runBulkSimulation(newOverrides, 'Loaded Cargo Requirement');
      } else {
        // Default canonical load
        handleQuickAction('reset_base');
      }
    } catch {
      handleQuickAction('reset_base');
    }
  };

  // Pin / Save Current Scenario for Comparison
  const handlePinScenario = () => {
    if (simulationResponse) {
      setSavedScenario({
        name: simulationResponse.scenario_name,
        response: simulationResponse,
      });
    }
  };

  // Macro Slider Handler (Container Simulator)
  const handleMacroSliderChange = (key: keyof ScenarioParameters, val: number) => {
    setActiveMacroPreset('Custom');
    setMacroParams((prev) => {
      const next = { ...prev, [key]: val };
      return next;
    });
  };

  const handleApplyMacroPreset = (presetName: string) => {
    setActiveMacroPreset(presetName);
    const newParams = macroPresets[presetName];
    setMacroParams(newParams);
    setMacroResult(scenarioService.runScenario(newParams));
  };

  const handleRunMacroScenario = () => {
    setIsSimulatingMacro(true);
    setTimeout(() => {
      setIsSimulatingMacro(false);
      setMacroResult(scenarioService.runScenario(macroParams));
    }, 400);
  };

  // Active sensitivity chart data
  const currentSensitivityTable = useMemo(() => {
    if (!simulationResponse) return null;
    if (sensitivityMetric === 'waiting') {
      return simulationResponse.sensitivity_tables.find(t => t.variable_name === 'Port Waiting Days');
    } else if (sensitivityMetric === 'freight') {
      return simulationResponse.sensitivity_tables.find(t => t.variable_name.includes('Freight Rate'));
    } else {
      return simulationResponse.sensitivity_tables.find(t => t.variable_name.includes('Bunker Price'));
    }
  }, [simulationResponse, sensitivityMetric]);

  return (
    <div className="space-y-8 pb-16">
      {/* TOP BREADCRUMB & HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-semibold">Scenario Simulator</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Scenario Simulator & What-If Decision Engine
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              SIH Phase 6
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Simulate and evaluate the impact of spot freight fluctuations, port waiting queues, vessel class shifts, and bunker volatility on total voyage economics into East Coast of India ports.
          </p>
        </div>

        {/* PRIMARY TAB SWITCHER */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bulk'
                ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ship className="w-4 h-4 text-sky-600" />
            Bulk Cargo & Chartering What-If
          </button>
          <button
            onClick={() => setActiveTab('container')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'container'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            Container Macro Shocks
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BULK CARGO & CHARTERING WHAT-IF SIMULATOR (PHASE 6 PRIMARY)       */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-8 animate-fadeIn">
          {/* CONTEXT BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/40 to-slate-50 border border-sky-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Active Simulation Baseline</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Decision Support Mode
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {baseParams.commodity_name} (50,000 MT Parcel) • {baseParams.origin_port} → Paradip Port (East Coast India)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Baseline Spot: ${baseParams.base_freight_rate_usd_mt}/MT • Anchorage Queue: {baseParams.base_port_waiting_days}d • Vessel: {baseParams.base_vessel_class} • Bunker VLSFO: ${baseParams.base_bunker_price_usd_mt}/MT
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleLoadCurrentCargoAnalysis}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-sky-700 border border-sky-300 hover:bg-sky-50 shadow-sm transition-all"
                title="Load parameters from Phase 2 / Phase 4 Cargo Requirement"
              >
                <Sparkles className="w-4 h-4 text-sky-600" />
                Load Current Cargo Analysis
              </button>
              <button
                onClick={() => handleQuickAction('reset_base')}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all"
                title="Reset all simulated variables to benchmark baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Base
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Report
              </button>
            </div>
          </div>

          {/* PRESETS CAROUSEL / CHIPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookmarkPlus className="w-3.5 h-3.5 text-sky-600" />
                Canonical Sensitivity Presets
              </span>
              <span className="text-[11px] text-slate-400">Click preset chip to apply structured market conditions</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {presets.map((p) => {
                const isActive = activePresetId === p.preset_id;
                return (
                  <button
                    key={p.preset_id}
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    <span className="text-xs font-bold leading-snug line-clamp-1">{p.name}</span>
                    <span className={`text-[10px] mt-1.5 line-clamp-1 ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                      {p.preset_id === 'preset-base' ? 'Standard' : p.name.includes('+') || p.name.includes('-') ? p.name.split('(')[1]?.replace(')', '') : 'What-If'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUICK WHAT-IF ACTIONS BAR */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              Quick What-If Adjustments:
            </span>
            <button
              onClick={() => handleQuickAction('freight_plus_10')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-rose-700 font-semibold hover:bg-rose-50 transition-colors"
            >
              +10% Freight Rate
            </button>
            <button
              onClick={() => handleQuickAction('freight_minus_10')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors"
            >
              -10% Freight Rate
            </button>
            <button
              onClick={() => handleQuickAction('waiting_plus_3')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
            >
              +3d Port Waiting
            </button>
            <button
              onClick={() => handleQuickAction('shift_cape')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
            >
              Shift to Capesize (120k MT)
            </button>
            <button
              onClick={() => handleQuickAction('shift_supra')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-teal-700 font-semibold hover:bg-teal-50 transition-colors"
            >
              Shift to Supramax Geared
            </button>
            <button
              onClick={() => handleQuickAction('bunker_plus_15')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-orange-700 font-semibold hover:bg-orange-50 transition-colors"
            >
              +15% Bunker Fuel
            </button>
            <button
              onClick={handlePinScenario}
              className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Pin for Side-by-Side Compare
            </button>
          </div>

          {/* MAIN SIMULATION CONTROLS & COMPARATIVE OUTPUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: WHAT-IF VARIABLE CONTROLS (4 COLS) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900">What-If Variable Controls</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Adjust Sliders
                  </span>
                </div>

                {/* 1. FREIGHT RATE SLIDER */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Spot Freight Rate ($/MT)
                    </span>
                    <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      ${simOverrides.freight_rate_usd_mt.toFixed(2)}/MT
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={30}
                    step={0.25}
                    value={simOverrides.freight_rate_usd_mt}
                    onChange={(e) => {
                      setActivePresetId('custom');
                      const val = parseFloat(e.target.value);
                      const next = { ...simOverrides, freight_rate_usd_mt: val };
                      setSimOverrides(next);
                      runBulkSimulation(next);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>$10/MT Soft</span>
                    <span className="text-slate-500">Base: ${baseParams.base_freight_rate_usd_mt.toFixed(2)}</span>
                    <span>$30/MT Bullish</span>
                  </div>
                </div>

                {/* 2. ANCHORAGE WAITING DAYS SLIDER */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Destination Waiting Days (Queue)
                    </span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {simOverrides.port_waiting_days.toFixed(1)} Days
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={0.5}
                    value={simOverrides.port_waiting_days}
                    onChange={(e) => {
                      setActivePresetId('custom');
                      const val = parseFloat(e.target.value);
                      const next = { ...simOverrides, port_waiting_days: val };
                      setSimOverrides(next);
                      runBulkSimulation(next);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>0d Direct Berth</span>
                    <span className="text-slate-500">Base: {baseParams.base_port_waiting_days}d</span>
                    <span>12d Severe Monsoon</span>
                  </div>
                </div>

                {/* 3. VESSEL CLASS SELECTOR */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Ship className="w-3.5 h-3.5 text-indigo-600" />
                    Vessel Class & Deadweight (DWT)
                  </label>
                  <select
                    value={simOverrides.vessel_class}
                    onChange={(e) => {
                      setActivePresetId('custom');
                      const vClass = e.target.value as DryBulkVesselClassName;
                      const next = { ...simOverrides, vessel_class: vClass };
                      if (vClass === 'Capesize' && next.cargo_quantity_mt < 100000) {
                        next.cargo_quantity_mt = 120000;
                        next.charter_hire_usd_day = 26000;
                      } else if (vClass === 'Supramax' && next.cargo_quantity_mt > 60000) {
                        next.cargo_quantity_mt = 50000;
                        next.charter_hire_usd_day = 15500;
                      }
                      setSimOverrides(next);
                      runBulkSimulation(next);
                    }}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Capesize">Capesize (180,000 DWT • Draft 17.8m)</option>
                    <option value="Kamsarmax">Kamsarmax (82,000 DWT • Draft 14.5m)</option>
                    <option value="Panamax">Panamax (75,000 DWT • Draft 14.1m)</option>
                    <option value="Ultramax">Ultramax (64,000 DWT • Draft 13.3m)</option>
                    <option value="Supramax">Supramax Geared (58,000 DWT • Draft 12.2m)</option>
                    <option value="Handysize">Handysize Geared (38,000 DWT • Draft 10.2m)</option>
                  </select>
                </div>

                {/* 4. CARGO QUANTITY / PARCEL SIZE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Simulated Parcel Quantity</span>
                    <span className="font-bold text-slate-900">
                      {simOverrides.cargo_quantity_mt.toLocaleString()} MT
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30000}
                    max={180000}
                    step={5000}
                    value={simOverrides.cargo_quantity_mt}
                    onChange={(e) => {
                      setActivePresetId('custom');
                      const val = parseInt(e.target.value);
                      const next = { ...simOverrides, cargo_quantity_mt: val };
                      setSimOverrides(next);
                      runBulkSimulation(next);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>30k MT Handysize</span>
                    <span>75k MT Panamax</span>
                    <span>180k MT Capesize</span>
                  </div>
                </div>

                {/* 5. DESTINATION PORT SELECTOR */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Anchor className="w-3.5 h-3.5 text-sky-600" />
                    East Coast Destination Port
                  </label>
                  <select
                    value={simOverrides.destination_port_id}
                    onChange={(e) => {
                      setActivePresetId('custom');
                      const portId = e.target.value;
                      const next = { ...simOverrides, destination_port_id: portId };
                      setSimOverrides(next);
                      runBulkSimulation(next);
                    }}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {Object.values(mockEastCoastPortConstraints).map((port) => (
                      <option key={port.portId} value={port.portId}>
                        {port.portName} ({port.state}) - Draft {port.maxPermissibleDraftMeters}m
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. BUNKER FUEL PRICE (VLSFO) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-orange-600" />
                      VLSFO Bunker Fuel Price ($/MT)
                    </span>
                    <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      ${simOverrides.bunker_price_usd_mt}/MT
                    </span>
                  </div>
                  <input
                    type="range"
                    min={480}
                    max={850}
                    step={10}
                    value={simOverrides.bunker_price_usd_mt}
                    onChange={(e) => {
                      setActivePresetId('custom');
                      const val = parseFloat(e.target.value);
                      const next = { ...simOverrides, bunker_price_usd_mt: val };
                      setSimOverrides(next);
                      runBulkSimulation(next);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>$480 Low</span>
                    <span className="text-slate-500">Base: ${baseParams.base_bunker_price_usd_mt}</span>
                    <span>$850 Geopolitical Spike</span>
                  </div>
                </div>

                {/* 7. TIME CHARTER HIRE & DEMURRAGE RATES */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Daily Hire ($/day)</label>
                    <input
                      type="number"
                      value={simOverrides.charter_hire_usd_day}
                      onChange={(e) => {
                        setActivePresetId('custom');
                        const val = parseFloat(e.target.value) || 18000;
                        const next = { ...simOverrides, charter_hire_usd_day: val };
                        setSimOverrides(next);
                        runBulkSimulation(next);
                      }}
                      className="w-full mt-1 text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Demurrage ($/day)</label>
                    <input
                      type="number"
                      value={simOverrides.demurrage_rate_usd_day}
                      onChange={(e) => {
                        setActivePresetId('custom');
                        const val = parseFloat(e.target.value) || 18000;
                        const next = { ...simOverrides, demurrage_rate_usd_day: val };
                        setSimOverrides(next);
                        runBulkSimulation(next);
                      }}
                      className="w-full mt-1 text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: SIMULATION RESULTS & COMPARATIVE OUTLAYS (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* PRIMARY COMPARATIVE KPI CARDS */}
              {simulationResponse && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* TOTAL VOYAGE OUTLAY */}
                  <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1">
                    <span className="text-[11px] uppercase font-bold text-slate-500">Total Voyage Outlay</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900">
                        {formatUsdConverted(simulationResponse.simulated_economics.total_voyage_outlay_usd, { compact: true })}
                      </span>
                      <span className={`flex items-center text-xs font-bold ${
                        simulationResponse.delta_total_outlay_usd > 0
                          ? 'text-rose-600'
                          : simulationResponse.delta_total_outlay_usd < 0
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}>
                        {simulationResponse.delta_total_outlay_usd > 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : simulationResponse.delta_total_outlay_usd < 0 ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : null}
                        {simulationResponse.delta_percentage_outlay > 0 ? '+' : ''}{simulationResponse.delta_percentage_outlay}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Base: {formatUsdConverted(simulationResponse.base_economics.total_voyage_outlay_usd, { compact: true })} (Δ {formatUsdConverted(Math.abs(Math.round(simulationResponse.delta_total_outlay_usd)))})
                    </p>
                  </div>

                  {/* DELIVERED COST PER MT */}
                  <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1">
                    <span className="text-[11px] uppercase font-bold text-slate-500">Delivered Cost / MT</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-sky-700">
                        {formatUsdConverted(simulationResponse.simulated_economics.cost_per_mt_usd, { unit: '/ MT' })}
                      </span>
                      <span className={`text-xs font-bold ${
                        simulationResponse.delta_cost_per_mt_usd > 0 ? 'text-rose-600' : simulationResponse.delta_cost_per_mt_usd < 0 ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {simulationResponse.delta_cost_per_mt_usd > 0 ? '+' : ''}{formatUsdConverted(simulationResponse.delta_cost_per_mt_usd, { unit: '/ MT' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Base Cost: {formatUsdConverted(simulationResponse.base_economics.cost_per_mt_usd, { unit: '/ MT' })}
                    </p>
                  </div>

                  {/* DEMURRAGE EXPOSURE */}
                  <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1">
                    <span className="text-[11px] uppercase font-bold text-slate-500">Demurrage Exposure</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-black ${
                        simulationResponse.simulated_economics.demurrage_exposure_usd > 50000 ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {formatUsdConverted(simulationResponse.simulated_economics.demurrage_exposure_usd)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Queue: {simulationResponse.simulated_economics.demurrage_exposure_usd > 0 ? `${simOverrides.port_waiting_days} days wait` : 'Zero congestion'}
                    </p>
                  </div>

                  {/* VESSEL & PORT COMPATIBILITY */}
                  <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1">
                    <span className="text-[11px] uppercase font-bold text-slate-500">Berth & UKC Status</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {simulationResponse.simulated_port_compatibility.is_compliant ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" /> Compatible ({simulationResponse.simulated_port_compatibility.ukc_status})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Non-Compliant
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Available UKC: {simulationResponse.simulated_port_compatibility.ukc_available_m}m
                    </p>
                  </div>
                </div>
              )}

              {/* CRITICAL RESTRICTION / ALERT NOTICES */}
              {simulationResponse && simulationResponse.simulated_port_compatibility.restrictions_found.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 shadow-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-sm text-rose-900">Port Restriction Detected in Simulation</p>
                    {simulationResponse.simulated_port_compatibility.restrictions_found.map((r, i) => (
                      <p key={i} className="leading-relaxed font-medium text-rose-800">
                        • {r}
                      </p>
                    ))}
                    <p className="text-[11px] text-rose-700 italic pt-1">
                      Action Required: Redirect to deepwater alternative (e.g. Kamarajar Port Ennore or Krishnapatnam) or reduce arrival draft through offshore lighterage.
                    </p>
                  </div>
                </div>
              )}

              {/* BEFORE VS AFTER DETAILED VOYAGE ECONOMICS TABLE */}
              {simulationResponse && (
                <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-600" />
                      <h3 className="text-sm font-bold text-slate-900">Before vs. After Voyage Economics Comparison</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Currency: {currency} {currency !== 'USD' ? `(Reference: 1 USD = ${rates[currency]} ${currency})` : '($)'} • Parcel: {simulationResponse.simulated_economics.cargo_quantity_mt.toLocaleString()} MT
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/70">
                          <th className="py-2.5 px-3">Cost / Operational Component</th>
                          <th className="py-2.5 px-3">Base Benchmark</th>
                          <th className="py-2.5 px-3 bg-sky-50/50 text-sky-900">Simulated Scenario</th>
                          <th className="py-2.5 px-3">Absolute Delta (Δ)</th>
                          <th className="py-2.5 px-3 text-right">Variance (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Ocean Freight Outlay</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatUsdConverted(simulationResponse.base_economics.total_freight_usd)}</td>
                          <td className="py-2.5 px-3 font-bold text-sky-900 bg-sky-50/40">{formatUsdConverted(simulationResponse.simulated_economics.total_freight_usd)}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{formatUsdConverted(simulationResponse.delta_total_freight_usd)}</td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            {simulationResponse.base_economics.total_freight_usd > 0
                              ? `${Math.round(((simulationResponse.simulated_economics.total_freight_usd - simulationResponse.base_economics.total_freight_usd) / simulationResponse.base_economics.total_freight_usd) * 100)}%`
                              : '0%'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Bunker Fuel Cost (VLSFO)</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatUsdConverted(simulationResponse.base_economics.total_bunker_cost_usd)}</td>
                          <td className="py-2.5 px-3 font-bold text-sky-900 bg-sky-50/40">{formatUsdConverted(simulationResponse.simulated_economics.total_bunker_cost_usd)}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{formatUsdConverted(simulationResponse.simulated_economics.total_bunker_cost_usd - simulationResponse.base_economics.total_bunker_cost_usd)}</td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            {Math.round(((simulationResponse.simulated_economics.total_bunker_cost_usd - simulationResponse.base_economics.total_bunker_cost_usd) / simulationResponse.base_economics.total_bunker_cost_usd) * 100)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Time Charter Hire Equivalent</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatUsdConverted(simulationResponse.base_economics.charter_hire_cost_usd)}</td>
                          <td className="py-2.5 px-3 font-bold text-sky-900 bg-sky-50/40">{formatUsdConverted(simulationResponse.simulated_economics.charter_hire_cost_usd)}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{formatUsdConverted(simulationResponse.simulated_economics.charter_hire_cost_usd - simulationResponse.base_economics.charter_hire_cost_usd)}</td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            {Math.round(((simulationResponse.simulated_economics.charter_hire_cost_usd - simulationResponse.base_economics.charter_hire_cost_usd) / simulationResponse.base_economics.charter_hire_cost_usd) * 100)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Port PDA (Disbursement Account)</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatUsdConverted(simulationResponse.base_economics.port_pda_usd)}</td>
                          <td className="py-2.5 px-3 font-bold text-sky-900 bg-sky-50/40">{formatUsdConverted(simulationResponse.simulated_economics.port_pda_usd)}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{formatUsdConverted(0)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">0%</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">Demurrage Liability Exposure</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatUsdConverted(simulationResponse.base_economics.demurrage_exposure_usd)}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-900 bg-amber-50/40">{formatUsdConverted(simulationResponse.simulated_economics.demurrage_exposure_usd)}</td>
                          <td className="py-2.5 px-3 text-amber-700 font-bold">{formatUsdConverted(simulationResponse.simulated_economics.demurrage_exposure_usd - simulationResponse.base_economics.demurrage_exposure_usd)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                            {simulationResponse.base_economics.demurrage_exposure_usd > 0
                              ? `${Math.round(((simulationResponse.simulated_economics.demurrage_exposure_usd - simulationResponse.base_economics.demurrage_exposure_usd) / simulationResponse.base_economics.demurrage_exposure_usd) * 100)}%`
                              : '+100%'}
                          </td>
                        </tr>
                        <tr className="bg-slate-100/70 font-black text-slate-900 text-[13px]">
                          <td className="py-3 px-3">Total Estimated Outlay</td>
                          <td className="py-3 px-3">{formatUsdConverted(simulationResponse.base_economics.total_voyage_outlay_usd)}</td>
                          <td className="py-3 px-3 text-sky-700 bg-sky-100/50">{formatUsdConverted(simulationResponse.simulated_economics.total_voyage_outlay_usd)}</td>
                          <td className="py-3 px-3 font-bold">{formatUsdConverted(simulationResponse.delta_total_outlay_usd)}</td>
                          <td className="py-3 px-3 text-right font-black">
                            {simulationResponse.delta_percentage_outlay > 0 ? '+' : ''}{simulationResponse.delta_percentage_outlay}%
                          </td>
                        </tr>
                        <tr className="bg-sky-50 font-bold text-sky-900">
                          <td className="py-2.5 px-3">Delivered Cost per Metric Tonne</td>
                          <td className="py-2.5 px-3">{formatUsdConverted(simulationResponse.base_economics.cost_per_mt_usd, { unit: '/ MT' })}</td>
                          <td className="py-2.5 px-3 text-sky-700 font-black">{formatUsdConverted(simulationResponse.simulated_economics.cost_per_mt_usd, { unit: '/ MT' })}</td>
                          <td className="py-2.5 px-3">{formatUsdConverted(simulationResponse.delta_cost_per_mt_usd, { unit: '/ MT' })}</td>
                          <td className="py-2.5 px-3 text-right">
                            {Math.round(((simulationResponse.simulated_economics.cost_per_mt_usd - simulationResponse.base_economics.cost_per_mt_usd) / simulationResponse.base_economics.cost_per_mt_usd) * 1000) / 10}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* SCENARIO IMPACT ATTRIBUTION BREAKDOWN TABLE */}
          {simulationResponse && simulationResponse.changed_variables.length > 0 && (
            <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">Scenario Parameter Impact Attribution</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {simulationResponse.changed_variables.length} active parameter overrides
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {simulationResponse.changed_variables.map((v, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{v.variable}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        {v.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Baseline</span>
                        <span className="font-semibold">{v.base_value}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Simulated</span>
                        <span className="font-bold text-sky-800">{v.simulated_value}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Variance</span>
                        <span className={`font-bold ${v.direction === 'increased' ? 'text-rose-600' : v.direction === 'decreased' ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {v.delta_percent > 0 ? `+${v.delta_percent}%` : `${v.delta_percent}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAUSAL DELTA INSPECTOR: WHAT CHANGED, WHY DID IT CHANGE, WHICH CONSTRAINT DROVE IT */}
          {simulationResponse && (
            <div className="glass-card rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      Causal Delta Inspector (SIH What-If Explainability)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Clear traceability: What parameters altered, economic formula breakdown, and binding constraints
                    </p>
                  </div>
                </div>

                <Link
                  href={`/decision-center?cargo=${encodeURIComponent(baseParams.commodity_name || 'Coking Coal')}&vessel=${encodeURIComponent(simOverrides.vessel_class)}&origin=${encodeURIComponent(baseParams.origin_port || 'Newcastle, Australia')}&destination=${encodeURIComponent(simOverrides.destination_port_id)}&freight=${simOverrides.freight_rate_usd_mt}&bunker=${simOverrides.bunker_price_usd_mt}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/30"
                >
                  <Layers className="w-4 h-4" />
                  <span>Send Scenario to Decision Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. What Changed */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase text-[11px]">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>1. What Changed?</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Active user perturbations applied over baseline charter:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-400">Anchorage Waiting</span>
                      <span className="font-bold text-amber-300">{baseParams.base_port_waiting_days}d → {simOverrides.port_waiting_days}d ({simOverrides.port_waiting_days > baseParams.base_port_waiting_days ? '+' : ''}{(simOverrides.port_waiting_days - baseParams.base_port_waiting_days).toFixed(1)}d)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-400">Bunker Fuel Price</span>
                      <span className="font-bold text-sky-300">${baseParams.base_bunker_price_usd_mt} → ${simOverrides.bunker_price_usd_mt}/MT</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-400">Vessel Class</span>
                      <span className="font-bold text-slate-100">{baseParams.base_vessel_class} → {simOverrides.vessel_class}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Why Did It Change */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[11px]">
                    <DollarSign className="w-4 h-4" />
                    <span>2. Why Did It Change?</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Deterministic voyage economics variance calculations:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-400">Demurrage Penalty</span>
                      <span className="font-bold text-amber-300">
                        {simulationResponse.simulated_economics.demurrage_exposure_usd > simulationResponse.base_economics.demurrage_exposure_usd
                          ? `+$${(simulationResponse.simulated_economics.demurrage_exposure_usd - simulationResponse.base_economics.demurrage_exposure_usd).toLocaleString()}`
                          : '$0'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-400">Total Bunker Outlay</span>
                      <span className="font-bold text-sky-300">
                        {simulationResponse.simulated_economics.total_bunker_cost_usd >= simulationResponse.base_economics.total_bunker_cost_usd ? '+' : ''}
                        ${(simulationResponse.simulated_economics.total_bunker_cost_usd - simulationResponse.base_economics.total_bunker_cost_usd).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-400">Net Outlay Delta</span>
                      <span className={`font-bold ${simulationResponse.delta_total_outlay_usd > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {simulationResponse.delta_total_outlay_usd > 0 ? '+' : ''}${Math.round(simulationResponse.delta_total_outlay_usd).toLocaleString()} ({simulationResponse.delta_percentage_outlay > 0 ? '+' : ''}{simulationResponse.delta_percentage_outlay}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Which Constraint Drove It */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[11px]">
                    <ShieldAlert className="w-4 h-4" />
                    <span>3. Binding Constraints</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Port infrastructure and charter party thresholds:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
                      <div className="text-[10px] text-slate-400">Draft Clearance (UKC)</div>
                      <div className="font-bold text-emerald-400 mt-0.5">
                        {simulationResponse.simulated_port_compatibility.is_compliant
                          ? `Safe (+${simulationResponse.simulated_port_compatibility.ukc_available_m}m margin)`
                          : `Violated (${simulationResponse.simulated_port_compatibility.restrictions_found[0] || 'Draft exceeds limit'})`}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
                      <div className="text-[10px] text-slate-400">Anchorage Laytime Rule</div>
                      <div className="font-bold text-slate-200 mt-0.5">
                        {simOverrides.port_waiting_days > 2.0
                          ? 'Congestion exceeds allowed 48h laytime → Demurrage triggered'
                          : 'Within typical operational turnaround window'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SENSITIVITY ANALYSIS CURVES (RECHARTS) */}
          {simulationResponse && currentSensitivityTable && (
            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sky-600" />
                    Multi-Variable Sensitivity Curves
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluate continuous outlay response across parameter stress levels.
                  </p>
                </div>

                {/* SENSITIVITY METRIC SELECTOR TABS */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setSensitivityMetric('waiting')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      sensitivityMetric === 'waiting'
                        ? 'bg-white text-sky-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Anchorage Waiting Days
                  </button>
                  <button
                    onClick={() => setSensitivityMetric('freight')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      sensitivityMetric === 'freight'
                        ? 'bg-white text-sky-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Freight Rate ($/MT)
                  </button>
                  <button
                    onClick={() => setSensitivityMetric('bunker')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      sensitivityMetric === 'bunker'
                        ? 'bg-white text-sky-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bunker Fuel (VLSFO)
                  </button>
                </div>
              </div>

              {/* RECHARTS SENSITIVITY CURVE */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={currentSensitivityTable.datapoints}
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="parameter_label"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#0284C7"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#10B981"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
                              <p className="font-bold text-sky-300">{currentSensitivityTable.variable_name}: {label}</p>
                              <p className="text-slate-200">
                                Total Outlay: <strong>${payload[0]?.value?.toLocaleString()}</strong>
                              </p>
                              <p className="text-emerald-300">
                                Cost/MT: <strong>${payload[1]?.value}</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="total_outlay_usd"
                      name="Total Voyage Outlay (USD)"
                      stroke="#0284C7"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0284C7' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost_per_mt_usd"
                      name="Delivered Cost per MT ($/MT)"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* MULTI-SCENARIO SIDE-BY-SIDE COMPARISON GRID */}
          {savedScenario && simulationResponse && (
            <div className="glass-card rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-4 bg-indigo-50/20">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Side-by-Side Multi-Scenario Comparison</h3>
                </div>
                <button
                  onClick={() => setSavedScenario(null)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear Comparison
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-white">
                      <th className="py-2.5 px-3">Metric / Parameter</th>
                      <th className="py-2.5 px-3">Benchmark Base</th>
                      <th className="py-2.5 px-3 bg-indigo-50 text-indigo-900">Pinned: {savedScenario.name}</th>
                      <th className="py-2.5 px-3 bg-sky-50 text-sky-900">Current Simulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-700">Vessel Class</td>
                      <td className="py-2 px-3">{simulationResponse.base_economics.cargo_quantity_mt} MT Panamax</td>
                      <td className="py-2 px-3 bg-indigo-50/30 font-semibold">{savedScenario.response.simulated_vessel_compatibility.vessel_class}</td>
                      <td className="py-2 px-3 bg-sky-50/30 font-bold text-sky-900">{simulationResponse.simulated_vessel_compatibility.vessel_class}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-700">Freight Rate</td>
                      <td className="py-2 px-3">{formatUsdConverted(simulationResponse.base_economics.freight_rate_usd_mt, { unit: '/ MT' })}</td>
                      <td className="py-2 px-3 bg-indigo-50/30">{formatUsdConverted(savedScenario.response.simulated_economics.freight_rate_usd_mt, { unit: '/ MT' })}</td>
                      <td className="py-2 px-3 bg-sky-50/30 font-bold text-sky-900">{formatUsdConverted(simulationResponse.simulated_economics.freight_rate_usd_mt, { unit: '/ MT' })}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-700">Waiting Days</td>
                      <td className="py-2 px-3">{baseParams.base_port_waiting_days}d</td>
                      <td className="py-2 px-3 bg-indigo-50/30">{savedScenario.response.simulated_economics.demurrage_exposure_usd > 0 ? 'Extended' : 'Normal'}</td>
                      <td className="py-2 px-3 bg-sky-50/30 font-bold text-sky-900">{simOverrides.port_waiting_days}d</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-700">Total Voyage Outlay</td>
                      <td className="py-2 px-3">{formatUsdConverted(simulationResponse.base_economics.total_voyage_outlay_usd)}</td>
                      <td className="py-2 px-3 bg-indigo-50/30 font-semibold">{formatUsdConverted(savedScenario.response.simulated_economics.total_voyage_outlay_usd)}</td>
                      <td className="py-2 px-3 bg-sky-50/30 font-black text-sky-900">{formatUsdConverted(simulationResponse.simulated_economics.total_voyage_outlay_usd)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-700">Delivered Cost / MT</td>
                      <td className="py-2 px-3">{formatUsdConverted(simulationResponse.base_economics.cost_per_mt_usd, { unit: '/ MT' })}</td>
                      <td className="py-2 px-3 bg-indigo-50/30 font-semibold">{formatUsdConverted(savedScenario.response.simulated_economics.cost_per_mt_usd, { unit: '/ MT' })}</td>
                      <td className="py-2 px-3 bg-sky-50/30 font-black text-sky-900">{formatUsdConverted(simulationResponse.simulated_economics.cost_per_mt_usd, { unit: '/ MT' })}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-700">Demurrage Exposure</td>
                      <td className="py-2 px-3">{formatUsdConverted(simulationResponse.base_economics.demurrage_exposure_usd)}</td>
                      <td className="py-2 px-3 bg-indigo-50/30">{formatUsdConverted(savedScenario.response.simulated_economics.demurrage_exposure_usd)}</td>
                      <td className="py-2 px-3 bg-sky-50/30 font-bold text-amber-700">{formatUsdConverted(simulationResponse.simulated_economics.demurrage_exposure_usd)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CAUSAL EXPLAINABILITY & STRATEGIC DECISION FACTORS */}
          {simulationResponse && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* CAUSAL AUDIT TRAIL */}
              <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">Causal Explainability: Why did the scenario change?</h3>
                </div>
                <div className="space-y-2.5">
                  {simulationResponse.explainability_chain.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* STRATEGIC DECISION FACTORS & TRADE-OFFS */}
              <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">Strategic Decision Factors & Recommendations</h3>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Identified Advantages</span>
                      <ul className="space-y-1">
                        {simulationResponse.decision_factors.advantages.map((adv, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span> {adv}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-700 block mb-1">Vulnerabilities & Risk Drivers</span>
                      <ul className="space-y-1">
                        {simulationResponse.decision_factors.vulnerabilities.map((vul, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-rose-500 font-bold">⚠</span> {vul}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Key Operational Trade-Off</span>
                      <p className="text-slate-700 italic">
                        {simulationResponse.decision_factors.tradeoffs[0]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs">
                    <span className="text-[10px] uppercase font-bold text-sky-800 block mb-0.5">Automated Recommendation</span>
                    <p className="font-semibold text-sky-900">
                      {simulationResponse.decision_factors.recommendation}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* DATA PROVENANCE FOOTER */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                {simulationResponse?.provenance.status || 'Simulated'}
              </span>
              <span>Source: FreightSense What-If Simulation Engine & Major Port Trust Tariffs</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Coverage: Newcastle → East Coast India Corridors • Non-binding analytical model
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONTAINER MACROECONOMIC SHOCKS (100% PRESERVED ORIGINAL)           */}
      {/* ========================================================================= */}
      {activeTab === 'container' && (
        <div className="space-y-8 animate-fadeIn">
          {/* HEADER & PRESETS ROW */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Macroeconomic Shock Profiles</h3>
                <p className="text-xs text-slate-500">Apply standard global container supply chain shock archetypes</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(macroPresets).map((pName) => (
                  <button
                    key={pName}
                    onClick={() => handleApplyMacroPreset(pName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      activeMacroPreset === pName
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {pName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SLIDERS & PARAMETER CONTROLS */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-semibold text-slate-900">Macro Parameter Adjustment</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApplyMacroPreset('Base Case')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={handleRunMacroScenario}
                  disabled={isSimulatingMacro}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isSimulatingMacro ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Demand Shift */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Consumer Demand Variance</span>
                  <span className="font-semibold text-indigo-600">
                    {macroParams.demandChangePercent > 0 ? '+' : ''}{macroParams.demandChangePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="40"
                  step="5"
                  value={macroParams.demandChangePercent}
                  onChange={(e) => handleMacroSliderChange('demandChangePercent', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-30% Slump</span>
                  <span>Baseline (0%)</span>
                  <span>+40% Boom</span>
                </div>
              </div>

              {/* Capacity Shift */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Vessel Capacity Variance</span>
                  <span className="font-semibold text-indigo-600">
                    {macroParams.capacityChangePercent > 0 ? '+' : ''}{macroParams.capacityChangePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="20"
                  step="5"
                  value={macroParams.capacityChangePercent}
                  onChange={(e) => handleMacroSliderChange('capacityChangePercent', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-40% Bottleneck</span>
                  <span>Baseline (0%)</span>
                  <span>+20% Oversupply</span>
                </div>
              </div>

              {/* Port Congestion */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Port Congestion Level</span>
                  <span className="font-semibold text-indigo-600">{macroParams.portCongestionLevel}/100</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={macroParams.portCongestionLevel}
                  onChange={(e) => handleMacroSliderChange('portCongestionLevel', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Fluid (20)</span>
                  <span>Normal (50)</span>
                  <span>Severe (100)</span>
                </div>
              </div>

              {/* Bunker Fuel */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">VLSFO Bunker Fuel Price</span>
                  <span className="font-semibold text-indigo-600">${macroParams.bunkerFuelPriceUsd} / MT</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="900"
                  step="25"
                  value={macroParams.bunkerFuelPriceUsd}
                  onChange={(e) => handleMacroSliderChange('bunkerFuelPriceUsd', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>$400 Cheap</span>
                  <span>$600 Baseline</span>
                  <span>$900 Spike</span>
                </div>
              </div>

              {/* Weather Severity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Weather Severity Index</span>
                  <span className="font-semibold text-indigo-600">{macroParams.weatherSeverityIndex}/100</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={macroParams.weatherSeverityIndex}
                  onChange={(e) => handleMacroSliderChange('weatherSeverityIndex', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Calm (10)</span>
                  <span>Moderate (50)</span>
                  <span>Severe (100)</span>
                </div>
              </div>

              {/* Trade Volume */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Trade Volume Variance</span>
                  <span className="font-semibold text-indigo-600">
                    {macroParams.tradeVolumeChangePercent > 0 ? '+' : ''}{macroParams.tradeVolumeChangePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="5"
                  value={macroParams.tradeVolumeChangePercent}
                  onChange={(e) => handleMacroSliderChange('tradeVolumeChangePercent', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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
              value={`$${macroResult.projectedRateUsd.toLocaleString()}`}
              unit="/ FEU"
              change={`${macroResult.rateDeltaPercent > 0 ? '+' : ''}${macroResult.rateDeltaPercent}%`}
              changeType={macroResult.rateDeltaPercent > 0 ? 'negative' : 'positive'}
              trendDirection={macroResult.rateDeltaPercent > 0 ? 'up' : 'down'}
              subtext={`Baseline $${macroResult.baselineRateUsd}`}
              icon={DollarSign}
            />
            <MetricCard
              label="Projected Roundtrip Delay"
              value={`${macroResult.expectedDelayDays} Days`}
              change={`${macroResult.delayDeltaDays > 0 ? '+' : ''}${macroResult.delayDeltaDays}d variance`}
              changeType="negative"
              subtext="Berth and Canal Dwell"
              icon={Clock}
            />
            <MetricCard
              label="Capacity Pressure"
              value={`${macroResult.capacityPressurePercent}%`}
              change="Extreme"
              changeType="negative"
              subtext="Vessel Space Committed"
              icon={Layers}
            />
            <MetricCard
              label="Composite Risk Score"
              value={`${macroResult.projectedRiskScore} / 100`}
              change={macroResult.projectedRiskScore > 70 ? 'High' : 'Moderate'}
              changeType={macroResult.projectedRiskScore > 70 ? 'negative' : 'positive'}
              subtext="Supply Chain Exposure"
              icon={AlertTriangle}
            />
          </div>

          {/* BEFORE / AFTER FORECAST COMPARISON CHART */}
          <ScenarioCompareChart
            series={macroResult.series}
            rateDeltaPercent={macroResult.rateDeltaPercent}
          />

          {/* FACTOR BREAKDOWN & AI SYNTHESIS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Factor Contribution Attribution</h3>
              <p className="text-xs text-slate-500">Decomposition of the simulated rate movement:</p>

              <div className="space-y-3">
                {macroResult.drivers.map((d, i) => (
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

            <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">AI Macro Scenario Synthesis</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-700 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 font-medium">
                    {macroResult.explanation}
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Budget Impact Projection</span>
                    <p className="text-slate-800 font-semibold text-xs">
                      Estimated procurement cost variance: <strong>{macroResult.rateDeltaPercent > 0 ? '+' : ''}{macroResult.rateDeltaPercent}%</strong> on 1,000 FEU annual volume ≈ <strong>${Math.round(Math.abs(macroResult.projectedRateUsd - macroResult.baselineRateUsd) * 1000).toLocaleString()} USD</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link href="/reports" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                  Export Scenario to Executive Report <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE SCENARIO REPORT MODAL                                          */}
      {/* ========================================================================= */}
      {showReportModal && simulationResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">FreightSense 2.0 • Executive Briefing</span>
                <h2 className="text-lg font-bold text-slate-900">{simulationResponse.scenario_name}</h2>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-slate-700">
                <div><strong>Corridor:</strong> {baseParams.origin_port} → Paradip Port</div>
                <div><strong>Commodity:</strong> {baseParams.commodity_name}</div>
                <div><strong>Base Parcel:</strong> {simulationResponse.base_economics.cargo_quantity_mt.toLocaleString()} MT</div>
                <div><strong>Simulated Parcel:</strong> {simulationResponse.simulated_economics.cargo_quantity_mt.toLocaleString()} MT</div>
                <div><strong>Simulated Outlay:</strong> {formatUsdConverted(simulationResponse.simulated_economics.total_voyage_outlay_usd)} {currency !== 'USD' ? `(≈ $${(simulationResponse.simulated_economics.total_voyage_outlay_usd / 1000).toFixed(1)}k USD)` : ''}</div>
                <div><strong>Cost / MT:</strong> {formatUsdConverted(simulationResponse.simulated_economics.cost_per_mt_usd, { unit: '/ MT' })}</div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">Key Economic Variances:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Total outlay delta: <strong>{formatUsdConverted(simulationResponse.delta_total_outlay_usd)} ({simulationResponse.delta_percentage_outlay}%)</strong></li>
                  <li>Delivered cost delta: <strong>{formatUsdConverted(simulationResponse.delta_cost_per_mt_usd, { unit: '/ MT' })}</strong></li>
                  <li>Demurrage exposure: <strong>{formatUsdConverted(simulationResponse.simulated_economics.demurrage_exposure_usd)}</strong></li>
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">Explainability Summary:</h4>
                {simulationResponse.explainability_chain.map((c, i) => (
                  <p key={i} className="text-slate-600">• {c}</p>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="font-bold text-sky-900">Recommendation:</span>
                <p className="text-sky-800 mt-0.5">{simulationResponse.decision_factors.recommendation}</p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>Timestamp: {new Date().toLocaleString()}</span>
                <span>Generated by FreightSense What-If Simulation Engine</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScenarioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Scenario Simulator...</div>}>
      <ScenarioSimulatorInner />
    </Suspense>
  );
}
