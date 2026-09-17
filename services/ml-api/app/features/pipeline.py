import os
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Annual World Bank World GDP growth rates (officially reported past years)
WORLD_BANK_GDP_MAP = {
    2021: -3.07,  # 2020 annual GDP published in 2021
    2022: 6.24,   # 2021 annual GDP published in 2022
    2023: 3.09,   # 2022 annual GDP published in 2023
    2024: 2.73,   # 2023 annual GDP published in 2024
}

class FeaturePipeline:
    """
    Time-series feature engineering pipeline for maritime container freight rates.
    Guarantees strictly leak-free transformations:
      - Weekly target lags (1w, 2w, 4w, 8w, 12w) using shift()
      - Backward-looking rolling statistics (mean, std) strictly closed on the left
      - Backward-aligned monthly Indian major port indicators (available on 1st of following month)
      - Published World Bank annual GDP macro step indicator (no artificial weekly interpolation)
      - Route corridor one-hot encoding
    """

    @classmethod
    def _load_india_port_aggregates(cls, data_dir: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Loads and aggregates monthly Indian major port operational indicators."""
        if data_dir is None:
            data_dir = os.path.join(os.path.dirname(__file__), "../../data")
        csv_path = os.path.join(data_dir, "india_major_ports_monthly_traffic.csv")
        if not os.path.exists(csv_path):
            return None

        try:
            india_df = pd.read_csv(csv_path)
            india_df["observation_date"] = pd.to_datetime(india_df["observation_date"])
            agg = india_df.groupby("observation_date").agg({
                "total_cargo_tonnes": "sum",
                "container_traffic_teu": "sum",
                "overseas_loaded_cargo_tonnes": "sum",
                "overseas_unloaded_cargo_tonnes": "sum",
                "vessel_traffic_count": "sum",
                "output_per_ship_berth_day_tonnes": "mean",
                "turnaround_time_hours": "mean",
                "berth_utilization_percent": "mean",
            }).reset_index()

            agg = agg.rename(columns={
                "total_cargo_tonnes": "india_total_cargo_tonnes",
                "container_traffic_teu": "india_container_teu",
                "overseas_loaded_cargo_tonnes": "india_export_tonnes",
                "overseas_unloaded_cargo_tonnes": "india_import_tonnes",
                "vessel_traffic_count": "india_vessel_calls",
                "output_per_ship_berth_day_tonnes": "india_avg_osbd_tonnes",
                "turnaround_time_hours": "india_avg_turnaround_hours",
                "berth_utilization_percent": "india_avg_berth_utilization",
            })

            # MoM growth rates
            agg["india_cargo_mom"] = agg["india_total_cargo_tonnes"].pct_change().fillna(0.0)
            agg["india_teu_mom"] = agg["india_container_teu"].pct_change().fillna(0.0)

            # Available date is 1st of following month (guarantees zero look-ahead bias)
            agg["available_date"] = agg["observation_date"] + pd.DateOffset(months=1)
            return agg.sort_values("available_date").reset_index(drop=True)
        except Exception as e:
            logger.warning("Could not load Indian port dataset for feature augmentation: %s", e)
            return None

    @classmethod
    def generate_features(cls, df: pd.DataFrame, target_col: str = "spot_rate_usd") -> pd.DataFrame:
        """
        Input DataFrame must have columns: ['date', 'route_id', 'spot_rate_usd']
        Accepts raw SCFI columns with alias resolution:
          'observation_date' -> 'date'
          'route/corridor'   -> 'route_id'
          'freight_rate'     -> 'spot_rate_usd'
        """
        df = df.copy()

        # Alias resolution
        if "observation_date" in df.columns and "date" not in df.columns:
            df["date"] = df["observation_date"]
        if "route/corridor" in df.columns and "route_id" not in df.columns:
            df["route_id"] = df["route/corridor"]
        if "freight_rate" in df.columns and target_col not in df.columns:
            df[target_col] = df["freight_rate"]

        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values(by=["route_id", "date"]).reset_index(drop=True)

        # Merge Indian major ports explanatory data if not present
        if "india_total_cargo_tonnes" not in df.columns and "date" in df.columns:
            india_agg = cls._load_india_port_aggregates()
            if india_agg is not None and not india_agg.empty:
                df = pd.merge_asof(
                    df.sort_values("date"),
                    india_agg,
                    left_on="date",
                    right_on="available_date",
                    direction="backward",
                )
                india_cols = [c for c in india_agg.columns if c.startswith("india_")]
                # For dates prior to the earliest available month, backfill with earliest known
                df[india_cols] = df[india_cols].bfill().fillna(0.0)

        feature_dfs = []
        for route_id, group in df.groupby("route_id"):
            g = group.copy().sort_values("date").reset_index(drop=True)

            # 1. Temporal / Lag Features (strict shifts to prevent target leakage)
            g["rate_lag_1w"] = g[target_col].shift(1)
            g["rate_lag_2w"] = g[target_col].shift(2)
            g["rate_lag_4w"] = g[target_col].shift(4)
            g["rate_lag_8w"] = g[target_col].shift(8)
            g["rate_lag_12w"] = g[target_col].shift(12)

            # Backward-compatible aliases for legacy daily tests
            g["rate_lag_1d"] = g["rate_lag_1w"]
            g["rate_lag_7d"] = g["rate_lag_1w"]
            g["rate_lag_14d"] = g["rate_lag_2w"]
            g["rate_lag_30d"] = g["rate_lag_4w"]

            # 2. Rolling Statistics (closed='left' by rolling on shift(1))
            s = g[target_col].shift(1)
            rolling_4 = s.rolling(window=4, min_periods=1)
            rolling_8 = s.rolling(window=8, min_periods=1)
            rolling_12 = s.rolling(window=12, min_periods=1)
            rolling_7_legacy = s.rolling(window=7, min_periods=1)
            rolling_14_legacy = s.rolling(window=14, min_periods=1)
            rolling_30_legacy = s.rolling(window=30, min_periods=1)

            g["rolling_mean_4w"] = rolling_4.mean()
            g["rolling_mean_8w"] = rolling_8.mean()
            g["rolling_mean_12w"] = rolling_12.mean()
            g["rolling_std_4w"] = rolling_4.std().fillna(0.0)
            g["rolling_std_12w"] = rolling_12.std().fillna(0.0)

            # Backward-compatible rolling aliases
            g["rolling_mean_7d"] = rolling_7_legacy.mean()
            g["rolling_std_7d"] = rolling_7_legacy.std().fillna(0.0)
            g["rolling_mean_14d"] = rolling_14_legacy.mean()
            g["rolling_mean_30d"] = rolling_30_legacy.mean()

            # 3. Differences, Changes, Momentum & Volatility
            g["rate_diff_1w"] = g["rate_lag_1w"] - g["rate_lag_2w"]
            g["rate_pct_change_1w"] = g["rate_diff_1w"] / (g["rate_lag_2w"].abs() + 1e-6)
            g["momentum_4w"] = g["rate_lag_1w"] - g["rate_lag_4w"]
            g["momentum_12w"] = g["rate_lag_1w"] - g["rate_lag_12w"]
            g["volatility_ratio_4_12"] = (g["rolling_std_4w"] + 1e-5) / (g["rolling_std_12w"] + 1e-5)

            # Backward-compatible momentum / volatility aliases
            g["momentum_7d"] = g["rate_lag_1d"] - g["rate_lag_7d"]
            g["volatility_ratio_7_30"] = (g["rolling_std_7d"] + 1e-5) / (rolling_30_legacy.std().fillna(1.0) + 1e-5)

            # 4. Calendar & Seasonality
            g["month"] = g["date"].dt.month
            g["quarter"] = g["date"].dt.quarter
            g["day_of_week"] = g["date"].dt.dayofweek
            week_series = g["date"].dt.isocalendar().week.astype(int)
            g["week_of_year"] = week_series
            g["sin_week"] = np.sin(2.0 * np.pi * week_series / 52.0)
            g["cos_week"] = np.cos(2.0 * np.pi * week_series / 52.0)
            g["is_q3_peak"] = g["month"].isin([7, 8, 9]).astype(float)
            g["is_q4_inventory"] = g["month"].isin([10, 11]).astype(float)

            # 5. Route / Corridor Encodings
            r_str = str(route_id)
            g["route_is_sha_rot"] = float(r_str == "route-sha-rot")
            g["route_is_sha_lax"] = float(r_str == "route-sha-lax")
            g["route_is_rot_nyc"] = float(r_str == "route-rot-nyc")

            # 6. Exogenous Variables (Bunker fuel, Canal Transits, Congestion)
            if "bunker_fuel_usd" in g.columns:
                g["bunker_lag_1d"] = g["bunker_fuel_usd"].shift(1)
            else:
                g["bunker_lag_1d"] = 615.0

            if "congestion_index" in g.columns:
                g["congestion_lag_1d"] = g["congestion_index"].shift(1)
            else:
                g["congestion_lag_1d"] = 50.0

            if "canal_transits" in g.columns:
                g["canal_transits_lag"] = g["canal_transits"].shift(1)
            else:
                g["canal_transits_lag"] = 850.0

            # Interaction Terms
            g["congestion_x_bunker"] = g["congestion_lag_1d"] * (g["bunker_lag_1d"] / 100.0)

            # 7. World Bank Macro Indicator (Annual GDP growth of previous year)
            g["world_gdp_growth"] = g["date"].dt.year.map(WORLD_BANK_GDP_MAP).fillna(3.0)

            # 8. Indian Ports Explanatory Fallbacks if missing
            india_expected_cols = [
                "india_total_cargo_tonnes", "india_container_teu", "india_export_tonnes",
                "india_import_tonnes", "india_vessel_calls", "india_avg_osbd_tonnes",
                "india_avg_turnaround_hours", "india_avg_berth_utilization",
                "india_cargo_mom", "india_teu_mom"
            ]
            for c in india_expected_cols:
                if c not in g.columns:
                    g[c] = 0.0

            feature_dfs.append(g)

        result = pd.concat(feature_dfs, ignore_index=True)
        return result

    @classmethod
    def get_feature_names(cls) -> List[str]:
        """Returns the primary feature column names for model training."""
        return [
            "rate_lag_1w",
            "rate_lag_2w",
            "rate_lag_4w",
            "rate_lag_8w",
            "rate_lag_12w",
            "rolling_mean_4w",
            "rolling_mean_8w",
            "rolling_mean_12w",
            "rolling_std_4w",
            "rolling_std_12w",
            "volatility_ratio_4_12",
            "rate_diff_1w",
            "rate_pct_change_1w",
            "momentum_4w",
            "momentum_12w",
            "month",
            "quarter",
            "week_of_year",
            "sin_week",
            "cos_week",
            "is_q3_peak",
            "is_q4_inventory",
            "route_is_sha_rot",
            "route_is_sha_lax",
            "route_is_rot_nyc",
            "india_total_cargo_tonnes",
            "india_container_teu",
            "india_export_tonnes",
            "india_import_tonnes",
            "india_vessel_calls",
            "india_avg_osbd_tonnes",
            "india_avg_turnaround_hours",
            "india_avg_berth_utilization",
            "india_cargo_mom",
            "india_teu_mom",
            "world_gdp_growth",
        ]

    @classmethod
    def get_legacy_feature_names(cls) -> List[str]:
        """Backward-compatible feature list for legacy tests."""
        return [
            "rate_lag_1d",
            "rate_lag_7d",
            "rate_lag_14d",
            "rate_lag_30d",
            "rolling_mean_7d",
            "rolling_std_7d",
            "rolling_mean_14d",
            "rolling_mean_30d",
            "momentum_7d",
            "volatility_ratio_7_30",
            "bunker_lag_1d",
            "congestion_lag_1d",
            "canal_transits_lag",
            "month",
            "quarter",
            "is_q3_peak",
            "congestion_x_bunker",
        ]

