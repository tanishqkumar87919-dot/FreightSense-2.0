'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  Navigation,
  Anchor,
  CloudLightning,
  FileText,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationItem } from '@/types';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'earlier' | 'alerts' | 'system'>('all');

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'alerts') return notif.type === 'market' || notif.type === 'route' || notif.type === 'weather';
    return notif.group === activeFilter;
  });

  const getSeverityIcon = (severity: string, type: string) => {
    switch (type) {
      case 'market': return TrendingUp;
      case 'route': return Navigation;
      case 'port': return Anchor;
      case 'weather': return CloudLightning;
      case 'report': return FileText;
      default: return Info;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notifications Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operational alerts, AI forecast revisions, meteorological warnings, and system logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-sky-600" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'today', label: 'Today' },
          { id: 'earlier', label: 'Earlier' },
          { id: 'alerts', label: 'Triggered Alerts' },
          { id: 'system', label: 'System Maintenance' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap ${
              activeFilter === tab.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-2xl border border-dashed border-slate-200">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No notifications found</p>
            <p className="text-xs text-slate-400 mt-0.5">All telemetry feeds are operating within normal variance thresholds.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const Icon = getSeverityIcon(notif.severity, notif.type);
            return (
              <div
                key={notif.id}
                className={`glass-card rounded-2xl border p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.isRead ? 'border-sky-300 bg-sky-50/20' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    notif.severity === 'critical'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : notif.severity === 'warning'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : notif.severity === 'success'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-sky-50 text-sky-600 border border-sky-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm font-bold ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-600" />
                      )}
                      <span className="text-[10px] text-slate-400 font-mono ml-auto sm:ml-0">
                        {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      title="Mark as Read"
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => clearNotification(notif.id)}
                    title="Dismiss Notification"
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {notif.relatedPath && (
                    <Link
                      href={notif.relatedPath}
                      onClick={() => markAsRead(notif.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
