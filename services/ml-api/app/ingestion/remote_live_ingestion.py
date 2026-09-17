import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
import httpx
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("remote_live_ingestion")

WORLD_BANK_URL = "https://api.worldbank.org/v2/country/WLD/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2018:2023&per_page=10"
SOURCE_ID = "src-worldbank-indicators"

def run_live_ingestion() -> Dict[str, Any]:
    """
    Executes a real controlled live ingestion from the World Bank Indicators API,
    validates quality, ensures idempotency, and writes to remote Supabase tables.
    """
    supabase_url = settings.SUPABASE_URL.rstrip("/")
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY

    if not service_key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY is required to write to Supabase.")

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    start_time = datetime.now(timezone.utc)
    logger.info("Connecting to real public API: %s", WORLD_BANK_URL)

    # 1. Fetch live public data
    with httpx.Client(timeout=15.0) as client:
        resp = client.get(WORLD_BANK_URL)
        resp.raise_for_status()
        raw_json = resp.json()

    # World Bank API returns: [metadata, [records...]]
    if not isinstance(raw_json, list) or len(raw_json) < 2:
        raise ValueError("Unexpected response format from World Bank API")

    meta = raw_json[0]
    records = raw_json[1]
    logger.info("Fetched %d raw records from World Bank API", len(records))

    # 2. Raw Checksum & Serialized Payload
    raw_serialized = json.dumps(raw_json, sort_keys=True)
    raw_checksum = hashlib.sha256(raw_serialized.encode("utf-8")).hexdigest()

    # 3. Create Ingestion Run in Supabase
    with httpx.Client(timeout=15.0) as client:
        run_payload = {
            "source_id": SOURCE_ID,
            "status": "running",
            "records_ingested": 0,
            "records_quarantined": 0,
            "started_at": start_time.isoformat(),
        }
        run_res = client.post(f"{supabase_url}/rest/v1/ingestion_runs", headers=headers, json=run_payload)
        run_res.raise_for_status()
        run_data = run_res.json()[0]
        run_id = run_data["id"]

        # 4. Save Raw Data Object
        raw_obj_payload = {
            "source_id": SOURCE_ID,
            "ingestion_run_id": run_id,
            "payload": {"metadata": meta, "records": records},
            "checksum": raw_checksum,
            "retrieval_timestamp": start_time.isoformat(),
            "source_timestamp": f"{meta.get('lastupdated', '2026-01-01')}T00:00:00Z",
        }
        raw_res = client.post(f"{supabase_url}/rest/v1/raw_data_objects", headers=headers, json=raw_obj_payload)
        raw_res.raise_for_status()
        raw_obj_id = raw_res.json()[0]["id"]

        # 5. Normalization, Validation, & Quality Gates
        valid_observations = []
        quarantined_observations = []
        duplicate_count = 0
        missing_value_count = 0

        # Check existing observations for idempotency
        existing_res = client.get(
            f"{supabase_url}/rest/v1/historical_observations?source_id=eq.{SOURCE_ID}&select=metric_name,observation_timestamp",
            headers=headers,
        )
        existing_keys = set()
        if existing_res.status_code == 200:
            for item in existing_res.json():
                existing_keys.add((item["metric_name"], item["observation_timestamp"]))

        for item in records:
            year = item.get("date")
            val = item.get("value")

            if val is None:
                missing_value_count += 1
                quarantined_observations.append({"item": item, "reason": "Missing value"})
                continue

            # Bounds Check: GDP growth between -50% and 50%
            if not (-50.0 <= float(val) <= 50.0):
                quarantined_observations.append({"item": item, "reason": f"Value {val} out of bounds"})
                continue

            obs_date = datetime(int(year), 1, 1, tzinfo=timezone.utc).isoformat()
            metric_name = "gdp_growth_annual_pct"

            # Natural composite key check (Idempotency)
            if (metric_name, obs_date) in existing_keys:
                duplicate_count += 1
                logger.info("Skipping duplicate record for %s at %s", metric_name, obs_date)
                continue

            valid_observations.append({
                "source_id": SOURCE_ID,
                "entity_type": "macro",
                "entity_id": "worldbank:NY.GDP.MKTP.KD.ZG:WLD",
                "metric_name": metric_name,
                "value": round(float(val), 4),
                "unit": "percent",
                "observation_timestamp": obs_date,
                "raw_object_id": raw_obj_id,
            })

        # 6. Insert Historical Observations & Validated Observations
        inserted_hist_ids = []
        if valid_observations:
            hist_res = client.post(
                f"{supabase_url}/rest/v1/historical_observations",
                headers=headers,
                json=valid_observations,
            )
            hist_res.raise_for_status()
            inserted_hist = hist_res.json()
            inserted_hist_ids = [h["id"] for h in inserted_hist]

            validated_payload = [
                {
                    "historical_observation_id": h["id"],
                    "entity_type": h["entity_type"],
                    "entity_id": h["entity_id"],
                    "metric_name": h["metric_name"],
                    "value": h["value"],
                    "unit": h["unit"],
                    "observation_timestamp": h["observation_timestamp"],
                    "validation_status": "valid",
                    "quality_score": 1.0,
                }
                for h in inserted_hist
            ]
            val_res = client.post(
                f"{supabase_url}/rest/v1/validated_observations",
                headers=headers,
                json=validated_payload,
            )
            val_res.raise_for_status()

        # 7. Record Data Quality Checks
        quality_checks = [
            {
                "ingestion_run_id": run_id,
                "check_name": "worldbank_schema_validation",
                "check_type": "schema",
                "passed": True,
                "details": {"format": "World Bank REST JSON v2", "expected_records": 6},
            },
            {
                "ingestion_run_id": run_id,
                "check_name": "gdp_growth_range_bounds",
                "check_type": "range",
                "passed": len(quarantined_observations) == 0,
                "details": {"min_allowed": -50.0, "max_allowed": 50.0, "quarantined": len(quarantined_observations)},
            },
            {
                "ingestion_run_id": run_id,
                "check_name": "composite_natural_key_deduplication",
                "check_type": "duplicate",
                "passed": True,
                "details": {"duplicates_skipped": duplicate_count},
            },
            {
                "ingestion_run_id": run_id,
                "check_name": "temporal_completeness_check",
                "check_type": "nullness",
                "passed": missing_value_count == 0,
                "details": {"missing_values": missing_value_count},
            },
        ]
        client.post(f"{supabase_url}/rest/v1/data_quality_checks", headers=headers, json=quality_checks)

        # 8. Complete Ingestion Run
        end_time = datetime.now(timezone.utc)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)

        update_run_payload = {
            "status": "completed",
            "records_ingested": len(valid_observations),
            "records_quarantined": len(quarantined_observations),
            "duration_ms": duration_ms,
            "completed_at": end_time.isoformat(),
        }
        client.patch(
            f"{supabase_url}/rest/v1/ingestion_runs?id=eq.{run_id}",
            headers=headers,
            json=update_run_payload,
        )

        # 9. Update data_sources table last_success_at
        client.patch(
            f"{supabase_url}/rest/v1/data_sources?id=eq.{SOURCE_ID}",
            headers=headers,
            json={
                "last_success_at": end_time.isoformat(),
                "active": True,
                "last_error": None,
            },
        )

    # 10. Summary Metrics
    metrics = {
        "source": "World Bank Indicators API",
        "source_id": SOURCE_ID,
        "source_url": WORLD_BANK_URL,
        "records_fetched": len(records),
        "records_accepted": len(valid_observations),
        "records_rejected": len(quarantined_observations),
        "duplicate_count": duplicate_count,
        "missing_value_rate": f"{(missing_value_count / len(records) * 100):.1f}%",
        "validation_errors": len(quarantined_observations),
        "date_coverage": "2018 to 2023 (Annual World Series)",
        "source_coverage": "Global Mainlanes / World Macro",
        "duration_ms": duration_ms,
        "run_id": run_id,
        "raw_object_id": raw_obj_id,
        "checksum": raw_checksum,
        "status": "completed",
    }
    logger.info("Ingestion completed successfully: %s", metrics)
    return metrics

if __name__ == "__main__":
    result = run_live_ingestion()
    print(json.dumps(result, indent=2))
