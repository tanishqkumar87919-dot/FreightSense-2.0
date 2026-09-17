import pytest
from datetime import datetime, timezone, timedelta
from app.ingestion.base import NormalizedObservation
from app.ingestion.validator import DataValidator

def test_validator_accepts_valid_observation():
    obs = NormalizedObservation(
        entity_type="route",
        entity_id="route-sha-rot",
        metric_name="spot_rate_usd",
        value=4200.0,
        unit="usd_per_feu",
        observation_timestamp=datetime.now(timezone.utc) - timedelta(hours=1),
        source_id="src-baltic-exchange",
        raw_checksum="chk123",
    )
    validated = DataValidator.validate_observations([obs])
    assert len(validated) == 1
    assert not validated[0].quarantined
    assert validated[0].quality_score == 1.0

def test_validator_quarantines_out_of_bounds_value():
    obs = NormalizedObservation(
        entity_type="route",
        entity_id="route-sha-rot",
        metric_name="spot_rate_usd",
        value=999999.0,  # Far above upper bound of 35000.0
        unit="usd_per_feu",
        observation_timestamp=datetime.now(timezone.utc) - timedelta(hours=1),
        source_id="src-baltic-exchange",
        raw_checksum="chk123",
    )
    validated = DataValidator.validate_observations([obs])
    assert validated[0].quarantined is True
    assert "outside bounds" in validated[0].quarantine_reason

def test_validator_quarantines_future_timestamp():
    obs = NormalizedObservation(
        entity_type="route",
        entity_id="route-sha-rot",
        metric_name="spot_rate_usd",
        value=4200.0,
        unit="usd_per_feu",
        observation_timestamp=datetime.now(timezone.utc) + timedelta(days=10),
        source_id="src-baltic-exchange",
        raw_checksum="chk123",
    )
    validated = DataValidator.validate_observations([obs])
    assert validated[0].quarantined is True
    assert "Future observation timestamp" in validated[0].quarantine_reason
