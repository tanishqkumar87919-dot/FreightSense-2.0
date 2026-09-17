import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_canonical_training_series(days: int = 365 * 3) -> pd.DataFrame:
    """
    Generates a 3-year daily continuous dataset for the 3 main canonical container corridors:
    - route-sha-rot (Shanghai - Rotterdam)
    - route-sha-lax (Shanghai - Los Angeles)
    - route-rot-nyc (Rotterdam - New York)
    Includes realistic seasonality (Q3 peak), bunker price correlation, and port dwell friction.
    """
    np.random.seed(42)
    end_date = datetime(2026, 9, 14)
    start_date = end_date - timedelta(days=days)
    dates = pd.date_range(start=start_date, end=end_date, freq="D")

    records = []
    for dt in dates:
        day_of_year = dt.timetuple().tm_yday
        # Seasonal cycle: peaks in Aug-Sep (day 210-270)
        seasonal_factor = 1.0 + 0.18 * np.sin(2 * np.pi * (day_of_year - 90) / 365.0)

        # Macro fuel proxy with random walk
        bunker_fuel = 610.0 + 40.0 * np.sin(2 * np.pi * day_of_year / 180.0) + np.random.normal(0, 5)

        for route_id, base_rate, mean_congestion in [
            ("route-sha-rot", 4180.0, 72.0),
            ("route-sha-lax", 4890.0, 58.0),
            ("route-rot-nyc", 1980.0, 34.0),
        ]:
            noise = np.random.normal(0, 25.0)
            congestion = float(np.clip(mean_congestion + np.random.normal(0, 6.0), 10, 99))
            rate = (base_rate * seasonal_factor) + (bunker_fuel - 600.0) * 0.8 + (congestion - 50.0) * 4.0 + noise

            records.append({
                "date": dt,
                "route_id": route_id,
                "spot_rate_usd": round(float(rate), 2),
                "bunker_fuel_usd": round(float(bunker_fuel), 2),
                "congestion_index": round(congestion, 1),
                "canal_transits": int(np.random.normal(880, 20)),
            })

    return pd.DataFrame(records)
