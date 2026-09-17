'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
  GitBranch,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { dataSourceService, forecastService, DataSourceRegistryItem, defaultDataSourcesRegistry } from '@/services';
import { mockForecastModelInfo } from '@/data/forecastData';

export default function MethodologyPage() {
  const [sources, setSources] = useState<DataSourceRegistryItem[]>(defaultDataSourcesRegistry);
  const [modelInfo, setModelInfo] = useState(mockForecastModelInfo);

  useEffect(() => {
    dataSourceService.getDataSources().then(res => {
      if (res && res.length > 0) setSources(res);
    });
    forecastService.getModelInfo().then(info => {
      if (info) setModelInfo(info);
    });
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Data Sources & Methodology
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Open Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Transparency, data lineage, Bayesian econometric formulation, and statistical validation parameters
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/forecast"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Explore Forecast Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* VISUAL PIPELINE FLOW */}
      <div className="glass-card rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">End-to-End Maritime Intelligence Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">From raw telemetry ingestion to predictive decision support</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {[
            { step: '01', title: 'Raw Ingestion', sub: 'AIS, Port TOS, FBX, Customs' },
            { step: '02', title: 'Telemetry Cleaning', sub: 'Denoising, outlier rejection' },
            { step: '03', title: 'Feature Eng.', sub: 'Dwell, slot supply absorption' },
            { step: '04', title: 'Model Ensemble', sub: 'LSTM + Graph Transformer' },
            { step: '05', title: 'Econometric Forecast', sub: '7D to 90D rate trajectory' },
            { step: '06', title: 'Confidence Envelopes', sub: '95% Bayesian bounds' },
          ].map((node, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center relative flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded-full mx-auto">
                {node.step}
              </span>
              <div>
                <p className="font-bold text-slate-900 text-xs">{node.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{node.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VERIFIED DATA SOURCES LIST */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Verified Telemetry Streams</h3>
          <p className="text-xs text-slate-500">Live connectors powering the FreightSense operational graph</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src) => (
            <div key={src.id} className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    src.access_type === 'public' ? 'bg-sky-50 text-sky-700' :
                    src.access_type === 'licensed' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {src.access_type}
                  </span>
                  {src.active ? (
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Operational ({src.last_success_at || 'Synced'})
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      API Key Required
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{src.source_name}</h4>
                  <p className="text-[11px] text-slate-500">{src.provider}</p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <p><span className="text-slate-400">Coverage:</span> {src.historical_coverage}</p>
                  <p><span className="text-slate-400">Cadence:</span> {src.update_frequency}</p>
                  {src.license_notes && (
                    <p className="text-[10px] text-slate-500 italic mt-1">{src.license_notes}</p>
                  )}
                </div>
              </div>

              {src.documentation_url && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <a
                    href={src.documentation_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                  >
                    <span>Documentation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-[10px] text-slate-400 font-mono">{src.id}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FORECASTING METHODOLOGY & MODEL BENCHMARK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Model Specs */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Ensemble-M3 Model Architecture</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <p>
              The <strong>FreightSense Ensemble-M3 (v2.4)</strong> model integrates three complementary algorithmic paradigms:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600">
              <li><strong>Temporal Bi-LSTM</strong>: Captures serial correlation in daily index movements and carrier general rate increase (GRI) momentum.</li>
              <li><strong>Spatio-Temporal Graph Neural Net</strong>: Models container ripple effects across port networks and inter-regional ship reallocations.</li>
              <li><strong>Bayesian Prophet Additive Decomposition</strong>: Separates recurring seasonal swings (Pre-Golden Week, Pre-Lunar New Year) from geopolitical shocks.</li>
            </ul>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Validation Protocol</span>
              <p className="text-slate-700 text-xs mt-0.5">
                Rolling 36-month backtesting evaluated on out-of-sample forward horizons: MAPE {mockForecastModelInfo.evaluationMetrics.mape} and directional accuracy {mockForecastModelInfo.evaluationMetrics.directionalAccuracy}.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Limitations */}
        <div className="lg:col-span-6 glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Model Assumptions & Limitations</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-1">
              <p className="font-bold">Black Swan Geopolitical Events:</p>
              <p className="text-[11px]">Sudden canal blockages or military escalations cannot be anticipated before physical AIS rerouting signatures emerge.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
              <p className="font-bold">Carrier Contract Confidentiality:</p>
              <p className="text-[11px]">Private named-account BCO contract rates are estimated via public indices and broker benchmarks; carrier-direct bilateral discounts may vary.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
              <p className="font-bold">Weather Forecast Horizon Degradation:</p>
              <p className="text-[11px]">Marine meteorological hazard precision diminishes past Day 10 in accordance with standard numerical weather prediction limits.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
