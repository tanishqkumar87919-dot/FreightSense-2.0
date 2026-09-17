'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  SlidersHorizontal,
  Building,
  Bell,
  Shield,
  Key,
  Globe,
  Clock,
  CheckCircle2,
  Save,
  Laptop,
  Smartphone,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';

export default function SettingsPage() {
  const { preferences, updatePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'preferences' | 'notifications' | 'security'>('profile');

  // Local form state
  const [formData, setFormData] = useState({
    name: preferences.name,
    email: preferences.email,
    company: preferences.company,
    role: preferences.role,
    workspaceName: preferences.workspaceName,
    defaultRegion: preferences.defaultRegion,
    timezone: preferences.timezone,
    defaultDashboard: preferences.defaultDashboard,
    defaultDateRange: preferences.defaultDateRange,
    currency: preferences.currency,
    speedUnit: preferences.speedUnit,
    distanceUnit: preferences.distanceUnit,
    emailNotifications: preferences.emailNotifications,
    pushNotifications: preferences.pushNotifications,
    marketAlerts: preferences.marketAlerts,
    routeAlerts: preferences.routeAlerts,
    portAlerts: preferences.portAlerts,
  });

  // Save feedback state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveStatus('saving');
    setTimeout(() => {
      updatePreferences(formData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 600);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Settings & Workspace Profile
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              Enterprise Tier
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your account credentials, regional defaults, alert notification channels, and active sessions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved
            </span>
          )}

          <button
            onClick={() => handleSave()}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* SETTINGS SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-3 glass-card rounded-2xl border border-slate-200/90 p-3 shadow-sm space-y-1">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'workspace', label: 'Workspace Info', icon: Building },
            { id: 'preferences', label: 'Display & Units', icon: SlidersHorizontal },
            { id: 'notifications', label: 'Notification Channels', icon: Bell },
            { id: 'security', label: 'Security & Sessions', icon: Shield },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Form Body */}
        <div className="lg:col-span-9 glass-card rounded-3xl border border-slate-200/90 p-8 shadow-sm">
          
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">Your identity details across FreightSense shared workspaces</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-900 text-sky-200 font-bold text-sm flex items-center justify-center shadow-sm">
                  MV
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Commercial Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSPACE */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Workspace Configuration</h3>
                <p className="text-xs text-slate-500">Default operational scope and organizational timezone</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workspace Name</label>
                  <input
                    type="text"
                    value={formData.workspaceName}
                    onChange={(e) => handleChange('workspaceName', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default Focus Region</label>
                    <select
                      value={formData.defaultRegion}
                      onChange={(e) => handleChange('defaultRegion', e.target.value)}
                      className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="Global Mainlanes">Global Mainlanes</option>
                      <option value="Asia - North Europe">Asia - North Europe</option>
                      <option value="Transpacific Eastbound">Transpacific Eastbound</option>
                      <option value="Transatlantic">Transatlantic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Operating Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="UTC (Greenwich Mean Time)">UTC (Greenwich Mean Time)</option>
                      <option value="America/New_York (EST)">America/New York (EST)</option>
                      <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT)</option>
                      <option value="Europe/Rotterdam (CET)">Europe/Rotterdam (CET)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISPLAY & UNITS */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Maritime Measurement & Display Units</h3>
                <p className="text-xs text-slate-500">Standardize currencies, speeds, and container dimensions</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency Standard</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vessel Speed Unit</label>
                  <select
                    value={formData.speedUnit}
                    onChange={(e) => handleChange('speedUnit', e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Knots (kts)">Knots (kts)</option>
                    <option value="km/h">Kilometers per hour (km/h)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Distance Unit</label>
                  <select
                    value={formData.distanceUnit}
                    onChange={(e) => handleChange('distanceUnit', e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Nautical Miles (nm)">Nautical Miles (nm)</option>
                    <option value="Kilometers (km)">Kilometers (km)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Landing Dashboard</label>
                  <select
                    value={formData.defaultDashboard}
                    onChange={(e) => handleChange('defaultDashboard', e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Executive Overview">Executive Command Center</option>
                    <option value="Global Map">Global Geospatial Map</option>
                    <option value="Freight Forecast">Predictive Forecast</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Alert Notifications</h3>
                <p className="text-xs text-slate-500">Configure delivery channels for price surges and hazard advisories</p>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { key: 'emailNotifications', label: 'Email Digest Notifications', desc: 'Daily summary and critical price surge emails' },
                  { key: 'pushNotifications', label: 'Browser & Mobile Push', desc: 'Instant desktop toasts for severe weather and port closures' },
                  { key: 'marketAlerts', label: 'Spot Rate Volatility Alerts', desc: 'Triggers when FBX index swings by > 5%' },
                  { key: 'routeAlerts', label: 'Chokepoint & Route Diversions', desc: 'Notices on Suez/Cape/Panama routing changes' },
                  { key: 'portAlerts', label: 'Port Congestion Dwell Alarms', desc: 'Triggers when yard dwell extends beyond 4.5 days' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(formData as any)[item.key]}
                      onChange={(e) => handleChange(item.key, e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & SESSIONS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Security & Active Sessions</h3>
                <p className="text-xs text-slate-500">Session authentication and multi-factor verification</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Protect your workspace with hardware keys or authenticator app.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Enforced
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Active Authenticated Devices</h4>
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Laptop className="w-5 h-5 text-sky-600" />
                        <div>
                          <p className="font-bold text-slate-900">MacBook Pro (Apple Silicon) • macOS</p>
                          <p className="text-[10px] text-slate-400">Singapore • Current Active Session</p>
                        </div>
                      </div>
                      <span className="text-emerald-600 font-bold text-[10px]">Active Now</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-900">iPhone 16 Pro • iOS App</p>
                          <p className="text-[10px] text-slate-400">Rotterdam, Netherlands • 2 days ago</p>
                        </div>
                      </div>
                      <button className="text-rose-600 font-medium hover:underline text-[11px]">
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Save Button */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Changes are applied immediately to your session</span>
            <button
              onClick={() => handleSave()}
              disabled={saveStatus === 'saving'}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Workspace Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
