'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Coins, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { CurrencyCode } from '@/types/currency';

interface CurrencySelectorProps {
  compact?: boolean;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  compact = false,
  className = '',
}) => {
  const { currency, setCurrency, currencies, rates, rateMetadata } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConfig = currencies[currency] || currencies.USD;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current currency: ${activeConfig.name} (${activeConfig.code}). Click to switch currency.`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white/90 hover:bg-white hover:text-slate-900 border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      >
        <span className="text-sm leading-none" aria-hidden="true">
          {activeConfig.flag}
        </span>
        <span className="font-bold text-slate-900">{activeConfig.symbol}</span>
        <span className="font-semibold text-slate-600">{activeConfig.code}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select currency"
          className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Info */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Display Currency
              </span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 uppercase">
              {rateMetadata.status}
            </span>
          </div>

          {/* Currencies List */}
          <div className="max-h-64 overflow-y-auto py-1 space-y-0.5 scrollbar-thin">
            {(Object.keys(currencies) as CurrencyCode[]).map((code) => {
              const config = currencies[code];
              const isSelected = currency === code;
              const rate = rates[code] || config.rate_to_usd;

              return (
                <button
                  key={code}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    setCurrency(code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none" aria-hidden="true">
                      {config.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{code}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({config.symbol})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{config.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      {code === 'USD' ? 'Base' : `1$ = ${rate}`}
                    </span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Notice */}
          <div className="pt-2 px-2.5 pb-1 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate" title={rateMetadata.source}>
              USD Base • {rateMetadata.source}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
