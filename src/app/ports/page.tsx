'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  ShieldAlert,
  Compass,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ExternalLink,
  ArrowRight,
  ArrowLeftRight,
  HelpCircle,
  Waves,
  CloudRain,
  Wind,
  Gauge,
  FileText,
  Check,
  Building,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskIndicator } from '@/components/ui/StatusBadge';
import { Drawer } from '@/components/ui/Drawer';
import { mockPorts } from '@/data/portData';
import {
  PortItem,
  EastCoastPortConstraint,
  DryBulkVesselClassName,
  PortIntelligenceEvaluationResponse,
  PortComparisonResponse,
  PortRiskLevel,
} from '@/types';
import { useWatchlist } from '@/context/WatchlistContext';
import { portService, portConstraintService, portIntelligenceService } from '@/services';
import { mockEastCoastPortConstraints } from '@/data/eastCoastPortConstraints';
import { MaritimeMap } from '@/components/maps/MaritimeMap';

function PortsPageContent() {
  const searchParams = useSearchParams();

  // URL Query Parameters from Cargo Analysis / Forecast / Vessels
  const paramOrigin = searchParams.get('origin') || 'Hay Point / Newcastle, Australia';
  const paramPort = searchParams.get('destination') || searchParams.get('port') || 'port-in-prt';
  const paramCargo = searchParams.get('cargo') || 'Hard Coking Coal (HCC)';
  const paramQuantity = parseFloat(searchParams.get('quantity') || '50000');
  const paramVessel = (searchParams.get('vessel') || 'Panamax') as DryBulkVesselClassName;
  const paramLaycanStart = searchParams.get('laycan_start') || '2026-10-15';
  const paramLaycanEnd = searchParams.get('laycan_end') || '2026-10-25';
  const initialTab = searchParams.get('tab') === 'global' ? 'global' : 'east-coast';

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'east-coast' | 'global'>(initialTab);
  const [selectedEastCoastPortId, setSelectedEastCoastPortId] = useState<string>(
    mockEastCoastPortConstraints[paramPort] ? paramPort : 'port-in-prt'
  );
  const [selectedGlobalPortId, setSelectedGlobalPortId] = useState<string>('port-sha');

  // Scenario Parameter States
  const [selectedCommodity, setSelectedCommodity] = useState<string>(paramCargo);
  const [cargoQuantity, setCargoQuantity] = useState<number>(isNaN(paramQuantity) ? 50000 : paramQuantity);
  const [selectedVesselClass, setSelectedVesselClass] = useState<DryBulkVesselClassName>(paramVessel);
  const [testDraftMeters, setTestDraftMeters] = useState<number>(13.8);

  // Data & Intelligence Results
  const [portIntelligence, setPortIntelligence] = useState<PortIntelligenceEvaluationResponse | null>(null);
  const [portComparison, setPortComparison] = useState<PortComparisonResponse | null>(null);
  const [isLoadingIntelligence, setIsLoadingIntelligence] = useState<boolean>(true);
  const [isSimulatedQueue, setIsSimulatedQueue] = useState<boolean>(false);

  // Modals & Drawers
  const [showRiskRubricModal, setShowRiskRubricModal] = useState<boolean>(false);
  const [showProvenanceModal, setShowProvenanceModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Global Ports State (Preserved)
  const [ports, setPorts] = useState<PortItem[]>(mockPorts);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { addItem, isSaved, removeItem } = useWatchlist();

  // Update default draft when vessel class changes
  useEffect(() => {
    const classDrafts: Record<string, number> = {
      Capesize: 17.8,
      Kamsarmax: 14.5,
      Panamax: 13.8,
      Ultramax: 12.8,
      Supramax: 12.2,
      Handysize: 10.0,
    };
    if (classDrafts[selectedVesselClass]) {
      setTestDraftMeters(classDrafts[selectedVesselClass]);
    }
  }, [selectedVesselClass]);

  // Load Global Ports from service
  useEffect(() => {
    portService.getPorts().then((res) => {
      if (res && res.length > 0) setPorts(res);
    });
  }, []);

  // Evaluate Port Intelligence whenever parameters change
  useEffect(() => {
    let isMounted = true;
    setIsLoadingIntelligence(true);

    portIntelligenceService
      .evaluatePort({
        port_id: selectedEastCoastPortId,
        commodity_id: selectedCommodity,
        commodity_name: selectedCommodity,
        cargo_quantity_mt: cargoQuantity,
        vessel_class: selectedVesselClass,
        vessel_draft_m: testDraftMeters,
        ukc_requirement_m: 1.0,
      })
      .then((res) => {
        if (isMounted) {
          setPortIntelligence(res);
          setIsLoadingIntelligence(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load port intelligence:', err);
        if (isMounted) setIsLoadingIntelligence(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEastCoastPortId, selectedCommodity, cargoQuantity, selectedVesselClass, testDraftMeters]);

  // Load Port Comparison whenever commodity or quantity changes
  useEffect(() => {
    let isMounted = true;
    portIntelligenceService
      .comparePorts({
        commodity_id: selectedCommodity,
        commodity_name: selectedCommodity,
        cargo_quantity_mt: cargoQuantity,
        preferred_vessel_class: selectedVesselClass,
        vessel_draft_m: testDraftMeters,
      })
      .then((res) => {
        if (isMounted) setPortComparison(res);
      })
      .catch((err) => {
        console.error('Failed to load port comparison:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity, cargoQuantity, selectedVesselClass, testDraftMeters]);

  const currentGlobalPort = ports.find((p) => p.id === selectedGlobalPortId) || ports[0] || mockPorts[0];
  const savedGlobal = isSaved(currentGlobalPort.id);

  const filteredGlobalPorts = ports.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWatchlistToggle = () => {
    if (savedGlobal) {
      removeItem(currentGlobalPort.id);
    } else {
      addItem({
        id: currentGlobalPort.id,
        name: currentGlobalPort.name,
        type: 'Ports',
        status: `Congestion: ${currentGlobalPort.congestionIndex}/100`,
        latestChange: `${currentGlobalPort.averageDwellDays}d dwell`,
        forecast: 'Peak Transshipment Yard Dwell',
        risk: currentGlobalPort.delayRisk,
        lastUpdated: 'Just now',
        targetPath: '/ports',
      });
    }
  };

  const getRiskBadgeColor = (lvl: PortRiskLevel) => {
    switch (lvl) {
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & View Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Port Intelligence &amp; Constraint Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[11px] font-bold uppercase tracking-wider">
              SIH Phase 5
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authoritative East Coast India gateway constraints, Under-Keel Clearance ($UKC$) verification, cargo handling feasibility, and demurrage exposure modeling.
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200/90 rounded-2xl self-start md:self-auto shrink-0 shadow-2xs">
          <button
            onClick={() => setActiveTab('east-coast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'east-coast'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>East Coast Port Intelligence</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-50 text-sky-700 border border-sky-200 font-mono">
              Core
            </span>
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'global'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Global Gateway Network &amp; Map</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: EAST COAST PORT INTELLIGENCE & CONSTRAINT ENGINE (PHASE 5)   */}
      {/* ===================================================================== */}
      {activeTab === 'east-coast' && (
        <div className="space-y-7">
          {/* Active Cargo & Voyage Context Banner */}
          <div className="glass-card rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                    Active Bulk Cargo &amp; Voyage Context
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-semibold">
                    Multi-Module Synced
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 font-medium">
                  <span>
                    Cargo: <strong className="text-slate-900">{selectedCommodity}</strong> ({cargoQuantity.toLocaleString()} MT)
                  </span>
                  <span>•</span>
                  <span>
                    Corridor: <strong className="text-slate-900">{paramOrigin}</strong> →{' '}
                    <strong className="text-sky-700">
                      {portIntelligence?.port_name || 'East Coast India'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Laycan: <strong className="text-slate-900">{paramLaycanStart}</strong> to{' '}
                    <strong className="text-slate-900">{paramLaycanEnd}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Candidate Vessel: <strong className="text-slate-900">{selectedVesselClass}</strong>
                  </span>
                </div>
              </div>

              {/* Navigation Bridges to Other Modules */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href={`/cargo-analysis?destination=${selectedEastCoastPortId}&cargo=${encodeURIComponent(
                    selectedCommodity
                  )}&quantity=${cargoQuantity}&vessel=${selectedVesselClass}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cargo Analysis</span>
                </Link>
                <Link
                  href={`/forecast?origin=${encodeURIComponent(
                    paramOrigin
                  )}&destination=${selectedEastCoastPortId}&cargo=${encodeURIComponent(
                    selectedCommodity
                  )}&vessel=${selectedVesselClass}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Freight Forecast</span>
                </Link>
                <Link
                  href={`/vessels?tab=chartering&destination=${selectedEastCoastPortId}&cargo=${encodeURIComponent(
                    selectedCommodity
                  )}&quantity=${cargoQuantity}&vessel=${selectedVesselClass}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors shadow-xs"
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>Chartering Optimization</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* East Coast Gateway Selector Pills */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Select East Coast Indian Discharge Gateway
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                8 Major Bulk Gateways Configured with Authoritative Port Authority Parameters
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { id: 'port-in-prt', name: 'Paradip', draft: '17.1m', state: 'Odisha' },
                { id: 'port-in-viz', name: 'Vizag', draft: '18.1m', state: 'Andhra' },
                { id: 'port-in-enr', name: 'Kamarajar', draft: '16.0m', state: 'Tamil Nadu' },
                { id: 'port-in-maa', name: 'Chennai', draft: '14.0m', state: 'Tamil Nadu' },
                { id: 'port-in-kri', name: 'Krishnapatnam', draft: '18.5m', state: 'Andhra' },
                { id: 'port-in-ccu', name: 'SPM Haldia', draft: '8.2m', state: 'West Bengal' },
                { id: 'port-in-dhm', name: 'Dhamra', draft: '18.0m', state: 'Odisha' },
                { id: 'port-in-tut', name: 'Tuticorin', draft: '14.2m', state: 'Tamil Nadu' },
              ].map((gw) => {
                const isSelected = selectedEastCoastPortId === gw.id;
                return (
                  <button
                    key={gw.id}
                    onClick={() => setSelectedEastCoastPortId(gw.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold block ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                        {gw.state}
                      </span>
                      <p className="text-xs font-extrabold truncate mt-0.5">{gw.name}</p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-dashed border-white/20 flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-sky-100' : 'text-sky-700'}`}>
                        {gw.draft} draft
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Scenario Controls Strip */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* Commodity Selector */}
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Commodity:</label>
                <select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
                >
                  <option value="Hard Coking Coal (HCC)">Hard Coking Coal (HCC)</option>
                  <option value="Thermal Coal">Thermal Coal (Energy)</option>
                  <option value="Iron Ore Fines / Pellets">Iron Ore Fines / Pellets</option>
                  <option value="Steel-Grade Limestone (Flux)">Steel-Grade Limestone (Flux)</option>
                  <option value="Finished Fertilizer (DAP/MOP)">Finished Fertilizer (DAP/MOP)</option>
                </select>
              </div>

              {/* Cargo Quantity Input */}
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Quantity:</label>
                <div className="relative w-28">
                  <input
                    type="number"
                    step="5000"
                    min="10000"
                    max="200000"
                    value={cargoQuantity}
                    onChange={(e) => setCargoQuantity(parseFloat(e.target.value) || 50000)}
                    className="w-full pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">MT</span>
                </div>
              </div>

              {/* Vessel Class Selector */}
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Vessel Class:</label>
                <select
                  value={selectedVesselClass}
                  onChange={(e) => setSelectedVesselClass(e.target.value as DryBulkVesselClassName)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
                >
                  <option value="Capesize">Capesize (180k DWT)</option>
                  <option value="Kamsarmax">Kamsarmax (82k DWT)</option>
                  <option value="Panamax">Panamax (75k DWT)</option>
                  <option value="Ultramax">Ultramax (64k DWT)</option>
                  <option value="Supramax">Supramax (58k DWT)</option>
                  <option value="Handysize">Handysize (35k DWT)</option>
                </select>
              </div>

              {/* Sailing Draft Input */}
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Sailing Draft:</label>
                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.1"
                    min="6"
                    max="22"
                    value={testDraftMeters}
                    onChange={(e) => setTestDraftMeters(parseFloat(e.target.value) || 13.8)}
                    className="w-full pl-3 pr-6 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">m</span>
                </div>
              </div>
            </div>

            {/* Queue Toggle & Provenance Trigger */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  checked={isSimulatedQueue}
                  onChange={(e) => setIsSimulatedQueue(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Simulated High Congestion</span>
              </label>

              <button
                onClick={() => setShowProvenanceModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold transition-colors"
              >
                <Info className="w-3 h-3 text-sky-600" />
                <span>Provenance</span>
              </button>
            </div>
          </div>

          {portIntelligence && (
            <>
              {/* Port Profile Card & Specifications */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">{portIntelligence.port_name}</h2>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                        {portIntelligence.port_code}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">
                        {portIntelligence.port_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      State: <strong>{portIntelligence.state}</strong> • Operational Status: Fully Operational
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                        portIntelligence.cargo_compatibility.is_supported &&
                        portIntelligence.vessel_compatibility.is_admissible
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {portIntelligence.cargo_compatibility.is_supported &&
                      portIntelligence.vessel_compatibility.is_admissible ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Candidate Gateway Feasible</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Operational Restriction Active</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* 6 Technical Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Max Permissible Draft
                    </span>
                    <p className="text-lg font-black text-sky-900 mt-0.5">
                      {portIntelligence.max_permissible_draft_m} m
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {portIntelligence.riverine_navigation ? 'Tidal Hugli Window' : 'Deepwater Outer Harbor'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Mechanized Discharge
                    </span>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">
                      {portIntelligence.mechanized_discharge_rate_mt_day.toLocaleString()} MT/d
                    </p>
                    <span className="text-[10px] text-slate-500">Official IPA Benchmark</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Typical Waiting Queue
                    </span>
                    <p className="text-lg font-black text-amber-700 mt-0.5">
                      {isSimulatedQueue ? (portIntelligence.typical_waiting_days + 1.8).toFixed(1) : portIntelligence.typical_waiting_days} Days
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {isSimulatedQueue ? 'Simulated High Queue' : 'Historical IPA Average'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Demurrage Rate
                    </span>
                    <p className="text-lg font-black text-slate-800 mt-0.5">
                      ${portIntelligence.average_demurrage_rate_usd_day.toLocaleString()} / d
                    </p>
                    <span className="text-[10px] text-slate-500">Baltic Bulk Standard</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Maximum Dimensions
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      LOA: {portIntelligence.max_loa_m}m | Beam: {portIntelligence.max_beam_m}m
                    </p>
                    <span className="text-[10px] text-slate-500">Berth Envelope Limit</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Lighterage Protocol
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {portIntelligence.lighterage_required ? 'Mandatory at Sandheads' : 'Direct Berthing'}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {portIntelligence.lighterage_required ? 'Offshore Transshipment' : 'Zero Double-Handling'}
                    </span>
                  </div>
                </div>

                {/* Operational Notes Strip */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Harbor Operations &amp; Berthing Context: </span>
                    <span>{portIntelligence.operational_notes}</span>
                  </div>
                </div>
              </div>

              {/* DRAFT CONSTRAINT ANALYSIS & CARGO HANDLING COMPATIBILITY (DUAL CARDS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* CARD 1: Under-Keel Clearance & Draft Bar */}
                <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-sky-600" />
                      <h3 className="text-sm font-bold text-slate-900">Draft Constraint &amp; UKC Verification</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        portIntelligence.vessel_compatibility.ukc_status === 'Safe'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : portIntelligence.vessel_compatibility.ukc_status === 'Marginal'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {portIntelligence.vessel_compatibility.ukc_status} Clearance
                    </span>
                  </div>

                  {/* Under-Keel Clearance Breakdown */}
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Vessel Draft</span>
                        <p className="text-base font-black text-slate-900 mt-0.5">
                          {portIntelligence.vessel_compatibility.sailing_draft_m} m
                        </p>
                        <span className="text-[9px] text-slate-500">Calculated Sailing</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Port Permissible</span>
                        <p className="text-base font-black text-sky-900 mt-0.5">
                          {portIntelligence.max_permissible_draft_m} m
                        </p>
                        <span className="text-[9px] text-slate-500">Channel Limit</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border ${
                          portIntelligence.vessel_compatibility.under_keel_clearance_m >= 1.0
                            ? 'bg-emerald-50 border-emerald-200'
                            : portIntelligence.vessel_compatibility.under_keel_clearance_m >= 0
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-rose-50 border-rose-200'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Under-Keel (UKC)</span>
                        <p
                          className={`text-base font-black mt-0.5 ${
                            portIntelligence.vessel_compatibility.under_keel_clearance_m >= 1.0
                              ? 'text-emerald-800'
                              : portIntelligence.vessel_compatibility.under_keel_clearance_m >= 0
                              ? 'text-amber-800'
                              : 'text-rose-800'
                          }`}
                        >
                          {portIntelligence.vessel_compatibility.under_keel_clearance_m} m
                        </p>
                        <span className="text-[9px] text-slate-600">Min 1.0m Required</span>
                      </div>
                    </div>

                    {/* Visual Clearance Gauge Bar */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span>Water Column Clearance Profile</span>
                        <span className="font-mono">
                          UKC: {portIntelligence.vessel_compatibility.under_keel_clearance_m}m
                        </span>
                      </div>
                      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              (portIntelligence.vessel_compatibility.sailing_draft_m /
                                Math.max(portIntelligence.max_permissible_draft_m, 18.5)) *
                                100
                            )}%`,
                          }}
                          className="bg-sky-600 h-full flex items-center justify-center text-[9px] text-white font-bold"
                          title="Vessel Draft"
                        >
                          Ship Draft
                        </div>
                        <div
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                (portIntelligence.vessel_compatibility.under_keel_clearance_m /
                                  Math.max(portIntelligence.max_permissible_draft_m, 18.5)) *
                                  100
                              )
                            )}%`,
                          }}
                          className={`h-full flex items-center justify-center text-[9px] font-bold ${
                            portIntelligence.vessel_compatibility.under_keel_clearance_m >= 1.0
                              ? 'bg-emerald-500 text-white'
                              : portIntelligence.vessel_compatibility.under_keel_clearance_m >= 0
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-rose-500 text-white'
                          }`}
                          title="Clearance"
                        >
                          UKC
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Waterline 0.0m</span>
                        <span>Seabed {portIntelligence.max_permissible_draft_m}m</span>
                      </div>
                    </div>

                    {/* Lighterage Warning or Safe Clearance Notice */}
                    {portIntelligence.vessel_compatibility.requires_lighterage ? (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Mandatory Sandheads Lighterage Triggered</p>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            Draft ({portIntelligence.vessel_compatibility.sailing_draft_m}m) exceeds the riverine estuarine limit ({portIntelligence.max_permissible_draft_m}m). The vessel must lighter at Sandheads deepwater anchorage prior to navigating Hugli estuary.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Safe Under-Keel Clearance Confirmed</p>
                          <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                            Sailing draft ({portIntelligence.vessel_compatibility.sailing_draft_m}m) provides {portIntelligence.vessel_compatibility.under_keel_clearance_m}m safety margin, exceeding the mandatory 1.0m Under-Keel Clearance threshold.
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 italic">
                      * Advisory Notice: Decision-support information only; not a maritime safety certificate or substitute for official Notice of Readiness (NOR).
                    </p>
                  </div>
                </div>

                {/* CARD 2: Cargo Handling & Regulatory Suitability */}
                <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-600" />
                      <h3 className="text-sm font-bold text-slate-900">Cargo Handling &amp; Regulatory Feasibility</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        portIntelligence.cargo_compatibility.is_supported
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {portIntelligence.cargo_compatibility.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* If prohibited (e.g. Chennai Coal) */}
                    {!portIntelligence.cargo_compatibility.is_supported ? (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <p className="font-bold text-sm">Regulatory Environmental Injunction Bar</p>
                        </div>
                        <p className="text-[11px] text-rose-800 leading-relaxed">
                          {portIntelligence.cargo_compatibility.notes}
                        </p>
                        <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                          <span className="text-[11px] font-semibold">Recommended Alternative Gateway:</span>
                          <button
                            onClick={() => setSelectedEastCoastPortId('port-in-enr')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors shadow-2xs"
                          >
                            Switch to Kamarajar (Ennore)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <p className="font-bold text-sm">Supported Commodity Discharge Pathway</p>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          {portIntelligence.cargo_compatibility.notes}
                        </p>
                      </div>
                    )}

                    {/* Handling Equipment & Discharge Velocity */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Mechanized Terminal Equipment
                      </span>
                      <p className="text-xs font-semibold text-slate-800">
                        {portIntelligence.cargo_compatibility.handling_equipment}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400">Mechanized Rate:</span>
                          <p className="font-bold text-slate-900">
                            {portIntelligence.cargo_compatibility.discharge_rate_mt_day.toLocaleString()} MT/day
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Laytime Duration:</span>
                          <p className="font-bold text-sky-700">
                            ~{portIntelligence.waiting_time_impact.estimated_discharge_days} Discharge Days
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Vessel Segment Admissibility:</span>
                      <span className="font-semibold text-slate-800">
                        {portIntelligence.allowable_vessel_classes.includes(selectedVesselClass)
                          ? `✓ ${selectedVesselClass} Permitted at Dedicated Bulk Berths`
                          : `⚠ ${selectedVesselClass} Not Recommended (Check Port Limits)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONGESTION & DEMURRAGE IMPACT + WEATHER RISK (DUAL CARDS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Congestion & Demurrage Exposure */}
                <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-900">Congestion &amp; Demurrage Exposure</h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        isSimulatedQueue ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isSimulatedQueue ? 'Simulated Port Congestion' : 'Historical Official Benchmark'}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Anchorage Queue</span>
                        <p className="text-base font-black text-amber-700 mt-0.5">
                          {isSimulatedQueue ? (portIntelligence.typical_waiting_days + 1.8).toFixed(1) : portIntelligence.typical_waiting_days} d
                        </p>
                        <span className="text-[9px] text-slate-500">Pre-Berth Wait</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Discharge Stay</span>
                        <p className="text-base font-black text-slate-900 mt-0.5">
                          {portIntelligence.waiting_time_impact.estimated_discharge_days} d
                        </p>
                        <span className="text-[9px] text-slate-500">Berth Working</span>
                      </div>
                      <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 uppercase font-bold">Demurrage Risk</span>
                        <p className="text-base font-black text-amber-900 mt-0.5">
                          ${(
                            (isSimulatedQueue ? portIntelligence.typical_waiting_days + 1.8 : portIntelligence.typical_waiting_days) *
                            portIntelligence.average_demurrage_rate_usd_day
                          ).toLocaleString()}
                        </p>
                        <span className="text-[9px] text-amber-700">Projected Liability</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Daily Demurrage Benchmark:</span>
                        <span className="font-bold text-slate-800">
                          ${portIntelligence.average_demurrage_rate_usd_day.toLocaleString()} / day
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Total Port Footprint:</span>
                        <span className="font-bold text-sky-800">
                          ~{(
                            (isSimulatedQueue ? portIntelligence.typical_waiting_days + 1.8 : portIntelligence.typical_waiting_days) +
                            portIntelligence.waiting_time_impact.estimated_discharge_days
                          ).toFixed(1)}{' '}
                          Days Total Turnaround
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Chartering Link:</span>
                        <Link
                          href={`/vessels?tab=chartering&destination=${selectedEastCoastPortId}&cargo=${encodeURIComponent(
                            selectedCommodity
                          )}&quantity=${cargoQuantity}&vessel=${selectedVesselClass}&demurrage=${
                            portIntelligence.average_demurrage_rate_usd_day
                          }`}
                          className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>Evaluate in Chartering Engine</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      * Turnaround calculation: {cargoQuantity.toLocaleString()} MT ÷{' '}
                      {portIntelligence.cargo_compatibility.discharge_rate_mt_day.toLocaleString()} MT/d mechanized rate +{' '}
                      {portIntelligence.typical_waiting_days}d historical queue benchmark.
                    </p>
                  </div>
                </div>

                {/* Weather & Seasonal Risk Profile */}
                <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-sky-600" />
                      <h3 className="text-sm font-bold text-slate-900">Weather &amp; Seasonal Operational Risk</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700">
                      Maritime Meteorology
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Waves className="w-3.5 h-3.5 text-sky-600" />
                          <span>Southwest Monsoon (June - September)</span>
                        </div>
                        <span className="px-2 py-0.2 rounded text-[10px] bg-sky-100 text-sky-800 font-semibold">
                          Rough Swell
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {portIntelligence.weather_operational_profile.southwest_monsoon.condition}: {portIntelligence.weather_operational_profile.southwest_monsoon.impact}.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <CloudRain className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Northeast Monsoon (October - December)</span>
                        </div>
                        <span className="px-2 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-semibold">
                          Rain Squalls
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {portIntelligence.weather_operational_profile.northeast_monsoon.condition}: {portIntelligence.weather_operational_profile.northeast_monsoon.impact}.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tropical Cyclone Protocols (May &amp; Oct-Nov)</span>
                        </div>
                        <span className="px-2 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                          Stand-off Alert
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {portIntelligence.weather_operational_profile.cyclone_window.condition}: {portIntelligence.weather_operational_profile.cyclone_window.impact}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PORT RISK MATRIX (6 TRANSPARENT DIMENSIONS) */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-sky-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        Port Operational Risk Matrix (6 Dimensions)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Deterministic, non-black-box rubric evaluating destination port constraints against active chartering parameters.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowRiskRubricModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors self-start sm:self-auto"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                    <span>How is this risk determined?</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {portIntelligence.risk_matrix.map((dim, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{dim.dimension}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRiskBadgeColor(dim.risk_level)}`}>
                            {dim.risk_level} Risk
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-sky-800 mt-0.5">{dim.metric_value}</p>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          <strong>Criteria:</strong> {dim.benchmark_criteria}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{dim.operational_implication.slice(0, 35)}...</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200/70 font-mono text-slate-600">
                          {dim.provenance_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PORT COMPARISON INTERFACE (ACROSS 8 CANDIDATE GATEWAYS) */}
              {portComparison && (
                <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-sky-600" />
                        <h3 className="text-base font-bold text-slate-900">
                          Candidate Destination Ports Comparison Matrix
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Side-by-side multi-factor evaluation for {cargoQuantity.toLocaleString()} MT {selectedCommodity} via {selectedVesselClass}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Showing {portComparison.comparison_items.length} East Coast Indian Gateways</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 uppercase font-bold">
                          <th className="py-2.5 px-3">Port Gateway</th>
                          <th className="py-2.5 px-3">Draft &amp; UKC</th>
                          <th className="py-2.5 px-3">Cargo Feasibility</th>
                          <th className="py-2.5 px-3">Discharge Velocity</th>
                          <th className="py-2.5 px-3">Avg Queue</th>
                          <th className="py-2.5 px-3">Demurrage Risk</th>
                          <th className="py-2.5 px-3">Overall Risk</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {portComparison.comparison_items.map((item) => {
                          const isSelected = selectedEastCoastPortId === item.port_id;
                          return (
                            <tr
                              key={item.port_id}
                              className={`transition-colors ${
                                isSelected ? 'bg-sky-50/60 font-medium' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{item.port_name}</span>
                                  {isSelected && (
                                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-bold">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.port_code} • {item.state}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      item.ukc_status === 'Safe'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : item.ukc_status === 'Marginal'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}
                                  >
                                    {item.max_permissible_draft_m}m ({item.under_keel_clearance_m}m UKC)
                                  </span>
                                </div>
                                {item.lighterage_required && (
                                  <span className="text-[9px] text-amber-700 block mt-0.5 font-medium">
                                    Sandheads Lighterage
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.cargo_supported
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {item.cargo_status}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-800">
                                  {item.mechanized_discharge_rate_mt_day.toLocaleString()} MT/d
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  ~{item.discharge_days}d discharge
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-800">{item.typical_waiting_days} days</span>
                              </td>

                              <td className="py-3 px-3">
                                <span className="font-semibold text-amber-800">
                                  ${item.demurrage_exposure_usd.toLocaleString()}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRiskBadgeColor(item.overall_risk_level)}`}>
                                  {item.overall_risk_level}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => setSelectedEastCoastPortId(item.port_id)}
                                  disabled={isSelected}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-slate-200 text-slate-500 cursor-default'
                                      : 'bg-white border border-slate-200 hover:border-sky-300 hover:text-sky-700 text-slate-700 shadow-2xs'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Inspect'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PORT SELECTION DECISION SUPPORT (ADVISORY FACTORS) */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        Port Decision Factors (Chartering &amp; Procurement Advisory)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Transparent synthesis of verified advantages, operational bottlenecks, unknowns, and required verifications for {portIntelligence.port_name}.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Advantages */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Operational Advantages</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-emerald-800 list-disc pl-4 leading-relaxed">
                      {portIntelligence.decision_factors.advantages.length > 0 ? (
                        portIntelligence.decision_factors.advantages.map((a, i) => <li key={i}>{a}</li>)
                      ) : (
                        <li>Standard commercial handling facilities.</li>
                      )}
                    </ul>
                  </div>

                  {/* Constraints */}
                  <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Operational Constraints</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-rose-800 list-disc pl-4 leading-relaxed">
                      {portIntelligence.decision_factors.constraints.length > 0 ? (
                        portIntelligence.decision_factors.constraints.map((c, i) => <li key={i}>{c}</li>)
                      ) : (
                        <li>No critical constraints identified for this cargo.</li>
                      )}
                    </ul>
                  </div>

                  {/* Unknowns */}
                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Unknowns &amp; Missing Data</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-amber-800 list-disc pl-4 leading-relaxed">
                      {portIntelligence.decision_factors.unknowns.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Required Verifications */}
                  <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-sky-900 text-xs">
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                      <span>Required Due Diligence</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-sky-800 list-disc pl-4 leading-relaxed">
                      {portIntelligence.decision_factors.required_verifications.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: GLOBAL GATEWAY NETWORK & FLEET MAP (PRESERVED 100%)            */}
      {/* ===================================================================== */}
      {activeTab === 'global' && (
        <div className="space-y-8">
          {/* Global Port Selector & Search */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Selected Port Gateway:</label>
                <select
                  value={selectedGlobalPortId}
                  onChange={(e) => setSelectedGlobalPortId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
                >
                  {ports.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
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
                  placeholder="Search ports by code, name, city..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="text-slate-500 text-[11px] flex items-center gap-4">
              <span>
                Country: <strong className="text-slate-800">{currentGlobalPort.country}</strong>
              </span>
              <span>•</span>
              <span>
                Berth Util: <strong className="text-sky-700">{currentGlobalPort.berthUtilizationPercent}%</strong>
              </span>
              <button
                onClick={handleWatchlistToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  savedGlobal
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>{savedGlobal ? 'Saved' : 'Watchlist'}</span>
              </button>
            </div>
          </div>

          {/* 5 Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              label="Congestion Score"
              value={`${currentGlobalPort.congestionIndex} / 100`}
              change={currentGlobalPort.delayRisk}
              changeType={currentGlobalPort.delayRisk === 'Low' ? 'positive' : 'negative'}
              subtext="Anchorage & Yard"
              icon={Activity}
            />
            <MetricCard
              label="Average Yard Dwell"
              value={`${currentGlobalPort.averageDwellDays} Days`}
              change="+0.7d vs target"
              changeType="negative"
              trendDirection="up"
              subtext="Container Stacking"
              icon={Clock}
            />
            <MetricCard
              label="Anchored Queue"
              value={`${currentGlobalPort.activeVesselsWaiting} Vessels`}
              subtext="Awaiting Terminal Berth"
              icon={Ship}
            />
            <MetricCard
              label="7-Day Arrivals"
              value={currentGlobalPort.vesselArrivals7d}
              unit="Calls"
              change="High Frequency"
              changeType="neutral"
              subtext="Scheduled Services"
              icon={Anchor}
            />
            <MetricCard
              label="Annual Throughput"
              value={`${currentGlobalPort.annualThroughputMTeu}M`}
              unit="TEU / Year"
              subtext="Total Capacity"
              icon={Layers}
            />
          </div>

          {/* Geospatial Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Geospatial Gateway Network</h3>
                <p className="text-xs text-slate-500">
                  Global container terminals and Indian major ports with live congestion heatmap overlays
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Selected: <strong className="text-slate-900">{currentGlobalPort.name}</strong> ({currentGlobalPort.code})
              </span>
            </div>
            <MaritimeMap
              height="h-[440px]"
              activeLayers={{ routes: true, ports: true, vessels: false, weather: false, congestion: true }}
              onSelectPort={(p) => setSelectedGlobalPortId(p.id)}
            />
          </div>

          {/* Operational Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Weekly Congestion &amp; Yard Dwell Trend</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Anchorage queue score (0-100) vs container dwell duration</p>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Score: {currentGlobalPort.congestionIndex}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentGlobalPort.metricsHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Daily Vessel Arrivals &amp; Terminal Throughput</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Vessel calls serviced per 24-hour cycle</p>
                </div>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  {currentGlobalPort.vesselArrivals7d} Calls / Wk
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentGlobalPort.metricsHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

          {/* AI Port Operations Synthesis & Recent Events */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Port Operations Synthesis</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Bottlenecks</span>
                  <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                    {currentGlobalPort.name} is experiencing elevated dwell levels ({currentGlobalPort.averageDwellDays} days) as off-schedule arrivals from the Cape bypass arrive in clusters.
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
                    Terminal operators are expanding off-dock yard staging areas. Congestion expected to ease slightly by late next week.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Recent Port Events &amp; Advisories</h3>
              <p className="text-xs text-slate-500 mb-4">Official notices, terminal updates, and weather logs</p>

              <div className="space-y-3">
                {currentGlobalPort.recentEvents.map((evt) => (
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
        </div>
      )}

      {/* RISK RUBRIC EXPLANATION MODAL */}
      {showRiskRubricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">How is Port Risk Determined?</h3>
              </div>
              <button
                onClick={() => setShowRiskRubricModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              FreightSense evaluates port risk across 6 deterministic, rule-based dimensions derived from authoritative Ministry of Ports, Shipping and Waterways (MoPSW) guidelines, Indian Ports Association (IPA) throughput bulletins, and Baltic charterparty norms. No risk score is arbitrarily assigned.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">1. Congestion &amp; Anchorage Queue:</span>
                <p className="text-[11px] text-slate-600">
                  • <strong>Low Risk:</strong> Average waiting time &lt; 1.8 days.<br />
                  • <strong>Moderate Risk:</strong> Average waiting time between 1.8 and 2.5 days.<br />
                  • <strong>High Risk:</strong> Average waiting time &gt; 2.5 days (elevates daily charterparty demurrage liability).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">2. Draft Constraint &amp; Under-Keel Clearance (UKC):</span>
                <p className="text-[11px] text-slate-600">
                  • <strong>Low Risk:</strong> Port draft ≥ 17.0m with calculated UKC ≥ 1.0m (Capesize safe).<br />
                  • <strong>Moderate Risk:</strong> Port draft 14.0m - 16.9m or marginal UKC (0.0m - 0.99m).<br />
                  • <strong>High Risk:</strong> Port draft &lt; 14.0m (e.g. Haldia 8.2m) or negative UKC requiring mandatory ocean lighterage.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">3. Weather &amp; Seasonal Sensitivity:</span>
                <p className="text-[11px] text-slate-600">
                  • <strong>Low Risk:</strong> Sheltered deepwater basin (e.g. Vizag inner/outer breakwater, Krishnapatnam).<br />
                  • <strong>Moderate Risk:</strong> Open roadstead approaches exposed to Southwest or Northeast Monsoon swell.<br />
                  • <strong>High Risk:</strong> Riverine tidal bore channels or active cyclone protocol zones.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">4. Vessel Segment Flexibility:</span>
                <p className="text-[11px] text-slate-600">
                  • <strong>Low Risk:</strong> Capesize, Kamsarmax, and Panamax admissible without de-ballasting.<br />
                  • <strong>Moderate Risk:</strong> Panamax maximum admissible (Chennai, Tuticorin).<br />
                  • <strong>High Risk:</strong> Feeder/Handysize only (restricts freight economies of scale).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">5. Cargo Handling Velocity:</span>
                <p className="text-[11px] text-slate-600">
                  • <strong>Low Risk:</strong> Mechanized discharge rate ≥ 25,000 MT/day.<br />
                  • <strong>Moderate Risk:</strong> Discharge rate 15,000 - 24,999 MT/day.<br />
                  • <strong>High Risk:</strong> Discharge rate &lt; 15,000 MT/day (prolongs berth occupancy).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">6. Operational &amp; Regulatory Constraints:</span>
                <p className="text-[11px] text-slate-600">
                  • <strong>Low Risk:</strong> Unrestricted direct deepwater berthing.<br />
                  • <strong>Moderate Risk:</strong> Partial de-ballasting or draft window coordination required.<br />
                  • <strong>High Risk:</strong> Regulatory ban (e.g. Chennai coal prohibition) or mandatory Sandheads lighterage.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowRiskRubricModal(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors shadow-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA PROVENANCE & ASSUMPTIONS MODAL */}
      {showProvenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Data Sources &amp; Assumptions</h3>
              </div>
              <button
                onClick={() => setShowProvenanceModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <p>
                Every metric displayed in FreightSense exposes its authoritative data classification:
              </p>

              <div className="space-y-2 pt-1">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block">Port Constraints &amp; Maximum Drafts:</strong>
                  <span className="text-[11px] text-slate-500">
                    Source: Indian Ports Association (IPA) &amp; Port Authority Harbor Master Circulars (Coverage: 2021-2024). Classification: <em>Historical Official Statistics</em>.
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block">Mechanized Handling &amp; Discharge Benchmarks:</strong>
                  <span className="text-[11px] text-slate-500">
                    Source: Ministry of Ports, Shipping and Waterways (MoPSW) Performance Reports &amp; Terminal Tariffs. Classification: <em>Configured Benchmark</em>.
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block">Port Congestion &amp; Anchorage Queues:</strong>
                  <span className="text-[11px] text-slate-500">
                    Default view uses IPA historical average waiting days. When &quot;Simulated High Congestion&quot; is toggled, it is explicitly classified as <em>Simulated Port Congestion</em>.
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block">Under-Keel Clearance ($UKC$) &amp; Demurrage:</strong>
                  <span className="text-[11px] text-slate-500">
                    Classification: <em>Calculated Deterministic Metrics</em> based on vessel draft formulas and user parcel inputs.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProvenanceModal(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAIL DRAWER (FOR TAB 2) */}
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

export default function PortsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading East Coast India Port Intelligence...
        </div>
      }
    >
      <PortsPageContent />
    </Suspense>
  );
}
