'use client';

import React from 'react';

export interface LegendItem {
  color: string;
  label: string;
  shape?: 'circle' | 'square' | 'line' | 'dashed-line';
  borderColor?: string;
}

interface MapLegendProps {
  items?: LegendItem[];
  children?: React.ReactNode;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  items,
  children,
  className = 'absolute bottom-4 left-4 z-20',
}) => {
  return (
    <div
      className={`glass-card px-3.5 py-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md text-xs font-medium text-slate-900 flex flex-wrap items-center gap-3.5 max-w-[90vw] ${className}`}
    >
      {items
        ? items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {item.shape === 'line' ? (
                <span
                  className="w-4 h-1 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                />
              ) : item.shape === 'dashed-line' ? (
                <span
                  className="w-4 h-1 border-b-2 border-dashed inline-block"
                  style={{ borderColor: item.color }}
                />
              ) : item.shape === 'square' ? (
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block"
                  style={{
                    backgroundColor: item.color,
                    border: item.borderColor ? `1px solid ${item.borderColor}` : undefined,
                  }}
                />
              ) : (
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: item.color,
                    border: item.borderColor ? `1.5px solid ${item.borderColor}` : '1px solid rgba(0,0,0,0.1)',
                  }}
                />
              )}
              <span className="text-[11px] font-semibold text-slate-800 tracking-tight">
                {item.label}
              </span>
            </div>
          ))
        : children}
    </div>
  );
};
