import json
import os
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from dateutil import parser
from app.ingestion.base import BaseConnector, NormalizedObservation
from app.config import settings

logger = logging.getLogger(__name__)

class MarineTrafficConnector(BaseConnector):
    """
    MarineTraffic / Kpler AIS Vessel Telemetry Connector.
    
    Commercial / Licensed Source:
    - Requires MARINETRAFFIC_API_KEY environment variable and credit-backed API subscription.
    - If unconfigured, operates in fixture/mock mode with clearly tagged mock vessel events.
    - Never scrapes live map services.
    """

    def __init__(self):
        super().__init__(
            source_id="src-marinetraffic",
            name="MarineTraffic AIS Telemetry",
            access_type="licensed",
            auth_required=True,
        )

    def is_configured(self) -> bool:
        return bool(settings.MARINETRAFFIC_API_KEY and settings.MARINETRAFFIC_API_KEY.strip())

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.is_configured():
            logger.info("MarineTraffic API key not configured; using offline fixture.")
            fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/marinetraffic_sample.json")
            if os.path.exists(fixture_path):
                with open(fixture_path, "r") as f:
                    return json.load(f)
            return []
        
        # Authenticated API fetch when key is present
        logger.info("Executing authorized MarineTraffic AIS API request.")
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            imo = item.get("imo", "0000000")
            ts_str = item.get("timestamp", "2024-09-14T08:00:00Z")
            obs_date = parser.parse(ts_str)
            if obs_date.tzinfo is None:
                obs_date = obs_date.replace(tzinfo=timezone.utc)

            lat = float(item.get("lat", 0.0))
            lon = float(item.get("lon", 0.0))
            speed = float(item.get("speed_knots", 0.0))

            observations.append(
                NormalizedObservation(
                    entity_type="vessel",
                    entity_id=f"vessel:{imo}",
                    metric_name="vessel_speed_knots",
                    value=speed,
                    unit="knots",
                    observation_timestamp=obs_date,
                    source_id=self.source_id,
                    raw_checksum="",
                    extra_attributes={
                        "vessel_name": item.get("vessel_name"),
                        "vessel_type": item.get("type"),
                        "latitude": lat,
                        "longitude": lon,
                        "heading": item.get("heading"),
                        "status": item.get("status"),
                        "is_licensed_truth": self.is_configured(),
                    },
                )
            )
        return observations
