'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CurrencyCode,
  CurrencyConfig,
  FxDataProvenance,
  FormatCurrencyOptions,
  DualCurrencyFormat,
  FxRatesResponse,
} from '@/types/currency';
import {
  DEFAULT_CURRENCY,
  CURRENCY_REGISTRY,
  REFERENCE_FX_RATES,
  DEFAULT_FX_PROVENANCE,
  normalizeCurrencyCode,
  convertCurrency,
  formatCurrency,
  formatWithOriginal as formatWithOriginalUtil,
} from '@/lib/currency';
import { fetchFromApi } from '@/lib/api';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: string | CurrencyCode) => void;
  currencies: Record<CurrencyCode, CurrencyConfig>;
  rates: Record<CurrencyCode, number>;
  rateMetadata: FxDataProvenance;
  convert: (amount: number | null | undefined, from?: string) => number;
  format: (amount: number | null | undefined, options?: FormatCurrencyOptions) => string;
  formatUsdConverted: (amountInUsd: number | null | undefined, options?: FormatCurrencyOptions) => string;
  formatWithOriginal: (amountInUsd: number | null | undefined, unit?: string) => DualCurrencyFormat;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'freightsense_currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(REFERENCE_FX_RATES);
  const [rateMetadata, setRateMetadata] = useState<FxDataProvenance>(DEFAULT_FX_PROVENANCE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage safely on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCurrencyState(normalizeCurrencyCode(saved));
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  // Fetch exchange rates from backend API with fallback to reference rates
  useEffect(() => {
    let mounted = true;

    async function loadRates() {
      try {
        const response = await fetchFromApi<FxRatesResponse>('/api/v1/fx/rates');
        if (mounted && response && response.rates) {
          setRates((prev) => ({
            ...prev,
            ...response.rates,
          }));
          if (response.data_provenance) {
            setRateMetadata(response.data_provenance);
          }
        }
      } catch (err) {
        // Fallback to REFERENCE_FX_RATES is already set in initial state
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadRates();

    return () => {
      mounted = false;
    };
  }, []);

  const setCurrency = useCallback((code: string | CurrencyCode) => {
    const normalized = normalizeCurrencyCode(code);
    setCurrencyState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const convert = useCallback(
    (amount: number | null | undefined, from: string = 'USD'): number => {
      return convertCurrency(amount, from, currency, rates);
    },
    [currency, rates]
  );

  const format = useCallback(
    (amount: number | null | undefined, options: FormatCurrencyOptions = {}): string => {
      return formatCurrency(amount, currency, options);
    },
    [currency]
  );

  const formatUsdConverted = useCallback(
    (amountInUsd: number | null | undefined, options: FormatCurrencyOptions = {}): string => {
      if (amountInUsd === null || amountInUsd === undefined || Number.isNaN(amountInUsd)) {
        return '—';
      }
      const converted = convertCurrency(amountInUsd, 'USD', currency, rates);
      return formatCurrency(converted, currency, options);
    },
    [currency, rates]
  );

  const formatWithOriginal = useCallback(
    (amountInUsd: number | null | undefined, unit?: string): DualCurrencyFormat => {
      return formatWithOriginalUtil(amountInUsd, currency, unit, rates);
    },
    [currency, rates]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      currencies: CURRENCY_REGISTRY,
      rates,
      rateMetadata,
      convert,
      format,
      formatUsdConverted,
      formatWithOriginal,
      isLoading,
    }),
    [
      currency,
      setCurrency,
      rates,
      rateMetadata,
      convert,
      format,
      formatUsdConverted,
      formatWithOriginal,
      isLoading,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
