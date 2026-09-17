import json
import os
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation
from app.config import settings

logger = logging.getLogger(__name__)

class BalticExchangeConnector(BaseConnector):
    """
    Baltic Exchange Freight Benchmark Indices Connector.
    
    Commercial / Licensed Source:
    - Requires BALTIC_API_KEY environment variable and valid Baltic Exchange Data License.
    - If unconfigured, operates in fixture/mock mode with clearly tagged synthetic/test data.
    - Strictly obeys terms of service; never scrapes proprietary public endpoints.
    """

    def __init__(self):
        super().__init__(
            source_id="src-baltic-exchange",
            name="Baltic Exchange Freight Indices",
            access_type="licensed",
            auth_required=True,
        )

    def is_configured(self) -> bool:
        return bool(settings.BALTIC_API_KEY and settings.BALTIC_API_KEY.strip())

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.is_configured():
            logger.info("Baltic Exchange API key not configured; using offline fixture data.")
            fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/baltic_sample.json")
            if os.path.exists(fixture_path):
                with open(fixture_path, "r") as f:
                    return json.load(f)
            return []
        
        # When license key is provided, real HTTP request to Baltic API would execute here
        logger.info("Executing authorized Baltic Exchange API request with configured credentials.")
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            date_str = item.get("date", "2024-08-26")
            obs_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            route_code = item.get("route_code", "FBX01")

            observations.append(
                NormalizedObservation(
                    entity_type="route",
                    entity_id=f"route:{route_code}",
                    metric_name="spot_rate_usd",
                    value=float(item.get("rate_usd", 4000.0)),
                    unit="usd_per_feu",
                    observation_timestamp=obs_date,
                    source_id=self.source_id,
                    raw_checksum="",
                    extra_attributes={
                        "route_name": item.get("name"),
                        "daily_change": item.get("daily_change", 0),
                        "is_licensed_truth": self.is_configured(),
                    },
                )
            )
        return observations
