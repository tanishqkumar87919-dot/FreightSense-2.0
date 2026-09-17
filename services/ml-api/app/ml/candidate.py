import logging
from typing import Dict, List, Tuple, Optional, Any
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import lightgbm as lgb
from app.features.pipeline import FeaturePipeline

logger = logging.getLogger(__name__)

class RidgeRegressionModel:
    """Standardized Ridge Regression for freight delta forecasting."""
    def __init__(self, alpha: float = 100.0, random_state: int = 42):
        self.name = "Ridge Regression"
        self.version = "v2.0"
        self.alpha = alpha
        self.scaler = StandardScaler()
        self.model = Ridge(alpha=alpha, random_state=random_state)

    def fit(self, X: pd.DataFrame, y: np.ndarray):
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        X_sc = self.scaler.fit_transform(X_arr)
        self.model.fit(X_sc, y)
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        X_sc = self.scaler.transform(X_arr)
        return self.model.predict(X_sc)

class RandomForestModel:
    """Constrained Random Forest Regressor for robust non-linear freight forecasting."""
    def __init__(self, n_estimators: int = 100, max_depth: int = 5, random_state: int = 42):
        self.name = "Random Forest"
        self.version = "v2.0"
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_leaf=3,
            random_state=random_state,
            n_jobs=-1,
        )

    def fit(self, X: pd.DataFrame, y: np.ndarray):
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        self.model.fit(X_arr, y)
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        return self.model.predict(X_arr)

class XGBoostModel:
    """Conservative Gradient Boosted Trees for freight delta modeling."""
    def __init__(self, n_estimators: int = 80, max_depth: int = 3, learning_rate: float = 0.03, random_state: int = 42):
        self.name = "XGBoost Regressor"
        self.version = "v2.0"
        self.model = xgb.XGBRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state,
        )

    def fit(self, X: pd.DataFrame, y: np.ndarray):
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        self.model.fit(X_arr, y)
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        return self.model.predict(X_arr)

class LightGBMModel:
    """Fast Histogram-based Gradient Boosting for freight delta modeling."""
    def __init__(self, n_estimators: int = 80, max_depth: int = 3, learning_rate: float = 0.03, random_state: int = 42):
        self.name = "LightGBM Regressor"
        self.version = "v2.0"
        self.model = lgb.LGBMRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state,
            verbose=-1,
        )

    def fit(self, X: pd.DataFrame, y: np.ndarray):
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        self.model.fit(X_arr, y)
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        X_arr = np.nan_to_num(X.to_numpy(), nan=0.0)
        return self.model.predict(X_arr)

class FreightForecastModel:
    """
    Production freight forecasting model supporting 1-week, 2-week, and 4-week horizons.
    Uses XGBoost delta learning (predicting rate change relative to latest rate)
    with empirical residual standard errors for calibrated 95% prediction intervals.
    """

    def __init__(self, version: str = "v2.5", horizon_days: int = 7):
        self.version = version
        self.horizon_days = horizon_days
        self.feature_names = FeaturePipeline.get_feature_names()
        self.fallback_feature_names = FeaturePipeline.get_legacy_feature_names()
        
        # Primary estimators for target horizons: 7D (1W), 14D (2W), 28/30D (4W)
        self.models: Dict[int, Any] = {}
        self.residual_rmse: Dict[int, float] = {}
        self.is_fitted = False

    def _prepare_X(self, df: pd.DataFrame) -> pd.DataFrame:
        available = [col for col in self.feature_names if col in df.columns]
        if not available:
            available = [col for col in self.fallback_feature_names if col in df.columns]
        X = df[available].copy()
        X = X.fillna(X.median(numeric_only=True)).fillna(0.0)
        return X

    def _get_anchor_rates(self, df: pd.DataFrame) -> np.ndarray:
        for col in ["rate_lag_1w", "rate_lag_1d"]:
            if col in df.columns:
                return df[col].to_numpy()
        if "spot_rate_usd" in df.columns:
            return df["spot_rate_usd"].to_numpy()
        return np.zeros(len(df))

    def fit(self, train_df: pd.DataFrame, target_col: str, val_df: Optional[pd.DataFrame] = None):
        """Fits the model on training data for the specified target column."""
        X_tr = self._prepare_X(train_df)
        y_tr = train_df[target_col].to_numpy()
        base_tr = self._get_anchor_rates(train_df)
        delta_tr = y_tr - base_tr

        h = self.horizon_days
        regressor = xgb.XGBRegressor(
            n_estimators=80,
            max_depth=3,
            learning_rate=0.03,
            subsample=0.8,
            random_state=42,
        )
        regressor.fit(X_tr.to_numpy(), delta_tr)
        self.models[h] = regressor

        # Compute empirical residual standard error for uncertainty intervals
        if val_df is not None and target_col in val_df.columns and len(val_df) > 0:
            X_val = self._prepare_X(val_df)
            y_val = val_df[target_col].to_numpy()
            base_val = self._get_anchor_rates(val_df)
            pred_delta = regressor.predict(X_val.to_numpy())
            pred_y = base_val + pred_delta
            residuals = y_val - pred_y
            rmse = float(np.sqrt(np.mean(residuals ** 2)))
        else:
            pred_delta = regressor.predict(X_tr.to_numpy())
            pred_y = base_tr + pred_delta
            residuals = y_tr - pred_y
            rmse = float(np.sqrt(np.mean(residuals ** 2)))

        self.residual_rmse[h] = max(25.0, rmse)
        self.is_fitted = True
        return self

    def fit_all_horizons(
        self,
        train_df: pd.DataFrame,
        val_df: Optional[pd.DataFrame] = None,
        horizons: List[int] = [7, 14, 28],
    ):
        """Fits models across all target forecast horizons."""
        for h in horizons:
            t_col = f"target_t_plus_{h}d"
            if t_col in train_df.columns:
                self.horizon_days = h
                self.fit(train_df, target_col=t_col, val_df=val_df)
        self.is_fitted = True
        return self

    def predict(self, df: pd.DataFrame, horizon_days: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Returns (point_predictions, lower_bounds, upper_bounds).
        Uncertainty bounds use empirical 95% confidence interval (+/- 1.96 * RMSE_val).
        """
        h = horizon_days or self.horizon_days
        # Fallback to closest trained horizon if exact horizon is missing
        if h not in self.models:
            if self.models:
                h = min(self.models.keys(), key=lambda k: abs(k - h))
            else:
                raise RuntimeError("FreightForecastModel has not been fitted.")

        X = self._prepare_X(df)
        base = self._get_anchor_rates(df)
        pred_delta = self.models[h].predict(X.to_numpy())
        point = base + pred_delta

        # 95% empirical interval (+/- 1.96 * RMSE_val)
        spread = 1.96 * self.residual_rmse.get(h, 75.0)
        # Minimum uncertainty buffer based on horizon distance
        min_spread = point * (0.015 + (h / 30.0) * 0.02)
        spread = np.maximum(spread, min_spread)

        lower = point - spread
        upper = point + spread

        # Enforce consistency: lower <= point <= upper
        lower = np.minimum(lower, point * 0.99)
        upper = np.maximum(upper, point * 1.01)
        return point, lower, upper

