import hashlib
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd
import numpy as np
from app.features.pipeline import FeaturePipeline

logger = logging.getLogger(__name__)

class DatasetBuilder:
    """
    Deterministic training dataset generator with multi-horizon targets,
    frequency auto-detection, chronological time-series splits, and leakage audit.
    """

    @classmethod
    def _detect_horizon_steps(cls, df: pd.DataFrame, horizon_days: int) -> int:
        """Determines the row shift based on series frequency (weekly vs daily)."""
        if "date" not in df.columns or len(df) < 5:
            return max(1, horizon_days)
        sample = df.sort_values("date").drop_duplicates(subset=["date"])
        diffs = sample["date"].diff().dropna().dt.total_seconds() / 86400.0
        median_diff = diffs.median()
        if median_diff >= 5.0:  # Weekly frequency (~7 days)
            steps = max(1, int(round(horizon_days / 7.0)))
            logger.debug("Detected weekly time series (median diff %.1f days). Horizon %d days -> %d steps.", median_diff, horizon_days, steps)
            return steps
        return horizon_days

    @classmethod
    def build_train_val_test(
        cls,
        raw_df: pd.DataFrame,
        horizon_days: int = 7,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        target_name: str = "spot_rate_usd",
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """
        Builds feature dataset with strict chronological 70/15/15 train/val/test split.
        Splits on unique dates to ensure zero temporal overlap across routes.
        """
        features_df = FeaturePipeline.generate_features(raw_df, target_col=target_name)
        horizon_steps = cls._detect_horizon_steps(features_df, horizon_days)

        # Target: spot rate shifted back by -horizon_steps
        target_col = f"target_t_plus_{horizon_days}d"
        features_df[target_col] = features_df.groupby("route_id")[target_name].shift(-horizon_steps)

        # Delta target: rate change from latest known rate to future horizon
        delta_col = f"delta_t_plus_{horizon_days}d"
        features_df[delta_col] = features_df[target_col] - features_df["rate_lag_1w"]

        # Drop rows where target or primary lag features are NaN (warmup and trailing periods)
        primary_lags = ["rate_lag_1w", "rate_lag_4w"] if len(features_df) > 50 else ["rate_lag_1w"]
        clean_df = features_df.dropna(subset=[target_col, "rate_lag_1w"]).reset_index(drop=True)

        if len(clean_df) == 0:
            raise ValueError("Insufficient data rows after applying lags and forecast horizon.")

        # Chronological split on unique dates (guarantees zero random shuffling)
        if "date" in clean_df.columns:
            unique_dates = sorted(clean_df["date"].unique())
            n_dates = len(unique_dates)
            n_train_dates = max(1, int(n_dates * train_ratio))
            n_val_dates = max(1, int(n_dates * val_ratio))

            train_dates = set(unique_dates[:n_train_dates])
            val_dates = set(unique_dates[n_train_dates:n_train_dates + n_val_dates])
            test_dates = set(unique_dates[n_train_dates + n_val_dates:])

            train_df = clean_df[clean_df["date"].isin(train_dates)].reset_index(drop=True)
            val_df = clean_df[clean_df["date"].isin(val_dates)].reset_index(drop=True)
            test_df = clean_df[clean_df["date"].isin(test_dates)].reset_index(drop=True)
        else:
            n = len(clean_df)
            n_train = int(n * train_ratio)
            n_val = int(n * val_ratio)
            train_df = clean_df.iloc[:n_train].copy().reset_index(drop=True)
            val_df = clean_df.iloc[n_train:n_train + n_val].copy().reset_index(drop=True)
            test_df = clean_df.iloc[n_train + n_val:].copy().reset_index(drop=True)

        feature_cols = [col for col in FeaturePipeline.get_feature_names() if col in clean_df.columns]
        if not feature_cols:
            feature_cols = [col for col in FeaturePipeline.get_legacy_feature_names() if col in clean_df.columns]

        metadata = cls.audit_dataset(
            clean_df=clean_df,
            train_df=train_df,
            val_df=val_df,
            test_df=test_df,
            target_col=target_col,
            delta_col=delta_col,
            feature_cols=feature_cols,
            horizon_days=horizon_days,
            horizon_steps=horizon_steps,
        )

        return train_df, val_df, test_df, metadata

    @classmethod
    def build_dataset(
        cls,
        raw_df: pd.DataFrame,
        horizon_days: int = 7,
        train_ratio: float = 0.8,
        target_name: str = "spot_rate_usd",
        return_val: bool = False,
    ) -> Any:
        """
        Backward-compatible build_dataset method.
        Returns (train_df, test_df, metadata) when return_val=False,
        or (train_df, val_df, test_df, metadata) when return_val=True.
        """
        if return_val:
            return cls.build_train_val_test(
                raw_df=raw_df,
                horizon_days=horizon_days,
                train_ratio=train_ratio,
                val_ratio=(1.0 - train_ratio) / 2.0,
                test_ratio=(1.0 - train_ratio) / 2.0,
                target_name=target_name,
            )

        features_df = FeaturePipeline.generate_features(raw_df, target_col=target_name)
        horizon_steps = cls._detect_horizon_steps(features_df, horizon_days)

        target_col = f"target_t_plus_{horizon_days}d"
        features_df[target_col] = features_df.groupby("route_id")[target_name].shift(-horizon_steps)

        delta_col = f"delta_t_plus_{horizon_days}d"
        features_df[delta_col] = features_df[target_col] - features_df["rate_lag_1w"]

        clean_df = features_df.dropna(subset=[target_col, "rate_lag_1w"]).reset_index(drop=True)

        if len(clean_df) == 0:
            raise ValueError("Insufficient data rows after applying lags and forecast horizon.")

        # Chronological split
        split_idx = int(len(clean_df) * train_ratio)
        train_df = clean_df.iloc[:split_idx].copy()
        test_df = clean_df.iloc[split_idx:].copy()

        features_list = [c for c in FeaturePipeline.get_feature_names() if c in clean_df.columns]
        if not features_list:
            features_list = [c for c in FeaturePipeline.get_legacy_feature_names() if c in clean_df.columns]

        metadata = {
            "version": f"v2.0-h{horizon_days}d",
            "horizon_days": horizon_days,
            "horizon_steps": horizon_steps,
            "target_col": target_col,
            "delta_col": delta_col,
            "feature_names": features_list,
            "total_rows": len(clean_df),
            "train_rows": len(train_df),
            "test_rows": len(test_df),
            "train_date_min": str(train_df["date"].min()) if "date" in train_df else None,
            "train_date_max": str(train_df["date"].max()) if "date" in train_df else None,
            "test_date_min": str(test_df["date"].min()) if "date" in test_df else None,
            "test_date_max": str(test_df["date"].max()) if "date" in test_df else None,
        }
        meta_hash = hashlib.sha256(json.dumps(metadata, sort_keys=True).encode("utf-8")).hexdigest()
        metadata["dataset_hash"] = meta_hash

        return train_df, test_df, metadata

    @classmethod
    def audit_dataset(
        cls,
        clean_df: pd.DataFrame,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        test_df: pd.DataFrame,
        target_col: str,
        delta_col: str,
        feature_cols: List[str],
        horizon_days: int,
        horizon_steps: int,
    ) -> Dict[str, Any]:
        """Generates the comprehensive data and leakage audit required before training."""
        routes = sorted(clean_df["route_id"].unique().tolist()) if "route_id" in clean_df else []
        has_dates = "date" in clean_df.columns

        # Leakage verification checks
        leakage_passed = True
        leakage_reasons = []

        if has_dates and len(train_df) > 0 and len(val_df) > 0 and len(test_df) > 0:
            train_max = train_df["date"].max()
            val_min = val_df["date"].min()
            val_max = val_df["date"].max()
            test_min = test_df["date"].min()

            if not (train_max < val_min):
                leakage_passed = False
                leakage_reasons.append(f"Train date max ({train_max}) not strictly earlier than Val date min ({val_min})")
            if not (val_max < test_min):
                leakage_passed = False
                leakage_reasons.append(f"Val date max ({val_max}) not strictly earlier than Test date min ({test_min})")

        # Check that no NaN values exist in features or targets
        missing_values = clean_df[feature_cols + [target_col]].isnull().sum().to_dict()
        duplicates_count = clean_df.duplicated(subset=["route_id", "date"]).sum() if has_dates else clean_df.duplicated().sum()

        metadata = {
            "version": f"v2.0-h{horizon_days}d",
            "horizon_days": horizon_days,
            "horizon_steps": horizon_steps,
            "target_col": target_col,
            "delta_col": delta_col,
            "feature_names": feature_cols,
            "feature_count": len(feature_cols),
            "routes": routes,
            "total_rows": len(clean_df),
            "train_rows": len(train_df),
            "val_rows": len(val_df),
            "test_rows": len(test_df),
            "train_date_min": str(train_df["date"].min()) if has_dates and len(train_df) > 0 else None,
            "train_date_max": str(train_df["date"].max()) if has_dates and len(train_df) > 0 else None,
            "val_date_min": str(val_df["date"].min()) if has_dates and len(val_df) > 0 else None,
            "val_date_max": str(val_df["date"].max()) if has_dates and len(val_df) > 0 else None,
            "test_date_min": str(test_df["date"].min()) if has_dates and len(test_df) > 0 else None,
            "test_date_max": str(test_df["date"].max()) if has_dates and len(test_df) > 0 else None,
            "missing_values_count": sum(missing_values.values()),
            "duplicate_rows_count": int(duplicates_count),
            "leakage_checks_passed": leakage_passed,
            "leakage_reasons": leakage_reasons,
        }
        meta_hash = hashlib.sha256(json.dumps(metadata, sort_keys=True).encode("utf-8")).hexdigest()
        metadata["dataset_hash"] = meta_hash
        return metadata

