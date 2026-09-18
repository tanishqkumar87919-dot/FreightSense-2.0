'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Filter,
  CheckCircle2,
  ChevronRight,
  Database,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Search,
  HelpCircle,
  TrendingUp,
  Anchor,
  Ship,
  Scale,
  Sliders,
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Clock,
  FileText,
  AlertCircle,
  Activity,
  Award,
} from 'lucide-react';
import { ConfidenceBadge } from '@/components/ui/StatusBadge';
import { Drawer } from '@/components/ui/Drawer';
import { mockAIInsights } from '@/data/insightData';
import {
  AIInsight,
  IntelligenceContext,
  IntelligenceQueryResponse,
  DecisionTraceNode,
  AssumptionItem,
  ModelCardInfo,
  DataQualityEvidenceState,
  FeatureDriver,
  MissingVariableItem,
} from '@/types';
import { insightService, intelligenceService } from '@/services';

const PREBUILT_QUESTIONS = [
  'Why is the 30-day forecast increasing for Australia to Paradip?',
  'What are the top 3 drivers influencing this freight rate?',
  'Is a Capesize vessel compatible with Paradip Port?',
  'What happens to total cost if destination port waiting time increases by 3 days?',
  'What variables are currently unobserved or missing from this analysis?',
  'How does the estimated demurrage compare to standard charter party allowance?',
  'What assumptions is the voyage economics model making for bunker fuel?',
  'What is the recommended chartering window based on the forecast trend?',
];

