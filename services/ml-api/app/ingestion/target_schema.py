import json
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, Field, field_validator


class AuthorizedFreightTargetRecord(BaseModel):
    """
    Formal schema specification for authoritative historical freight rate and index observations.
    
    Supports:
    - observation_date
    - route/corridor (route_corridor)
    - origin
    - destination
    - freight_index
    - freight_rate
    - currency
    - unit
    - container/vessel type (container_vessel_type)
    - source
    - source_dataset
    - source_url
    - retrieval_timestamp
    - license/access status (license_access_status)
    - data_version
    """

    observation_date: date = Field(..., description="Date of market observation (YYYY-MM-DD)")
    route_corridor: str = Field(..., min_length=2, description="Route/Corridor identifier, e.g. route-sha-rot, Shanghai-Rotterdam")
    origin: str = Field(..., min_length=2, description="Origin port or geographical hub, e.g. Shanghai, CNSHA")
    destination: str = Field(..., min_length=2, description="Destination port or region, e.g. Rotterdam, NLRTM")
    freight_index: str = Field(..., min_length=2, description="Freight benchmark or index code, e.g. SCFI, CCFI, FBX01, WCI, BDI")
    freight_rate: float = Field(..., gt=0.0, description="Numerical freight rate or index assessment level, strictly positive")
    currency: str = Field(default="USD", description="Quotation currency, e.g. USD, EUR, RMB")
    unit: str = Field(default="USD/FEU", description="Rate measurement unit, e.g. USD/FEU, USD/TEU, points, USD/Day")
    container_vessel_type: Optional[str] = Field(default="40ft Dry Container", description="Container or vessel specification")
    source: str = Field(..., min_length=2, description="Primary reporting organization, e.g. Shanghai Shipping Exchange, Baltic Exchange")
    source_dataset: str = Field(..., min_length=2, description="Dataset title or index series name")
    source_url: Optional[str] = Field(default=None, description="Official publication URL or authoritative data catalog link")
    retrieval_timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp when data was acquired/ingested"
    )
    license_access_status: str = Field(
        default="authorized_dataset",
        description="License and access clearance, e.g. authorized_historical_import, licensed_exchange, public_release"
    )
    data_version: str = Field(default="v1.0-target", description="Version identifier of the ingested target dataset")

    @field_validator("observation_date", mode="before")
    @classmethod
    def parse_date(cls, v: Any) -> date:
        if isinstance(v, date):
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            clean = v.split("T")[0].strip()
            return datetime.strptime(clean, "%Y-%m-%d").date()
        raise ValueError(f"Cannot parse observation_date from {v}")

    @field_validator("freight_rate")
    @classmethod
    def validate_rate(cls, v: float) -> float:
        if v <= 0.0:
            raise ValueError(f"freight_rate must be strictly positive (> 0.0), got {v}")
        return float(v)

    def to_dict(self) -> Dict[str, Any]:
        """Return canonical 15-field dictionary."""
        return {
            "observation_date": str(self.observation_date),
            "route/corridor": self.route_corridor,
            "origin": self.origin,
            "destination": self.destination,
            "freight_index": self.freight_index,
            "freight_rate": self.freight_rate,
            "currency": self.currency,
            "unit": self.unit,
            "container/vessel type": self.container_vessel_type,
            "source": self.source,
            "source_dataset": self.source_dataset,
            "source_url": self.source_url,
            "retrieval_timestamp": self.retrieval_timestamp.isoformat(),
            "license/access status": self.license_access_status,
            "data_version": self.data_version,
        }

    def to_normalized_observation(self, raw_checksum: str = ""):
        """Map to canonical NormalizedObservation for historical_observations table."""
        from app.ingestion.base import NormalizedObservation
        obs_dt = datetime.combine(self.observation_date, datetime.min.time(), tzinfo=timezone.utc)
        
        return NormalizedObservation(
            entity_type="route",
            entity_id=self.route_corridor,
            metric_name="spot_rate_usd",
            value=self.freight_rate,
            unit=self.unit,
            observation_timestamp=obs_dt,
            source_id=self.source,
            raw_checksum=raw_checksum,
            quality_score=1.0,
            quarantined=False,
            extra_attributes={
                "origin": self.origin,
                "destination": self.destination,
                "freight_index": self.freight_index,
                "currency": self.currency,
                "container_vessel_type": self.container_vessel_type,
                "source_dataset": self.source_dataset,
                "source_url": self.source_url,
                "license_access_status": self.license_access_status,
                "data_version": self.data_version,
                "retrieval_timestamp": self.retrieval_timestamp.isoformat(),
            },
        )

    def to_freight_market_observation_row(self) -> Dict[str, Any]:
        """Map to Supabase freight_market_observations table row."""
        return {
            "route_id": self.route_corridor,
            "date": str(self.observation_date),
            "rate_usd": self.freight_rate,
            "weekly_change": None,
            "capacity_status": "Normal",
            "source": self.source,
        }


class TargetDatasetBatch(BaseModel):
    """Container for validated target dataset batches with audit metadata."""
    records: List[AuthorizedFreightTargetRecord]
    source_name: str
    dataset_version: str
    license_status: str
    row_count: int = 0
    min_date: Optional[date] = None
    max_date: Optional[date] = None

    @classmethod
    def from_records(
        cls,
        records: List[AuthorizedFreightTargetRecord],
        source_name: str,
        dataset_version: str = "v1.0-target",
        license_status: str = "authorized_dataset"
    ) -> "TargetDatasetBatch":
        dates = [r.observation_date for r in records]
        return cls(
            records=records,
            source_name=source_name,
            dataset_version=dataset_version,
            license_status=license_status,
            row_count=len(records),
            min_date=min(dates) if dates else None,
            max_date=max(dates) if dates else None,
        )
