import os
import logging
from typing import Any, Dict, List, Optional
from app.ingestion.base import BaseConnector, NormalizedObservation
from app.ingestion.target_schema import AuthorizedFreightTargetRecord
from app.ingestion.target_loader import TargetFreightDataLoader

logger = logging.getLogger("connector_scfi")


class SCFIConnector(BaseConnector):
    """
    Shanghai Shipping Exchange (SCFI / CCFI) Ingestion Connector.
    
    Target Dataset Interface:
    - Ingests authorized historical spot freight rates and containerized freight index assessments
      (e.g., SCFI Shanghai-Europe, Shanghai-US West Coast, Shanghai-US East Coast).
    - Supports batch import from authorized CSV/JSON files, data drops, or licensed API feeds.
    - If unconfigured, cleanly returns an empty list without fabricating any synthetic data.
    - Preserves exact historical ground truth without proxy substitution.
    """

    def __init__(self, dataset_path: Optional[str] = None):
        super().__init__(
            source_id="src-shanghai-shipping-exchange",
            name="Shanghai Shipping Exchange (SCFI)",
            access_type="authorized_exchange",
            auth_required=False,
        )
        self.dataset_path = dataset_path or os.getenv("SCFI_DATASET_PATH")

    def is_configured(self) -> bool:
        """Returns True if an authorized dataset file exists on disk."""
        return bool(self.dataset_path and os.path.exists(self.dataset_path))

    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves authorized historical records from configured storage or returns empty list.
        Never generates synthetic observations.
        """
        if not self.is_configured():
            logger.info(
                "SCFI Connector: No authorized dataset file found at SCFI_DATASET_PATH (%s). "
                "Connector is staged and waiting for authorized historical dataset.",
                self.dataset_path
            )
            return []

        logger.info("SCFI Connector: Loading authorized historical dataset from %s", self.dataset_path)
        records = TargetFreightDataLoader.load_from_csv(
            self.dataset_path,
            default_source="Shanghai Shipping Exchange",
            default_dataset="SCFI Route Spot Rate Assessments",
            default_license="authorized_exchange",
        )
        return [r.to_dict() for r in records]

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return raw_data

    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        """Maps parsed records into canonical NormalizedObservation objects for historical_observations."""
        target_records = TargetFreightDataLoader.load_from_dict_list(
            parsed_items,
            default_source="Shanghai Shipping Exchange",
            default_dataset="SCFI Route Spot Rate Assessments",
            default_license="authorized_exchange",
        )
        observations = []
        for rec in target_records:
            obs = rec.to_normalized_observation()
            obs.extra_attributes["is_authorized_truth"] = True
            observations.append(obs)
        return observations

    def ingest_authorized_csv_content(self, csv_content: str) -> List[NormalizedObservation]:
        """Direct programmatic ingestion helper for authorized CSV string content."""
        target_records = TargetFreightDataLoader.load_from_csv(
            csv_content,
            default_source="Shanghai Shipping Exchange",
            default_dataset="SCFI Route Spot Rate Assessments",
            default_license="authorized_exchange",
        )
        return [r.to_normalized_observation() for r in target_records]
