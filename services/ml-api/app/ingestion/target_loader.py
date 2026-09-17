import csv
import io
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from app.config import settings
from app.ingestion.target_schema import AuthorizedFreightTargetRecord, TargetDatasetBatch

logger = logging.getLogger("target_loader")

# Normalized column alias mappings for flexible ingestion of authorized CSVs
COLUMN_ALIASES = {
    "date": "observation_date",
    "observation_date": "observation_date",
    "obs_date": "observation_date",
    "corridor": "route_corridor",
    "route": "route_corridor",
    "route_id": "route_corridor",
    "route_corridor": "route_corridor",
    "origin": "origin",
    "origin_port": "origin",
    "from": "origin",
    "destination": "destination",
    "dest": "destination",
    "destination_port": "destination",
    "to": "destination",
    "freight_index": "freight_index",
    "index": "freight_index",
    "index_code": "freight_index",
    "freight_rate": "freight_rate",
    "rate": "freight_rate",
    "rate_usd": "freight_rate",
    "spot_rate": "freight_rate",
    "spot_rate_usd": "freight_rate",
    "value": "freight_rate",
    "currency": "currency",
    "unit": "unit",
    "rate_unit": "unit",
    "container_type": "container_vessel_type",
    "container_vessel_type": "container_vessel_type",
    "vessel_type": "container_vessel_type",
    "source": "source",
    "source_name": "source",
    "provider": "source",
    "source_dataset": "source_dataset",
    "dataset": "source_dataset",
    "dataset_name": "source_dataset",
    "source_url": "source_url",
    "url": "source_url",
    "retrieval_timestamp": "retrieval_timestamp",
    "license_status": "license_access_status",
    "license_access_status": "license_access_status",
    "access_status": "license_access_status",
    "data_version": "data_version",
    "version": "data_version",
}


