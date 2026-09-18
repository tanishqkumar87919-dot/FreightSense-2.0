'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  DollarSign,
  Fuel,
  Activity,
  ChevronRight,
  TrendingUp,
  Scale,
  Sliders,
  ShieldCheck,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MaritimeMap } from '@/components/maps/MaritimeMap';
import { mockVessels } from '@/data/vesselData';
import { mockCandidateBulkVessels } from '@/data/bulkCargoData';
import { mockEastCoastPortConstraints } from '@/data/eastCoastPortConstraints';
import { VesselItem, CharterCandidateVessel, CharteringEvaluationResponse, VesselFitAnalysisResult } from '@/types';
import { useWatchlist } from '@/context/WatchlistContext';
import { charteringService, forecastService } from '@/services';

function VesselsContent() {
  const searchParams = useSearchParams();

  // Ingest URL parameters if navigating from /cargo-analysis or /forecast
  const initialTab = searchParams.get('tab') === 'fleet' ? 'fleet' : 'chartering';
  const paramCargo = searchParams.get('cargo') || 'Hard Coking Coal (HCC)';
  const paramOrigin = searchParams.get('origin') || 'Newcastle / Hay Point, Australia';
  const paramDestination = searchParams.get('destination') || 'Paradip Port';
  const paramVessel = searchParams.get('vessel') || 'Panamax';
  const paramLaycan = searchParams.get('laycan') || '2026-10-15 to 2026-10-25';
  const paramQuantity = parseFloat(searchParams.get('quantity') || '50000');
  const paramFreight = parseFloat(searchParams.get('freight') || '14.80');
  const paramRoute = searchParams.get('route') || 'route-aus-paradip';

  const [activeTab, setActiveTab] = useState<'chartering' | 'fleet'>(initialTab);

  // ----------------------------------------------------------------------
  // CHARTERING WORKSPACE STATE
  // ----------------------------------------------------------------------
  const [cargoRequirement, setCargoRequirement] = useState({
    commodity: paramCargo,
    quantityMt: paramQuantity,
    originPort: paramOrigin,
    destinationPort: paramDestination,
    laycanStart: '2026-10-15',
    laycanEnd: '2026-10-25',
    preferredClass: paramVessel,
  });

  // User-provided market overrides
  const [targetFreight, setTargetFreight] = useState<number>(paramFreight);
  const [dailyHireOverride, setDailyHireOverride] = useState<number | undefined>(undefined);
  const [bunkerFuelPrice, setBunkerFuelPrice] = useState<number>(615.0);
  const [demurrageRateOverride, setDemurrageRateOverride] = useState<number | undefined>(undefined);
  const [portCostOverride, setPortCostOverride] = useState<number>(45000.0);

  // Evaluation response state
  const [evaluationData, setEvaluationData] = useState<CharteringEvaluationResponse | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('ves-bulk-odisha-maratha');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Forecast Outlook state
  const [forecastOutlook, setForecastOutlook] = useState<any>(null);

  // ----------------------------------------------------------------------
  // FLEET TRACKING STATE (Preserved Containership Fleet)
  // ----------------------------------------------------------------------
  const [selectedVesselId, setSelectedVesselId] = useState('ves-msc-irina');
  const [carrierFilter, setCarrierFilter] = useState('All Carriers');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem, isSaved, removeItem } = useWatchlist();

  const currentTrackedVessel = mockVessels.find(v => v.id === selectedVesselId) || mockVessels[0];
  const saved = isSaved(currentTrackedVessel.id);

  const filteredTrackedVessels = mockVessels.filter((v) => {
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
      removeItem(currentTrackedVessel.id);
    } else {
      addItem({
        id: currentTrackedVessel.id,
        name: `${currentTrackedVessel.name} (IMO ${currentTrackedVessel.imo})`,
        type: 'Vessels',
        status: `${currentTrackedVessel.currentStatus} (${currentTrackedVessel.currentSpeedKnots} kts)`,
        latestChange: `Destination: ${currentTrackedVessel.destinationPort}`,
        forecast: `ETA ${currentTrackedVessel.estimatedArrival}`,
        risk: currentTrackedVessel.currentStatus === 'Delayed' ? 'High' : 'Low',
        lastUpdated: 'Just now',
        targetPath: '/vessels',
      });
    }
  };

  // Run evaluation
  const runEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await charteringService.evaluateCharter({
        commodity_id: cargoRequirement.commodity,
        cargo_quantity_mt: cargoRequirement.quantityMt,
        origin_port: cargoRequirement.originPort,
        destination_port: cargoRequirement.destinationPort,
        laycan_start: cargoRequirement.laycanStart,
        laycan_end: cargoRequirement.laycanEnd,
        target_freight_usd_mt: targetFreight,
        daily_hire_usd_day: dailyHireOverride,
        bunker_fuel_price_usd_mt: bunkerFuelPrice,
        demurrage_rate_usd_day: demurrageRateOverride,
        port_cost_usd: portCostOverride,
      });
      if (res) {
        setEvaluationData(res);
        if (res.recommended_vessel_id && !selectedCandidateId) {
          setSelectedCandidateId(res.recommended_vessel_id);
        }
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // Initial evaluation & forecast load
  useEffect(() => {
    runEvaluation();
    forecastService.getForecast(paramRoute || 'route-aus-paradip', '14D').then(f => {
      if (f) setForecastOutlook(f);
    });
  }, [
    cargoRequirement.quantityMt,
    cargoRequirement.destinationPort,
    targetFreight,
    dailyHireOverride,
    bunkerFuelPrice,
    demurrageRateOverride,
    portCostOverride,
  ]);

  // Selected candidate analysis result
  const activeCandidateAnalysis: VesselFitAnalysisResult | undefined =
    evaluationData?.vessel_analyses.find(a => a.vessel.id === selectedCandidateId) ||
    evaluationData?.vessel_analyses[0];

  // Helper to load SIH demo scenario
  const loadSihDemo = () => {
    setCargoRequirement({
      commodity: 'Hard Coking Coal (HCC)',
      quantityMt: 50000,
      originPort: 'Newcastle / Hay Point, Australia',
      destinationPort: 'Paradip Port',
      laycanStart: '2026-10-15',
      laycanEnd: '2026-10-25',
      preferredClass: 'Panamax',
    });
    setTargetFreight(15.00);
    setBunkerFuelPrice(615.0);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Vessel Selection & Fleet Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-600 animate-pulse" />
              SIH Phase 4: Optimized Vessel Chartering
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-200 flex items-center gap-1">
              <Anchor className="w-3 h-3 text-indigo-600" />
              East Coast India Port Constraints
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end bulk vessel selection, port draft compatibility, laycan timeline validation, and transparent voyage economics (Voyage vs Time Charter)
          </p>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('chartering')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chartering'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ship className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chartering Optimization</span>
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fleet'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-sky-600" />
            <span>Fleet Tracking (AIS)</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: CHARTERING OPTIMIZATION WORKSPACE (PRIMARY PHASE 4 WORKFLOW) */}
      {/* ==================================================================== */}
      {activeTab === 'chartering' && (
        <div className="space-y-6 animate-in fade-in">
          {/* SECTION 1: CARGO REQUIREMENT & FORECAST CONTEXT STRIP */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-700/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-400">
                  Active Procurement & Freight Forecast Context
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px] border border-slate-700">
                  Bridged from /cargo-analysis & /forecast
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSihDemo}
                  className="px-3 py-1 rounded-lg bg-sky-600/80 hover:bg-sky-600 text-white font-semibold text-[11px] transition-colors"
                >
                  Load Canonical SIH Scenario
                </button>
                <Link
                  href="/cargo-analysis"
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition-colors flex items-center gap-1"
                >
                  Edit Cargo <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 font-medium text-slate-300">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Commodity</span>
                <span className="text-white font-bold text-xs">{cargoRequirement.commodity}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Parcel Quantity</span>
                <span className="text-white font-bold text-xs">{cargoRequirement.quantityMt.toLocaleString()} MT</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Origin Port</span>
                <span className="text-white font-bold text-xs">{cargoRequirement.originPort}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Destination Port</span>
                <span className="text-white font-bold text-xs">{cargoRequirement.destinationPort}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Laycan Window</span>
                <span className="text-amber-400 font-bold text-xs">{cargoRequirement.laycanStart} to {cargoRequirement.laycanEnd}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">14D Freight Outlook</span>
                <span className="text-emerald-400 font-bold text-xs">
                  ${forecastOutlook?.expectedRateUsd ? Number(forecastOutlook.expectedRateUsd).toFixed(2) : '14.85'} / MT
                  <span className="text-[10px] text-slate-400 font-normal ml-1">({forecastOutlook?.trend || 'Stable'})</span>
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-300">Next Steps in Decision Workflow:</span>
                <span>Evaluate port constraints & simulate what-if scenarios for this charter</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/ports?destination=${encodeURIComponent(cargoRequirement.destinationPort)}&cargo=${encodeURIComponent(cargoRequirement.commodity)}&quantity=${cargoRequirement.quantityMt}&vessel=${encodeURIComponent(cargoRequirement.preferredClass)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Anchor className="w-3.5 h-3.5" />
                  <span>Step 5: Port Intelligence</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/scenario?cargo=${encodeURIComponent(cargoRequirement.commodity)}&origin=${encodeURIComponent(cargoRequirement.originPort)}&destination=${encodeURIComponent(cargoRequirement.destinationPort)}&vessel=${encodeURIComponent(cargoRequirement.preferredClass)}&quantity=${cargoRequirement.quantityMt}&freight=${targetFreight}&bunker=${bunkerFuelPrice}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Step 6: Scenario Simulator</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/decision-center?cargo=${encodeURIComponent(cargoRequirement.commodity)}&origin=${encodeURIComponent(cargoRequirement.originPort)}&destination=${encodeURIComponent(cargoRequirement.destinationPort)}&vessel=${encodeURIComponent(cargoRequirement.preferredClass)}&quantity=${cargoRequirement.quantityMt}&freight=${targetFreight}&bunker=${bunkerFuelPrice}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Step 7: Decision Center</span>
                </Link>
              </div>
            </div>
          </div>

          {/* SECTION 2: CANDIDATE BULK VESSELS COMPARISON MATRIX */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Candidate Bulk Vessels: Fit & Comparative Matrix
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a candidate vessel to inspect port draft compliance, laycan timeline fit, and voyage economics
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {evaluationData?.candidates_analyzed || 5} Candidate Profiles Analyzed
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Select</th>
                    <th className="px-4 py-2.5 font-bold">Vessel / Name</th>
                    <th className="px-4 py-2.5 font-bold">Segment</th>
                    <th className="px-4 py-2.5 font-bold">DWT / Built</th>
                    <th className="px-4 py-2.5 font-bold">Sailing Draft (UKC)</th>
                    <th className="px-4 py-2.5 font-bold">Port Admissibility</th>
                    <th className="px-4 py-2.5 font-bold">Laycan Fit</th>
                    <th className="px-4 py-2.5 font-bold">Voyage Charter</th>
                    <th className="px-4 py-2.5 font-bold">Time Charter</th>
                    <th className="px-4 py-2.5 font-bold">Compatibility Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {evaluationData?.vessel_analyses.map((analysis) => {
                    const v = analysis.vessel;
                    const isSelected = v.id === selectedCandidateId;
                    const isTop = v.id === evaluationData.recommended_vessel_id;

                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedCandidateId(v.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedCandidateId(v.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{v.name}</span>
                            {isTop && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase">
                                TOP FIT
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">IMO {v.imo} • Flag: {v.flag}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{v.vessel_class}</td>
                        <td className="px-4 py-3 font-mono">
                          {v.dwt.toLocaleString()} MT
                          <span className="block text-[10px] text-slate-400">{v.built_year} Built</span>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className="font-bold text-slate-900">{analysis.calculated_sailing_draft_m}m</span>
                          <span className="block text-[10px] text-slate-500">UKC: {analysis.under_keel_clearance_m}m</span>
                        </td>
                        <td className="px-4 py-3">
                          {analysis.port_admissible ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Compatible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> Draft Exceeded
                            </span>
                          )}
                          {analysis.requires_lighterage && (
                            <span className="block text-[9px] text-amber-700 font-semibold mt-0.5">
                              Lighterage Req.
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            analysis.laycan_status === 'Compatible'
                              ? 'bg-emerald-100 text-emerald-800'
                              : analysis.laycan_status === 'Early'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {analysis.laycan_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          ${analysis.voyage_economics.voyage_charter_usd_mt} <span className="text-[10px] font-normal text-slate-500">/ MT</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          ${analysis.voyage_economics.time_charter_usd_mt} <span className="text-[10px] font-normal text-slate-500">/ MT</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${
                              analysis.fit_score.total_score >= 85
                                ? 'text-emerald-700'
                                : analysis.fit_score.total_score >= 70
                                ? 'text-sky-700'
                                : 'text-amber-700'
                            }`}>
                              {analysis.fit_score.total_score}
                            </span>
                            <span className="text-[10px] text-slate-400">/100</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: DEEP-DIVE ANALYSIS FOR SELECTED CANDIDATE */}
          {activeCandidateAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Fit Checklist, Port Compatibility & Laycan Fit */}
              <div className="lg:col-span-6 space-y-6">
                {/* Card 1: Vessel Fit Analysis & Checklist */}
                <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Vessel Fit Analysis: {activeCandidateAnalysis.vessel.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activeCandidateAnalysis.vessel.vessel_class} ({activeCandidateAnalysis.vessel.dwt.toLocaleString()} DWT) • Built {activeCandidateAnalysis.vessel.built_year}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsScoreModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1"
                    >
                      <span>Score: {activeCandidateAnalysis.fit_score.total_score}/100</span>
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Criteria Checklist */}
                  <div className="space-y-2.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Satisfied Operational Criteria
                    </span>
                    {activeCandidateAnalysis.satisfied_criteria.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-semibold leading-relaxed">{item}</span>
                      </div>
                    ))}

                    {activeCandidateAnalysis.operational_constraints.length > 0 && (
                      <>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">
                          Operational Constraints & Cautions
                        </span>
                        {activeCandidateAnalysis.operational_constraints.map((item, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span className="font-semibold leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {activeCandidateAnalysis.missing_data_notices.length > 0 && (
                      <>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">
                          Required Market Verification (Missing Data)
                        </span>
                        {activeCandidateAnalysis.missing_data_notices.map((item, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-2">
                            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Card 2: Port Draft & UKC Compatibility Visualizer */}
                <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-sky-600" />
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Port Draft Compatibility & Under-Keel Clearance
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {cargoRequirement.destinationPort}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Max Permissible Draft</span>
                        <span className="text-base font-black text-slate-900">{activeCandidateAnalysis.port_max_draft_m} m</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Calculated Sailing Draft</span>
                        <span className="text-base font-black text-sky-700">{activeCandidateAnalysis.calculated_sailing_draft_m} m</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Under-Keel Clearance</span>
                        <span className={`text-base font-black ${
                          activeCandidateAnalysis.under_keel_clearance_m >= 1.0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {activeCandidateAnalysis.under_keel_clearance_m} m
                        </span>
                      </div>
                    </div>

                    {/* Visual Draft Gauge Bar */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                        <span>Draft Waterline ({activeCandidateAnalysis.calculated_sailing_draft_m}m)</span>
                        <span>Berth Max ({activeCandidateAnalysis.port_max_draft_m}m)</span>
                      </div>
                      <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-sky-600 rounded-full"
                          style={{
                            width: `${Math.min(100, (activeCandidateAnalysis.calculated_sailing_draft_m / activeCandidateAnalysis.port_max_draft_m) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        Safety threshold: Minimum 1.0m Under-Keel Clearance required by Indian Major Port guidelines.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Laycan Timeline Fit */}
                <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Laycan Window Fit Visualizer
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      Window: {cargoRequirement.laycanStart} to {cargoRequirement.laycanEnd}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                      <span>Laycan Start: {cargoRequirement.laycanStart}</span>
                      <span className="font-bold text-indigo-700">Estimated ETA: {activeCandidateAnalysis.estimated_eta_load_port}</span>
                      <span>Laycan End: {cargoRequirement.laycanEnd}</span>
                    </div>

                    {/* Timeline representation */}
                    <div className="relative py-4">
                      <div className="h-2 w-full bg-slate-200 rounded-full relative">
                        <div className="absolute left-1/4 right-1/4 h-2 bg-indigo-300 rounded-full" />
                      </div>
                      {/* Vessel Marker */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-md" />
                        <span className="text-[9px] font-bold text-indigo-900 mt-1 bg-white px-1.5 py-0.5 rounded shadow-2xs border border-indigo-200">
                          {activeCandidateAnalysis.vessel.name} ETA
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-600">
                        Ballast Origin: <strong>{activeCandidateAnalysis.ballast_leg.ballast_origin}</strong> ({activeCandidateAnalysis.ballast_leg.ballast_distance_nm.toLocaleString()} NM)
                      </span>
                      <span className="text-slate-600">
                        Ballast Steaming: <strong>{activeCandidateAnalysis.ballast_leg.ballast_days} days</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Voyage Economics, Demurrage & Decision Workspace */}
              <div className="lg:col-span-6 space-y-6">
                {/* Card 4: Voyage Economics (Voyage Charter vs Time Charter) */}
                <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-base font-extrabold text-slate-900">
                        Voyage Economics: Charter Type Comparison
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Scenario Comparison
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {/* Voyage Charter Column */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs">Voyage Charter (Spot)</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Carriers Bear Risk
                        </span>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-slate-900">
                          ${activeCandidateAnalysis.voyage_economics.voyage_charter_usd_mt}
                        </span>
                        <span className="text-xs text-slate-500 font-medium"> / MT</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                        <div className="flex justify-between">
                          <span>Total Freight:</span>
                          <span className="font-mono font-bold">${activeCandidateAnalysis.voyage_economics.voyage_charter_total_usd.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Demurrage Risk Buffer:</span>
                          <span className="font-mono">${activeCandidateAnalysis.demurrage_exposure.potential_exposure_usd.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Time Charter Column */}
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-indigo-950 text-xs">Time Charter (Trip)</span>
                        <span className="text-[10px] font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                          Charterer Assumes Fuel
                        </span>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-indigo-700">
                          ${activeCandidateAnalysis.voyage_economics.time_charter_usd_mt}
                        </span>
                        <span className="text-xs text-indigo-600 font-medium"> / MT</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-indigo-900 pt-1 border-t border-indigo-200">
                        <div className="flex justify-between">
                          <span>Hire Component:</span>
                          <span className="font-mono font-bold">${activeCandidateAnalysis.voyage_economics.hire_component_usd.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bunker Fuel (VLSFO):</span>
                          <span className="font-mono">${activeCandidateAnalysis.voyage_economics.bunker_component_usd.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Port Disbursements:</span>
                          <span className="font-mono">${activeCandidateAnalysis.voyage_economics.port_pda_component_usd.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Banner */}
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Recommended Structure: <strong className="text-indigo-700">{activeCandidateAnalysis.voyage_economics.recommended_charter_type}</strong>
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        Variance: ${Math.abs(activeCandidateAnalysis.voyage_economics.cost_differential_usd).toLocaleString()} ({activeCandidateAnalysis.voyage_economics.cost_differential_pct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {activeCandidateAnalysis.voyage_economics.risk_allocation_notes}
                    </p>
                  </div>

                  {/* Calculation Assumptions */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Calculation Assumptions</span>
                    <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5 font-mono">
                      {activeCandidateAnalysis.voyage_economics.calculation_assumptions.map((asm, i) => (
                        <li key={i}>{asm}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card 5: Demurrage Exposure Scenario Calculator */}
                <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Demurrage Exposure Scenario Estimator
                      </h4>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      activeCandidateAnalysis.demurrage_exposure.risk_level === 'Elevated'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeCandidateAnalysis.demurrage_exposure.risk_level} Risk
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Demurrage Rate</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        ${activeCandidateAnalysis.demurrage_exposure.daily_demurrage_rate_usd.toLocaleString()}/day
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Allowed Laytime</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {activeCandidateAnalysis.demurrage_exposure.allowed_laytime_days} days
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Demurrage Days</span>
                      <span className="text-sm font-bold text-amber-600 font-mono">
                        {activeCandidateAnalysis.demurrage_exposure.estimated_demurrage_days} days
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Potential Exposure</span>
                      <span className="text-sm font-bold text-amber-700 font-mono">
                        ${activeCandidateAnalysis.demurrage_exposure.potential_exposure_usd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Formula: {activeCandidateAnalysis.demurrage_exposure.calculation_formula}
                  </p>
                </div>

                {/* Card 6: User-Provided Market Overrides */}
                <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Adjust Market Inputs & Simulation Overrides</span>
                    </div>
                    <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                      User Overrides Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Freight ($/MT)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={targetFreight}
                        onChange={(e) => setTargetFreight(parseFloat(e.target.value) || 14.80)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">VLSFO Fuel ($/MT)</label>
                      <input
                        type="number"
                        step="5"
                        value={bunkerFuelPrice}
                        onChange={(e) => setBunkerFuelPrice(parseFloat(e.target.value) || 615.0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Daily Hire ($/day)</label>
                      <input
                        type="number"
                        step="500"
                        placeholder="Default Baltic"
                        value={dailyHireOverride || ''}
                        onChange={(e) => setDailyHireOverride(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Port PDA ($)</label>
                      <input
                        type="number"
                        step="1000"
                        value={portCostOverride}
                        onChange={(e) => setPortCostOverride(parseFloat(e.target.value) || 45000)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 7: Chartering Decision Workspace Executive Summary */}
                <div className="p-5 rounded-2xl bg-indigo-950 text-white shadow-md space-y-3 text-xs">
                  <div className="flex items-center gap-2 border-b border-indigo-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">
                      Chartering Decision Workspace: Executive Recommendation
                    </h4>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-medium">
                    {activeCandidateAnalysis.decision_summary}
                  </p>

                  <div className="p-3 rounded-xl bg-indigo-900/80 border border-indigo-800 text-[11px] text-indigo-200 space-y-1">
                    <strong className="text-white block">Advisory Governance Notice:</strong>
                    <p className="leading-relaxed">
                      {evaluationData?.advisory_notice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCORE BREAKDOWN MODAL */}
          {isScoreModalOpen && activeCandidateAnalysis && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      How is the Vessel Fit Score Calculated?
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Transparent mathematical weighting without black-box AI fabrication
                    </p>
                  </div>
                  <button
                    onClick={() => setIsScoreModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900 mb-1">
                      <span>1. Cargo Parcel Intake Match</span>
                      <span>30% Weight • Score: {activeCandidateAnalysis.fit_score.cargo_intake_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Evaluates parcel size against vessel DWT load factor envelope (70% - 95% is optimal).</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900 mb-1">
                      <span>2. Port Draft & UKC Compliance</span>
                      <span>25% Weight • Score: {activeCandidateAnalysis.fit_score.port_draft_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Evaluates calculated sailing draft against port permissible draft and requires UKC ≥ 1.0m.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900 mb-1">
                      <span>3. Laycan Timing Window Fit</span>
                      <span>20% Weight • Score: {activeCandidateAnalysis.fit_score.laycan_fit_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Compares vessel ballast steaming ETA against the specified laycan boundaries.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900 mb-1">
                      <span>4. Port Equipment & Crane Suitability</span>
                      <span>15% Weight • Score: {activeCandidateAnalysis.fit_score.equipment_crane_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Evaluates gear requirements (e.g. riverine ports requiring cranes vs mechanized berths).</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900 mb-1">
                      <span>5. Route Speed & Bunker Fuel Efficiency</span>
                      <span>10% Weight • Score: {activeCandidateAnalysis.fit_score.route_efficiency_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Rewards modern eco-design vessels with lower daily fuel burn.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold flex justify-between">
                  <span>Total Calculated Compatibility:</span>
                  <span className="text-base">{activeCandidateAnalysis.fit_score.total_score} / 100</span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsScoreModalOpen(false)}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: GLOBAL FLEET TRACKING (PRESERVED COMMERCIAL CONTAINERSHIP FLEET) */}
      {/* ==================================================================== */}
      {activeTab === 'fleet' && (
        <div className="space-y-6 animate-in fade-in">
          {/* TRACKED FLEET NOTICE */}
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Tracked Commercial Container Fleet (Demonstration AIS):</strong> These vessels represent tracked container liner vessels on global trade lanes. For bulk cargo charter fixtures, please switch to the <strong>Chartering Optimization</strong> tab.
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-2.5">
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
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={carrierFilter}
                  onChange={(e) => setCarrierFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs"
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

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="At Sea">At Sea</option>
                <option value="At Port">At Port</option>
                <option value="Anchored">Anchored</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            <div className="text-slate-500 text-xs font-medium">
              Showing <span className="font-bold text-slate-900">{filteredTrackedVessels.length}</span> tracked vessels
            </div>
          </div>

          {/* MAIN FLEET CONTENT: LIST + DETAIL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Vessel List */}
            <div className="lg:col-span-5 space-y-3">
              {filteredTrackedVessels.map((vessel) => {
                const isSelected = vessel.id === selectedVesselId;
                return (
                  <div
                    key={vessel.id}
                    onClick={() => setSelectedVesselId(vessel.id)}
                    className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/40 shadow-sm'
                        : 'border-slate-200/90 hover:border-slate-300 bg-white/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-sm">{vessel.name}</h3>
                          <span className="text-[10px] text-slate-400">({vessel.flag})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{vessel.carrier}</p>
                      </div>
                      <StatusBadge status={vessel.currentStatus} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 mb-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Route:</span>
                        <span className="font-semibold text-slate-800">{vessel.originPort.split(' ')[0]} → {vessel.destinationPort.split(' ')[0]}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Speed / Telemetry:</span>
                        <span className="font-semibold text-slate-800">{vessel.currentSpeedKnots} kts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>IMO: {vessel.imo}</span>
                      <span>ETA: {vessel.estimatedArrival.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Vessel Telemetry & Map */}
            <div className="lg:col-span-7 space-y-6">
              {/* Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Current Speed"
                  value={`${currentTrackedVessel.currentSpeedKnots} kts`}
                  subtext="Doppler radar telemetry"
                  icon={Compass}
                />
                <MetricCard
                  label="Capacity"
                  value={`${currentTrackedVessel.capacityTeu.toLocaleString()}`}
                  subtext="Nominal TEU"
                  icon={Ship}
                />
                <MetricCard
                  label="Deadweight"
                  value={`${Math.round(currentTrackedVessel.deadweightTonnage / 1000)}k MT`}
                  subtext="Max Displacement"
                  icon={Anchor}
                />
                <MetricCard
                  label="ETA"
                  value={currentTrackedVessel.estimatedArrival.split(' ')[0]}
                  subtext="Port pilot target"
                  icon={Clock}
                />
              </div>

              {/* Map Preview */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900">Vessel Real-Time Geolocation</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Lat: {currentTrackedVessel.coordinates[0]}°, Lon: {currentTrackedVessel.coordinates[1]}°
                  </span>
                </div>
                <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                  <MaritimeMap
                    selectedId={currentTrackedVessel.id}
                    height="h-64"
                  />
                </div>
              </div>

              {/* Voyage Milestone Timeline */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm text-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Voyage Waypoints & Milestones</h4>
                <div className="space-y-3 border-l-2 border-slate-200 ml-2 pl-4">
                  {currentTrackedVessel.timeline.map((stage, i) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        stage.status === 'completed'
                          ? 'bg-emerald-500'
                          : stage.status === 'current'
                          ? 'bg-sky-600 ring-2 ring-sky-200'
                          : 'bg-slate-300'
                      }`} />
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-slate-900">{stage.stage}: {stage.location}</span>
                        <span className="text-[10px] text-slate-400">{stage.timestamp}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold ${
                        stage.status === 'completed'
                          ? 'text-emerald-600'
                          : stage.status === 'current'
                          ? 'text-sky-600'
                          : 'text-slate-400'
                      }`}>
                        {stage.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VesselsPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-xs text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
        Loading Vessel Selection & Fleet Intelligence...
      </div>
    }>
      <VesselsContent />
    </Suspense>
  );
}
