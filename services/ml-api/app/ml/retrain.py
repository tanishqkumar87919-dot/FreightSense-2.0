import argparse
import logging
from app.config import settings
from app.ml.train import run_training
from app.ml.registry import ModelRegistry

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ml_retrain")

def run_retraining(reason: str = "scheduled"):
    logger.info("Retraining job triggered with reason: %s", reason)
    
    # Check retraining feature flag
    if not settings.RETRAINING_ENABLED and reason != "manual":
        logger.info("Continuous retraining is currently disabled via flag (RETRAINING_ENABLED=false). Aborting.")
        return False, "Retraining disabled via environment configuration."

    logger.info("Starting retraining pipeline across primary forecasting horizons (7D, 30D)...")
    try:
        art_7d = run_training(target="freight_rate", horizon=7)
        art_30d = run_training(target="freight_rate", horizon=30)
        logger.info("Continuous retraining completed successfully. Generated artifacts: %s, %s", art_7d, art_30d)
        return True, "Retraining completed successfully."
    except Exception as exc:
        logger.exception("Retraining pipeline encountered an error: %s", exc)
        return False, str(exc)

def main():
    parser = argparse.ArgumentParser(description="FreightSense Continuous Retraining Trigger")
    parser.add_argument("--reason", type=str, default="scheduled", help="Retraining trigger reason: scheduled, drift, degradation, manual")
    args = parser.parse_args()

    success, msg = run_retraining(reason=args.reason)
    if not success:
        logger.warning("Retraining status: %s", msg)

if __name__ == "__main__":
    main()