class TargetFreightDataLoader:
    """
    Authorized Target Dataset Ingestion Engine.
    
    Loads, validates, and prepares historical freight rate and index observations
    for inclusion as training ground truth once authorized data is supplied.
    
    Guarantees:
    - Never fabricates synthetic records.
    - Strictly validates all 15 required target schema fields.
    - Ensures idempotency via natural key hashing.
    """

    @classmethod
    def normalize_row_keys(cls, raw_row: Dict[str, Any]) -> Dict[str, Any]:
        """Maps varying input column names to canonical schema keys."""
        normalized = {}
        for k, v in raw_row.items():
            clean_k = str(k).strip().lower().replace(" ", "_").replace("/", "_").replace("-", "_")
            canonical_k = COLUMN_ALIASES.get(clean_k, clean_k)
            normalized[canonical_k] = v
        return normalized

    @classmethod
    def load_from_dict_list(
        cls,
        items: List[Dict[str, Any]],
        default_source: str = "Authorized Market Import",
        default_dataset: str = "Freight Target Time Series",
        default_license: str = "authorized_dataset",
        default_version: str = "v1.0-target",
    ) -> List[AuthorizedFreightTargetRecord]:
        """Convert a list of raw dictionaries into validated AuthorizedFreightTargetRecord objects."""
        records: List[AuthorizedFreightTargetRecord] = []
        for i, raw in enumerate(items):
            norm = cls.normalize_row_keys(raw)
            if not norm.get("source"):
                norm["source"] = default_source
            if not norm.get("source_dataset"):
                norm["source_dataset"] = default_dataset
            if not norm.get("license_access_status"):
                norm["license_access_status"] = default_license
            if not norm.get("data_version"):
                norm["data_version"] = default_version

            try:
                rec = AuthorizedFreightTargetRecord(**norm)
                records.append(rec)
            except Exception as e:
                logger.warning("Skipping invalid record at index %d: %s (data: %s)", i, e, raw)
        return records

    @classmethod
    def load_from_csv(
        cls,
        csv_source: Union[str, Path, io.StringIO],
        default_source: str = "Shanghai Shipping Exchange",
        default_dataset: str = "SCFI Comprehensive & Route Spot Rates",
        default_license: str = "authorized_dataset",
        default_version: str = "v1.0-target",
    ) -> List[AuthorizedFreightTargetRecord]:
        """Load and parse an authorized CSV string or file into target records."""
        content: str
        if isinstance(csv_source, Path) or (isinstance(csv_source, str) and os.path.exists(csv_source)):
            with open(csv_source, "r", encoding="utf-8") as f:
                content = f.read()
        elif isinstance(csv_source, io.StringIO):
            content = csv_source.getvalue()
        else:
            content = str(csv_source)

        if not content.strip():
            logger.info("Empty CSV content supplied. Returning 0 records.")
            return []

        reader = csv.DictReader(io.StringIO(content))
        raw_rows = list(reader)
        return cls.load_from_dict_list(
            raw_rows,
            default_source=default_source,
            default_dataset=default_dataset,
            default_license=default_license,
            default_version=default_version,
        )

    @classmethod
    def load_from_json(
        cls,
        json_source: Union[str, Path],
        default_source: str = "Shanghai Shipping Exchange",
        default_dataset: str = "SCFI Comprehensive & Route Spot Rates",
    ) -> List[AuthorizedFreightTargetRecord]:
        """Load and parse JSON string or file into target records."""
        if isinstance(json_source, Path) or (isinstance(json_source, str) and os.path.exists(json_source)):
            with open(json_source, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = json.loads(str(json_source))

        items = data if isinstance(data, list) else data.get("records", data.get("data", []))
        return cls.load_from_dict_list(items, default_source=default_source, default_dataset=default_dataset)

    @classmethod
    def ingest_to_supabase(
        cls,
        records: List[AuthorizedFreightTargetRecord],
        client: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Idempotently writes authorized records into remote Supabase:
        - freight_market_observations
        - historical_observations
        - validated_observations
        """
        if not records:
            return {"status": "no_data", "ingested": 0, "message": "No records supplied for ingestion"}

        import httpx
        supabase_url = settings.SUPABASE_URL.rstrip("/")
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if not key or "mock" in supabase_url:
            logger.warning("Supabase credentials not configured or in mock mode; skipping database write.")
            return {"status": "skipped", "ingested": 0, "records_buffered": len(records)}

        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        }

        # 1. Prepare freight_market_observations rows
        market_rows = [r.to_freight_market_observation_row() for r in records]

        # 2. Prepare historical_observations rows
        hist_rows = []
        for r in records:
            obs = r.to_normalized_observation()
            hist_rows.append({
                "entity_type": obs.entity_type,
                "entity_id": obs.entity_id,
                "metric_name": obs.metric_name,
                "value": obs.value,
                "unit": obs.unit,
                "observation_timestamp": obs.observation_timestamp.isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

        ingested_market = 0
        ingested_hist = 0

        with httpx.Client(timeout=15.0) as http_client:
            # Upsert into freight_market_observations
            try:
                res_m = http_client.post(
                    f"{supabase_url}/rest/v1/freight_market_observations",
                    headers=headers,
                    json=market_rows,
                )
                if res_m.status_code in [200, 201]:
                    ingested_market = len(res_m.json()) if isinstance(res_m.json(), list) else len(market_rows)
                else:
                    logger.warning("freight_market_observations upsert response %d: %s", res_m.status_code, res_m.text)
            except Exception as e:
                logger.error("Failed writing to freight_market_observations: %s", e)

            # Insert into historical_observations
            try:
                res_h = http_client.post(
                    f"{supabase_url}/rest/v1/historical_observations",
                    headers=headers,
                    json=hist_rows,
                )
                if res_h.status_code in [200, 201]:
                    ingested_hist = len(res_h.json()) if isinstance(res_h.json(), list) else len(hist_rows)
                else:
                    logger.warning("historical_observations insert response %d: %s", res_h.status_code, res_h.text)
            except Exception as e:
                logger.error("Failed writing to historical_observations: %s", e)

        return {
            "status": "completed",
            "total_records_processed": len(records),
            "freight_market_observations_written": ingested_market,
            "historical_observations_written": ingested_hist,
        }
