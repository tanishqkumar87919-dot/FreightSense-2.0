import json
import os
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation
from app.config import settings

logger = logging.getLogger(__name__)

class FredConnector(BaseConnector):
    """FRED Economic Data Connector (Federal Reserve Bank of St. Louis)."""

    def __init__(self):
        super().__init__(
            source_id="src-fred",
            name="FRED Economic Data",
            access_type="api",
            auth_required=True,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/fred_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            date_str = item.get("date", "2024-08-01")
            obs_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            series_id = item.get("series_id", "FRED")

            observations.append(
                NormalizedObservation(
                    entity_type="macro",
                    entity_id=f"fred:{series_id}",
                    metric_name=series_id.lower(),
                    value=float(item.get("value", 0.0)),
                    unit="index_or_usd",
                    observation_timestamp=obs_date,
                    source_id=self.source_id,
                    raw_checksum="",
                    extra_attributes={"series_name": item.get("name")},
                )
            )
        return observations
