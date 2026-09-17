import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Intelligence Feed Interrupted',
  message = 'Unable to synchronize telemetry with the maritime data pipeline. Please retry the connection.',
  onRetry,
}) => {
  return (
    <div className="glass-card rounded-2xl border border-rose-200/80 bg-rose-50/40 p-8 text-center my-6">
      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mx-auto mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
