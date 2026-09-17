'use client';

import React from 'react';

export type MapLoadStatus = 'loading' | 'online' | 'unavailable' | 'configured';

interface MapStatusBadgeProps {
  status: MapLoadStatus;
  detail: string;
  className?: string;
}

export const MapStatusBadge: React.FC<MapStatusBadgeProps> = ({
  status,
  detail,
  className = 'absolute bottom-4 right-4 z-20',
}) => {
  return (
    <div
      className={`px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/90 text-[11px] text-slate-800 flex items-center gap-2 shadow-md ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          status === 'online' || status === 'configured'
            ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
            : status === 'loading'
            ? 'bg-amber-500 animate-pulse'
            : 'bg-rose-500 ring-2 ring-rose-500/20'
        }`}
      />
      <span className="font-semibold text-slate-900 tracking-tight">{detail}</span>
    </div>
  );
};
