'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Plus,
  Trash2,
  Power,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Smartphone,
  AppWindow,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockAlerts } from '@/data/alertData';
import { AlertItem } from '@/types';
import { alertService } from '@/services';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'triggered' | 'paused'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [testNotificationMessage, setTestNotificationMessage] = useState<string | null>(null);

  React.useEffect(() => {
    alertService.getAlerts().then((res) => {
      if (res && res.length > 0) {
        setAlerts(res);
      }
    });
  }, []);

  // Create Alert Form State
  const [formMetric, setFormMetric] = useState('Freight Spot Rate');
  const [formTarget, setFormTarget] = useState('Shanghai to Rotterdam');
  const [formCondition, setFormCondition] = useState('Increases by > 5%');
  const [formThreshold, setFormThreshold] = useState('$4,500 / FEU');
  const [formChannel, setFormChannel] = useState<'email' | 'in-app' | 'push'>('email');

  const previewSentence = `This alert will trigger when ${formMetric} on "${formTarget}" ${formCondition.toLowerCase()} crossing ${formThreshold}.`;

  const handleToggleStatus = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'active' ? 'paused' : 'active';
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleTestAlert = (alert: AlertItem) => {
    setTestNotificationMessage(`Test Alert Fired: "${alert.title}" evaluated positive. Simulated notification sent to ${alert.notificationChannels.join(', ')}.`);
    setTimeout(() => setTestNotificationMessage(null), 4000);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: AlertItem = {
      id: `alt-${Date.now()}`,
      title: `${formTarget} ${formMetric} Alert`,
      type: 'freight_price',
      targetObject: formTarget,
      condition: `${formCondition} (${formThreshold})`,
      currentValue: '$4,180 / FEU',
      thresholdValue: formThreshold,
      status: 'active',
      severity: 'High',
      createdDate: new Date().toISOString().split('T')[0],
      notificationChannels: [formChannel],
    };
    setAlerts(prev => [newAlert, ...prev]);
    setIsCreateModalOpen(false);
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Stay Ahead of Change
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-sky-600" />
              Monitoring Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated event triggers, price movement notifications, and port dwell anomaly detectors
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Alert</span>
          </button>
        </div>
      </div>

      {/* Test Notification Banner */}
      {testNotificationMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{testNotificationMessage}</span>
          </div>
          <button onClick={() => setTestNotificationMessage(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 text-xs">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'triggered', 'paused'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {status} ({status === 'all' ? alerts.length : alerts.filter(a => a.status === status).length})
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-400 font-mono">Evaluation Interval: Every 15 Minutes</span>
      </div>

      {/* ALERTS LIST */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-2xl border border-dashed border-slate-300">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No alerts in this category</p>
            <p className="text-xs text-slate-400 mt-1">Create an alert monitor to receive notifications on market deviations.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-card rounded-2xl border p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                alert.status === 'triggered'
                  ? 'border-rose-300 bg-rose-50/20'
                  : alert.status === 'paused'
                  ? 'border-slate-200 opacity-60'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alert.status === 'triggered'
                      ? 'bg-rose-100 text-rose-800'
                      : alert.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {alert.status}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                </div>

                <p className="text-xs text-slate-600">
                  Target: <strong className="text-slate-800">{alert.targetObject}</strong> • Condition: <span className="font-mono text-slate-700">{alert.condition}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span>Current: <strong className="text-slate-700">{alert.currentValue}</strong></span>
                  <span>•</span>
                  <span>Threshold: <strong className="text-slate-700">{alert.thresholdValue}</strong></span>
                  {alert.lastTriggered && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600">Last Fired: {alert.lastTriggered}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Channels: {alert.notificationChannels.join(', ')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  onClick={() => handleTestAlert(alert)}
                  title="Simulate Test Trigger"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleToggleStatus(alert.id)}
                  title={alert.status === 'active' ? 'Pause Alert' : 'Enable Alert'}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                    alert.status === 'active'
                      ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(alert.id)}
                  title="Delete Alert"
                  className="p-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE ALERT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Configure New Intelligence Alert"
        subtitle="Establish automated triggers across freight rates, port congestion, and meteorological hazards"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Dimension</label>
            <select
              value={formMetric}
              onChange={(e) => setFormMetric(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
            >
              <option value="Freight Spot Rate">Freight Spot Rate ($/FEU)</option>
              <option value="Port Container Dwell">Port Container Dwell (Days)</option>
              <option value="Tropical Wave Height">Significant Wave Height (Meters)</option>
              <option value="Forecast Horizon Shift">Econometric 30D Forecast Shift (%)</option>
              <option value="Vessel Schedule Variance">Vessel ETA Schedule Slip (Hours)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Object / Tradelane</label>
            <input
              type="text"
              value={formTarget}
              onChange={(e) => setFormTarget(e.target.value)}
              placeholder="e.g. Shanghai to Rotterdam"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Condition</label>
              <select
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                <option value="Increases by > 5%">Increases by &gt; 5%</option>
                <option value="Increases by > 10%">Increases by &gt; 10%</option>
                <option value="Exceeds absolute value">Exceeds absolute value</option>
                <option value="Drops below threshold">Drops below threshold</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Threshold Value</label>
              <input
                type="text"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
                placeholder="e.g. $4,500"
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notification Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'email', label: 'Email Digest', icon: Mail },
                { id: 'in-app', label: 'In-App Badge', icon: AppWindow },
                { id: 'push', label: 'Mobile Push', icon: Smartphone },
              ].map((ch) => {
                const Icon = ch.icon;
                const isChecked = formChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setFormChannel(ch.id as any)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all ${
                      isChecked
                        ? 'border-sky-600 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Sentence */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Trigger Rule Preview</span>
            <p className="text-slate-800 font-medium mt-0.5">{previewSentence}</p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm"
            >
              Activate Alert Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
