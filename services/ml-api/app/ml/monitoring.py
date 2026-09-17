import numpy as np
import pandas as pd
from typing import Dict, List, Any

class DriftMonitor:
    """Calculates Population Stability Index (PSI) and tracking metrics for features and predictions."""

    @staticmethod
    def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
        """
        Calculate Population Stability Index (PSI) between reference baseline and current production distribution.
        PSI < 0.1: No significant shift
        0.1 <= PSI < 0.2: Moderate shift (flag for review)
        PSI >= 0.2: Significant drift (triggers retraining alert)
        """
        expected = np.asarray(expected, dtype=float)
        actual = np.asarray(actual, dtype=float)

        expected = expected[~np.isnan(expected)]
        actual = actual[~np.isnan(actual)]

        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        # Percentile bucket boundaries from expected distribution
        percentiles = np.linspace(0, 100, num_buckets + 1)
        breakpoints = np.percentile(expected, percentiles)
        breakpoints[0] -= 1e-5
        breakpoints[-1] += 1e-5

        # Count frequencies in each bucket
        expected_counts = np.histogram(expected, bins=breakpoints)[0]
        actual_counts = np.histogram(actual, bins=breakpoints)[0]

        # Convert to percentages with epsilon smoothing
        expected_pct = np.maximum(expected_counts / len(expected), 1e-4)
        actual_pct = np.maximum(actual_counts / len(actual), 1e-4)

        # PSI formula: sum((Actual - Expected) * ln(Actual / Expected))
        psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(round(psi_value, 4))

    @classmethod
    def evaluate_features_drift(cls, baseline_df: pd.DataFrame, current_df: pd.DataFrame, feature_cols: List[str]) -> Dict[str, Any]:
        drift_report = {}
        for col in feature_cols:
            if col in baseline_df.columns and col in current_df.columns:
                psi = cls.calculate_psi(baseline_df[col].to_numpy(), current_df[col].to_numpy())
                status = "stable" if psi < 0.1 else ("warning" if psi < 0.2 else "drift_detected")
                drift_report[col] = {
                    "psi": psi,
                    "status": status,
                }
        return drift_report
