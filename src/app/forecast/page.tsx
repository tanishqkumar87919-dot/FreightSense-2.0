'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Info,
  ChevronRight,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { Modal } from '@/components/ui/Modal';
import { forecastService, feedbackService } from '@/services';
import { mockRouteForecasts, mockForecastModelInfo, mockForecastContributingFactors } from '@/data/forecastData';
import { mockRoutes } from '@/data/routeData';

export default function ForecastPage() {
  const [selectedRouteId, setSelectedRouteId] = useState('route-sha-rot');
  const [horizon, setHorizon] = useState<'7D' | '14D' | '30D' | '60D' | '90D'>('30D');
  
  const [forecastData, setForecastData] = useState<any>(mockRouteForecasts['route-sha-rot']['30D']);
  const [modelInfo, setModelInfo] = useState(mockForecastModelInfo);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);

  // Modals state
  const [isDiscrepancyModalOpen, setIsDiscrepancyModalOpen] = useState(false);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [discrepancyComment, setDiscrepancyComment] = useState('');
  const [suggestedRate, setSuggestedRate] = useState('');

  // Observation form
  const [obsMetric, setObsMetric] = useState('spot_rate_usd');
  const [obsValue, setObsValue] = useState('');
  const [obsContext, setObsContext] = useState('');
  const [obsStatusMessage, setObsStatusMessage] = useState('');

  useEffect(() => {
    forecastService.getForecast(selectedRouteId, horizon).then((res) => {
      if (res) setForecastData(res);
    });
    forecastService.getModelInfo().then((info) => {
      if (info) setModelInfo(info);
    });
  }, [selectedRouteId, horizon]);

  const handleRating = async (rating: 'helpful' | 'unhelpful') => {
    await feedbackService.submitPredictionFeedback({
      route_id: selectedRouteId,
      rating,
    });
    setFeedbackSubmitted(`Thank you! Forecast marked as ${rating}.`);
    setTimeout(() => setFeedbackSubmitted(null), 4000);
  };

  const handleDiscrepancySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await feedbackService.submitPredictionFeedback({
      route_id: selectedRouteId,
      rating: 'incorrect',
      comment: discrepancyComment,
      suggested_rate: suggestedRate ? parseFloat(suggestedRate) : undefined,
    });
    setIsDiscrepancyModalOpen(false);
    setDiscrepancyComment('');
    setSuggestedRate('');
    setFeedbackSubmitted('Discrepancy report recorded for human audit & reliability ranking.');
    setTimeout(() => setFeedbackSubmitted(null), 5000);
  };

  const handleObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsValue) return;
    await feedbackService.submitUserObservation({
      entity_type: 'route',
      entity_id: selectedRouteId,
      observation_type: obsMetric,
      value: parseFloat(obsValue),
      unit: obsMetric === 'spot_rate_usd' ? 'USD/FEU' : 'days',
      source_context: obsContext || 'Direct carrier booking confirmation',
    });
    setIsObservationModalOpen(false);
    setObsValue('');
    setObsContext('');
    setFeedbackSubmitted('Observation submitted. Quarantined in pending pool until verification.');
    setTimeout(() => setFeedbackSubmitted(null), 5000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Predict the Next Move.
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              Econometric AI Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Machine-learned spot rate projections with multi-factor Bayesian posterior confidence intervals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsObservationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Submit Observation</span>
          </button>
          <Link
            href="/scenario"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Test a Scenario Simulation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedbackSubmitted && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackSubmitted}</span>
          </div>
          <button onClick={() => setFeedbackSubmitted(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* SELECTORS BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Route Selector */}
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-semibold">Tradelane Corridor:</label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-sky-500"
            >
              {mockRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.corridor})
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Forecast Horizon Selector (7D to 90D) */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Horizon:</span>
            {(['7D', '14D', '30D', '60D', '90D'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  horizon === h
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {forecastData.isRealBackendData ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              REAL BACKEND DATA
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              DEMO / FALLBACK DATA
            </span>
          )}
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {forecastData.modelVersion || modelInfo.version} • {forecastData.sourceFreshness || 'Telemetry Verified'}
            </span>
          </span>
        </div>
      </div>

      {/* FORECAST CHART COMPONENT */}
      <ForecastChart
        series={forecastData.series}
        expectedRateUsd={forecastData.expectedRateUsd}
        expectedChangePercent={forecastData.expectedChangePercent}
        confidencePercent={forecastData.confidencePercent}
        riskScore={forecastData.riskScore}
      />

      {/* FEEDBACK BAR */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-800">Was this {horizon} projection helpful?</span>
          <span className="text-[11px] text-slate-400">User ratings calibrate model reliability without altering raw ground-truth.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRating('helpful')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Helpful</span>
          </button>
          <button
            onClick={() => handleRating('unhelpful')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
            <span>Unhelpful</span>
          </button>
          <button
            onClick={() => setIsDiscrepancyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Report Discrepancy</span>
          </button>
        </div>
      </div>

      {/* CONTRIBUTING FACTORS & MODEL ARCHITECTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Factor Breakdown */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Key Forecasting Drivers & Feature Weights</h3>
              <p className="text-xs text-slate-500 mt-0.5">Underlying econometric factors influencing the {horizon} projection</p>
            </div>
            <Link href="/signals" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              All Signals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {mockForecastContributingFactors.map((factor, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900">{factor.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      factor.sentiment === 'bullish' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {factor.impactScore} {factor.sentiment === 'bullish' ? 'Upward' : 'Downward'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Model Transparency & Governance Box */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Cpu className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Model Architecture & Verification</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Model Specification</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{forecastData.modelVersion || modelInfo.version}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Training Set: {modelInfo.trainingPeriod}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">MAPE Accuracy</span>
                  <p className="text-base font-bold text-sky-700 mt-0.5">{modelInfo.evaluationMetrics.mape}</p>
                  <p className="text-[10px] text-slate-500">Mean Abs % Error</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Directional Accuracy</span>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">{modelInfo.evaluationMetrics.directionalAccuracy}</p>
                  <p className="text-[10px] text-slate-500">Backtested (3-yr)</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Calibrated against daily FBX spot benchmarks with Bayesian prior updates.</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/methodology" className="text-sky-600 hover:underline font-medium">
              View Full Methodology Documentation
            </Link>
            <Link href="/reports" className="text-slate-500 hover:text-slate-800">
              Download Forecast PDF
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL 1: REPORT DISCREPANCY */}
      <Modal
        isOpen={isDiscrepancyModalOpen}
        onClose={() => setIsDiscrepancyModalOpen(false)}
        title="Report Market Forecast Discrepancy"
        subtitle={`Corridor: ${selectedRouteId} • Horizon: ${horizon}`}
        maxWidth="md"
      >
        <form onSubmit={handleDiscrepancySubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Submit observed market deviations. Reports are audited by the reliability pipeline and help detect potential data drift.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observed Spot Rate (USD/FEU, optional)</label>
            <input
              type="number"
              value={suggestedRate}
              onChange={(e) => setSuggestedRate(e.target.value)}
              placeholder="e.g. 4350"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Discrepancy Rationale / Context</label>
            <textarea
              value={discrepancyComment}
              onChange={(e) => setDiscrepancyComment(e.target.value)}
              rows={3}
              placeholder="Describe spot quotes, booking rejections, or unexpected carrier surcharge announcements..."
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-900 text-[11px]">
            <strong>Quality Policy:</strong> Subjective feedback is recorded for human review and drift tracking. It never directly overwrites numerical ground truth.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDiscrepancyModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
            >
              Submit Discrepancy Report
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: SUBMIT FIELD OBSERVATION */}
      <Modal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        title="Submit Field Observation"
        subtitle="Operator Telemetry Contribution"
        maxWidth="md"
      >
        <form onSubmit={handleObservationSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observation Metric</label>
            <select
              value={obsMetric}
              onChange={(e) => setObsMetric(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-sky-500"
            >
              <option value="spot_rate_usd">Confirmed Spot Rate (USD/FEU)</option>
              <option value="dwell_days">Port Terminal Dwell (Days)</option>
              <option value="delay_days">Corridor Delay (Days)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observed Value</label>
            <input
              type="number"
              step="any"
              value={obsValue}
              onChange={(e) => setObsValue(e.target.value)}
              placeholder="e.g. 4250"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Source & Context</label>
            <input
              type="text"
              value={obsContext}
              onChange={(e) => setObsContext(e.target.value)}
              placeholder="e.g. Carrier booking confirmation from Maersk / MSC"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-sky-900 text-[11px]">
            <strong>Moderation Gate:</strong> Observations enter a pending quarantine pool. Only observations that pass provenance checks and statistical verification are promoted into the training pool.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsObservationModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
            >
              Submit for Verification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
