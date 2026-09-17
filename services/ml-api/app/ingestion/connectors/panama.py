import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation

class PanamaCanalConnector(BaseConnector):
    """Panama Canal Authority (ACP) Transit Statistics Connector."""

    def __init__(self):
        super().__init__(
            source_id="src-panama-canal",
            name="Panama Canal Statistics",
            access_type="public",
            auth_required=False,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/panama_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            month_str = item.get("month", "2024-05")
            year, m = month_str.split("-")
            obs_date = datetime(int(year), int(m), 1, tzinfo=timezone.utc)

            # Commercial transits
            if "oceangoing_transits" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="canal",
                        entity_id="canal:panama",
                        metric_name="canal_transits_monthly",
                        value=float(item["oceangoing_transits"]),
                        unit="vessels_per_month",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                        extra_attributes={
                            "neopanamax_transits": item.get("neopanamax_transits"),
                            "net_tonnage_k": item.get("net_tonnage_k"),
                        },
                    )
                )

            # Max draft restrictions
            if "max_draft_ft" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="canal",
                        entity_id="canal:panama",
                        metric_name="canal_max_draft_feet",
                        value=float(item["max_draft_ft"]),
                        unit="feet",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                    )
                )
        return observations
