import logging
from typing import List
from datetime import datetime, timezone
from app.ingestion.base import NormalizedObservation

logger = logging.getLogger(__name__)

class DataValidator:
    """Quality gates and validation checks for ingested observations."""

    # Reasonable domain bounds for maritime metrics
    METRIC_BOUNDS = {
        "spot_rate_usd": (100.0, 35000.0),       # Freight rate per FEU ($100 - $35,000)
        "crude_oil_usd": (10.0, 300.0),          # Crude oil per barrel ($10 - $300)
        "bunker_fuel_usd": (150.0, 2500.0),      # Bunker price per mt / barrel
        "port_congestion_index": (0.0, 100.0),    # Congestion score (0 - 100)
        "average_dwell_days": (0.1, 45.0),       # Port yard dwell (0.1 - 45 days)
        "vessel_speed_knots": (0.0, 40.0),       # Commercial vessel speed (0 - 40 kts)
        "transit_days": (0.5, 90.0),             # Ocean corridor transit days
        "annual_throughput_m_teu": (0.01, 100.0),# Port annual throughput in million TEU
        "wave_height_meters": (0.0, 30.0),       # Ocean significant wave height
        "wind_speed_knots": (0.0, 150.0),        # Wind speed
        "canal_transits_monthly": (100, 3000),   # Panama/Suez monthly transits
        "trade_value_usd_m": (0.0, 1e8),         # Bilateral trade value
    }

    @classmethod
    def validate_observations(cls, observations: List[NormalizedObservation]) -> List[NormalizedObservation]:
        """Runs quality checks on each observation, quarantining failing records."""
        checked = []
        for obs in observations:
            quarantined = False
            reason = None

            # 1. Null / NaN check
            if obs.value is None or (isinstance(obs.value, float) and obs.value != obs.value):
                quarantined = True
                reason = f"Missing/NaN value for metric {obs.metric_name}"

            # 2. Timestamp sanity check (must be timezone-aware UTC and not far into the future)
            elif obs.observation_timestamp > datetime.now(timezone.utc):
                quarantined = True
                reason = f"Future observation timestamp: {obs.observation_timestamp.isoformat()}"

            # 3. Domain range checks
            elif obs.metric_name in cls.METRIC_BOUNDS:
                min_val, max_val = cls.METRIC_BOUNDS[obs.metric_name]
                if obs.value < min_val or obs.value > max_val:
                    quarantined = True
                    reason = f"Value {obs.value} outside bounds [{min_val}, {max_val}] for {obs.metric_name}"

            # 4. Geospatial coordinate checks if coordinates present
            if not quarantined and "latitude" in obs.extra_attributes and "longitude" in obs.extra_attributes:
                lat = obs.extra_attributes.get("latitude")
                lon = obs.extra_attributes.get("longitude")
                if lat is not None and (lat < -90.0 or lat > 90.0):
                    quarantined = True
                    reason = f"Latitude {lat} out of range [-90, 90]"
                elif lon is not None and (lon < -180.0 or lon > 180.0):
                    quarantined = True
                    reason = f"Longitude {lon} out of range [-180, 180]"

            if quarantined:
                obs.quarantined = True
                obs.quarantine_reason = reason
                obs.quality_score = 0.0
                logger.warning(
                    "Quarantined observation from %s for %s (%s): %s",
                    obs.source_id,
                    obs.entity_id,
                    obs.metric_name,
                    reason,
                )
            else:
                obs.quality_score = 1.0

            checked.append(obs)
        return checked