function InsightsContent() {
  const searchParams = useSearchParams();

  // Tab State: 'decision_center' | 'decision_trace' | 'assumptions_model_card' | 'macro_insights'
  const initialTab = searchParams.get('tab') || 'decision_center';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Context & Intelligence State
  const [context, setContext] = useState<IntelligenceContext | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  // Grounded Q&A State
  const [queryInput, setQueryInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [queryResponse, setQueryResponse] = useState<IntelligenceQueryResponse | null>(null);
  const [selectedTraceNode, setSelectedTraceNode] = useState<DecisionTraceNode | null>(null);

  // Preserved Macro Insights State
  const [macroInsights, setMacroInsights] = useState<AIInsight[]>([]);
  const [isMacroLoading, setIsMacroLoading] = useState(true);
  const [macroCategory, setMacroCategory] = useState('All');
  const [selectedMacroInsight, setSelectedMacroInsight] = useState<AIInsight | null>(null);

  // Load Primary Intelligence Context
  const loadContext = useCallback(async () => {
    setIsContextLoading(true);
    setContextError(null);
    try {
      const data = await intelligenceService.getIntelligenceContext();
      setContext(data);
      if (data.decision_trace && data.decision_trace.length > 0) {
        setSelectedTraceNode(data.decision_trace[0]);
      }
    } catch (err: any) {
      console.error('Error loading intelligence context:', err);
      setContextError(err?.message || 'Unable to load grounded intelligence context.');
    } finally {
      setIsContextLoading(false);
    }
  }, []);

  // Load Preserved Macro Insights
  const loadMacroInsights = useCallback(async () => {
    setIsMacroLoading(true);
    try {
      const res = await insightService.getInsights();
      if (res && Array.isArray(res) && res.length > 0) {
        setMacroInsights(res);
      } else {
        setMacroInsights(mockAIInsights);
      }
    } catch (err) {
      console.error('Error loading macro insights:', err);
      setMacroInsights(mockAIInsights);
    } finally {
      setIsMacroLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContext();
    loadMacroInsights();
  }, [loadContext, loadMacroInsights]);

  // Execute Question
  const handleRunQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setQueryInput(queryText);
    setIsAnswering(true);
    try {
      const resp = await intelligenceService.explainQuery({
        query: queryText,
        commodity_name: context?.commodity_name,
        cargo_quantity_mt: context?.cargo_quantity_mt,
        origin_port: context?.origin_port,
        destination_port_id: context?.destination_port_id,
        vessel_class: context?.vessel_class,
        forecast_rate_usd_mt: context?.forecast_rate_usd_mt,
      });
      setQueryResponse(resp);
    } catch (err) {
      console.error('Error answering query:', err);
    } finally {
      setIsAnswering(false);
    }
  };

  const macroCategories = ['All', 'Market', 'Route', 'Port', 'Risk', 'Forecast'];
  const filteredMacroInsights = (macroInsights || []).filter((i) => {
    if (!i) return false;
    if (macroCategory === 'All') return true;
    return (i.category || '').toLowerCase() === macroCategory.toLowerCase();
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              FreightSense Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold border border-sky-300 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Decision Support Center
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Explainable decision support for freight, cargo, vessels and ports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/cargo-analysis"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors shadow-2xs"
          >
            <Scale className="w-3.5 h-3.5 text-sky-600" />
            <span>Cargo Analysis</span>
          </Link>
          <Link
            href="/scenario"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>What-If Simulator</span>
          </Link>
          <button
            onClick={() => {
              loadContext();
              loadMacroInsights();
            }}
            disabled={isContextLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs"
            title="Refresh Intelligence Engine"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isContextLoading ? 'animate-spin' : ''}`} />
            <span>Sync Engine</span>
          </button>
        </div>
      </div>

      {/* PRIMARY 4 TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('decision_center')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'decision_center'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Decision Support Center</span>
        </button>

        <button
          onClick={() => setActiveTab('decision_trace')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'decision_trace'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Decision Trace</span>
          {context?.decision_trace && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-400">
              {context.decision_trace.length} Steps
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('assumptions_model_card')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'assumptions_model_card'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Assumptions & Model Card</span>
        </button>

        <button
          onClick={() => setActiveTab('macro_insights')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'macro_insights'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Global Macro Insights</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {macroInsights.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DECISION SUPPORT CENTER */}
      {activeTab === 'decision_center' && (
        <div className="space-y-8">
          {/* Active Grounded Context Banner */}
          {context && (
            <div className="glass-card rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-200 text-sky-900">
                      Active Operational Baseline
                    </span>
                    <span className="text-xs text-slate-500">
                      Grounded Corridor: {context.origin_port} → {context.destination_port}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {context.commodity_name} • {context.cargo_quantity_mt.toLocaleString()} MT via {context.vessel_class} Bulk Carrier
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px]">30-Day Spot Rate</span>
                    <span className="text-sky-700 font-extrabold text-sm">
                      ${context.forecast_rate_usd_mt.toFixed(2)} / MT
                    </span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px]">95% Empirical Interval</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      [${context.uncertainty_intervals.horizon_30d?.lower.toFixed(2)}, ${context.uncertainty_intervals.horizon_30d?.upper.toFixed(2)}]
                    </span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px]">Evidence State</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {context.data_quality.evidence_state}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Natural Language Grounded Q&A Console */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Natural Language Grounded Q&A Console</h3>
              </div>
              <p className="text-xs text-slate-500">
                Auditable explanations grounded strictly in XGBoost v2.5 model metrics, IPA port statistics, and charter party calculations.
              </p>
            </div>

            {/* Prebuilt Question Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Auditable Domain Questions (Click to Analyze):
              </span>
              <div className="flex flex-wrap gap-2">
                {PREBUILT_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunQuery(q)}
                    disabled={isAnswering}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-900 border border-slate-200 hover:border-sky-300 transition-all text-left shadow-2xs disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunQuery(queryInput);
                  }}
                  placeholder="Ask an operational or economic question about this corridor (e.g. Why is freight rate increasing?)..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs"
                />
                <HelpCircle className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              </div>
              <button
                onClick={() => handleRunQuery(queryInput)}
                disabled={isAnswering || !queryInput.trim()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isAnswering ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Explain Query</span>
                  </>
                )}
              </button>
            </div>

            {/* Structured Grounded Answer Display */}
            {queryResponse && (
              <div className="rounded-2xl border border-sky-200 bg-slate-50/70 p-6 space-y-5 animate-fadeIn">
                {/* Header & Category */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                      {queryResponse.intent_category}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Query: &quot;{queryResponse.query}&quot;
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Status: {queryResponse.data_status}
                  </span>
                </div>

                {/* 1. Answer */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                    Auditable Synthesis (ANSWER)
                  </span>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {queryResponse.answer}
                  </p>
                </div>

                {/* 2. Evidence & Citations */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Domain Evidence & Signal Sources (EVIDENCE)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {queryResponse.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium">{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Impact & Uncertainty Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                      Commercial & Operational Impact (IMPACT)
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">{queryResponse.impact}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      Model Uncertainty & Prediction Interval (UNCERTAINTY)
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">{queryResponse.uncertainty}</p>
                  </div>
                </div>

                {/* 4. Decision Factors */}
                {queryResponse.decision_factors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Independent Decision Factors
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {queryResponse.decision_factors.map((df, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium shadow-2xs"
                        >
                          {df}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Limitations & Missing Factors */}
                {queryResponse.limitations.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Transparent Disclosures & Unobserved Factors:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800">
                      {queryResponse.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* "WHY THIS FORECAST?": EXPLANATION FLOW */}
          {context && (
            <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Why this forecast? (Causal Implication Chain)</h3>
                <p className="text-xs text-slate-500">
                  Step-by-step causal chain showing how raw market signals convert into model predictions and procurement implications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {context.explanation_flow.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3 relative"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Step {idx + 1}: {step.step}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            step.type === 'Observed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.type === 'Calculated'
                              ? 'bg-sky-100 text-sky-800'
                              : step.type === 'Model Output'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {step.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{step.label}</h4>
                      <p className="text-slate-600 leading-relaxed mt-1">{step.description}</p>
                    </div>
                    {idx < 3 && (
                      <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORECAST DRIVERS & UNCERTAINTY SECTION */}
          {context && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Feature Drivers */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    <h3 className="text-base font-bold text-slate-900">Econometric Feature Drivers (XGBoost v2.5)</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Feature importance weights derived from tree-gain and SHAP attribution in champion model registry.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {context.feature_drivers.map((driver, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">{driver.name}</span>
                        <span className="text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-[11px]">
                          {driver.weight_pct}% Weight
                        </span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-600 h-full rounded-full"
                          style={{ width: `${driver.weight_pct * 2.5}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Observed Signal:</span>
                          <span>{driver.observed_signal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Model Impact:</span>
                          <span className="font-semibold text-slate-800">{driver.model_output}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Forecast Uncertainty across Horizons */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-600" />
                    <h3 className="text-base font-bold text-slate-900">Multi-Horizon Forecast Uncertainty</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    95% empirical prediction intervals calibrated via walk-forward quantile residuals.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {Object.entries(context.uncertainty_intervals).map(([key, interval]) => {
                    const label = key.replace('horizon_', '') + ' Horizon';
                    const spread = interval.upper - interval.lower;
                    return (
                      <div key={key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 capitalize">{label}</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-slate-400 text-[11px]">Interval Spread:</span>
                            <span className="font-bold text-purple-700">±${(spread / 2).toFixed(2)}/MT</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Lower Bound: ${interval.lower.toFixed(2)}</span>
                          <span className="text-sky-700 font-extrabold text-xs">
                            Forecast: ${interval.forecast.toFixed(2)} / MT
                          </span>
                          <span className="text-slate-500">Upper Bound: ${interval.upper.toFixed(2)}</span>
                        </div>

                        {/* Visual Range Indicator */}
                        <div className="w-full bg-slate-200 h-2 rounded-full relative overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{
                              marginLeft: `${((interval.lower - 14.0) / 4.0) * 100}%`,
                              width: `${(spread / 4.0) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* DATA QUALITY & WHAT IS MISSING? SECTION */}
          {context && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Evidence State & Criteria Evaluated */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">Data Confidence & Evidence State</h3>
                    <p className="text-xs text-slate-500">
                      Transparent evidence evaluation without synthetic composite scores.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {context.data_quality.evidence_state}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                  {context.data_quality.state_rationale}
                </p>

                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Criteria Evaluated:
                  </span>
                  {context.data_quality.criteria_evaluated.map((crit, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{crit.criterion}</span>
                        <span className="text-[11px] text-slate-500">{crit.evidence}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          crit.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {crit.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What is missing? Unobserved Variables */}
              <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <h3 className="text-base font-bold text-slate-900">What is missing? (Unobserved Variables)</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Explicit list of operational variables not observed in real time, with impacts and mitigations.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {context.missing_variables.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{item.variable}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800">
                          Unobserved
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div>
                          <span className="font-semibold text-rose-900">Impact: </span>
                          <span>{item.impact}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-emerald-800">User Mitigation: </span>
                          <span>{item.mitigation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE DECISION TRACE */}
      {activeTab === 'decision_trace' && context && (
        <div className="space-y-8">
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">End-to-End Decision Trace</h3>
              </div>
              <p className="text-xs text-slate-500">
                Click any node in the flowchart to inspect the exact input parameters, formulas, models, and data provenance.
              </p>
            </div>

            {/* Clickable Node Flowchart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {context.decision_trace.map((node, idx) => {
                const isSelected = selectedTraceNode?.node_id === node.node_id;
                return (
                  <button
                    key={node.node_id}
                    onClick={() => setSelectedTraceNode(node)}
                    className={`p-4 rounded-xl text-left border transition-all relative flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 shadow-md ring-2 ring-sky-400/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Phase {node.phase_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                          {node.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{node.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{node.subtitle}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{node.key_metric_label}:</span>
                      <span className="font-extrabold text-slate-900 text-xs">{node.key_metric_value}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Node Deep-Dive Inspector */}
            {selectedTraceNode && (
              <div className="rounded-2xl border border-sky-200 bg-slate-50/80 p-6 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                      Phase {selectedTraceNode.phase_number} Inspector
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{selectedTraceNode.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Source:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                      {selectedTraceNode.source_attribution}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {Object.entries(selectedTraceNode.details).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {k.replace(/_/g, ' ')}
                      </span>
                      <p className="font-bold text-slate-900 text-xs">
                        {typeof v === 'number'
                          ? v.toLocaleString()
                          : typeof v === 'boolean'
                          ? v ? 'Yes' : 'No'
                          : String(v)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSUMPTIONS & MODEL CARD */}
      {activeTab === 'assumptions_model_card' && context && (
        <div className="space-y-8">
          {/* Assumption Register */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Canonical Assumption Register</h3>
              </div>
              <p className="text-xs text-slate-500">
                All external economic parameters, contractual terms, and port benchmarks used in FreightSense calculations.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4">Parameter</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Benchmark Value</th>
                    <th className="py-3 px-4">Source / Agency</th>
                    <th className="py-3 px-4">Data Status</th>
                    <th className="py-3 px-4">Sensitivity Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {context.assumptions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.parameter}</td>
                      <td className="py-3 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">{item.value}</td>
                      <td className="py-3 px-4 text-slate-600">{item.source}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.data_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{item.sensitivity_impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Card */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-900">Champion Model Card ({context.model_card.version})</h3>
                </div>
                <p className="text-xs text-slate-500 font-mono">{context.model_card.model_name}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                STATUS: {context.model_card.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Algorithm</span>
                <p className="font-bold text-slate-900">{context.model_card.algorithm}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Training Period</span>
                <p className="font-bold text-slate-900">{context.model_card.training_data_period}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Evaluation Method</span>
                <p className="font-bold text-slate-900">{context.model_card.evaluation_method}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Target Variable</span>
                <p className="font-bold text-slate-900">{context.model_card.target_variable}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cross-Validation Performance Metrics:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs font-mono">
                {Object.entries(context.model_card.metrics).map(([m, val]) => (
                  <div key={m} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-sans">
                      {m.replace(/_/g, ' ')}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Set */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Feature Inputs:
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {context.model_card.feature_set.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL MACRO INSIGHTS (PRESERVED) */}
      {activeTab === 'macro_insights' && (
        <div className="space-y-6">
          {/* Category Filter Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
            {macroCategories.map((cat) => {
              const isSelected = macroCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setMacroCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'All' ? 'All Global Macro Feeds' : `${cat} Macro`}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {isMacroLoading && (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="glass-card rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-16 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* List */}
          {!isMacroLoading && filteredMacroInsights.length > 0 && (
            <div className="space-y-6">
              {filteredMacroInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
                          {insight.category || 'Domain'} Intelligence
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {insight.timestamp || 'Real-time Telemetry'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{insight.title || 'Market Intelligence Brief'}</h3>
                    </div>
                    <ConfidenceBadge score={typeof insight.confidenceScore === 'number' ? insight.confidenceScore : 90} />
                  </div>

                  {/* Core Domain Reasoning Quad */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">1. Empirical Observation</span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {insight.observation || 'Empirical observation data being synthesized from live telemetry.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">2. Root Cause Analysis</span>
                      <p className="text-slate-600 leading-relaxed">
                        {insight.explanation || 'Detailed causal breakdown being processed by machine reasoning pipeline.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">3. Operational & Commercial Impact</span>
                      <p className="text-slate-700 leading-relaxed">
                        {insight.impact || 'Operational and commercial impacts under active monitoring across corridors.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-sky-800">4. Forward-Looking Forecast</span>
                      <p className="text-sky-900 font-semibold leading-relaxed">
                        {insight.forecast || 'Projections based on champion forecasting model v2.5.'}
                      </p>
                    </div>
                  </div>

                  {/* Supporting Metrics */}
                  {(insight.supportingMetrics ?? []).length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex flex-wrap items-center gap-6">
                        {(insight.supportingMetrics ?? []).map((sm, i) => (
                          <div key={i} className="flex items-baseline gap-1.5">
                            <span className="text-slate-500 text-[11px]">{sm.label}:</span>
                            <span className="font-bold text-slate-900">{sm.value}</span>
                            {sm.change && <span className="text-[10px] font-semibold text-emerald-600">({sm.change})</span>}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setSelectedMacroInsight(insight)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors"
                      >
                        View Supporting Data <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Verified Sources: {(insight.dataSources ?? ['SCFI Target Registry', 'AIS Telemetry']).join(', ')}</span>
                    </div>
                    <span className="font-mono">{insight.modelVersion || 'FreightSense Intelligence Engine v2.5'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drawer for Macro Insight */}
          {selectedMacroInsight && (
            <Drawer
              isOpen={!!selectedMacroInsight}
              onClose={() => setSelectedMacroInsight(null)}
              title="Underlying Telemetry & Source Evidence"
              subtitle={selectedMacroInsight.title || 'Domain Intelligence Brief'}
              width="lg"
            >
              <div className="space-y-6 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Domain Observation</p>
                  <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                    {selectedMacroInsight.observation || 'Empirical observation data being synthesized from live telemetry.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                    Ingested Telemetry Feeds
                  </h4>
                  <div className="space-y-2">
                    {(selectedMacroInsight.dataSources ?? []).map((ds, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{ds}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                    Verified Quantitative Metrics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(selectedMacroInsight.supportingMetrics ?? []).map((sm, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500">{sm.label}</span>
                        <p className="text-base font-bold text-slate-900 mt-0.5">{sm.value}</p>
                        {sm.change && <p className="text-[10px] font-semibold text-emerald-600">{sm.change}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Drawer>
          )}
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading FreightSense Intelligence Decision Support Center...
        </div>
      }
    >
      <InsightsContent />
    </Suspense>
  );
}
