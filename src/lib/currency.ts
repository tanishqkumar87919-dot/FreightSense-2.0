/**
 * FreightSense 2.0 — Centralized Currency & Presentation Conversion Utility.
 * Authoritative currency registry, locale-aware formatting, and arithmetic conversion logic.
 * USD is the internal base currency; conversions operate on the presentation layer.
 */

import type {
  CurrencyCode,
  CurrencyConfig,
  FxDataProvenance,
  FormatCurrencyOptions,
  DualCurrencyFormat,
} from '../types/currency';

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimal_digits: 2,
    locale: 'en-US',
    flag: '🇺🇸',
    rate_to_usd: 1.0,
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimal_digits: 2,
    locale: 'en-IN',
    flag: '🇮🇳',
    rate_to_usd: 83.75,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimal_digits: 2,
    locale: 'de-DE',
    flag: '🇪🇺',
    rate_to_usd: 0.92,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimal_digits: 2,
    locale: 'en-GB',
    flag: '🇬🇧',
    rate_to_usd: 0.79,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimal_digits: 0,
    locale: 'ja-JP',
    flag: '🇯🇵',
    rate_to_usd: 155.2,
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimal_digits: 2,
    locale: 'zh-CN',
    flag: '🇨🇳',
    rate_to_usd: 7.24,
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    decimal_digits: 2,
    locale: 'ar-AE',
    flag: '🇦🇪',
    rate_to_usd: 3.67,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimal_digits: 2,
    locale: 'en-SG',
    flag: '🇸🇬',
    rate_to_usd: 1.35,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimal_digits: 2,
    locale: 'en-AU',
    flag: '🇦🇺',
    rate_to_usd: 1.52,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimal_digits: 2,
    locale: 'en-CA',
    flag: '🇨🇦',
    rate_to_usd: 1.36,
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    decimal_digits: 2,
    locale: 'de-CH',
    flag: '🇨🇭',
    rate_to_usd: 0.9,
  },
};

export const REFERENCE_FX_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  INR: 83.75,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.2,
  CNY: 7.24,
  AED: 3.67,
  SGD: 1.35,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.9,
};

export const DEFAULT_FX_PROVENANCE: FxDataProvenance = {
  status: 'REFERENCE',
  source: 'International Monetary Fund (IMF) / World Bank IFS & Federal Reserve H.10',
  timestamp: '2026-09-18T00:00:00Z',
  methodology: 'International Financial Statistics (IFS) Cross-Currency Reference Benchmark',
  is_live: false,
};

/**
 * Validate and sanitize a currency code string into a supported CurrencyCode.
 * Handles legacy values like 'USD ($)', 'EUR (€)', 'INR (₹)' gracefully.
 */
export function normalizeCurrencyCode(code: string | null | undefined): CurrencyCode {
  if (!code) return DEFAULT_CURRENCY;
  const upper = code.trim().toUpperCase();
  for (const registeredCode of Object.keys(CURRENCY_REGISTRY) as CurrencyCode[]) {
    if (upper.startsWith(registeredCode)) {
      return registeredCode;
    }
  }
  return DEFAULT_CURRENCY;
}

/**
 * Pure, non-mutating currency conversion between any two registered currencies.
 */
export function convertCurrency(
  amount: number | null | undefined,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  rates: Record<CurrencyCode, number> = REFERENCE_FX_RATES
): number {
  if (amount === null || amount === undefined || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return 0;
  }

  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);

  if (from === to) {
    return amount;
  }

  const fromRate = rates[from] || REFERENCE_FX_RATES[from] || 1.0;
  const toRate = rates[to] || REFERENCE_FX_RATES[to] || 1.0;

  // Cross rate calculation relative to USD:
  // Amount in USD = amount / fromRate
  // Amount in Target = (amount / fromRate) * toRate
  const crossRate = toRate / fromRate;
  const converted = amount * crossRate;

  // Round according to target currency precision convention
  const config = CURRENCY_REGISTRY[to];
  const decimals = config.decimal_digits;
  const factor = Math.pow(10, decimals);
  return Math.round(converted * factor) / factor;
}

/**
 * Format a numeric amount using locale-aware Intl.NumberFormat.
 * Respects currency-specific decimal conventions (e.g. JPY has 0 decimals).
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'USD',
  options: FormatCurrencyOptions = {}
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return '—';
  }

  const code = normalizeCurrencyCode(currencyCode);
  const config = CURRENCY_REGISTRY[code];
  const decimals = options.decimals !== undefined ? options.decimals : config.decimal_digits;

  let formatted = '';

  try {
    if (options.compact) {
      const absAmount = Math.abs(amount);
      const sign = amount < 0 ? '-' : '';
      if (absAmount >= 1_000_000_000) {
        formatted = `${sign}${config.symbol}${(absAmount / 1_000_000_000).toFixed(1)}B`;
      } else if (absAmount >= 1_000_000) {
        formatted = `${sign}${config.symbol}${(absAmount / 1_000_000).toFixed(1)}M`;
      } else if (absAmount >= 1_000) {
        formatted = `${sign}${config.symbol}${(absAmount / 1_000).toFixed(1)}k`;
      } else {
        formatted = `${sign}${config.symbol}${absAmount.toFixed(decimals)}`;
      }
    } else {
      const formatter = new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      formatted = formatter.format(amount);
    }
  } catch {
    // Fallback if locale is unsupported in environment
    const sign = amount < 0 ? '-' : '';
    const abs = Math.abs(amount).toFixed(decimals);
    formatted = `${sign}${config.symbol}${abs}`;
  }

  if (options.unit) {
    formatted = `${formatted} ${options.unit}`.trim();
  }

  return formatted;
}

/**
 * Format an internal USD amount converted to the target currency,
 * alongside its original USD value for full financial transparency.
 */
export function formatWithOriginal(
  amountUsd: number | null | undefined,
  targetCurrency: string = 'USD',
  unit?: string,
  rates: Record<CurrencyCode, number> = REFERENCE_FX_RATES
): DualCurrencyFormat {
  if (amountUsd === null || amountUsd === undefined || Number.isNaN(amountUsd) || !Number.isFinite(amountUsd)) {
    return {
      display: '—',
      original: '—',
      combined: '—',
    };
  }

  const code = normalizeCurrencyCode(targetCurrency);
  const originalStr = formatCurrency(amountUsd, 'USD', { unit });

  if (code === 'USD') {
    return {
      display: originalStr,
      original: originalStr,
      combined: originalStr,
    };
  }

  const converted = convertCurrency(amountUsd, 'USD', code, rates);
  const displayStr = formatCurrency(converted, code, { unit });

  return {
    display: displayStr,
    original: originalStr,
    combined: `${displayStr} (≈ ${originalStr})`,
  };
}
