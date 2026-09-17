import React from 'react';
import { RiskLevel, VesselStatus } from '@/types';

interface StatusBadgeProps {
  status: VesselStatus | 'active' | 'triggered' | 'paused' | 'Tight' | 'Balanced' | 'Normal' | 'Severe' | 'Surplus' | 'Connected' | 'Error' | 'Updating' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = () => {
    switch (status) {
      case 'At Sea':
      case 'active':
      case 'Connected':
      case 'Normal':
      case 'Balanced':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'At Port':
      case 'Anchored':
      case 'Updating':
      case 'Tight':
      case 'Moderate':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'Delayed':
      case 'triggered':
      case 'Error':
      case 'Severe':
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'paused':
      case 'Surplus':
      case 'Unknown':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${getStyle()} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};

export const ConfidenceBadge: React.FC<{ score: number }> = ({ score }) => {
  const getStyle = () => {
    if (score >= 90) return 'text-sky-800 bg-sky-50 border-sky-200';
    if (score >= 80) return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    return 'text-amber-800 bg-amber-50 border-amber-200';
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
      AI Confidence: {score}%
    </span>
  );
};

export const RiskIndicator: React.FC<{ level: RiskLevel; score?: number }> = ({ level, score }) => {
  const getStyle = () => {
    switch (level) {
      case 'Low':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
      case 'Moderate':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
      case 'High':
        return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
      case 'Severe':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
    }
  };

  const style = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {level} Risk {score !== undefined ? `(${score}/100)` : ''}
    </span>
  );
};
