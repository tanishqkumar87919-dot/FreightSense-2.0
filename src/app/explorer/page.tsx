'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Database,
  Search,
  Download,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  ArrowUpDown,
  CheckSquare,
  Square,
  Eye,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { mockDatasets } from '@/data/datasetData';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function ExplorerPage() {
  const [selectedDatasetId, setSelectedDatasetId] = useState('freight-rates');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [activeChartType, setActiveChartType] = useState<'line' | 'bar' | 'area'>('bar');
  const [showChartBuilder, setShowChartBuilder] = useState(true);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const dataset = mockDatasets[selectedDatasetId] || mockDatasets['freight-rates'];

  // Handle row selection
  const toggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const selectAllRows = () => {
    if (selectedRowIds.length === dataset.rows.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(dataset.rows.map(r => r.id));
    }
  };

  // Filter & Sort rows
  const filteredRows = dataset.rows
    .filter(row => {
      if (!searchQuery) return true;
      return Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  const handleExport = (format: 'CSV' | 'JSON') => {
    const dataToExport = selectedRowIds.length > 0
      ? dataset.rows.filter(r => selectedRowIds.includes(r.id))
      : dataset.rows;

    const content = format === 'JSON'
      ? JSON.stringify(dataToExport, null, 2)
      : Object.keys(dataToExport[0]).join(',') + '\n' + dataToExport.map(r => Object.values(r).join(',')).join('\n');

    const blob = new Blob([content], { type: format === 'JSON' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.id}-export.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotification(`Exported ${dataToExport.length} rows as ${format}.`);
    setTimeout(() => setExportNotification(null), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Data Explorer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              SQL Telemetry Lake
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Query, filter, sort, and visualize millions of granular maritime freight transactions and AIS events
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport('JSON')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {exportNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>{exportNotification}</span>
        </div>
      )}

      {/* DATASET SELECTOR & METADATA CARD */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Dataset:</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                setSelectedRowIds([]);
              }}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
            >
              {Object.values(mockDatasets).map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowChartBuilder(!showChartBuilder)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                showChartBuilder ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{showChartBuilder ? 'Hide Visualizer' : 'Open Visualizer'}</span>
            </button>
          </div>
        </div>

        {/* Dataset Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Data Source</span>
            <p className="text-slate-800 font-medium mt-0.5">{dataset.source}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Coverage Scope</span>
            <p className="text-slate-800 font-medium mt-0.5">{dataset.coverage}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Record Volume</span>
            <p className="text-slate-800 font-medium mt-0.5">{dataset.recordsCount.toLocaleString()} Entries</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Last Synchronization</span>
            <p className="text-slate-800 font-medium mt-0.5">{dataset.lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* VISUALIZATION BUILDER (CHART BUILDER) */}
      {showChartBuilder && (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dynamic Visualization Builder</h3>
              <p className="text-xs text-slate-500">Instant visualization computed directly from current dataset rows</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {(['bar', 'line', 'area'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveChartType(type)}
                  className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all ${
                    activeChartType === type ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type} Chart
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartType === 'bar' ? (
                <BarChart data={filteredRows.slice(0, 8)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey={dataset.fields[1].key} stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey={dataset.fields[4]?.key || 'spotRateUsd'} fill="#0284C7" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeChartType === 'line' ? (
                <LineChart data={filteredRows.slice(0, 8)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey={dataset.fields[1].key} stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey={dataset.fields[4]?.key || 'spotRateUsd'} stroke="#0284C7" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                <AreaChart data={filteredRows.slice(0, 8)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey={dataset.fields[1].key} stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey={dataset.fields[4]?.key || 'spotRateUsd'} stroke="#0284C7" fill="#BAE6FD" fillOpacity={0.6} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DYNAMIC DATA TABLE */}
      <div className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        {/* Table Search & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in table rows..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>Selected: <strong className="text-slate-900">{selectedRowIds.length}</strong> rows</span>
            <span>•</span>
            <span>Total Shown: <strong className="text-slate-900">{filteredRows.length}</strong></span>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 w-8">
                  <button onClick={selectAllRows} className="text-slate-400 hover:text-slate-600">
                    {selectedRowIds.length === dataset.rows.length ? (
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                {dataset.fields.map((field) => (
                  <th
                    key={field.key}
                    onClick={() => handleSort(field.key)}
                    className="pb-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>{field.label}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => {
                const isSelected = selectedRowIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-sky-50/40 transition-colors ${isSelected ? 'bg-sky-50/60' : ''}`}
                  >
                    <td className="py-3">
                      <button onClick={() => toggleSelectRow(row.id)} className="text-slate-400 hover:text-slate-600">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-sky-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    {dataset.fields.map((field) => (
                      <td key={field.key} className="py-3 text-slate-700 font-medium">
                        {field.type === 'badge' ? (
                          <StatusBadge status={row[field.key]} />
                        ) : field.type === 'number' && field.key.includes('Rate') ? (
                          <span className="font-bold text-slate-900">${row[field.key]?.toLocaleString()}</span>
                        ) : (
                          row[field.key]
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
