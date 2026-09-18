'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ship,
  Anchor,
  Compass,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Info,
  ShieldCheck,
  Calendar,
  Layers,
  FileText,
  Boxes,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  CargoAnalysisRequest,
  CargoAnalysisResponse,
  BulkCommodity,
  DryBulkVesselClass,
  EastCoastPortConstraint,
  DecisionWorkspaceItem,
} from '@/types';
import {
  cargoAnalysisService,
  bulkService,
  portConstraintService,
} from '@/services';
import { mockBulkCommodities, mockDryBulkVesselClasses } from '@/data/bulkCargoData';
import { mockEastCoastPortConstraints } from '@/data/eastCoastPortConstraints';

// 8 analysis pipeline stages
const PIPELINE_STAGES = [
  '01: Validating Cargo Requirement & Specifications',
  '02: Checking Shipping Corridor & Transit Distance',
  '03: Loading Freight Intelligence & Rate Benchmarks',
  '04: Preparing Forecast & Volatility Markers',
  '05: Checking Vessel DWT Envelope & Sailing Draft',
  '06: Analyzing Port Berths, UKC & Lighterage Constraints',
  '07: Evaluating Route Weather, Monsoons & Choke Points',
  '08: Preparing Procurement Decision Support Matrix',
];

export default function CargoAnalysisPage() {
  // Form State
  const [cargoType, setCargoType] = useState('Hard Coking Coal (HCC)');
  const [cargoQuantity, setCargoQuantity] = useState<number>(50000);
  const [originCountry, setOriginCountry] = useState('Australia');
  const [originPort, setOriginPort] = useState('Newcastle / Hay Point');
  const [destinationPort, setDestinationPort] = useState('port-in-prt');
  const [laycanStart, setLaycanStart] = useState('2026-10-15');
  const [laycanEnd, setLaycanEnd] = useState('2026-10-25');
  const [deliveryDate, setDeliveryDate] = useState('2026-10-31');
  const [preferredVesselType, setPreferredVesselType] = useState('Panamax');
  const [targetFreight, setTargetFreight] = useState<number | undefined>(15.0);
  const [budget, setBudget] = useState<number | undefined>(800000);
  const [contractType, setContractType] = useState<'spot_voyage' | 'time_charter' | 'coa'>('spot_voyage');
  const [isDemoActive, setIsDemoActive] = useState(false);

  // Reference Data
  const [commodities, setCommodities] = useState<BulkCommodity[]>(mockBulkCommodities);
  const [vesselClasses, setVesselClasses] = useState<DryBulkVesselClass[]>(mockDryBulkVesselClasses);
  const [portConstraints, setPortConstraints] = useState<Record<string, EastCoastPortConstraint>>(mockEastCoastPortConstraints);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<CargoAnalysisResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    bulkService.getCommodities().then(res => res && setCommodities(res));
    bulkService.getVesselClasses().then(res => res && setVesselClasses(res));
    portConstraintService.getAllConstraints().then(res => res && setPortConstraints(res));
  }, []);

  // Handle Load SIH Demo Scenario
  const handleLoadDemoScenario = () => {
    const demo = cargoAnalysisService.getDemoScenario();
    setCargoType(demo.cargoType);
    setCargoQuantity(demo.cargoQuantity);
    setOriginCountry(demo.originCountry);
    setOriginPort(demo.originPort);
    setDestinationPort(demo.destinationPort);
    setLaycanStart(demo.laycanStart);
    setLaycanEnd(demo.laycanEnd);
    setDeliveryDate(demo.deliveryDate);
    setPreferredVesselType(demo.preferredVesselType);
    setTargetFreight(demo.targetFreight || 15.0);
    setBudget(demo.budget || 800000);
    setContractType(demo.contractType || 'spot_voyage');
    setIsDemoActive(true);
    setFormError(null);
  };

  // Reset form
  const handleReset = () => {
    setCargoType('Hard Coking Coal (HCC)');
    setCargoQuantity(50000);
    setOriginCountry('Australia');
    setOriginPort('Newcastle / Hay Point');
    setDestinationPort('port-in-prt');
    setLaycanStart('2026-10-15');
    setLaycanEnd('2026-10-25');
    setDeliveryDate('2026-10-31');
    setPreferredVesselType('Panamax');
    setTargetFreight(undefined);
    setBudget(undefined);
    setContractType('spot_voyage');
    setIsDemoActive(false);
    setAnalysisResult(null);
    setFormError(null);
  };

  // Run analysis workflow
  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    // Basic client validations
    if (!cargoQuantity || cargoQuantity <= 0) {
      setFormError('Cargo parcel quantity must be a positive number (> 0 MT).');
      return;
    }
    if (cargoQuantity > 350000) {
      setFormError('Cargo parcel exceeds global dry bulk vessel limits (350,000 MT).');
      return;
    }
    if (new Date(laycanStart) > new Date(laycanEnd)) {
      setFormError(`Laycan start date (${laycanStart}) cannot be later than laycan end date (${laycanEnd}).`);
      return;
    }

    setIsAnalyzing(true);
    setCurrentStageIndex(0);

    // Animate through 8 stages
    const stageInterval = setInterval(() => {
      setCurrentStageIndex(prev => {
        if (prev < PIPELINE_STAGES.length - 1) {
          return prev + 1;
        }
        clearInterval(stageInterval);
        return prev;
      });
    }, 200);

    const requestPayload: CargoAnalysisRequest = {
      cargoType,
      cargoQuantity,
      quantityUnit: 'MT',
      originCountry,
      originPort,
      destinationPort,
      deliveryDate,
      laycanStart,
      laycanEnd,
      preferredVesselType,
      targetFreight: targetFreight ? Number(targetFreight) : undefined,
      budget: budget ? Number(budget) : undefined,
      contractType,
      isDemo: isDemoActive,
    };

    try {
      const response = await cargoAnalysisService.analyzeCargoRequirement(requestPayload);
      // Wait for animation to finish nicely
      setTimeout(() => {
        clearInterval(stageInterval);
        setIsAnalyzing(false);
        setAnalysisResult(response);
      }, 1650);
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsAnalyzing(false);
      setFormError(err?.message || 'Failed to complete cargo procurement analysis.');
    }
  };

  const selectedPortData = portConstraints[destinationPort] || mockEastCoastPortConstraints['port-in-prt'];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Bulk Cargo Procurement Analysis
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" />
                SIH Phase 2 Active
              </span>
              {isDemoActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                  SIH Demonstration Scenario
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
              Define your cargo requirement to analyze freight conditions, chartering constraints, vessel compatibility, and East Coast India delivery options.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadDemoScenario}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:from-sky-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load SIH Demo Scenario</span>
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* SIH Demo Banner */}
        {isDemoActive && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <div className="font-semibold flex items-center gap-2">
                <span>SIH Demonstration Scenario Loaded</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 text-[10px] font-bold">
                  Demo / Simulated Data
                </span>
              </div>
              <p className="text-amber-800">
                50,000 MT Hard Coking Coal from Australia (Newcastle) to Paradip Port (Laycan 15–25 Oct 2026, Panamax vessel).
                Domain calculations and port draft rules are authoritative; forward freight projections link to the forecasting engine.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Grid: Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cargo Requirement Input Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">1. Cargo & Chartering Parameters</h2>
            </div>
            <span className="text-[11px] text-slate-400">All fields validated against official port limits</span>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-5">
            {/* Commodity & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bulk Commodity Type
                </label>
                <select
                  value={cargoType}
                  onChange={e => setCargoType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                >
                  {commodities.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Cargo Parcel Quantity (MT)
                  </label>
                  <div className="flex gap-1">
                    {[50000, 75000, 120000].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setCargoQuantity(val)}
                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                      >
                        {val / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="1000"
                  max="350000"
                  step="1000"
                  value={cargoQuantity}
                  onChange={e => setCargoQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Overseas Origin (Country & Port)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={originCountry}
                    onChange={e => {
                      setOriginCountry(e.target.value);
                      if (e.target.value === 'Australia') setOriginPort('Newcastle / Hay Point');
                      else if (e.target.value === 'Indonesia') setOriginPort('Samarinda / Muara Berau');
                      else if (e.target.value === 'South Africa') setOriginPort('Richards Bay');
                      else if (e.target.value === 'UAE') setOriginPort('Mina Saqr');
                      else if (e.target.value === 'Morocco') setOriginPort('Jorf Lasfar');
                    }}
                    className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Australia">Australia</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="South Africa">South Africa</option>
                    <option value="UAE">UAE</option>
                    <option value="Morocco">Morocco</option>
                  </select>
                  <input
                    type="text"
                    value={originPort}
                    onChange={e => setOriginPort(e.target.value)}
                    placeholder="Origin Port"
                    className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Destination Port (East Coast India)
                </label>
                <select
                  value={destinationPort}
                  onChange={e => setDestinationPort(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                >
                  {Object.values(portConstraints).map(p => (
                    <option key={p.portId} value={p.portId}>
                      {p.portName} ({p.portCode}) — Max Draft {p.maxPermissibleDraftMeters}m
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Laycan Window & Delivery Target */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Laycan Start Date
                </label>
                <input
                  type="date"
                  value={laycanStart}
                  onChange={e => setLaycanStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Laycan End Date
                </label>
                <input
                  type="date"
                  value={laycanEnd}
                  onChange={e => setLaycanEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Delivery Target Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Vessel Class & Contract Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Vessel Class
                </label>
                <select
                  value={preferredVesselType}
                  onChange={e => setPreferredVesselType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                >
                  {vesselClasses.map(v => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.dwtMin.toLocaleString()} - {v.dwtMax.toLocaleString()} DWT) — Draft {v.typicalDraftMeters}m
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Charter Party Contract Structure
                </label>
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="spot_voyage">Single Spot Voyage Charter Party</option>
                  <option value="time_charter">Time Charter Trip (TCT)</option>
                  <option value="coa">Contract of Affreightment (COA)</option>
                </select>
              </div>
            </div>

            {/* Optional Financial Targets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Freight Rate (USD/MT) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.00"
                    value={targetFreight !== undefined ? targetFreight : ''}
                    onChange={e => setTargetFreight(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Procurement Freight Budget (USD) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="5000"
                    placeholder="e.g. 800000"
                    value={budget !== undefined ? budget : ''}
                    onChange={e => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Domain Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Procurement Analysis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Side Summary & Port Constraint Snapshot */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Anchor className="w-4 h-4 text-sky-600" />
              Target Port Constraint Snapshot
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Destination Port</span>
                <span className="font-bold text-slate-800">{selectedPortData.portName} ({selectedPortData.portCode})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Max Permissible Draft</span>
                <span className="font-bold text-emerald-700">{selectedPortData.maxPermissibleDraftMeters} m</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Mechanized Discharge Rate</span>
                <span className="font-bold text-slate-800">{selectedPortData.mechanizedDischargeRateMtPerDay.toLocaleString()} MT / day</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Demurrage Benchmark</span>
                <span className="font-bold text-slate-800">${selectedPortData.averageDemurrageRateUsdPerDay.toLocaleString()} / day</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Lighterage Status</span>
                <span className={`font-bold ${selectedPortData.lighterageRequired ? 'text-amber-700' : 'text-slate-700'}`}>
                  {selectedPortData.lighterageRequired ? `Required (${selectedPortData.lighterageLocation})` : 'Direct Berthing Available'}
                </span>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700">Operational Note: </span>
                {selectedPortData.operationalNotes}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              SIH Domain Validation Rules Active
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>Laden vessel draft computed dynamically from parcel load factor.</li>
              <li>Under-Keel Clearance (UKC) threshold strictly verified (&ge; 1.0 m required).</li>
              <li>Haldia Dock Complex riverine constraints trigger mandatory lighterage alerts.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 8-Stage Animated Progress Tracker */}
      {isAnalyzing && (
        <div className="bg-white rounded-2xl border border-sky-200 p-6 shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />
              <h3 className="text-sm font-bold text-slate-900">
                Executing Bulk Cargo Domain Analysis Pipeline
              </h3>
            </div>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              Stage {currentStageIndex + 1} of 8
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mb-5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100}%` }}
            />
          </div>

          {/* Stage Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stage}
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-800'
                      : isCurrent
                      ? 'bg-sky-50 border border-sky-300 text-sky-900 font-semibold ring-2 ring-sky-200'
                      : 'bg-slate-50/50 border border-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Results Workspace */}
      {analysisResult && !isAnalyzing && (
        <div className="space-y-8 pt-4">
          {/* Result Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    {analysisResult.requestId}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(analysisResult.timestamp).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold">
                  Procurement Analysis: {analysisResult.cargoRequirement.cargoQuantityMt.toLocaleString()} MT {analysisResult.cargoRequirement.commodityName}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Route Corridor: {analysisResult.routeContext.corridorName} • Preferred Vessel: {analysisResult.vesselContext.vesselClass}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Baseline Voyage Benchmark</div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    ${analysisResult.freightMarket.benchmarkRateUsdMt.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-300">/ MT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8: PROCUREMENT DECISION WORKSPACE (High Visibility) */}
          <div className="bg-white rounded-2xl border-2 border-sky-500/30 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    PROCUREMENT DECISION WORKSPACE
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Multi-dimensional operational assessment across freight outlook, vessel compatibility, port constraints, route risk, and landed cost exposure.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                6 Critical Dimensions Evaluated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {analysisResult.decisionWorkspace.map((item, idx) => {
                let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                if (item.status === 'OPTIMAL') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300';
                else if (item.status === 'COMPATIBLE') badgeStyle = 'bg-sky-50 text-sky-700 border-sky-300';
                else if (item.status === 'CAUTION') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300';
                else if (item.status === 'RESTRICTED') badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300';
                else if (item.status === 'PENDING_MODEL') badgeStyle = 'bg-purple-50 text-purple-700 border-purple-300';

                return (
                  <div
                    key={item.category}
                    className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-4 flex flex-col justify-between space-y-3 hover:border-sky-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">{item.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] block">Available Data</span>
                          <span className="text-slate-700 font-medium">{item.availableData}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] block">Relevant Evidence</span>
                          <span className="text-slate-600">{item.relevantEvidence}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] block">Actionable Recommendation</span>
                      <span className="text-sky-900 font-medium">{item.actionableRecommendation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Structured 7-Section Technical Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: Cargo Requirement Context */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Boxes className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">1. Cargo Requirement Context</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Commodity Category</span>
                  <span className="font-semibold text-slate-800">{analysisResult.cargoRequirement.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Parcel Classification</span>
                  <span className="font-semibold text-slate-800">{analysisResult.cargoRequirement.parcelClassification}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Stowage Factor</span>
                  <span className="font-semibold text-slate-800">{analysisResult.cargoRequirement.stowageFactorM3PerMt} m³/MT</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Handling & IMSBC Requirements:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    {analysisResult.cargoRequirement.handlingRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2: Freight Market Context */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">2. Freight Market Context</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Benchmark Reference Rate</span>
                  <span className="font-bold text-slate-800">${analysisResult.freightMarket.benchmarkRateUsdMt.toFixed(2)} / MT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Index Reference</span>
                  <span className="font-semibold text-slate-800">{analysisResult.freightMarket.benchmarkIndexName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Market Sentiment & Volatility</span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.freightMarket.marketSentiment} ({analysisResult.freightMarket.historicVolatilityPct}% historical)
                  </span>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    Forecast Engine Connection Status
                  </div>
                  <p>{analysisResult.freightMarket.forecastStatus}.</p>
                  <p className="text-[10px] text-indigo-700">{analysisResult.freightMarket.notice}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Chartering Context */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">3. Chartering Context</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Laycan Window</span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.charteringContext.laycanStart} to {analysisResult.charteringContext.laycanEnd} ({analysisResult.charteringContext.laycanWindowDays} days)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Recommended Charter Type</span>
                  <span className="font-semibold text-slate-800">{analysisResult.charteringContext.recommendedCharterType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Market Fixture Liquidity</span>
                  <span className="font-semibold text-slate-800">{analysisResult.charteringContext.marketFixtureLiquidity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Cancellation Risk</span>
                  <span className="font-semibold text-emerald-700">{analysisResult.charteringContext.cancellationRisk}</span>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <span className="font-semibold text-slate-700">Terms Summary: </span>
                  {analysisResult.charteringContext.charterTermsSummary}
                </div>
              </div>
            </div>

            {/* Section 4: Vessel Context */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Ship className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">4. Vessel Context</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Vessel Class & Envelope</span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.vesselContext.vesselClass} ({analysisResult.vesselContext.dwtMin.toLocaleString()} - {analysisResult.vesselContext.dwtMax.toLocaleString()} DWT)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Calculated Sailing Draft</span>
                  <span className="font-bold text-sky-700">{analysisResult.vesselContext.calculatedSailingDraftM} m (Typical {analysisResult.vesselContext.typicalDraftM} m)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Bunker Fuel Consumption</span>
                  <span className="font-semibold text-slate-800">{analysisResult.vesselContext.dailyBunkerConsumptionMt} MT / day (Laden {analysisResult.vesselContext.ladenSpeedKnots} kts)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Deck Cranes / Geared</span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.vesselContext.geared
                      ? `Yes (${analysisResult.vesselContext.craneCapacityTonnes}T cranes)`
                      : 'Gearless (Requires shore discharge cranes)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <span className="font-semibold text-slate-700">Suitability Assessment: </span>
                  {analysisResult.vesselContext.suitabilityAssessment}
                </div>
              </div>
            </div>

            {/* Section 5: Port Constraints & Feasibility */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Anchor className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">5. Port Feasibility Context</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Destination Port</span>
                  <span className="font-bold text-slate-800">
                    {analysisResult.portContext.destinationPortName} ({analysisResult.portContext.portCode}, {analysisResult.portContext.state})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Permissible Draft vs UKC</span>
                  <span className="font-bold text-emerald-700">
                    Max {analysisResult.portContext.maxPermissibleDraftM} m • UKC {analysisResult.portContext.calculatedUkcM} m
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Lighterage Requirement</span>
                  <span className={`font-semibold ${analysisResult.portContext.requiresLighterage ? 'text-amber-700' : 'text-slate-800'}`}>
                    {analysisResult.portContext.requiresLighterage
                      ? `Mandatory at ${analysisResult.portContext.lighterageLocation || 'Outer Anchorage'}`
                      : 'Direct Berth Admissible'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Discharge Throughput & Turnaround</span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.portContext.mechanizedDischargeRateMtDay.toLocaleString()} MT/day (~{analysisResult.portContext.estimatedDischargeDays} days turnaround)
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <span className="font-semibold text-slate-700">Weather & Seasonal Notes: </span>
                  {analysisResult.portContext.weatherSensitivityNotes}
                </div>
              </div>
            </div>

            {/* Section 6: Shipping Corridor & Route Risk */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Compass className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">6. Shipping Corridor & Route Risk</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Corridor</span>
                  <span className="font-semibold text-slate-800">{analysisResult.routeContext.corridorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nautical Distance & Sea Transit</span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.routeContext.distanceNm.toLocaleString()} NM (~{analysisResult.routeContext.transitDaysLaden} laden transit days)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Key Maritime Choke Points</span>
                  <span className="font-semibold text-slate-800">{analysisResult.routeContext.chokePoints.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Route Risk Score</span>
                  <span className="font-bold text-slate-800">{analysisResult.routeContext.routeRiskScore} / 100</span>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <span className="font-semibold text-slate-700">Weather Vulnerability: </span>
                  {analysisResult.routeContext.weatherVulnerability}
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: Landed Cost Context */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">7. Landed Cost & Demurrage Exposure Context</h3>
              </div>
              <span className="text-xs text-slate-400">Voyage Fixture Baseline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Baseline Freight Total</span>
                <span className="text-lg font-bold text-slate-900">
                  ${analysisResult.costContext.estimatedFreightBaselineUsd.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  @ ${analysisResult.costContext.freightRateUsdMt.toFixed(2)} / MT
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Target Freight Variance</span>
                <span className="text-lg font-bold text-slate-900">
                  {analysisResult.costContext.varianceVsTargetUsdMt !== undefined && analysisResult.costContext.varianceVsTargetUsdMt !== null
                    ? `${analysisResult.costContext.varianceVsTargetUsdMt >= 0 ? '+' : ''}$${analysisResult.costContext.varianceVsTargetUsdMt.toFixed(2)}/MT`
                    : 'Not Specified'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Vs User Target</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Discharge Time Allowed</span>
                <span className="text-lg font-bold text-slate-900">
                  {analysisResult.costContext.estimatedDischargeDays} Days
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Based on berth rate</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Demurrage Risk Exposure</span>
                <span className="text-lg font-bold text-amber-700">
                  ${analysisResult.costContext.potentialDemurrageExposureUsd.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  @ ${analysisResult.costContext.demurrageRateUsdDay.toLocaleString()} / day
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">Cost Engine Connection Notice: </span>
                {analysisResult.costContext.costStatusNotice}. Demurrage risk calculated using historical major port berth waiting averages.
              </div>
            </div>
          </div>

          {/* Section 9: Next-Step Navigation ("Continue Analysis") */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-400" />
                  Continue Analysis Across FreightSense Modules
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seamlessly bridge this cargo requirement into dedicated intelligence tools.
                </p>
              </div>
              <span className="text-xs text-sky-400 font-semibold">5 Integrated Modules</span>
            </div>

            {/* PRIMARY END-TO-END WORKFLOW BRIDGE */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-sky-900/80 via-indigo-900/80 to-slate-900 border border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-sky-400 uppercase">
                    Continuous Decision Workflow (Step 1 Complete)
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Requirement Analyzed: {cargoQuantity.toLocaleString()} MT {cargoType}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Ready to evaluate shipping corridor and East Coast India port discharge constraints.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={analysisResult ? `/routes?route=${analysisResult.routeContext.routeId}&cargo=${encodeURIComponent(analysisResult.cargoRequirement.commodityName)}&origin=${encodeURIComponent(analysisResult.routeContext.originPort)}&destination=${encodeURIComponent(analysisResult.portContext.destinationPortName)}&vessel=${encodeURIComponent(analysisResult.vesselContext.vesselClass)}&quantity=${analysisResult.cargoRequirement.cargoQuantityMt}` : `/routes?cargo=${encodeURIComponent(cargoType)}&origin=${encodeURIComponent(originPort)}&destination=${destinationPort}&quantity=${cargoQuantity}&vessel=${preferredVesselType}`}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Step 2: Route Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={analysisResult ? `/decision-center?cargo=${encodeURIComponent(analysisResult.cargoRequirement.commodityName)}&quantity=${analysisResult.cargoRequirement.cargoQuantityMt}&origin=${encodeURIComponent(analysisResult.routeContext.originPort)}&destination=${encodeURIComponent(analysisResult.portContext.destinationPortId)}&vessel=${encodeURIComponent(analysisResult.vesselContext.vesselClass)}&laycan_start=${analysisResult.charteringContext.laycanStart}&laycan_end=${analysisResult.charteringContext.laycanEnd}&freight=${analysisResult.costContext.freightRateUsdMt}` : `/decision-center?cargo=${encodeURIComponent(cargoType)}&quantity=${cargoQuantity}&origin=${encodeURIComponent(originPort)}&destination=${destinationPort}&vessel=${preferredVesselType}&laycan_start=${laycanStart}&laycan_end=${laycanEnd}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Direct to Decision Center</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Link
                href={analysisResult ? `/forecast?route=${analysisResult.routeContext.routeId}&cargo=${encodeURIComponent(analysisResult.cargoRequirement.commodityName)}&origin=${encodeURIComponent(analysisResult.routeContext.originPort)}&destination=${encodeURIComponent(analysisResult.portContext.destinationPortName)}&vessel=${encodeURIComponent(analysisResult.vesselContext.vesselClass)}&laycan=${encodeURIComponent(analysisResult.charteringContext.laycanStart + ' to ' + analysisResult.charteringContext.laycanEnd)}` : '/forecast'}
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
                  </div>
                  <div className="font-bold text-xs text-white">Freight Forecast</div>
                  <div className="text-[11px] text-slate-400 mt-1">Multi-horizon rate projections</div>
                </div>
                <span className="text-[10px] text-sky-400 font-semibold mt-3 block">Explore Rates →</span>
              </Link>

              <Link
                href="/ports"
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Anchor className="w-4 h-4 text-emerald-400" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
                  </div>
                  <div className="font-bold text-xs text-white">Port Intelligence</div>
                  <div className="text-[11px] text-slate-400 mt-1">Drafts, berths & congestion</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-3 block">Inspect Ports →</span>
              </Link>

              <Link
                href="/routes"
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
                  </div>
                  <div className="font-bold text-xs text-white">Route Network</div>
                  <div className="text-[11px] text-slate-400 mt-1">Choke points & distances</div>
                </div>
                <span className="text-[10px] text-amber-400 font-semibold mt-3 block">View Routes →</span>
              </Link>

              <Link
                href="/scenario"
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
                  </div>
                  <div className="font-bold text-xs text-white">Scenario Simulator</div>
                  <div className="text-[11px] text-slate-400 mt-1">Bunker fuel & delay shocks</div>
                </div>
                <span className="text-[10px] text-purple-400 font-semibold mt-3 block">Simulate →</span>
              </Link>

              <Link
                href={analysisResult ? `/vessels?tab=chartering&route=${analysisResult.routeContext.routeId}&cargo=${encodeURIComponent(analysisResult.cargoRequirement.commodityName)}&origin=${encodeURIComponent(analysisResult.routeContext.originPort)}&destination=${encodeURIComponent(analysisResult.portContext.destinationPortName)}&vessel=${encodeURIComponent(analysisResult.vesselContext.vesselClass)}&laycan=${encodeURIComponent(analysisResult.charteringContext.laycanStart + ' to ' + analysisResult.charteringContext.laycanEnd)}&quantity=${analysisResult.cargoRequirement.cargoQuantityMt}&freight=${analysisResult.costContext.freightRateUsdMt}` : '/vessels?tab=chartering'}
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Ship className="w-4 h-4 text-cyan-400" />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
                  </div>
                  <div className="font-bold text-xs text-white">Vessel & Chartering</div>
                  <div className="text-[11px] text-slate-400 mt-1">Selection & voyage economics</div>
                </div>
                <span className="text-[10px] text-cyan-400 font-semibold mt-3 block">Optimize Charter →</span>
              </Link>
            </div>
          </div>

          {/* Section 10: Data & Assumptions (Provenance Metadata Table) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">10. Data Provenance & Assumptions</h3>
              </div>
              <span className="text-[11px] text-slate-400">Authoritative audit trail</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Source / Agency</th>
                    <th className="pb-2">Dataset Name</th>
                    <th className="pb-2">Coverage Period</th>
                    <th className="pb-2">Data Type</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysisResult.dataProvenance.map((dp, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-800">{dp.source}</td>
                      <td className="py-2.5 text-slate-600">{dp.datasetName}</td>
                      <td className="py-2.5 text-slate-500">{dp.coveragePeriod}</td>
                      <td className="py-2.5 text-slate-500">{dp.dataType}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dp.status === 'historical'
                            ? 'bg-slate-100 text-slate-700'
                            : dp.status === 'demo'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {dp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
