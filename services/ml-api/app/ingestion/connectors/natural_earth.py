import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation

class NaturalEarthConnector(BaseConnector):
    """Natural Earth Global Ports Reference Connector."""

    def __init__(self):
        super().__init__(
            source_id="src-natural-earth",
            name="Natural Earth Global Ports",
            access_type="public",
            auth_required=False,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/natural_earth_ports.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        static_timestamp = datetime(2024, 1, 1, tzinfo=timezone.utc)
        for port in parsed_items:
            code = port.get("code", "PORT")
            lat = float(port.get("lat", 0.0))
            lon = float(port.get("lon", 0.0))

            observations.append(
                NormalizedObservation(
                    entity_type="port",
                    entity_id=f"port:{code}",
                    metric_name="port_reference_rank",
                    value=float(port.get("scale_rank", 1.0)),
                    unit="scale_rank",
                    observation_timestamp=static_timestamp,
                    source_id=self.source_id,
                    raw_checksum="",
                    extra_attributes={
                        "port_name": port.get("port_name"),
                        "country": port.get("country"),
                        "latitude": lat,
                        "longitude": lon,
                    },
                )
            )
        return observations
