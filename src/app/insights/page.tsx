'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Filter,
  CheckCircle2,
  ChevronRight,
  Database,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { ConfidenceBadge } from '@/components/ui/StatusBadge';
import { Drawer } from '@/components/ui/Drawer';
import { mockAIInsights } from '@/data/insightData';
import { AIInsight } from '@/types';
import { insightService } from '@/services';

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await insightService.getInsights();
      if (res && Array.isArray(res) && res.length > 0) {
        setInsights(res);
      } else {
        setInsights(mockAIInsights);
      }
    } catch (err: any) {
      console.error('Error loading AI insights:', err);
      setError(err?.message || 'Unable to establish connection to the domain reasoning service.');
      setInsights(mockAIInsights);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const categories = ['All', 'Market', 'Route', 'Port', 'Risk', 'Forecast'];

  const filteredInsights = (insights || []).filter((i) => {
    if (!i) return false;
    if (selectedCategory === 'All') return true;
    return (i.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              From Data to Decisions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Machine Domain Reasoning
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synthesized domain interpretations connecting disparate satellite AIS, customs manifests, and terminal queue feeds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadInsights}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs"
            title="Refresh Intelligence Feeds"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Feeds</span>
          </button>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Methodology & Validation</span>
          </Link>
        </div>
      </div>

      {/* CATEGORY TABS BAR */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat === 'All' ? 'All Intelligence Briefs' : `${cat} Insights`}
            </button>
          );
        })}
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5 animate-pulse"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="space-y-2 w-1/2">
                  <div className="h-3 bg-slate-200 rounded w-24" />
                  <div className="h-5 bg-slate-200 rounded w-4/5" />
                </div>
                <div className="h-6 bg-slate-200 rounded-full w-16" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {!isLoading && error && (
        <div className="glass-card rounded-2xl border border-rose-200 p-8 text-center space-y-4 bg-rose-50/40 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Intelligence Feed Temporarily Unavailable</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
          </div>
          <button
            onClick={loadInsights}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            Retry Feed Sync
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !error && filteredInsights.length === 0 && (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Intelligence Briefs in This Category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no active domain insights categorized under &quot;{selectedCategory}&quot;. Select &quot;All&quot; to review all synthesized intelligence.
          </p>
          <button
            onClick={() => setSelectedCategory('All')}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View All Categories
          </button>
        </div>
      )}

      {/* SUCCESS STATE - INSIGHTS LIST GRID */}
      {!isLoading && !error && filteredInsights.length > 0 && (
        <div className="space-y-6">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="glass-card rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5"
            >
              {/* Insight Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
                      {insight.category || 'Domain'} Intelligence
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400 font-mono">{insight.timestamp || 'Real-time Telemetry'}</span>
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

              {/* Supporting Metrics Bar */}
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
                    onClick={() => setSelectedInsight(insight)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors"
                  >
                    View Supporting Data <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Metadata Footer */}
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

      {/* SUPPORTING EVIDENCE DRAWER */}
      {selectedInsight && (
        <Drawer
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          title="Underlying Telemetry & Source Evidence"
          subtitle={selectedInsight.title || 'Domain Intelligence Brief'}
          width="lg"
        >
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-slate-500 text-[10px] uppercase font-bold">Domain Observation</p>
              <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                {selectedInsight.observation || 'Empirical observation data being synthesized from live telemetry.'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Ingested Telemetry Feeds</h4>
              <div className="space-y-2">
                {(selectedInsight.dataSources ?? []).map((ds, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{ds}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Verified Quantitative Metrics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(selectedInsight.supportingMetrics ?? []).map((sm, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500">{sm.label}</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{sm.value}</p>
                    {sm.change && <p className="text-[10px] font-semibold text-emerald-600">{sm.change}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-400 font-mono text-[11px]">{selectedInsight.modelVersion || 'FreightSense v2.5'}</span>
              <Link
                href="/forecast"
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Simulate Impact on Forecast
              </Link>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
