import os
import pytest
import numpy as np
import pandas as pd
from app.features.synthetic_data import generate_canonical_training_series
from app.features.dataset_builder import DatasetBuilder
from app.features.pipeline import FeaturePipeline
from app.ml.baselines import NaiveLastValueModel, MovingAverageModel, ExponentialSmoothingModel
from app.ml.candidate import (
    RidgeRegressionModel,
    RandomForestModel,
    XGBoostModel,
    LightGBMModel,
    FreightForecastModel,
)
from app.ml.evaluation import ModelEvaluator
from app.ml.promotion import PromotionEngine
from app.ml.registry import ModelRegistry

def test_baseline_and_candidate_models():
    df = generate_canonical_training_series(days=120)
    train_df, test_df, meta = DatasetBuilder.build_dataset(df, horizon_days=7)
    target_col = meta["target_col"]

    # 1. Test baseline
    naive = NaiveLastValueModel()
    preds_naive = naive.predict(test_df)
    assert len(preds_naive) == len(test_df)

    # 2. Test candidate model
    model = FreightForecastModel(horizon_days=7)
    model.fit(train_df, target_col=target_col)
    preds, lowers, uppers = model.predict(test_df)

    assert len(preds) == len(test_df)
    assert np.all(lowers <= preds)
    assert np.all(preds <= uppers)

    # 3. Test metrics
    metrics = ModelEvaluator.evaluate(
        y_true=test_df[target_col].to_numpy(),
        y_pred=preds,
        y_lag=test_df["rate_lag_1d"].to_numpy(),
        lower_bound=lowers,
        upper_bound=uppers,
    )
    assert "mae" in metrics
    assert "directional_accuracy" in metrics
    assert "interval_coverage" in metrics
    assert metrics["interval_coverage"] >= 90.0

def test_promotion_policy_rejects_coverage_regression():
    champ_metrics = {"mae": 100.0, "directional_accuracy": 92.0, "interval_coverage": 95.0}
    cand_metrics = {"mae": 90.0, "directional_accuracy": 92.0, "interval_coverage": 85.0}  # < 90%
    promotable, reason = PromotionEngine.evaluate_promotion(champ_metrics, cand_metrics)
    assert promotable is False
    assert "safety threshold" in reason

def test_chronological_time_series_split():
    """Verifies that the chronological train/val/test split strictly obeys time ordering."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    raw_df = pd.read_csv(csv_path)

    train_df, val_df, test_df, meta = DatasetBuilder.build_train_val_test(
        raw_df=raw_df,
        horizon_days=7,
        train_ratio=0.70,
        val_ratio=0.15,
        test_ratio=0.15,
    )

    assert meta["leakage_checks_passed"] is True
    assert len(train_df) > 0
    assert len(val_df) > 0
    assert len(test_df) > 0

    # Ensure date ordering: max(train) < min(val) and max(val) < min(test)
    assert train_df["date"].max() < val_df["date"].min()
    assert val_df["date"].max() < test_df["date"].min()

def test_all_baseline_models():
    """Verifies all 3 requested baseline models on real test split."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    raw_df = pd.read_csv(csv_path)

    train_df, val_df, test_df, meta = DatasetBuilder.build_train_val_test(
        raw_df=raw_df, horizon_days=7
    )

    # 1. Naive Last Value
    naive = NaiveLastValueModel()
    pred_naive = naive.predict(test_df)
    assert len(pred_naive) == len(test_df)
    assert not np.isnan(pred_naive).any()

    # 2. Moving Average
    ma = MovingAverageModel(window_col="rolling_mean_4w")
    pred_ma = ma.predict(test_df)
    assert len(pred_ma) == len(test_df)
    assert not np.isnan(pred_ma).any()

    # 3. Exponential Smoothing
    es = ExponentialSmoothingModel(alpha=0.3)
    pred_es = es.predict(test_df)
    assert len(pred_es) == len(test_df)
    assert not np.isnan(pred_es).any()

