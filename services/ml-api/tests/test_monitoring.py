import pytest
import numpy as np
from app.ml.monitoring import DriftMonitor

def test_drift_monitor_psi():
    np.random.seed(42)
    base = np.random.normal(100, 10, 1000)
    # Similar distribution
    same = np.random.normal(100, 10, 1000)
    psi_low = DriftMonitor.calculate_psi(base, same)
    assert psi_low < 0.1, f"Expected low PSI for similar distribution, got {psi_low}"

    # Drastically shifted distribution
    shifted = np.random.normal(150, 15, 1000)
    psi_high = DriftMonitor.calculate_psi(base, shifted)
    assert psi_high >= 0.2, f"Expected high PSI for shifted distribution, got {psi_high}"
