import pytest
from datetime import date
from app.ingestion.import_india_data import normalize_port_id, validate_indian_records


def test_port_id_normalization():
    """Verify that colloquial and official Indian port names map to normalized IDs."""
    assert normalize_port_id("Paradip") == "india-paradip"
    assert normalize_port_id("paradip port") == "india-paradip"
    assert normalize_port_id("Visakhapatnam") == "india-visakhapatnam"
    assert normalize_port_id("Vizag") == "india-visakhapatnam"
    assert normalize_port_id("Kamarajar Port (Ennore)") == "india-kamarajar"
    assert normalize_port_id("Ennore") == "india-kamarajar"
    assert normalize_port_id("Chennai Port") == "india-chennai"
    assert normalize_port_id("Madras") == "india-chennai"
    assert normalize_port_id("V.O. Chidambaranar") == "india-vocpt"
    assert normalize_port_id("Tuticorin") == "india-vocpt"
    assert normalize_port_id("Syama Prasad Mookerjee Port") == "india-kolkata-haldia"
    assert normalize_port_id("Haldia") == "india-kolkata-haldia"
    assert normalize_port_id("NonExistentPort") is None


def test_validation_detects_bad_records():
    """Verify that invalid dates or negative tonnage are quarantined."""
    sample_records = [
        {
            "observation_date": "2024-04-01",
            "port_name": "Paradip Port",
            "total_cargo_tonnes": 11500000,
            "container_traffic_teu": 4200,
        },
        {
            "observation_date": "invalid-date",
            "port_name": "Paradip Port",
            "total_cargo_tonnes": 10000,
        },
        {
            "observation_date": "2024-04-01",
            "port_name": "Paradip Port",
            "total_cargo_tonnes": -500,  # Negative tonnage
        },
        {
            "observation_date": "2024-04-01",
            "port_name": "Unknown Fake Port",
            "total_cargo_tonnes": 100000,
        },
    ]

    valid, rejected, stats = validate_indian_records(sample_records)
    assert len(valid) == 1
    assert len(rejected) == 3
    assert stats["ports_covered"] == ["india-paradip"]


def test_monthly_records_deduplication():
    """Verify deduplication by (port_id, date)."""
    sample_records = [
        {
            "observation_date": "2024-05-01",
            "port_name": "Chennai Port",
            "total_cargo_tonnes": 4200000,
            "container_traffic_teu": 125000,
        },
        {
            "observation_date": "2024-05-01",
            "port_name": "Chennai Port",
            "total_cargo_tonnes": 4200000,
            "container_traffic_teu": 125000,
        },
    ]

    valid, rejected, stats = validate_indian_records(sample_records)
    assert len(valid) == 1
    assert stats["duplicates_removed"] == 1


def test_freight_target_isolation():
    """Verify that adding Indian maritime features did NOT overwrite the freight target table."""
    from app.config import settings
    import httpx

    url = settings.SUPABASE_URL.rstrip("/")
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not key or "mock" in url:
        pytest.skip("Supabase not configured")

    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Range": "0-0", "Prefer": "count=exact"}
    res = httpx.get(f"{url}/rest/v1/freight_market_observations?select=id", headers=headers)
    assert res.status_code in [200, 206]
    # SCFI target must remain exactly 570 records
    assert res.headers.get("content-range") == "0-0/570"

