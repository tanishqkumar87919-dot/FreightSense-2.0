'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ScenarioCompareChartProps {
  series: { date: string; baseline: number; scenario: number }[];
  rateDeltaPercent: number;
}

export const ScenarioCompareChart: React.FC<ScenarioCompareChartProps> = ({
  series,
  rateDeltaPercent,
}) => {
  return (
    <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Baseline vs. Scenario Projection</h3>
          <p className="text-xs text-slate-500 mt-0.5">Simulated spot rate variance over 60-day horizon</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium">Variance:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
            rateDeltaPercent > 0
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : rateDeltaPercent < 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {rateDeltaPercent > 0 ? '+' : ''}{rateDeltaPercent}%
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
              domain={['dataMin - 150', 'dataMax + 150']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-card px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-slate-900">{label}</p>
                      <p className="text-slate-600">Baseline: <strong className="text-slate-900">${payload[0]?.value}</strong></p>
                      <p className="text-sky-700">Scenario: <strong className="text-sky-800 font-bold">${payload[1]?.value}</strong></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="plainline"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Line
              type="monotone"
              name="Baseline Reference"
              dataKey="baseline"
              stroke="#64748B"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#64748B' }}
            />
            <Line
              type="monotone"
              name="Scenario Simulation"
              dataKey="scenario"
              stroke="#0284C7"
              strokeWidth={3}
              dot={{ r: 4, fill: '#0284C7' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
