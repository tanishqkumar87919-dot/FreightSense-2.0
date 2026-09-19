/**
 * Unit Test Suite for FreightSense Multi-Currency Support
 * Tests precision rules, conversions, formatting, resilience, and dual display.
 */

import {
  CURRENCY_REGISTRY,
  REFERENCE_FX_RATES,
  DEFAULT_FX_PROVENANCE,
  normalizeCurrencyCode,
  convertCurrency,
  formatCurrency,
  formatWithOriginal,
} from '../src/lib/currency.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n========================================');
console.log('FREIGHTSENSE 2.0 MULTI-CURRENCY TEST SUITE');
console.log('========================================\n');

// 1. Registry & Supported Currencies
console.log('1. Registry & Supported Currencies (11 total):');
const expectedCurrencies = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CNY', 'AED', 'SGD', 'AUD', 'CAD', 'CHF'];
assert(
  Object.keys(CURRENCY_REGISTRY).length === 11,
  `Exactly 11 currencies registered (found ${Object.keys(CURRENCY_REGISTRY).length})`
);
for (const code of expectedCurrencies) {
  assert(Boolean(CURRENCY_REGISTRY[code]), `Currency ${code} is defined in registry`);
  assert(typeof REFERENCE_FX_RATES[code] === 'number' && REFERENCE_FX_RATES[code] > 0, `FX rate for ${code} is positive number`);
}

// 2. Normalization & Sanitization
console.log('\n2. Currency Code Normalization:');
assert(normalizeCurrencyCode('usd') === 'USD', 'Normalizes lowercase "usd" to "USD"');
assert(normalizeCurrencyCode('INR (₹)') === 'INR', 'Normalizes legacy label "INR (₹)" to "INR"');
assert(normalizeCurrencyCode('eur') === 'EUR', 'Normalizes lowercase "eur" to "EUR"');
assert(normalizeCurrencyCode(null) === 'USD', 'Null falls back to default USD');
assert(normalizeCurrencyCode('UNKNOWN') === 'USD', 'Unknown currency falls back to default USD');

// 3. Conversions
console.log('\n3. Currency Conversion Mechanics:');
assert(convertCurrency(100, 'USD', 'USD') === 100, 'Identity: 100 USD -> 100 USD');
const inrConverted = convertCurrency(100, 'USD', 'INR');
assert(inrConverted === 8375, `100 USD -> INR: expected 8375, got ${inrConverted}`);
const eurConverted = convertCurrency(100, 'USD', 'EUR');
assert(eurConverted === 92, `100 USD -> EUR: expected 92, got ${eurConverted}`);
const jpyConverted = convertCurrency(10, 'USD', 'JPY');
assert(jpyConverted === 1552, `10 USD -> JPY: expected 1552, got ${jpyConverted}`);

// Cross-currency conversion (INR -> EUR)
const inrToEur = convertCurrency(8375, 'INR', 'EUR');
// 8375 / 83.75 = 100 USD -> 100 * 0.92 = 92 EUR
assert(inrToEur === 92, `Cross currency 8375 INR -> EUR: expected 92, got ${inrToEur}`);

// 4. Precision Rules (JPY 0 decimals, others 2)
console.log('\n4. Precision Conventions:');
assert(CURRENCY_REGISTRY['JPY'].decimal_digits === 0, 'JPY configured with 0 decimal digits');
assert(CURRENCY_REGISTRY['USD'].decimal_digits === 2, 'USD configured with 2 decimal digits');
assert(CURRENCY_REGISTRY['INR'].decimal_digits === 2, 'INR configured with 2 decimal digits');

// 5. Formatting
console.log('\n5. Locale Formatting:');
const formattedUsd = formatCurrency(1234.56, 'USD');
assert(formattedUsd.includes('$') || formattedUsd.includes('1,234.56'), `USD formatted correctly: ${formattedUsd}`);
const formattedInr = formatCurrency(100000, 'INR');
assert(formattedInr.includes('₹') || formattedInr.includes('INR'), `INR formatted correctly: ${formattedInr}`);
const formattedJpy = formatCurrency(1552.4, 'JPY');
assert(!formattedJpy.includes('.'), `JPY format has 0 decimals: ${formattedJpy}`);

// 6. Dual Display Formatting
console.log('\n6. Dual Display with USD Original:');
const dualUsd = formatWithOriginal(52.0, 'USD', '/ MT');
assert(dualUsd.display.includes('$52'), `USD display contains $52: ${dualUsd.display}`);
assert(!dualUsd.combined.includes('≈'), `USD does not show approximate duplicate: ${dualUsd.combined}`);

const dualInr = formatWithOriginal(52.0, 'INR', '/ MT');
assert(dualInr.combined.includes('≈') && dualInr.combined.includes('$52'), `INR dual display includes both INR and USD: ${dualInr.combined}`);

// 7. Edge Cases & Resilience
console.log('\n7. Edge Cases & Resilience:');
assert(convertCurrency(null, 'USD', 'INR') === 0, 'Null amount safely converts to 0');
assert(convertCurrency(undefined, 'USD', 'INR') === 0, 'Undefined amount safely converts to 0');
assert(convertCurrency(NaN, 'USD', 'INR') === 0, 'NaN amount safely converts to 0');
assert(formatCurrency(null, 'USD') === '—', 'Null format returns dash');
assert(formatCurrency(undefined, 'USD') === '—', 'Undefined format returns dash');

// 8. Epistemic Provenance
console.log('\n8. Epistemic Provenance:');
assert(DEFAULT_FX_PROVENANCE.status === 'REFERENCE', 'Provenance status is REFERENCE');
assert(DEFAULT_FX_PROVENANCE.is_live === false, 'Provenance is_live is FALSE (strictly honest)');
assert(DEFAULT_FX_PROVENANCE.source.includes('IMF'), 'Provenance source credits IMF / World Bank');

console.log('\n----------------------------------------');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('----------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
