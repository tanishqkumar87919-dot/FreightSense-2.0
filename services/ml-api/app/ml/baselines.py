import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

class NaiveLastValueModel:
    """Carries forward the latest observed spot rate (t-1)."""
    def __init__(self):
        self.name = "Naive Last Value"
        self.version = "v1.0"

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        for col in ["rate_lag_1w", "rate_lag_1d"]:
            if col in X.columns:
                return X[col].to_numpy()
        raise KeyError("rate_lag_1w or rate_lag_1d column required for NaiveLastValueModel")

class MovingAverageModel:
    """Rolling window mean baseline."""
    def __init__(self, window_col: Optional[str] = None):
        self.name = f"Rolling Moving Average"
        self.version = "v1.0"
        self.window_col = window_col

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        col = self.window_col
        if col and col in X.columns:
            return X[col].to_numpy()
        for c in ["rolling_mean_4w", "rolling_mean_7d", "rate_lag_1w", "rate_lag_1d"]:
            if c in X.columns:
                return X[c].to_numpy()
        raise KeyError("rolling mean column required for MovingAverageModel")

class ExponentialSmoothingModel:
    """Simple Exponential Smoothing baseline."""
    def __init__(self, alpha: float = 0.3):
        self.name = f"Exponential Smoothing (alpha={alpha})"
        self.version = "v1.0"
        self.alpha = alpha

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        col1 = "rate_lag_1w" if "rate_lag_1w" in X.columns else "rate_lag_1d"
        col2 = "rate_lag_2w" if "rate_lag_2w" in X.columns else ("rate_lag_7d" if "rate_lag_7d" in X.columns else col1)
        if col1 in X.columns:
            y1 = X[col1].to_numpy()
            y2 = X[col2].to_numpy() if col2 in X.columns else y1
            return self.alpha * y1 + (1.0 - self.alpha) * y2
        raise KeyError("rate lag column required for ExponentialSmoothingModel")

class SeasonalNaiveModel:
    """Carries forward the seasonal lag (e.g. t-4 for monthly or t-7 for weekly)."""
    def __init__(self, lag_col: Optional[str] = None):
        self.name = f"Seasonal Naive"
        self.version = "v1.0"
        self.lag_col = lag_col

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        col = self.lag_col
        fallback = "rate_lag_1w" if "rate_lag_1w" in X.columns else "rate_lag_1d"
        if col and col in X.columns:
            return X[col].fillna(X[fallback]).to_numpy()
        for c in ["rate_lag_4w", "rate_lag_7d"]:
            if c in X.columns:
                return X[c].fillna(X[fallback]).to_numpy()
        return X[fallback].to_numpy()

