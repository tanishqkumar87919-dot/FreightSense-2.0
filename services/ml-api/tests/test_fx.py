import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.domain.currency import CURRENCY_CONFIGS, convert_amount, get_exchange_rates

client = TestClient(app)


def test_get_currencies():
    response = client.get("/api/v1/fx/currencies")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["count"] == 11
    codes = [c["code"] for c in data["currencies"]]
    for expected in ["USD", "INR", "EUR", "GBP", "JPY", "CNY", "AED", "SGD", "AUD", "CAD", "CHF"]:
        assert expected in codes


def test_get_rates_usd_base():
    response = client.get("/api/v1/fx/rates")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["base_currency"] == "USD"
    rates = data["rates"]
    assert rates["USD"] == 1.0
    assert rates["INR"] == 83.75
    assert rates["EUR"] == 0.92
    assert rates["GBP"] == 0.79
    assert rates["JPY"] == 155.20
    assert rates["AED"] == 3.67
    assert data["data_provenance"]["status"] == "REFERENCE"
    assert data["data_provenance"]["is_live"] is False


def test_get_cross_rates_eur():
    response = client.get("/api/v1/fx/rates/EUR")
    assert response.status_code == 200
    data = response.json()
    assert data["base_currency"] == "EUR"
    rates = data["rates"]
    assert rates["EUR"] == 1.0
    # 1 EUR = (83.75 / 0.92) INR ≈ 91.03
    assert rates["INR"] > 85.0


def test_convert_endpoint():
    response = client.get("/api/v1/fx/convert?amount=52&from_currency=USD&to_currency=INR")
    assert response.status_code == 200
    data = response.json()
    conv = data["conversion"]
    assert conv["original_amount"] == 52.0
    assert conv["from_currency"] == "USD"
    assert conv["to_currency"] == "INR"
    assert conv["converted_amount"] == round(52 * 83.75, 2)
    assert conv["status"] == "REFERENCE"


def test_convert_zero_and_negative():
    # Zero
    zero_res = convert_amount(0.0, "USD", "INR")
    assert zero_res["converted_amount"] == 0.0

    # Negative delta
    neg_res = convert_amount(-2000.0, "USD", "INR")
    assert neg_res["converted_amount"] == -167500.0


def test_convert_jpy_zero_decimals():
    # JPY should have 0 decimals
    jpy_res = convert_amount(52.0, "USD", "JPY")
    assert jpy_res["converted_amount"] == round(52.0 * 155.20)
    assert isinstance(jpy_res["converted_amount"], (int, float))


def test_invalid_currency_handling():
    with pytest.raises(ValueError):
        convert_amount(100.0, "FAKE", "USD")
    
    response = client.get("/api/v1/fx/convert?amount=100&from_currency=XYZ&to_currency=USD")
    assert response.status_code == 400
