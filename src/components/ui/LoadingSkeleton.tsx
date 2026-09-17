import React from 'react';

export const LoadingSkeleton: React.FC<{
  type?: 'card' | 'chart' | 'table' | 'map' | 'metrics';
  count?: number;
}> = ({ type = 'card', count = 1 }) => {
  if (type === 'metrics') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl border border-slate-200/80 p-4 animate-pulse">
            <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-24 bg-slate-300 rounded mb-2" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="glass-card rounded-xl border border-slate-200/80 p-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-8 w-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-64 w-full bg-slate-100 rounded-lg flex items-end gap-2 p-4">
          <div className="h-24 flex-1 bg-slate-200 rounded-t" />
          <div className="h-40 flex-1 bg-slate-200 rounded-t" />
          <div className="h-32 flex-1 bg-slate-200 rounded-t" />
          <div className="h-48 flex-1 bg-slate-200 rounded-t" />
          <div className="h-56 flex-1 bg-slate-200 rounded-t" />
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="glass-card rounded-xl border border-slate-200/80 p-4 animate-pulse space-y-3">
        <div className="h-10 w-full bg-slate-100 rounded-lg mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-slate-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (type === 'map') {
    return (
      <div className="w-full h-96 bg-slate-100 rounded-2xl border border-slate-200/80 animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Synthesizing Geospatial AIS Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-xl border border-slate-200/80 p-5 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
          <div className="h-3 w-3/4 bg-slate-100 rounded mb-2" />
          <div className="h-3 w-1/2 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
};
