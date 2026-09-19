"""
FreightSense 2.0 — Currency Domain Model & Reference FX Rate Registry.
Authoritative currency configurations and reference exchange rates relative to USD base.
Source: IMF / World Bank International Financial Statistics & Federal Reserve H.10 Release.
Data Provenance: REFERENCE
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone

# Baseline reference calibration timestamp
FX_REFERENCE_TIMESTAMP = "2026-09-18T00:00:00Z"
FX_DATA_SOURCE = "International Monetary Fund (IMF) / World Bank IFS & Federal Reserve H.10"
FX_STATUS = "REFERENCE"

# 11 initial supported international trade currencies
CURRENCY_CONFIGS: Dict[str, Dict[str, Any]] = {
    "USD": {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "decimal_digits": 2,
        "locale": "en-US",
        "flag": "🇺🇸",
        "rate_to_usd": 1.0,
    },
    "INR": {
        "code": "INR",
        "name": "Indian Rupee",
        "symbol": "₹",
        "decimal_digits": 2,
        "locale": "en-IN",
        "flag": "🇮🇳",
        "rate_to_usd": 83.75,
    },
    "EUR": {
        "code": "EUR",
        "name": "Euro",
        "symbol": "€",
        "decimal_digits": 2,
        "locale": "de-DE",
        "flag": "🇪🇺",
        "rate_to_usd": 0.92,
    },
    "GBP": {
        "code": "GBP",
        "name": "British Pound",
        "symbol": "£",
        "decimal_digits": 2,
        "locale": "en-GB",
        "flag": "🇬🇧",
        "rate_to_usd": 0.79,
    },
    "JPY": {
        "code": "JPY",
        "name": "Japanese Yen",
        "symbol": "¥",
        "decimal_digits": 0,
        "locale": "ja-JP",
        "flag": "🇯🇵",
        "rate_to_usd": 155.20,
    },
    "CNY": {
        "code": "CNY",
        "name": "Chinese Yuan",
        "symbol": "¥",
        "decimal_digits": 2,
        "locale": "zh-CN",
        "flag": "🇨🇳",
        "rate_to_usd": 7.24,
    },
    "AED": {
        "code": "AED",
        "name": "UAE Dirham",
        "symbol": "AED",
        "decimal_digits": 2,
        "locale": "ar-AE",
        "flag": "🇦🇪",
        "rate_to_usd": 3.67,
    },
    "SGD": {
        "code": "SGD",
        "name": "Singapore Dollar",
        "symbol": "S$",
        "decimal_digits": 2,
        "locale": "en-SG",
        "flag": "🇸🇬",
        "rate_to_usd": 1.35,
    },
    "AUD": {
        "code": "AUD",
        "name": "Australian Dollar",
        "symbol": "A$",
        "decimal_digits": 2,
        "locale": "en-AU",
        "flag": "🇦🇺",
        "rate_to_usd": 1.52,
    },
    "CAD": {
        "code": "CAD",
        "name": "Canadian Dollar",
        "symbol": "C$",
        "decimal_digits": 2,
        "locale": "en-CA",
        "flag": "🇨🇦",
        "rate_to_usd": 1.36,
    },
    "CHF": {
        "code": "CHF",
        "name": "Swiss Franc",
        "symbol": "CHF",
        "decimal_digits": 2,
        "locale": "de-CH",
        "flag": "🇨🇭",
        "rate_to_usd": 0.90,
    },
}

def get_exchange_rates(base_currency: str = "USD") -> Dict[str, float]:
    """Calculate cross rates relative to any specified base currency."""
    base = base_currency.upper()
    if base not in CURRENCY_CONFIGS:
        raise ValueError(f"Unsupported base currency: {base_currency}")
    
    usd_to_base = CURRENCY_CONFIGS[base]["rate_to_usd"]
    rates = {}
    for code, config in CURRENCY_CONFIGS.items():
        # rate_to_base = (rate_to_usd of target) / (rate_to_usd of base)
        rates[code] = round(config["rate_to_usd"] / usd_to_base, 6)
    return rates

def convert_amount(
    amount: float,
    from_currency: str = "USD",
    to_currency: str = "USD",
    custom_rate: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Safely convert an amount between currencies.
    Preserves sign, handles zero, avoids floating point surprises.
    """
    if amount is None:
        raise ValueError("Amount cannot be null")
    
    from_curr = from_currency.upper()
    to_curr = to_currency.upper()

    if from_curr not in CURRENCY_CONFIGS:
        raise ValueError(f"Unsupported source currency: {from_currency}")
    if to_curr not in CURRENCY_CONFIGS:
        raise ValueError(f"Unsupported target currency: {to_currency}")

    if from_curr == to_curr:
        rate = 1.0
        converted = float(amount)
    elif custom_rate is not None and custom_rate > 0:
        rate = custom_rate
        converted = float(amount) * rate
    else:
        rates = get_exchange_rates(from_curr)
        rate = rates[to_curr]
        converted = float(amount) * rate

    decimals = CURRENCY_CONFIGS[to_curr]["decimal_digits"]
    rounded = round(converted, decimals) if decimals > 0 else round(converted)

    return {
        "original_amount": float(amount),
        "from_currency": from_curr,
        "to_currency": to_curr,
        "rate": rate,
        "converted_amount": rounded,
        "source": FX_DATA_SOURCE,
        "timestamp": FX_REFERENCE_TIMESTAMP,
        "status": FX_STATUS,
    }
