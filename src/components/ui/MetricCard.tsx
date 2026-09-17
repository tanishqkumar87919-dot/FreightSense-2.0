import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string | number;
  changeType?: 'positive' | 'negative' | 'neutral'; // semantic, or bullish/bearish
  trendDirection?: 'up' | 'down' | 'neutral';
  unit?: string;
  icon?: LucideIcon;
  subtext?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  trendDirection,
  unit,
  icon: Icon,
  subtext,
  onClick,
  className = '',
}) => {
  const isClickable = !!onClick;

  // Maritime color coding: usually freight rate going UP can be warning or info, rate going DOWN is relief, etc.
  const changeColorClasses = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    negative: 'text-rose-700 bg-rose-50 border-rose-200/80',
    neutral: 'text-slate-600 bg-slate-100 border-slate-200',
  }[changeType];

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            <Icon className="w-4 h-4 text-sky-700" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-medium border ${changeColorClasses}`}>
            {trendDirection === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trendDirection === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trendDirection === 'neutral' && <Minus className="w-3 h-3" />}
            {change}
          </span>
        )}
        {subtext && <span className="text-slate-500 truncate">{subtext}</span>}
      </div>
    </div>
  );
};
