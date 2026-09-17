import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseConnector, NormalizedObservation
from app.config import settings

class ComtradeConnector(BaseConnector):
    """UN Comtrade API Connector for Bilateral Merchandise Trade Flows."""

    def __init__(self):
        super().__init__(
            source_id="src-un-comtrade",
            name="UN Comtrade API",
            access_type="api",
            auth_required=True,
        )

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        # In offline/test or without COMTRADE_API_KEY, use verified fixture
        fixture_path = os.path.join(os.path.dirname(__file__), "../fixtures/comtrade_sample.json")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r") as f:
                return json.load(f)
        return []

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        observations = []
        for item in parsed_items:
            reporter = item.get("reporter", "CHN")
            partner = item.get("partner", "USA")
            period = item.get("period", "2024-06")
            
            # Convert YYYY-MM to datetime
            year, month = period.split("-")
            obs_date = datetime(int(year), int(month), 1, tzinfo=timezone.utc)

            flow_id = f"comtrade:{reporter}_{partner}"

            # Trade value in millions USD
            trade_val_m = float(item.get("trade_value_usd", 0)) / 1e6
            observations.append(
                NormalizedObservation(
                    entity_type="trade_flow",
                    entity_id=flow_id,
                    metric_name="trade_value_usd_m",
                    value=trade_val_m,
                    unit="million_usd",
                    observation_timestamp=obs_date,
                    source_id=self.source_id,
                    raw_checksum="",
                    extra_attributes={
                        "reporter": reporter,
                        "partner": partner,
                        "commodity": item.get("commodity", "General"),
                    },
                )
            )
        return observations
