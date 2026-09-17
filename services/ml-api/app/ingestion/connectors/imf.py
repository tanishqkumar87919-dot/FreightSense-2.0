import json
import os
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation

logger = logging.getLogger(__name__)

class ImfConnector(BaseConnector):
    """IMF Data APIs Connector for Direction of Trade Statistics (DOTS) & World Economic Outlook (WEO)."""

    def __init__(self):
        super().__init__(
            source_id="src-imf",
            name="IMF Data APIs",
            access_type="public",
            auth_required=False,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/imf_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            period = item.get("period", "2024-05")
            try:
                parts = period.split("-")
                obs_date = datetime(int(parts[0]), int(parts[1]), 1, tzinfo=timezone.utc)
            except Exception:
                obs_date = datetime(2024, 1, 1, tzinfo=timezone.utc)

            country = item.get("country", "CHN")
            partner = item.get("partner", "USA")

            if "exports_usd_m" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="macro",
                        entity_id=f"imf:dots:{country}:{partner}:exports",
                        metric_name="trade_value_usd_m",
                        value=float(item["exports_usd_m"]),
                        unit="usd_millions",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                        extra_attributes={"country": country, "partner": partner, "flow": "exports"},
                    )
                )

            if "imports_usd_m" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="macro",
                        entity_id=f"imf:dots:{country}:{partner}:imports",
                        metric_name="trade_value_usd_m",
                        value=float(item["imports_usd_m"]),
                        unit="usd_millions",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                        extra_attributes={"country": country, "partner": partner, "flow": "imports"},
                    )
                )

            if "balance_usd_m" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="macro",
                        entity_id=f"imf:dots:{country}:{partner}:balance",
                        metric_name="trade_balance_usd_m",
                        value=float(item["balance_usd_m"]),
                        unit="usd_millions",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                        extra_attributes={"country": country, "partner": partner, "flow": "balance"},
                    )
                )

        return observations
