'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  TrendingUp,
  Navigation,
  Anchor,
  Ship,
  Layers,
  Sparkles,
  Globe,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { preferences, updatePreferences } = usePreferences();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 Selections
  const [monitors, setMonitors] = useState<string[]>(['Freight Markets', 'Routes', 'Ports']);
  // Step 2 Selections
  const [priorities, setPriorities] = useState<string[]>(['Price', 'Capacity', 'Congestion']);
  // Step 3 Selections
  const [selectedRegion, setSelectedRegion] = useState('Global Mainlanes');
  // Step 4 Selections
  const [preferredView, setPreferredView] = useState('Executive Overview');

  const toggleMonitor = (item: string) => {
    setMonitors(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const togglePriority = (item: string) => {
    setPriorities(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleFinish = () => {
    updatePreferences({
      defaultRegion: selectedRegion,
      defaultDashboard: preferredView,
    });
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Step Tracker Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Workspace Configuration
            </span>
          </div>
          <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-600 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: WHAT DO YOU WANT TO MONITOR? */}
      {currentStep === 1 && (
        <div className="glass-card rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">What do you want to monitor?</h2>
            <p className="text-xs text-slate-500 mt-1">Select the operational resources relevant to your supply chain</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { id: 'Freight Markets', icon: TrendingUp, desc: 'Spot quotes, FBX/SCFI indices & rate changes' },
              { id: 'Routes', icon: Navigation, desc: 'Asia-EU, Transpacific corridors & transit times' },
              { id: 'Ports', icon: Anchor, desc: 'Berth queues, container dwell times & yard congestion' },
              { id: 'Vessels', icon: Ship, desc: 'AIS satellite coordinates, carrier fleets & ETA drift' },
              { id: 'Trade Corridors', icon: Globe, desc: 'Annual TEU volume movements & growth rates' },
              { id: 'Forecasting', icon: Sparkles, desc: '90-day Bayesian ensemble spot predictions' },
            ].map((item) => {
              const Icon = item.icon;
              const isChecked = monitors.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleMonitor(item.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between ${
                    isChecked
                      ? 'border-sky-600 bg-sky-50/40 ring-1 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${isChecked ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.id}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Skip Step
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              disabled={monitors.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              Continue to Priorities <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: WHAT MATTERS MOST? */}
      {currentStep === 2 && (
        <div className="glass-card rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">What matters most to your team?</h2>
            <p className="text-xs text-slate-500 mt-1">This tunes our AI prioritization algorithms and threshold alerts</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {[
              { id: 'Price', icon: DollarSign, label: 'Freight Price Volatility' },
              { id: 'Capacity', icon: Layers, label: 'Vessel Slot Availability' },
              { id: 'Congestion', icon: Anchor, label: 'Port Anchorage Dwell' },
              { id: 'Delays', icon: Clock, label: 'Schedule Reliability / Delays' },
              { id: 'Demand', icon: TrendingUp, label: 'Import Booking Surges' },
              { id: 'Risk', icon: AlertTriangle, label: 'Geopolitical & Weather Risk' },
            ].map((item) => {
              const Icon = item.icon;
              const isChecked = priorities.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => togglePriority(item.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all text-center flex flex-col items-center justify-center gap-2 ${
                    isChecked
                      ? 'border-sky-600 bg-sky-50/50 ring-1 ring-sky-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${isChecked ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">{item.id}</p>
                  <p className="text-[10px] text-slate-500">{item.label}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={priorities.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              Select Regions <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SELECT REGIONS (INTERACTIVE MAP SELECTOR) */}
      {currentStep === 3 && (
        <div className="glass-card rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Select Primary Trade Regions</h2>
            <p className="text-xs text-slate-500 mt-1">Focus your command center telemetry on key geographical corridors</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'Global Mainlanes', label: 'All Global Corridors', sub: 'Asia, EU, North America, ME, LatAm' },
              { id: 'Asia - North Europe', label: 'Asia - Europe', sub: 'Shanghai, Singapore, Rotterdam, Hamburg' },
              { id: 'Transpacific Eastbound', label: 'Transpacific', sub: 'Yantian, Ningbo, Los Angeles, Long Beach' },
              { id: 'Transatlantic', label: 'Transatlantic', sub: 'Rotterdam, Antwerp, New York, Savannah' },
              { id: 'Asia - Middle East', label: 'Asia - Arabian Gulf', sub: 'Singapore, Port Klang, Jebel Ali' },
              { id: 'Asia - Latin America', label: 'Asia - South America', sub: 'Santos, Paranagua, Shanghai' },
            ].map((region) => {
              const isSelected = selectedRegion === region.id;
              return (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegion(region.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/50 ring-1 ring-sky-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{region.label}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border ${isSelected ? 'bg-sky-600 border-sky-600' : 'border-slate-300'}`} />
                  </div>
                  <p className="text-[11px] text-slate-500">{region.sub}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Choose Workspace View <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PREFERRED INTELLIGENCE VIEW & READY SCREEN */}
      {currentStep === 4 && (
        <div className="glass-card rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Preferred Intelligence View</h2>
            <p className="text-xs text-slate-500 mt-1">Select the landing view for your daily workflow</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { id: 'Executive Overview', desc: 'Holistic KPI cards, global rate indices, and AI morning briefs' },
              { id: 'Global Map View', desc: 'Full-screen interactive maritime geospatial map with AIS layer controls' },
              { id: 'Predictive Forecast', desc: 'Ensemble model projections with 7D to 90D horizon selector' },
              { id: 'Scenario Simulator', desc: 'Stress-test fuel prices, capacity shocks, and demand surges' },
            ].map((view) => {
              const isSelected = preferredView === view.id;
              return (
                <div
                  key={view.id}
                  onClick={() => setPreferredView(view.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/50 ring-1 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{view.id}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border ${isSelected ? 'bg-sky-600 border-sky-600' : 'border-slate-300'}`} />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{view.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Final Ready Box */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-bold">Your FreightSense workspace is ready.</p>
                <p className="text-[11px] text-emerald-700">Telemetry streams configured for {selectedRegion}.</p>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Open My Intelligence
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
