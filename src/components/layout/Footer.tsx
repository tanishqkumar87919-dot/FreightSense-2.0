import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-200/90 bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Col 1: Brand & Status */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-900 flex items-center justify-center text-white shadow-xs">
                <Compass className="w-4 h-4 text-sky-200" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                Freight<span className="text-sky-600">Sense</span> 2.0
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Observe. Understand. Predict. Decide. Commercial-grade AI-powered maritime intelligence for understanding global freight markets, container routes, port operations, and predictive risk.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AIS Constellation: Synchronized
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-medium text-sky-700">
                <Activity className="w-3 h-3 text-sky-500" />
                Model v2.4 Active
              </span>
            </div>
          </div>

          {/* Col 2: Intelligence & Operations */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Intelligence</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="/dashboard" className="hover:text-sky-700 transition-colors">Executive Overview</Link></li>
              <li><Link href="/map" className="hover:text-sky-700 transition-colors">Global Maritime Map</Link></li>
              <li><Link href="/market" className="hover:text-sky-700 transition-colors">Market Dynamics</Link></li>
              <li><Link href="/forecast" className="hover:text-sky-700 transition-colors">Freight Forecast</Link></li>
              <li><Link href="/signals" className="hover:text-sky-700 transition-colors">Market Signals</Link></li>
              <li><Link href="/insights" className="hover:text-sky-700 transition-colors">AI Insights</Link></li>
            </ul>
          </div>

          {/* Col 3: Maritime Network */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Network</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="/routes" className="hover:text-sky-700 transition-colors">Route Intelligence</Link></li>
              <li><Link href="/ports" className="hover:text-sky-700 transition-colors">Port Intelligence</Link></li>
              <li><Link href="/vessels" className="hover:text-sky-700 transition-colors">Vessel Tracking (AIS)</Link></li>
              <li><Link href="/trade-flows" className="hover:text-sky-700 transition-colors">Trade Flow Volumes</Link></li>
              <li><Link href="/weather" className="hover:text-sky-700 transition-colors">Weather & Hazards</Link></li>
              <li><Link href="/compare" className="hover:text-sky-700 transition-colors">Compare Intelligence</Link></li>
            </ul>
          </div>

          {/* Col 4: Platform & Governance */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="/scenario" className="hover:text-sky-700 transition-colors">Scenario Simulator</Link></li>
              <li><Link href="/explorer" className="hover:text-sky-700 transition-colors">Data Explorer</Link></li>
              <li><Link href="/reports" className="hover:text-sky-700 transition-colors">Report Library</Link></li>
              <li><Link href="/alerts" className="hover:text-sky-700 transition-colors">Alert Monitoring</Link></li>
              <li><Link href="/methodology" className="hover:text-sky-700 transition-colors">Methodology & Sources</Link></li>
              <li><Link href="/integrations" className="hover:text-sky-700 transition-colors">API & Integrations</Link></li>
              <li><Link href="/docs" className="hover:text-sky-700 transition-colors">Help Documentation</Link></li>
              <li><Link href="/settings" className="hover:text-sky-700 transition-colors">Settings & Workspace</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FreightSense 2.0. Maritime Intelligence & Predictive Analytics. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/methodology" className="hover:text-slate-600">Model Evaluation</Link>
            <Link href="/docs" className="hover:text-slate-600">Security & Privacy</Link>
            <Link href="/docs" className="hover:text-slate-600">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
