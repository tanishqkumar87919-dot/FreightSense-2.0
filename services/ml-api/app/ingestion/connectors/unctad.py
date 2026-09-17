import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation

class UnctadConnector(BaseConnector):
    """UNCTAD Data Hub Connector for Maritime Transport & Liner Connectivity (LSCI)."""

    def __init__(self):
        super().__init__(
            source_id="src-unctad",
            name="UNCTAD Data Hub",
            access_type="public",
            auth_required=False,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/unctad_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            country = item.get("country", "GLOBAL")
            period = item.get("period", "2024-Q1")
            
            # Map quarterly period to date
            year, q = period.split("-")
            month = 1 if q == "Q1" else (4 if q == "Q2" else (7 if q == "Q3" else 10))
            obs_date = datetime(int(year), month, 1, tzinfo=timezone.utc)

            # LSCI
            observations.append(
                NormalizedObservation(
                    entity_type="macro",
                    entity_id=f"unctad:lsci:{country}",
                    metric_name="liner_connectivity_index",
                    value=float(item.get("lsci", 100.0)),
                    unit="index_points",
                    observation_timestamp=obs_date,
                    source_id=self.source_id,
                    raw_checksum="",
                    extra_attributes={"country": country, "period": period},
                )
            )

            # Fleet DWT
            if "fleet_dwt_k" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="macro",
                        entity_id=f"unctad:fleet_dwt:{country}",
                        metric_name="merchant_fleet_dwt_k",
                        value=float(item["fleet_dwt_k"]),
                        unit="thousand_dwt",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                        extra_attributes={"country": country, "period": period},
                    )
                )
        return observations
