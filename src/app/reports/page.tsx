'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Share2,
  Bookmark,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { mockReports } from '@/data/reportData';
import { ReportItem } from '@/types';
import { useWatchlist } from '@/context/WatchlistContext';

export default function ReportsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'idle' | 'preparing' | 'generating' | 'completed'>('idle');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const { addItem, isSaved, removeItem } = useWatchlist();

  const categories = ['All', 'Market', 'Route', 'Port', 'Forecast', 'Risk'];

  const filteredReports = selectedCategory === 'All'
    ? mockReports
    : mockReports.filter(r => r.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleStartGenerate = () => {
    setIsGenerating(true);
    setGenerationStep('preparing');
    setTimeout(() => {
      setGenerationStep('generating');
      setTimeout(() => {
        setGenerationStep('completed');
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationStep('idle');
          router.push(`/reports/rep-q3-global-freight-outlook`);
        }, 1200);
      }, 1400);
    }, 1000);
  };

  const handleExport = (report: ReportItem, format: 'PDF' | 'CSV') => {
    // Generate simulated client download
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported "${report.title}" as ${format}.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleSaveToggle = (report: ReportItem) => {
    if (isSaved(report.id)) {
      removeItem(report.id);
    } else {
      addItem({
        id: report.id,
        name: report.title,
        type: 'Reports',
        status: `${report.category} Report (${report.readTimeMinutes} min)`,
        latestChange: `Published ${report.generatedDate}`,
        forecast: 'Contains econometric outlook',
        risk: 'Low',
        lastUpdated: 'Just now',
        targetPath: `/reports/${report.id}`,
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Intelligence Reports & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              Verified Library
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Executive dossiers synthesized from multi-source customs manifests, bunker indexes, and machine forecasting
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleStartGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-70"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Export notification banner */}
      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* CATEGORY TABS BAR */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat === 'All' ? 'All Publications' : `${cat} Reports`}
          </button>
        ))}
      </div>

      {/* REPORTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReports.map((report) => {
          const saved = isSaved(report.id);
          return (
            <div
              key={report.id}
              className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-sky-300 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {report.category} Intelligence
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{report.generatedDate}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 hover:text-sky-700 cursor-pointer">
                  <Link href={`/reports/${report.id}`}>{report.title}</Link>
                </h3>

                <p className="text-[11px] text-slate-500">
                  Coverage: <strong className="text-slate-700">{report.coverage}</strong>
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Key Synthesis</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{report.keyInsight}</p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSaveToggle(report)}
                    title="Save Report"
                    className={`p-2 rounded-lg border transition-colors ${
                      saved ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleExport(report, 'PDF')}
                    title="Export PDF"
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => handleExport(report, 'CSV')}
                    title="Export CSV"
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>CSV</span>
                  </button>
                </div>

                <Link
                  href={`/reports/${report.id}`}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                >
                  <span>Open Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* GENERATE REPORT PROGRESS MODAL */}
      <Modal
        isOpen={isGenerating}
        onClose={() => setIsGenerating(false)}
        title="Compiling Maritime Intelligence Report"
        subtitle="Aggregating satellite telemetry and econometric model projections"
        maxWidth="md"
      >
        <div className="space-y-6 text-center py-4 text-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mx-auto">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm capitalize">
              {generationStep === 'preparing' && '1. Fetching Global Mainlane Ingestions...'}
              {generationStep === 'generating' && '2. Running Bayesian Ensemble Projections...'}
              {generationStep === 'completed' && '3. Report Compiled Successfully!'}
            </h4>
            <p className="text-slate-500 max-w-sm mx-auto">
              {generationStep === 'preparing' && 'Normalizing 14,000 vessel telemetry points and carrier GRI filings.'}
              {generationStep === 'generating' && 'Evaluating 95% posterior confidence interval envelopes.'}
              {generationStep === 'completed' && 'Redirecting to interactive report viewer...'}
            </p>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-all duration-500"
              style={{
                width:
                  generationStep === 'preparing'
                    ? '35%'
                    : generationStep === 'generating'
                    ? '75%'
                    : '100%',
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
