export type CurrencyCode =
  | 'USD'
  | 'INR'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CNY'
  | 'AED'
  | 'SGD'
  | 'AUD'
  | 'CAD'
  | 'CHF';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimal_digits: number;
  locale: string;
  flag: string;
  rate_to_usd: number;
}

export type FxStatus = 'LIVE' | 'REFERENCE' | 'DEMO' | 'UNAVAILABLE';

export interface FxDataProvenance {
  status: FxStatus;
  source: string;
  timestamp: string;
  methodology?: string;
  is_live: boolean;
}

export interface FxRatesResponse {
  status: string;
  base_currency: string;
  rates: Record<CurrencyCode, number>;
  currencies_count: number;
  data_provenance: FxDataProvenance;
}

export interface FormatCurrencyOptions {
  decimals?: number;
  compact?: boolean;
  showSymbol?: boolean;
  showCode?: boolean;
  unit?: string; // e.g. '/ MT', '/ day', '/ voyage'
}

export interface DualCurrencyFormat {
  display: string;
  original: string;
  combined: string;
}
