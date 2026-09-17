'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  LifeBuoy,
  AlertCircle,
  MessageSquare,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { mockDocArticles, mockDocCategories, DocArticle } from '@/data/docsData';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
  const [copied, setCopied] = useState(false);

  // Modals
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [modalSuccessNotice, setModalSuccessNotice] = useState<string | null>(null);

  const filteredArticles = mockDocArticles.filter(art => {
    const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesQuery = searchQuery === '' ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccessNotice('Your priority enterprise support ticket (#FS-8821) has been logged.');
    setTimeout(() => {
      setModalSuccessNotice(null);
      setIsSupportModalOpen(false);
    }, 2000);
  };

  const handleReportIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccessNotice('Telemetry discrepancy logged for review by our data engineering team.');
    setTimeout(() => {
      setModalSuccessNotice(null);
      setIsReportIssueOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Knowledge Base & Documentation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              Developer & Analyst Guides
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System workflows, mathematical model descriptions, API reference specs, and operational guides
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReportIssueOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Report Data Issue</span>
          </button>

          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>

      {/* SEARCH BANNER */}
      <div className="glass-card rounded-3xl border border-slate-200/90 p-8 text-center max-w-2xl mx-auto space-y-4 shadow-sm bg-gradient-to-b from-white to-slate-50">
        <h2 className="text-xl font-bold text-slate-900">How can we help your maritime operations?</h2>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, forecasting algorithms, webhooks, or chokepoint routes..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
          <span>Popular topics:</span>
          {['Bayesian Forecast', 'Cape Routing', 'Tuas Dwell', 'Outbound Webhooks', 'Alert Thresholds'].map(topic => (
            <button
              key={topic}
              onClick={() => setSearchQuery(topic)}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* ARTICLE DETAIL VIEW (IF SELECTED) */}
      {selectedArticle ? (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-8 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all articles</span>
            </button>

            <span className="text-[11px] text-slate-400 font-mono">Updated: {selectedArticle.updatedDate}</span>
          </div>

          <div className="space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
              {selectedArticle.category}
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{selectedArticle.title}</h2>
            <p className="text-xs text-slate-500">{selectedArticle.description}</p>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4 pt-2">
            {selectedArticle.content}
          </div>

          {selectedArticle.codeSnippet && (
            <div className="rounded-2xl bg-slate-900 text-slate-200 p-5 font-mono text-xs relative space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400 text-[11px]">
                <span>Payload Example</span>
                <button
                  onClick={() => handleCopyCode(selectedArticle.codeSnippet!)}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-sky-300">
                {selectedArticle.codeSnippet}
              </pre>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Tags:</span>
              {selectedArticle.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                  #{t}
                </span>
              ))}
            </div>

            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="text-sky-600 font-semibold hover:underline"
            >
              Need further clarification? Contact engineers
            </button>
          </div>
        </div>
      ) : (
        /* ARTICLES DIRECTORY VIEW */
        <div className="space-y-6">
          {/* Categories Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Topics ({mockDocArticles.length})
            </button>
            {mockDocCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="glass-card rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-sky-300 cursor-pointer transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{art.readTime}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {art.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-600 font-semibold">
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPORT TICKET MODAL */}
      <Modal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        title="Contact Enterprise Support"
        subtitle="Connect with our maritime intelligence engineering desk"
        maxWidth="md"
      >
        {modalSuccessNotice ? (
          <div className="p-6 text-center space-y-3">
            <Check className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">{modalSuccessNotice}</p>
          </div>
        ) : (
          <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Inbound AIS API discrepancy on Transpacific loop"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
              <select className="w-full bg-white px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500">
                <option>Severity 3 - General Guidance</option>
                <option>Severity 2 - Data Telemetry Degraded</option>
                <option>Severity 1 - Critical Procurement Impact</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Inquiry</label>
              <textarea
                rows={4}
                placeholder="Describe the issue, affected routes, or required custom models..."
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-sm"
              >
                Submit Support Ticket
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* REPORT ISSUE MODAL */}
      <Modal
        isOpen={isReportIssueOpen}
        onClose={() => setIsReportIssueOpen(false)}
        title="Report Telemetry Discrepancy"
        subtitle="Help us refine machine accuracy by flagging vessel or port dwell anomalies"
        maxWidth="md"
      >
        {modalSuccessNotice ? (
          <div className="p-6 text-center space-y-3">
            <Check className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">{modalSuccessNotice}</p>
          </div>
        ) : (
          <form onSubmit={handleReportIssueSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Dimension</label>
              <select className="w-full bg-white px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500">
                <option>Vessel Position / AIS Track</option>
                <option>Port Anchorage Queue Count</option>
                <option>Spot Rate Quote Deviation</option>
                <option>Weather Wave Height Report</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Object Identifier</label>
              <input
                type="text"
                placeholder="e.g. IMO 9929429 or Port of Singapore"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discrepancy Description</label>
              <textarea
                rows={3}
                placeholder="Observed value vs expected value..."
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportIssueOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm"
              >
                Submit Discrepancy Log
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
