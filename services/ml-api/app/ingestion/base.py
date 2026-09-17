import abc
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class RawPayload(BaseModel):
    source_id: str
    payload: Dict[str, Any]
    checksum: str
    retrieval_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_timestamp: Optional[datetime] = None

class NormalizedObservation(BaseModel):
    entity_type: str  # route, port, vessel, market_index, commodity, weather, macro, canal
    entity_id: str
    metric_name: str
    value: float
    unit: str
    observation_timestamp: datetime
    source_id: str
    raw_checksum: str
    quality_score: float = 1.0
    quarantined: bool = False
    quarantine_reason: Optional[str] = None
    extra_attributes: Dict[str, Any] = Field(default_factory=dict)

class IngestionResult(BaseModel):
    source_id: str
    status: str  # completed, failed, partial
    records_ingested: int = 0
    records_quarantined: int = 0
    duration_ms: int = 0
    error_message: Optional[str] = None
    observations: List[NormalizedObservation] = Field(default_factory=list)

class BaseConnector(abc.ABC):
    """Abstract base class for all authoritative FreightSense data connectors."""

    def __init__(self, source_id: str, name: str, access_type: str, auth_required: bool = False):
        self.source_id = source_id
        self.name = name
        self.access_type = access_type
        self.auth_required = auth_required
        self.raw_store: List[RawPayload] = []
        self.normalized_store: List[NormalizedObservation] = []

    @abc.abstractmethod
    def fetch(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch raw data from upstream API or fallback fixture."""
        pass

    @abc.abstractmethod
    def parse(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse raw responses into intermediate structured items."""
        pass

    @abc.abstractmethod
    def normalize(self, parsed_items: List[Dict[str, Any]]) -> List[NormalizedObservation]:
        """Normalize parsed items into FreightSense canonical observations."""
        pass

    def validate(self, observations: List[NormalizedObservation]) -> List[NormalizedObservation]:
        """Apply quality gates, range checks, and quarantine invalid entries."""
        from app.ingestion.validator import DataValidator
        return DataValidator.validate_observations(observations)

    def deduplicate(self, observations: List[NormalizedObservation]) -> List[NormalizedObservation]:
        """Deduplicate records using composite natural key hash."""
        seen = set()
        deduped = []
        for obs in observations:
            key = f"{obs.entity_type}:{obs.entity_id}:{obs.metric_name}:{obs.observation_timestamp.isoformat()}"
            if key not in seen:
                seen.add(key)
                deduped.append(obs)
        return deduped

    def enrich(self, observations: List[NormalizedObservation]) -> List[NormalizedObservation]:
        """Optional enrichment hook (e.g. currency conversion, standardized units)."""
        return observations

    def persist_raw(self, payloads: List[Dict[str, Any]]) -> None:
        """Persist raw response payloads with checksums."""
        for p in payloads:
            serialized = json.dumps(p, sort_keys=True, default=str).encode("utf-8")
            checksum = hashlib.sha256(serialized).hexdigest()
            raw_obj = RawPayload(
                source_id=self.source_id,
                payload=p,
                checksum=checksum,
                retrieval_timestamp=datetime.now(timezone.utc),
            )
            self.raw_store.append(raw_obj)

    def persist_normalized(self, observations: List[NormalizedObservation]) -> None:
        """Persist normalized observations to repository / memory buffer."""
        self.normalized_store.extend(observations)

    def record_ingestion_run(self, result: IngestionResult) -> None:
        """Record the ingestion execution metadata."""
        logger.info(
            "Ingestion run recorded for %s: status=%s, ingested=%d, quarantined=%d in %dms",
            result.source_id,
            result.status,
            result.records_ingested,
            result.records_quarantined,
            result.duration_ms,
        )

    def run(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> IngestionResult:
        """Full execution lifecycle."""
        start_time = datetime.now()
        try:
            raw_items = self.fetch(start_date=start_date, end_date=end_date)
            self.persist_raw(raw_items)
            parsed = self.parse(raw_items)
            normalized = self.normalize(parsed)
            validated = self.validate(normalized)
            deduped = self.deduplicate(validated)
            enriched = self.enrich(deduped)
            
            valid_records = [r for r in enriched if not r.quarantined]
            quarantined_records = [r for r in enriched if r.quarantined]
            
            self.persist_normalized(valid_records)

            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            res = IngestionResult(
                source_id=self.source_id,
                status="completed",
                records_ingested=len(valid_records),
                records_quarantined=len(quarantined_records),
                duration_ms=duration,
                observations=valid_records,
            )
            self.record_ingestion_run(res)
            return res
        except Exception as exc:
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            logger.exception("Ingestion failed for %s", self.source_id)
            res = IngestionResult(
                source_id=self.source_id,
                status="failed",
                records_ingested=0,
                records_quarantined=0,
                duration_ms=duration,
                error_message=str(exc),
            )
            self.record_ingestion_run(res)
            return res
