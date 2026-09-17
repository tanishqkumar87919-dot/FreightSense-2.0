import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation

class WorldBankConnector(BaseConnector):
    """World Bank Pink Sheet Commodity Prices & Indicators Connector."""

    def __init__(self):
        super().__init__(
            source_id="src-worldbank-pink",
            name="World Bank Commodity Pink Sheet",
            access_type="public",
            auth_required=False,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/worldbank_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            date_str = item.get("date", "2024-05")
            year, month = date_str.split("-")
            obs_date = datetime(int(year), int(month), 1, tzinfo=timezone.utc)

            # Crude Brent
            if "crude_brent_usd" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="commodity",
                        entity_id="commodity:oil:brent",
                        metric_name="crude_oil_usd",
                        value=float(item["crude_brent_usd"]),
                        unit="usd_per_bbl",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                    )
                )

            # Natural Gas
            if "natural_gas_us_usd" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="commodity",
                        entity_id="commodity:gas:henry_hub",
                        metric_name="natural_gas_price_usd",
                        value=float(item["natural_gas_us_usd"]),
                        unit="usd_per_mmbtu",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                    )
                )
        return observations