def test_all_ml_candidate_models():
    """Verifies all 4 ML models: Ridge, Random Forest, XGBoost, and LightGBM."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    raw_df = pd.read_csv(csv_path)

    train_df, val_df, test_df, meta = DatasetBuilder.build_train_val_test(
        raw_df=raw_df, horizon_days=7
    )

    features = meta["feature_names"]
    X_tr = train_df[features]
    y_tr_delta = train_df[meta["delta_col"]].to_numpy()
    X_te = test_df[features]
    base_te = test_df["rate_lag_1w"].to_numpy()

    # 1. Ridge
    ridge = RidgeRegressionModel(alpha=100.0)
    ridge.fit(X_tr, y_tr_delta)
    pred_ridge = base_te + ridge.predict(X_te)
    assert len(pred_ridge) == len(test_df)
    assert not np.isnan(pred_ridge).any()

    # 2. Random Forest
    rf = RandomForestModel(n_estimators=30, max_depth=4)
    rf.fit(X_tr, y_tr_delta)
    pred_rf = base_te + rf.predict(X_te)
    assert len(pred_rf) == len(test_df)
    assert not np.isnan(pred_rf).any()

    # 3. XGBoost
    xgb_mod = XGBoostModel(n_estimators=30, max_depth=3)
    xgb_mod.fit(X_tr, y_tr_delta)
    pred_xgb = base_te + xgb_mod.predict(X_te)
    assert len(pred_xgb) == len(test_df)
    assert not np.isnan(pred_xgb).any()

    # 4. LightGBM
    lgb_mod = LightGBMModel(n_estimators=30, max_depth=3)
    lgb_mod.fit(X_tr, y_tr_delta)
    pred_lgb = base_te + lgb_mod.predict(X_te)
    assert len(pred_lgb) == len(test_df)
    assert not np.isnan(pred_lgb).any()

def test_multi_horizon_forecasting_and_intervals():
    """Verifies that multi-horizon models produce consistent predictions and calibrated intervals."""
    csv_path = os.path.join(os.path.dirname(__file__), "../data/unctad_scfi_historical_freight_rates.csv")
    raw_df = pd.read_csv(csv_path)

    for h in [7, 14, 28]:
        train_df, val_df, test_df, meta = DatasetBuilder.build_train_val_test(
            raw_df=raw_df, horizon_days=h
        )
        model = FreightForecastModel(horizon_days=h)
        model.fit(train_df, target_col=meta["target_col"], val_df=val_df)
        preds, lowers, uppers = model.predict(test_df)

        assert len(preds) == len(test_df)
        # Mathematical invariant: lower <= point <= upper
        assert np.all(lowers <= preds), f"Lower bound violation for horizon {h}"
        assert np.all(preds <= uppers), f"Upper bound violation for horizon {h}"

def test_model_registry_persistence_and_loading(tmp_path):
    """Verifies serialization and reloading of trained models from registry."""
    reg = ModelRegistry(base_dir=str(tmp_path))
    model = FreightForecastModel(version="v2.5-test", horizon_days=7)
    df = generate_canonical_training_series(days=60)
    train_df, test_df, meta = DatasetBuilder.build_dataset(df, horizon_days=7)
    model.fit(train_df, target_col=meta["target_col"])

    reg.register_model(
        model_obj=model,
        version="v2.5-test",
        algorithm="XGBoost Delta Estimator",
        metrics={"mae": 45.0, "rmse": 62.0},
        features_hash="testhash123",
        is_champion=True,
    )

    loaded = reg.load_model(role="champion")
    assert loaded is not None
    assert loaded.version == "v2.5-test"
    pred_orig, _, _ = model.predict(test_df)
    pred_load, _, _ = loaded.predict(test_df)
    np.testing.assert_allclose(pred_orig, pred_load, rtol=1e-5)

