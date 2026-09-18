'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Play,
  Layers,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';

export interface DemoStep {
  step: number;
  title: string;
  subtitle: string;
  category: string;
  targetRoute: string;
  actionLabel: string;
  explanation: string;
  metrics: { label: string; value: string }[];
  queryParams?: Record<string, string>;
}

const SIH_DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: '1. Select Bulk Cargo Parcel',
    subtitle: '75,000 MT Metallurgical Coking Coal',
    category: 'Procurement Requirement',
    targetRoute: '/cargo-analysis',
    actionLabel: 'Inspect Cargo Specs',
    explanation:
      'High-grade coking coal sourced for blast furnace steel production in Odisha. Requires dedicated mechanized bulk handling and dust suppression.',
    metrics: [
      { label: 'Cargo', value: 'Coking Coal' },
      { label: 'Parcel Quantity', value: '75,000 MT' },
      { label: 'Stowage Factor', value: '1.28 m³/MT' },
    ],
  },
  {
    step: 2,
    title: '2. Select Overseas Origin Port',
    subtitle: 'Gladstone / Hay Point, Queensland, Australia',
    category: 'Corridor Topography',
    targetRoute: '/routes',
    actionLabel: 'View Route Topography',
    explanation:
      'Deepwater Australian coal export terminal capable of loading Capesize and Panamax bulk carriers. Great Barrier Reef transit corridor.',
    metrics: [
      { label: 'Origin', value: 'Gladstone, AU' },
      { label: 'Voyage Distance', value: '5,120 Nautical Miles' },
      { label: 'Standard Steaming', value: '16.7 Days @ 12.8 kts' },
    ],
  },
  {
    step: 3,
    title: '3. Select Destination Terminal',
    subtitle: 'Paradip Port Authority, Odisha, East Coast India',
    category: 'Discharge Terminal',
    targetRoute: '/ports',
    actionLabel: 'Inspect Paradip Limits',
    explanation:
      'One of India\'s largest deepwater ports on the Bay of Bengal. Direct rail evacuation link to Rourkela and Kalinganagar steel clusters.',
    metrics: [
      { label: 'Destination', value: 'Paradip Port (PRT)' },
      { label: 'Terminal', value: 'Mechanized Coal Berth' },
      { label: 'Berth Output', value: '30,500 MT / Day' },
    ],
  },
  {
    step: 4,
    title: '4. Set Delivery Window & Laycan',
    subtitle: 'Laycan Window: 2026-10-15 to 2026-10-25',
    category: 'Contract Window',
    targetRoute: '/cargo-analysis',
    actionLabel: 'Review Laycan Bounds',
    explanation:
      '10-day charter party cancellation window. Missing laycan triggers contractual cancellation risk or steep late-arrival demurrage charges.',
    metrics: [
      { label: 'Laycan Start', value: '15 Oct 2026' },
      { label: 'Laycan End', value: '25 Oct 2026' },
      { label: 'Contract Mode', value: 'Spot Voyage Charter' },
    ],
  },
  {
    step: 5,
    title: '5. Run AI Freight Forecast',
    subtitle: 'XGBoost 14-Day Rate Projection: $15.80 / MT',
    category: 'Forecasting Engine',
    targetRoute: '/forecast',
    actionLabel: 'View Freight Forecast',
    explanation:
      'FreightSense ML models detect seasonal pre-winter restocking demand (+1.8% over 14 days) anchored by stable $615/MT bunker fuel costs.',
    metrics: [
      { label: 'Forecast Spot Rate', value: '$15.80 / MT' },
      { label: 'Baseline Rate', value: '$15.20 / MT' },
      { label: 'Confidence Band', value: '$14.85 — $16.75' },
    ],
  },
  {
    step: 6,
    title: '6. Evaluate Port Draft Constraints',
    subtitle: 'Paradip Max Permissible Draft: 17.1m',
    category: 'Port Constraints',
    targetRoute: '/ports',
    actionLabel: 'Check Draft Clearance',
    explanation:
      'Paradip accommodates Panamax fully laden with safe 3.3m Under-Keel Clearance (UKC). Fully loaded Capesize (18.2m draft) would exceed limits.',
    metrics: [
      { label: 'Permissible Draft', value: '17.1 Meters' },
      { label: 'Vessel Draft', value: '13.8 Meters' },
      { label: 'UKC Clearance Margin', value: '+3.3m (SAFE)' },
    ],
  },
  {
    step: 7,
    title: '7. Select Optimized Vessel Candidate',
    subtitle: 'MV Odisha Maratha (Panamax — 74,500 DWT)',
    category: 'Chartering Optimizer',
    targetRoute: '/vessels',
    actionLabel: 'Inspect Vessel Specs',
    explanation:
      'Panamax class chosen over Capesize to avoid lighterage at Sandheads/Dhamra and eliminate draft violation penalties.',
    metrics: [
      { label: 'Selected Vessel', value: 'MV Odisha Maratha' },
      { label: 'Class', value: 'Panamax (Gearless)' },
      { label: 'Suitability Score', value: '94 / 100' },
    ],
  },
  {
    step: 8,
    title: '8. Simulate What-If Perturbation',
    subtitle: 'Simulate +3 Days Anchorage Waiting Time',
    category: 'Scenario Simulator',
    targetRoute: '/scenario',
    actionLabel: 'Run What-If Scenario',
    explanation:
      'Testing seasonal swell delays at Paradip anchorage. Evaluates additional demurrage exposure ($18,000/day = +$54,000 total exposure).',
    metrics: [
      { label: 'Base Waiting', value: '1.8 Days' },
      { label: 'Simulated Waiting', value: '4.8 Days (+3.0d)' },
      { label: 'Demurrage Exposure', value: '+$54,000' },
    ],
  },
  {
    step: 9,
    title: '9. Synthesize in Decision Center',
    subtitle: '9-Stage Pipeline Synthesis & Factor Table',
    category: 'Decision Engine',
    targetRoute: '/decision-center',
    actionLabel: 'Launch Decision Center',
    explanation:
      'Unifies cargo specs, route forecast, vessel kinematics, port constraints, economics, and what-if simulation into an end-to-end trace.',
    metrics: [
      { label: 'Stages Verified', value: '9 of 9 Complete' },
      { label: 'Total Freight Cost', value: '$1,185,000' },
      { label: 'Decision Confidence', value: '88% High' },
    ],
  },
  {
    step: 10,
    title: '10. Review Executive Decision & Audit',
    subtitle: 'Defensible Procurement Recommendation',
    category: 'Executive Sign-off',
    targetRoute: '/decision-center',
    actionLabel: 'View Executive Brief',
    explanation:
      'Procurement & chartering managers receive a transparent decision factor breakdown, multi-persona view, and printable PDF audit report.',
    metrics: [
      { label: 'Recommendation', value: 'FIX PANAMAX ON SPOT' },
      { label: 'Risk Mitigation', value: 'Incorporate 2d Laycan Buffer' },
      { label: 'Data Provenance', value: '100% Grounded Lineage' },
    ],
  },
];

interface SihDemoGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SihDemoGuide: React.FC<SihDemoGuideProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentStep = SIH_DEMO_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === SIH_DEMO_STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNavigate = () => {
    router.push(currentStep.targetRoute);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 border-2 border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden text-left text-slate-100">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-slate-900 p-3 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
              SIH Evaluator Demo Guide
            </span>
            <ProvenanceBadge status="SIMULATED" label="DEMO MODE" size="xs" interactive={false} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              {currentStep.step} / {SIH_DEMO_STEPS.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Demo Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-emerald-500 h-1 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / SIH_DEMO_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              {currentStep.category}
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">{currentStep.title}</h3>
            <p className="text-xs text-sky-300 font-medium">{currentStep.subtitle}</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
            {currentStep.explanation}
          </p>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-2">
            {currentStep.metrics.map((m, idx) => (
              <div key={idx} className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
                <div className="font-bold text-xs text-slate-100 mt-0.5 truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-3 bg-slate-800/70 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isFirst}
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 text-xs transition-colors"
              title="Previous Step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 text-xs transition-colors"
              title="Next Step"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNavigate}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>{currentStep.actionLabel}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs transition-colors"
              >
                Finish Tour
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
