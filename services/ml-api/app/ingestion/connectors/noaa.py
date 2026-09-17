import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from dateutil import parser
from app.ingestion.base import BaseConnector, NormalizedObservation

class NoaaConnector(BaseConnector):
    """NOAA NCEI & CoastWatch ERDDAP Marine Weather & Sea-State Connector."""

    def __init__(self):
        super().__init__(
            source_id="src-noaa-erddap",
            name="NOAA Marine & Ocean Telemetry",
            access_type="public",
            auth_required=False,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/noaa_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            station_id = item.get("station_id", "STATION-UNKNOWN")
            timestamp_str = item.get("timestamp", "2024-09-01T12:00:00Z")
            obs_date = parser.parse(timestamp_str)
            if obs_date.tzinfo is None:
                obs_date = obs_date.replace(tzinfo=timezone.utc)

            lat = float(item.get("lat", 0.0))
            lon = float(item.get("lon", 0.0))

            # Wave Height
            if "wave_height_m" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="weather",
                        entity_id=f"station:{station_id}",
                        metric_name="wave_height_meters",
                        value=float(item["wave_height_m"]),
                        unit="meters",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                        extra_attributes={"latitude": lat, "longitude": lon, "location": item.get("location")},
                    )
                )

            # Wind Speed
            if "wind_speed_kts" in item:
                observations.append(
                    NormalizedObservation(
                        entity_type="weather",
                        entity_id=f"station:{station_id}",
                        metric_name="wind_speed_knots",
                        value=float(item["wind_speed_kts"]),
                        unit="knots",
                        observation_timestamp=obs_date,
                        source_id=self.source_id,
                        raw_checksum="",
                        extra_attributes={"latitude": lat, "longitude": lon, "location": item.get("location")},
                    )
                )
        return observations
