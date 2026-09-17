'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface MarketChartProps {
  title?: string;
  data: { date: string; value: number }[];
  currency?: string;
  unit?: string;
}

export const MarketChart: React.FC<MarketChartProps> = ({
  title = 'Historical Freight Rate Benchmark',
  data,
  currency = 'USD',
  unit = 'per FEU',
}) => {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '3M' | '6M' | '1Y' | '5Y'>('30D');

  // Slice or adjust data based on selected timeframe
  const filteredData = React.useMemo(() => {
    switch (timeframe) {
      case '7D':
        return data.slice(-5);
      case '30D':
        return data.slice(-8);
      case '3M':
        return data.slice(-10);
      default:
        return data;
    }
  }, [data, timeframe]);

  const minVal = Math.min(...filteredData.map(d => d.value)) * 0.95;
  const maxVal = Math.max(...filteredData.map(d => d.value)) * 1.05;

  return (
    <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Spot pricing index in {currency} {unit}</p>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          {(['7D', '30D', '3M', '6M', '1Y', '5Y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === tf
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[Math.round(minVal / 100) * 100, Math.round(maxVal / 100) * 100]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-card px-3 py-2 rounded-xl border border-slate-200/90 shadow-lg text-xs">
                      <p className="font-semibold text-slate-700">{label}</p>
                      <p className="text-sky-700 font-bold text-sm mt-0.5">
                        ${payload[0].value?.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{unit}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0284C7"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#marketGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
