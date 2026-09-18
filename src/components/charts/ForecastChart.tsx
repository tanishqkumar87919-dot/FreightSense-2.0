'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ForecastChartProps {
  series: {
    date: string;
    actual?: number;
    forecast?: number;
    upperBound?: number;
    lowerBound?: number;
  }[];
  expectedRateUsd: number;
  expectedChangePercent: number;
  confidencePercent: number;
  riskScore: number;
  unit?: string;
  modelName?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  series,
  expectedRateUsd,
  expectedChangePercent,
  confidencePercent,
  riskScore,
  unit = 'USD/FEU',
  modelName = 'XGBoost Champion (v2.5)',
}) => {
  const isBulk = unit.toUpperCase().includes('/MT') || expectedRateUsd < 100;
  const displayUnit = isBulk ? 'USD / MT' : 'USD / FEU';
  const unitSuffix = isBulk ? '/ MT' : '/ FEU';

  // Format series so that the shaded area shows the band between lowerBound and upperBound
  const chartData = series.map((item) => ({
    ...item,
    bandRange: item.upperBound && item.lowerBound ? [item.lowerBound, item.upperBound] : null,
  }));

  return (
    <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">Econometric AI Projection</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-sky-100 text-sky-800 uppercase">
              {modelName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
              {displayUnit}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Historical trajectory and 95% confidence interval ribbon (Strict Leak-Free Pipeline)</p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-700" />
            <span className="text-slate-600">Actuals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 border-dashed" />
            <span className="text-sky-700 font-medium">Forecast Mean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-200/60 border border-sky-300" />
            <span className="text-slate-500">95% Envelope</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: isBulk ? 5 : -10, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${isBulk ? Number(val).toFixed(2) : Math.round(Number(val))}`}
              domain={isBulk ? ['dataMin - 1', 'dataMax + 1'] : ['dataMin - 200', 'dataMax + 200']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const actual = payload.find(p => p.dataKey === 'actual')?.value;
                  const forecast = payload.find(p => p.dataKey === 'forecast')?.value;
                  const upper = payload[0]?.payload?.upperBound;
                  const lower = payload[0]?.payload?.lowerBound;

                  return (
                    <div className="glass-card px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-slate-900 border-b border-slate-100 pb-1">{label}</p>
                      {actual !== undefined && (
                        <p className="text-slate-700 font-medium">Actual: <span className="font-bold">${isBulk ? Number(actual).toFixed(2) : actual} {unitSuffix}</span></p>
                      )}
                      {forecast !== undefined && (
                        <>
                          <p className="text-sky-700 font-bold">Forecast: ${isBulk ? Number(forecast).toFixed(2) : forecast} {unitSuffix}</p>
                          <p className="text-[10px] text-slate-500">
                            Confidence Band (95%): ${isBulk ? Number(lower).toFixed(2) : lower} - ${isBulk ? Number(upper).toFixed(2) : upper}
                          </p>
                        </>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Confidence Interval Ribbon */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="transparent"
              fill="url(#confidenceBandGrad)"
            />
            {/* Actuals Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#0F172A"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0F172A' }}
            />
            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#0284C7"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: '#0284C7' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Metric Callouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Projected Target</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            ${isBulk ? expectedRateUsd.toFixed(2) : expectedRateUsd} <span className="text-xs font-normal text-slate-500">{unitSuffix}</span>
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Expected Move</span>
          <p className={`text-lg font-bold mt-0.5 ${expectedChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {expectedChangePercent >= 0 ? '+' : ''}{expectedChangePercent}%
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Model Confidence</span>
          <p className="text-lg font-bold text-sky-700 mt-0.5">{confidencePercent}%</p>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Predictive Risk</span>
          <p className="text-lg font-bold text-amber-600 mt-0.5">{riskScore} / 100</p>
        </div>
      </div>
    </div>
  );
};
