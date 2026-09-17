import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation

class EiaConnector(BaseConnector):
    """U.S. Energy Information Administration (EIA) Bunker Fuel Connector."""

    def __init__(self):
        super().__init__(
            source_id="src-eia",
            name="U.S. EIA Energy Statistics",
            access_type="api",
            auth_required=True,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/eia_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            period = item.get("period", "2024-08")
            year, month = period.split("-")
            obs_date = datetime(int(year), int(month), 1, tzinfo=timezone.utc)
            loc = item.get("location", "Rotterdam")

            observations.append(
                NormalizedObservation(
                    entity_type="commodity",
                    entity_id=f"eia:vlsfo:{loc.lower()}",
                    metric_name="bunker_fuel_usd",
                    value=float(item.get("price_usd_mt", 600.0)),
                    unit="usd_per_mt",
                    observation_timestamp=obs_date,
                    source_id=self.source_id,
                    raw_checksum="",
                    extra_attributes={"location": loc, "product": item.get("product")},
                )
            )
        return observations
