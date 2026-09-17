'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Download,
  Calendar,
  CheckCircle2,
  Layers,
  Sparkles,
  Database,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { mockReports } from '@/data/reportData';
import { MarketChart } from '@/components/charts/MarketChart';
import { mockFreightIndices } from '@/data/marketData';
import { useWatchlist } from '@/context/WatchlistContext';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, isSaved, removeItem } = useWatchlist();
  const [activeSection, setActiveSection] = useState('sec-exec-summary');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const reportId = params.id as string;
  const report = mockReports.find(r => r.id === reportId) || mockReports[0];
  const saved = isSaved(report.id);

  const handleSaveToggle = () => {
    if (saved) {
      removeItem(report.id);
      setActionNotice('Report removed from watchlist.');
    } else {
      addItem({
        id: report.id,
        name: report.title,
        type: 'Reports',
        status: `${report.category} Publication`,
        latestChange: report.generatedDate,
        forecast: 'Contains forward-looking econometric estimates',
        risk: 'Low',
        lastUpdated: 'Just now',
        targetPath: `/reports/${report.id}`,
      });
      setActionNotice('Report pinned to your watchlist.');
    }
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExport = (format: 'PDF' | 'CSV') => {
    setActionNotice(`Compiling ${format} download package for "${report.title}"...`);
    setTimeout(() => {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.id}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionNotice(`Exported ${format} successfully.`);
      setTimeout(() => setActionNotice(null), 3000);
    }, 600);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setActionNotice('Direct report link copied to clipboard.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.2 rounded border border-sky-100">
                {report.category} Dossier
              </span>
              <span className="text-xs text-slate-400">• Published: {report.generatedDate}</span>
            </div>
            <h1 className="text-base font-bold text-slate-900 mt-0.5 max-w-xl truncate">
              {report.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              saved ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share</span>
          </button>

          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* MAIN LAYOUT: STICKY TABLE OF CONTENTS + REPORT BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sticky Desktop Table of Contents */}
        <div className="lg:col-span-3 sticky top-24 space-y-4 hidden lg:block">
          <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Table of Contents</h3>
            <nav className="space-y-1 text-xs font-medium">
              {report.sections?.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    activeSection === sec.id
                      ? 'bg-sky-50 text-sky-800 font-bold border-l-2 border-sky-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </div>

          <div className="glass-card rounded-2xl border border-slate-200/90 p-4 shadow-sm text-xs space-y-2 text-slate-500">
            <p className="font-semibold text-slate-800">Reading Time: {report.readTimeMinutes} mins</p>
            <p className="text-[11px]">Aggregated from {report.sourceCount} verified customs & AIS telemetry streams.</p>
          </div>
        </div>

        {/* Report Document Content Body */}
        <div className="lg:col-span-9 space-y-8">
          {/* Report Cover Header Card */}
          <div className="glass-card rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm space-y-4 bg-gradient-to-br from-white via-slate-50/40 to-sky-50/30">
            <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>FreightSense Intelligence Dossier • Ref #{report.id}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {report.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Coverage: {report.coverage}
            </p>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Core Intelligence Takeaway</span>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">{report.keyInsight}</p>
            </div>
          </div>

          {/* Interactive Chart Embed in Report */}
          <MarketChart
            title="Global Tradelane Composite Volatility (Correlated Index)"
            data={mockFreightIndices[0].historical}
            currency="USD"
            unit="per 40ft Container (FEU)"
          />

          {/* Sections Render */}
          <div className="space-y-8">
            {report.sections?.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="glass-card rounded-2xl border border-slate-200/90 p-8 shadow-sm space-y-4"
              >
                <h2 className="text-xl font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">
                  {sec.title}
                </h2>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
                  {sec.content}
                </div>

                {/* Section Metrics if present */}
                {sec.metrics && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    {sec.metrics.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{m.label}</span>
                        <p className="text-base font-bold text-slate-900 mt-0.5">{m.value}</p>
                        {m.delta && <p className="text-[11px] font-semibold text-sky-700">{m.delta}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Report Footer Verification Note */}
          <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              <span>Certified under FreightSense Maritime Methodology v2.4</span>
            </div>
            <Link href="/methodology" className="text-sky-600 font-semibold hover:underline">
              Inspect Model Validation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
