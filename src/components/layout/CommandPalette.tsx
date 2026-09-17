'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Navigation,
  Anchor,
  Ship,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { mockRoutes } from '@/data/routeData';
import { mockPorts } from '@/data/portData';
import { mockVessels } from '@/data/vesselData';
import { mockFreightIndices } from '@/data/marketData';
import { mockReports } from '@/data/reportData';
import { mockAIInsights } from '@/data/insightData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle if already open or handled outside
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Build unified search items
  const allItems = [
    ...mockRoutes.map(r => ({
      id: r.id,
      title: `${r.name} (${r.corridor})`,
      subtitle: `Rate: $${r.spotRateUsd}/FEU • Transit: ${r.transitDays}d • Risk: ${r.riskLevel}`,
      type: 'Route',
      icon: Navigation,
      href: `/routes`,
    })),
    ...mockPorts.map(p => ({
      id: p.id,
      title: `${p.name} (${p.code})`,
      subtitle: `Throughput: ${p.annualThroughputMTeu}M TEU • Dwell: ${p.averageDwellDays}d • Congestion: ${p.congestionIndex}/100`,
      type: 'Port',
      icon: Anchor,
      href: `/ports`,
    })),
    ...mockVessels.map(v => ({
      id: v.id,
      title: `${v.name} (IMO: ${v.imo})`,
      subtitle: `Carrier: ${v.carrier} • Status: ${v.currentStatus} (${v.currentSpeedKnots} kts) • To: ${v.destinationPort}`,
      type: 'Vessel',
      icon: Ship,
      href: `/vessels`,
    })),
    ...mockFreightIndices.map(m => ({
      id: m.id,
      title: `${m.name} (${m.symbol})`,
      subtitle: `Current: $${m.currentValue} • Change: ${m.changePercent > 0 ? '+' : ''}${m.changePercent}%`,
      type: 'Market',
      icon: TrendingUp,
      href: `/market`,
    })),
    ...mockReports.map(rep => ({
      id: rep.id,
      title: rep.title,
      subtitle: `${rep.category} • Coverage: ${rep.coverage}`,
      type: 'Report',
      icon: FileText,
      href: `/reports/${rep.id}`,
    })),
    ...mockAIInsights.map(ins => ({
      id: ins.id,
      title: ins.title,
      subtitle: `${ins.category} Intelligence • Confidence: ${ins.confidenceScore}%`,
      type: 'Insight',
      icon: Sparkles,
      href: `/insights`,
    })),
  ];

  const filteredItems = query.trim() === ''
    ? allItems.slice(0, 8)
    : allItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search routes, ports, vessels, indices, reports, and AI insights..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No maritime intelligence records match &ldquo;<span className="font-semibold text-slate-700">{query}</span>&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isCurrent = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      isCurrent ? 'bg-sky-50/80 border border-sky-200/80' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isCurrent ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${isCurrent ? 'text-sky-600' : 'text-slate-300'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span>Use <kbd className="px-1 py-0.5 font-mono bg-white border border-slate-200 rounded">↑</kbd> <kbd className="px-1 py-0.5 font-mono bg-white border border-slate-200 rounded">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 font-mono bg-white border border-slate-200 rounded">↵</kbd> to select</span>
          </div>
          <span className="text-sky-700 font-medium">FreightSense Command 2.0</span>
        </div>
      </div>
    </div>
  );
};
