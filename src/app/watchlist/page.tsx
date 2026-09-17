'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Trash2,
  Bell,
  ArrowRight,
  GitCompare,
  ExternalLink,
  Navigation,
  Anchor,
  Ship,
  TrendingUp,
  FileText,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react';
import { useWatchlist } from '@/context/WatchlistContext';
import { RiskIndicator } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WatchlistPage() {
  const { items, removeItem } = useWatchlist();
  const [activeTab, setActiveTab] = useState<'All' | 'Routes' | 'Ports' | 'Vessels' | 'Markets' | 'Reports'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['All', 'Routes', 'Ports', 'Vessels', 'Markets', 'Reports'] as const;

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === 'All' || item.type === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'Routes': return Navigation;
      case 'Ports': return Anchor;
      case 'Vessels': return Ship;
      case 'Markets': return TrendingUp;
      case 'Reports': return FileText;
      default: return Bookmark;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Watchlist
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-sky-600" />
              {items.length} Saved Telemetries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalized monitoring workspace tracking your critical container lanes, transshipment hubs, and fleet assets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Explore More Intelligence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const count = tab === 'All' ? items.length : items.filter(i => i.type === tab).length;
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  isSelected ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter saved items..."
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* WATCHLIST ITEMS LIST */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty"
          description="You have not saved any routes, ports, vessels, or reports to this category yet. Browse our intelligence workspaces to pin assets."
          icon={Inbox}
          actionText="Explore Intelligence"
          actionHref="/dashboard"
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1">
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.2 rounded">
                        {item.type}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                      <RiskIndicator level={item.risk} />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span>Status: <strong className="text-slate-800">{item.status}</strong></span>
                      <span>•</span>
                      <span>Change: <strong className="text-sky-700">{item.latestChange}</strong></span>
                      <span>•</span>
                      <span>Forecast: <span className="text-slate-500">{item.forecast}</span></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Link
                    href="/compare"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                    title="Compare in Workspace"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/alerts"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                    title="Create Alert Monitor"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href={item.targetPath}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
