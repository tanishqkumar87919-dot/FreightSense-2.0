'use client';

import React, { useState } from 'react';
import { Info, ShieldCheck, Database, Cpu, Sliders, AlertCircle, HelpCircle, X, ExternalLink } from 'lucide-react';

export type EpistemicStatus = 'KNOWN' | 'ESTIMATED' | 'SIMULATED' | 'UNKNOWN';
export type ProvenanceSourceType = 'REAL / EXTERNAL' | 'BENCHMARK' | 'SIMULATED / DEMO' | 'CALCULATED';

export interface ProvenanceDetails {
  source?: string;
  sourceType?: ProvenanceSourceType;
  datasetDate?: string;
  lastUpdated?: string;
  freshness?: string;
  latency?: string;
  confidence?: string | number;
  collectionMethod?: string;
  assumptions?: string[];
  limitations?: string[];
  isDemo?: boolean;
}

interface ProvenanceBadgeProps {
  status: EpistemicStatus | ProvenanceSourceType | string;
  label?: string;
  details?: ProvenanceDetails;
  size?: 'xs' | 'sm' | 'md';
  interactive?: boolean;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  status,
  label,
  details,
  size = 'sm',
  interactive = true,
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);

  const getStyle = () => {
    const normalized = (status || '').toUpperCase();
    switch (normalized) {
      case 'KNOWN':
      case 'OBSERVED':
      case 'REAL / EXTERNAL':
      case 'LIVE':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
          dot: 'bg-emerald-400',
          text: 'KNOWN / OBSERVED',
          icon: ShieldCheck,
        };
      case 'ESTIMATED':
      case 'MODEL OUTPUT':
      case 'MODEL':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20',
          dot: 'bg-sky-400',
          text: 'ESTIMATED / MODEL',
          icon: Cpu,
        };
      case 'SIMULATED':
      case 'WHAT-IF':
      case 'SIMULATED / DEMO':
      case 'DEMO':
      case 'DEMONSTRATION DATA':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
          dot: 'bg-amber-400',
          text: 'SIMULATED / WHAT-IF',
          icon: Sliders,
        };
      case 'UNKNOWN':
      case 'UNOBSERVED':
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20',
          dot: 'bg-slate-400',
          text: 'UNKNOWN / UNOBSERVED',
          icon: HelpCircle,
        };
    }
  };

  const styleConfig = getStyle();
  const Icon = styleConfig.icon;
  const displayLabel = label || styleConfig.text;

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'md'
      ? 'px-2.5 py-1 text-xs'
      : 'px-2 py-0.5 text-[11px]';

  const defaultDetails: ProvenanceDetails = details || {
    source: styleConfig.text.includes('KNOWN')
      ? 'Indian Ports Association (IPA) / BIMCO / MarineTraffic Baseline'
      : styleConfig.text.includes('ESTIMATED')
      ? 'FreightSense XGBoost v2.5 Freight Forecasting Pipeline'
      : styleConfig.text.includes('SIMULATED')
      ? 'FreightSense Scenario What-If Engine (User Parameter Overrides)'
      : 'Unobserved Market Variable (Offline / Commercial Confidential)',
    sourceType: styleConfig.text.includes('KNOWN')
      ? 'REAL / EXTERNAL'
      : styleConfig.text.includes('ESTIMATED')
      ? 'CALCULATED'
      : styleConfig.text.includes('SIMULATED')
      ? 'SIMULATED / DEMO'
      : 'BENCHMARK',
    datasetDate: '2021-01 to 2024-08 (Historical Series) / Verified Domain Constants',
    lastUpdated: '2026-09-18T12:00:00Z',
    freshness: 'Historical Calibration & Validated Domain Benchmarks',
    assumptions: [
      'Data grounded in published port limits (IPA) and maritime standards.',
      'Simulated inputs are explicitly marked and never represented as real-time broker quotes.',
    ],
    limitations: [
      'Live dynamic berth lineups are subject to daily port authority schedule updates.',
      'Spot market charter fixtures outside major corridors rely on synthetic historical fixtures.',
    ],
  };

  return (
    <>
      <button
        type="button"
        onClick={() => interactive && setShowModal(true)}
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${
          styleConfig.bg
        } ${sizeClasses} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${className}`}
        title={interactive ? 'Click to inspect data provenance and trust details' : undefined}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${styleConfig.dot}`} />
        <span>{displayLabel}</span>
        {interactive && <Info className="w-3 h-3 opacity-60 ml-0.5" />}
      </button>

      {/* Trust Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-left">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-sky-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Data Provenance & Trust Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-slate-400 text-[10px] uppercase font-medium">Epistemic Status</div>
                  <div className="font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${styleConfig.dot}`} />
                    {styleConfig.text}
                  </div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-slate-400 text-[10px] uppercase font-medium">Source Type</div>
                  <div className="font-bold text-sky-400 mt-1">
                    {defaultDetails.sourceType || 'REAL / EXTERNAL'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 space-y-2">
                <div>
                  <span className="text-slate-400 font-medium">Underlying Source:</span>
                  <p className="text-slate-200 mt-0.5 font-mono text-[11px]">{defaultDetails.source}</p>
                </div>
                {defaultDetails.datasetDate && (
                  <div>
                    <span className="text-slate-400 font-medium">Dataset Coverage:</span>
                    <p className="text-slate-300 mt-0.5">{defaultDetails.datasetDate}</p>
                  </div>
                )}
                {defaultDetails.freshness && (
                  <div>
                    <span className="text-slate-400 font-medium">Freshness / Latency:</span>
                    <p className="text-slate-300 mt-0.5">{defaultDetails.freshness}</p>
                  </div>
                )}
              </div>

              {defaultDetails.assumptions && defaultDetails.assumptions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium uppercase text-[10px]">Documented Assumptions</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {defaultDetails.assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {defaultDetails.limitations && defaultDetails.limitations.length > 0 && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium uppercase text-[10px]">Known Limitations</span>
                  <ul className="list-disc pl-4 space-y-1 text-amber-300/90">
                    {defaultDetails.limitations.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-800/80 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
