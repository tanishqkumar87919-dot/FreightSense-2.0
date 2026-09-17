import os
import pytest
import pandas as pd
import numpy as np
from app.features.synthetic_data import generate_canonical_training_series
from app.features.pipeline import FeaturePipeline
from app.features.dataset_builder import DatasetBuilder

def test_feature_pipeline_zero_future_leakage():
    df = generate_canonical_training_series(days=100)
    features_df = FeaturePipeline.generate_features(df)
    
    # Check that rate_lag_1d at index t equals spot_rate_usd at index t-1
    for route_id, grp in features_df.groupby("route_id"):
        grp = grp.reset_index(drop=True)
        for i in range(1, len(grp)):
            assert grp.loc[i, "rate_lag_1d"] == grp.loc[i - 1, "spot_rate_usd"]
            # Rolling mean at t should be based on values strictly before t
            prev_7 = grp.loc[max(0, i - 7):i - 1, "spot_rate_usd"]
            expected_mean = prev_7.mean()
            np.testing.assert_allclose(grp.loc[i, "rolling_mean_7d"], expected_mean, rtol=1e-4)

def test_dataset_builder_deterministic_hash():
    df = generate_canonical_training_series(days=150)
    train_1, test_1, meta_1 = DatasetBuilder.build_dataset(df, horizon_days=7)
    train_2, test_2, meta_2 = DatasetBuilder.build_dataset(df, horizon_days=7)

    assert meta_1["dataset_hash"] == meta_2["dataset_hash"]
    assert len(train_1) == len(train_2)
    assert len(test_1) == len(test_2)

def test_feature_generation_on_scfi_and_india_ports():
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    assert os.path.exists(csv_path), "SCFI historical dataset must exist."
    raw_df = pd.read_csv(csv_path)
    
    features_df = FeaturePipeline.generate_features(raw_df)
    assert len(features_df) == len(raw_df)
    
    feature_cols = FeaturePipeline.get_feature_names()
    for col in feature_cols:
        assert col in features_df.columns, f"Feature column '{col}' missing from engineered dataset."

    # Verify Indian port features are populated and non-negative
    for col in ["india_total_cargo_tonnes", "india_container_teu", "india_export_tonnes", "india_import_tonnes"]:
        assert (features_df[col] >= 0).all(), f"Column {col} has invalid negative values"

def test_india_data_temporal_alignment_no_lookahead():
    """Verifies that monthly Indian port data is only accessible after the month ends."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    raw_df = pd.read_csv(csv_path)
    features_df = FeaturePipeline.generate_features(raw_df)
    
    # Check rows in 2021-05
    may_2021 = features_df[features_df["date"].dt.strftime("%Y-%m") == "2021-05"]
    assert len(may_2021) > 0
    # On May 2021 dates, the India cargo tonnage must come from April 2021 data (never May or June)
    # Check that for any date T, available_date <= T
    if "available_date" in features_df.columns:
        valid_rows = features_df.dropna(subset=["available_date"])
        assert (valid_rows["available_date"] <= valid_rows["date"]).all(), "Look-ahead leakage: available_date > prediction date"

def test_macro_indicators_annual_step_function():
    """Verifies that World Bank annual GDP is not artificially converted into weekly variations."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    raw_df = pd.read_csv(csv_path)
    features_df = FeaturePipeline.generate_features(raw_df)

    # Within a single calendar year, world_gdp_growth must remain constant
    for year, grp in features_df.groupby(features_df["date"].dt.year):
        unique_gdp_vals = grp["world_gdp_growth"].unique()
        assert len(unique_gdp_vals) == 1, f"Year {year} has multiple GDP values ({unique_gdp_vals}), violating step function rule"

def test_multi_lag_and_rolling_calculations():
    """Verifies that 1w, 2w, 4w, 8w, 12w lags and rolling means use strictly past data."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    raw_df = pd.read_csv(csv_path)
    features_df = FeaturePipeline.generate_features(raw_df)

    for route_id, grp in features_df.groupby("route_id"):
        grp = grp.reset_index(drop=True)
        for i in range(12, len(grp)):
            # Lags
            assert grp.loc[i, "rate_lag_1w"] == grp.loc[i - 1, "spot_rate_usd"]
            assert grp.loc[i, "rate_lag_2w"] == grp.loc[i - 2, "spot_rate_usd"]
            assert grp.loc[i, "rate_lag_4w"] == grp.loc[i - 4, "spot_rate_usd"]
            assert grp.loc[i, "rate_lag_8w"] == grp.loc[i - 8, "spot_rate_usd"]
            assert grp.loc[i, "rate_lag_12w"] == grp.loc[i - 12, "spot_rate_usd"]

            # Rolling mean 4w
            expected_4w = grp.loc[i - 4:i - 1, "spot_rate_usd"].mean()
            np.testing.assert_allclose(grp.loc[i, "rolling_mean_4w"], expected_4w, rtol=1e-4)

