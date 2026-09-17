from datetime import date, datetime
import pytest
from pydantic import ValidationError

from app.ingestion.target_schema import AuthorizedFreightTargetRecord, TargetDatasetBatch
from app.ingestion.target_loader import TargetFreightDataLoader
from app.ingestion.connectors.scfi import SCFIConnector
from app.ingestion.connectors.baltic import BalticExchangeConnector
from app.api.routes.data_sources import REGISTRY_SOURCES


SAMPLE_CSV = """observation_date,route/corridor,origin,destination,freight_index,freight_rate,currency,unit,container/vessel type,source,source_dataset,source_url,retrieval_timestamp,license/access status,data_version
2024-08-16,route-sha-rot,Shanghai,Rotterdam,SCFI,4610.0,USD,USD/FEU,40ft Dry,Shanghai Shipping Exchange,SCFI Route Spot Rate Assessments,https://en.sse.net.cn,2024-08-16T15:00:00Z,authorized_exchange,v1.0-target
2024-08-23,route-sha-rot,Shanghai,Rotterdam,SCFI,4400.0,USD,USD/FEU,40ft Dry,Shanghai Shipping Exchange,SCFI Route Spot Rate Assessments,https://en.sse.net.cn,2024-08-23T15:00:00Z,authorized_exchange,v1.0-target
2024-08-16,route-sha-lax,Shanghai,Los Angeles,SCFI,5200.0,USD,USD/FEU,40ft Dry,Shanghai Shipping Exchange,SCFI Route Spot Rate Assessments,https://en.sse.net.cn,2024-08-16T15:00:00Z,authorized_exchange,v1.0-target
"""


def test_authorized_target_record_all_15_fields():
    """Verify AuthorizedFreightTargetRecord supports all 15 specified fields."""
    rec = AuthorizedFreightTargetRecord(
        observation_date=date(2024, 8, 23),
        route_corridor="route-sha-rot",
        origin="Shanghai",
        destination="Rotterdam",
        freight_index="SCFI",
        freight_rate=4400.0,
        currency="USD",
        unit="USD/FEU",
        container_vessel_type="40ft Dry Container",
        source="Shanghai Shipping Exchange",
        source_dataset="SCFI Route Spot Rate Assessments",
        source_url="https://en.sse.net.cn/indices/scfinew.jsp",
        license_access_status="authorized_historical_import",
        data_version="v1.0-target",
    )

    d = rec.to_dict()
    assert d["observation_date"] == "2024-08-23"
    assert d["route/corridor"] == "route-sha-rot"
    assert d["origin"] == "Shanghai"
    assert d["destination"] == "Rotterdam"
    assert d["freight_index"] == "SCFI"
    assert d["freight_rate"] == 4400.0
    assert d["currency"] == "USD"
    assert d["unit"] == "USD/FEU"
    assert d["container/vessel type"] == "40ft Dry Container"
    assert d["source"] == "Shanghai Shipping Exchange"
    assert d["source_dataset"] == "SCFI Route Spot Rate Assessments"
    assert d["source_url"] == "https://en.sse.net.cn/indices/scfinew.jsp"
    assert "retrieval_timestamp" in d
    assert d["license/access status"] == "authorized_historical_import"
    assert d["data_version"] == "v1.0-target"


def test_target_record_rejects_negative_or_zero_rates():
    """Target ground truth must be strictly positive."""
    with pytest.raises(ValidationError):
        AuthorizedFreightTargetRecord(
            observation_date="2024-08-23",
            route_corridor="route-sha-rot",
            origin="Shanghai",
            destination="Rotterdam",
            freight_index="SCFI",
            freight_rate=-100.0,  # Invalid
            source="SSE",
            source_dataset="SCFI",
        )


def test_loader_parses_authorized_csv():
    """Verify TargetFreightDataLoader loads and normalizes CSV records."""
    records = TargetFreightDataLoader.load_from_csv(SAMPLE_CSV)
    assert len(records) == 3
    assert records[0].freight_rate == 4610.0
    assert records[1].route_corridor == "route-sha-rot"
    assert records[2].route_corridor == "route-sha-lax"


def test_mapping_to_canonical_normalized_observation():
    """Verify target record maps cleanly to NormalizedObservation with audit attributes."""
    records = TargetFreightDataLoader.load_from_csv(SAMPLE_CSV)
    obs = records[0].to_normalized_observation(raw_checksum="test-chk-123")

    assert obs.entity_type == "route"
    assert obs.entity_id == "route-sha-rot"
    assert obs.metric_name == "spot_rate_usd"
    assert obs.value == 4610.0
    assert obs.unit == "USD/FEU"
    assert obs.extra_attributes["freight_index"] == "SCFI"
    assert obs.extra_attributes["origin"] == "Shanghai"
    assert obs.extra_attributes["destination"] == "Rotterdam"
    assert obs.extra_attributes["license_access_status"] == "authorized_exchange"


def test_mapping_to_freight_market_observations_row():
    """Verify target record maps directly to Supabase freight_market_observations row."""
    records = TargetFreightDataLoader.load_from_csv(SAMPLE_CSV)
    row = records[0].to_freight_market_observation_row()

    assert row["route_id"] == "route-sha-rot"
    assert row["date"] == "2024-08-16"
    assert row["rate_usd"] == 4610.0
    assert row["source"] == "Shanghai Shipping Exchange"


def test_scfi_connector_unconfigured_produces_zero_synthetic_data():
    """When unconfigured, SCFI connector must NOT fabricate any fake data."""
    connector = SCFIConnector(dataset_path="/path/that/does/not/exist.csv")
    assert connector.is_configured() is False

    res = connector.run()
    assert res.status == "completed"
    assert res.records_ingested == 0
    assert len(res.observations) == 0


def test_scfi_connector_ingests_authorized_content():
    """Programmatic ingestion of authorized CSV content succeeds with full provenance."""
    connector = SCFIConnector()
    obs_list = connector.ingest_authorized_csv_content(SAMPLE_CSV)

    assert len(obs_list) == 3
    assert obs_list[0].value == 4610.0
    assert obs_list[0].metric_name == "spot_rate_usd"
    assert obs_list[0].extra_attributes["origin"] == "Shanghai"


def test_baltic_exchange_remains_marked_license_required():
    """Baltic Exchange source entry must remain marked LICENSE REQUIRED."""
    baltic = BalticExchangeConnector()
    assert baltic.access_type == "licensed"
    assert baltic.auth_required is True

    # Check registry definition in data_sources.py
    baltic_entry = next(s for s in REGISTRY_SOURCES if s["id"] == "src-baltic-exchange")
    assert baltic_entry["access_type"] == "licensed"
    assert "LICENSE REQUIRED" in baltic_entry["last_error"]
    assert "enterprise subscription license" in baltic_entry["license_notes"]
