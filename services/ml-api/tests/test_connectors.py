import pytest
from app.ingestion.connectors import CONNECTOR_MAP

def test_all_connectors_instantiate_and_run():
    for name, connector_cls in CONNECTOR_MAP.items():
        connector = connector_cls()
        result = connector.run()
        assert result.status == "completed", f"Connector {name} failed: {result.error_message}"
        if name == "scfi":
            # SCFI connector is staged waiting for authorized dataset (zero synthetic records generated)
            assert result.records_ingested == 0
        else:
            assert result.records_ingested > 0, f"Connector {name} should ingest records"
            assert len(result.observations) == result.records_ingested


def test_licensed_connectors_flag_synthetic_truth():
    from app.ingestion.connectors.baltic import BalticExchangeConnector
    from app.ingestion.connectors.marinetraffic import MarineTrafficConnector

    baltic = BalticExchangeConnector()
    assert baltic.access_type == "licensed"
    res = baltic.run()
    assert res.status == "completed"
    assert res.observations[0].metric_name == "spot_rate_usd"
    assert res.observations[0].extra_attributes.get("is_licensed_truth") is False

    marine = MarineTrafficConnector()
    assert marine.access_type == "licensed"
    res_m = marine.run()
    assert res_m.status == "completed"
    assert res_m.observations[0].metric_name == "vessel_speed_knots"

def test_idempotency_deduplication():
    from app.ingestion.connectors.unctad import UnctadConnector
    connector = UnctadConnector()
    res1 = connector.run()
    double_obs = res1.observations + res1.observations
    deduped = connector.deduplicate(double_obs)
    assert len(deduped) == len(res1.observations)

