'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  Key,
  Database,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Clock,
  Compass,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: 'Connected' | 'Not Connected' | 'Error' | 'Updating';
  lastSync: string;
  dataCoverage: string;
  apiKeyMasked: string;
  endpoint: string;
}

const initialIntegrations: IntegrationItem[] = [
  {
    id: 'int-ais-satellite',
    name: 'Satellite & Terrestrial AIS Feed',
    provider: 'Spire Maritime Constellation',
    category: 'Vessel Telemetry',
    status: 'Connected',
    lastSync: '12 seconds ago',
    dataCoverage: '142,000 vessels global coverage',
    apiKeyMasked: 'spire_live_99a8*******************f4b1',
    endpoint: 'wss://stream.maritime.spire.com/v2/ais',
  },
  {
    id: 'int-freight-indices',
    name: 'Freightos Baltic Daily Indices (FBX)',
    provider: 'Freightos Exchange API',
    category: 'Market Spot Rates',
    status: 'Connected',
    lastSync: '14 minutes ago',
    dataCoverage: '12 global container benchmarks',
    apiKeyMasked: 'fbx_auth_88c1*******************99a2',
    endpoint: 'https://api.freightos.com/v1/indices/daily',
  },
  {
    id: 'int-weather-ecmwf',
    name: 'Marine Ocean Wave & Storm Models',
    provider: 'ECMWF Copernicus Marine',
    category: 'Environmental Hazards',
    status: 'Connected',
    lastSync: '1 hour ago',
    dataCoverage: 'Global ocean surface 0.1° resolution',
    apiKeyMasked: 'ecmwf_sec_44b2*******************12c9',
    endpoint: 'https://cds.climate.copernicus.eu/api/v2',
  },
  {
    id: 'int-mapbox-tiles',
    name: 'Maritime Bathymetry & Vector Mapbox',
    provider: 'Mapbox Navigation SDK',
    category: 'Geospatial Canvas',
    status: 'Connected',
    lastSync: 'Just now',
    dataCoverage: 'Global marine navigational cartography',
    apiKeyMasked: 'pk.eyJ1IjoibWFyaXRpbWUi*******************889a',
    endpoint: 'https://api.mapbox.com/styles/v1/maritime/light-v11',
  },
  {
    id: 'int-sap-webhook',
    name: 'Enterprise TMS Outbound Webhook',
    provider: 'SAP Transportation Management',
    category: 'Enterprise Integration',
    status: 'Updating',
    lastSync: '4 hours ago',
    dataCoverage: 'Automated booking event triggers',
    apiKeyMasked: 'sap_whk_22a1*******************77e4',
    endpoint: 'https://tms.vanguardlogistics.com/webhooks/freightsense',
  },
  {
    id: 'int-customs-ams',
    name: 'US Customs AMS Automated Manifest',
    provider: 'CBP Trade Portal',
    category: 'Trade Corridors',
    status: 'Not Connected',
    lastSync: 'Never',
    dataCoverage: 'US East & West Coast Inbound Declarations',
    apiKeyMasked: 'cbp_key_unconfigured',
    endpoint: 'https://ace.cbp.dhs.gov/ams/v3',
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; latency: string; status: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);

  const handleTestConnection = (intItem: IntegrationItem) => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        id: intItem.id,
        latency: '42ms',
        status: '200 OK (Telemetry Handshake Verified)',
      });
      setTimeout(() => setTestResult(null), 5000);
    }, 750);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Not Connected', lastSync: 'Disconnected' };
      }
      return item;
    }));
  };

  const handleOpenConfigure = (intItem: IntegrationItem) => {
    setSelectedIntegration(intItem);
    setIsConfigureOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              API & Telemetry Integrations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-600" />
              Connector Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage external data pipelines, secure API credentials, webhook triggers, and vessel stream synchronization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span>API Docs & Webhooks</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Connection verified: <strong>{testResult.status}</strong> • Roundtrip latency: <strong>{testResult.latency}</strong></span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* INTEGRATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-sky-300 transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <StatusBadge status={item.status} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                <p className="text-xs text-sky-700 font-medium mt-0.5">{item.provider}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <p><span className="text-slate-400 font-medium">Coverage:</span> {item.dataCoverage}</p>
                <p><span className="text-slate-400 font-medium">Last Sync:</span> {item.lastSync}</p>
                <p className="font-mono text-[10px] text-slate-500 truncate">Key: {item.apiKeyMasked}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestConnection(item)}
                  disabled={isTesting || item.status === 'Not Connected'}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-2xs transition-colors disabled:opacity-50"
                >
                  Test Connection
                </button>

                {item.status === 'Connected' ? (
                  <button
                    onClick={() => handleDisconnect(item.id)}
                    className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenConfigure(item)}
                    className="px-2.5 py-1.5 rounded-lg text-sky-700 hover:bg-sky-50 font-semibold transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>

              <button
                onClick={() => handleOpenConfigure(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Configure Endpoint"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIGURE MODAL */}
      {selectedIntegration && (
        <Modal
          isOpen={isConfigureOpen}
          onClose={() => setIsConfigureOpen(false)}
          title={`Configure ${selectedIntegration.name}`}
          subtitle={`Provider: ${selectedIntegration.provider}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">API Key / Token</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  defaultValue="sk_live_maritime_enterprise_2026_secured_key"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Credentials stored in encrypted hardware security module.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Ingestion Endpoint</label>
              <input
                type="text"
                defaultValue={selectedIntegration.endpoint}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-sky-500 text-xs"
              />
            </div>

            <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-900">
              <span className="font-bold">Sync Cadence:</span>
              <p className="text-[11px] mt-0.5">Automated continuous polling every 60 seconds with exponential retry backoff.</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfigureOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntegrations(prev => prev.map(i => i.id === selectedIntegration.id ? { ...i, status: 'Connected', lastSync: 'Just now' } : i));
                  setIsConfigureOpen(false);
                  setTestResult({
                    id: selectedIntegration.id,
                    latency: '38ms',
                    status: 'Integration Updated & Connected',
                  });
                }}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm"
              >
                Save & Verify Handshake
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
