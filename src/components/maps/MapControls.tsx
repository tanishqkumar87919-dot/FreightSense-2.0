'use client';

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Anchor } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFocusIndia?: () => void;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onFocusIndia,
  className = 'absolute top-4 right-4 z-20',
}) => {
  return (
    <div
      className={`flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/90 shadow-md ${className}`}
    >
      <button
        type="button"
        onClick={onZoomIn}
        className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onReset}
        className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        title="Reset Global View"
        aria-label="Reset Global View"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {onFocusIndia && (
        <>
          <div className="h-px bg-slate-200 my-0.5" />
          <button
            type="button"
            onClick={onFocusIndia}
            className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center justify-center"
            title="Focus Indian Maritime Hubs (East Coast)"
            aria-label="Focus Indian Maritime Hubs"
          >
            <Anchor className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
