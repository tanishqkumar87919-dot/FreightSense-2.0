"""
FreightSense 2.0 — Foreign Exchange (FX) & Multi-Currency API Router.
Provides reference exchange rates, currency registry, and presentation conversion endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from app.domain.currency import (
    CURRENCY_CONFIGS,
    FX_DATA_SOURCE,
    FX_STATUS,
    FX_REFERENCE_TIMESTAMP,
    get_exchange_rates,
    convert_amount,
)

router = APIRouter(prefix="/fx", tags=["Foreign Exchange & Multi-Currency"])


@router.get("/currencies", summary="Get supported international trade currencies")
def get_supported_currencies() -> Dict[str, Any]:
    """Returns list of supported currencies and their display configurations."""
    return {
        "status": "success",
        "count": len(CURRENCY_CONFIGS),
        "currencies": list(CURRENCY_CONFIGS.values()),
        "base_currency": "USD",
    }


@router.get("/rates", summary="Get exchange rates (USD base)")
def get_rates(base_currency: str = Query("USD", description="Base currency code (e.g. USD)")) -> Dict[str, Any]:
    """
    Returns reference exchange rates relative to the requested base currency.
    Includes explicit data provenance status, authoritative source, and timestamp.
    """
    base = base_currency.upper()
    try:
        rates = get_exchange_rates(base)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "success",
        "base_currency": base,
        "rates": rates,
        "currencies_count": len(rates),
        "data_provenance": {
            "status": FX_STATUS,
            "source": FX_DATA_SOURCE,
            "timestamp": FX_REFERENCE_TIMESTAMP,
            "methodology": "International Financial Statistics (IFS) Cross-Currency Reference Benchmark",
            "is_live": False,
        },
    }


@router.get("/rates/{base_currency}", summary="Get exchange rates for specific base currency")
def get_rates_for_base(base_currency: str) -> Dict[str, Any]:
    """Path-parameter variant for retrieving exchange rates for a specific base currency."""
    return get_rates(base_currency=base_currency)


@router.get("/convert", summary="Convert amount between currencies")
def convert(
    amount: float = Query(..., description="Monetary amount to convert"),
    from_currency: str = Query("USD", description="Source currency code"),
    to_currency: str = Query("INR", description="Target currency code"),
    rate: Optional[float] = Query(None, description="Optional custom rate override"),
) -> Dict[str, Any]:
    """
    Convert a monetary value from one currency to another using reference rates.
    Preserves numerical accuracy, sign, and attaches provenance metadata.
    """
    try:
        result = convert_amount(
            amount=amount,
            from_currency=from_currency,
            to_currency=to_currency,
            custom_rate=rate,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "success",
        "conversion": result,
    }
