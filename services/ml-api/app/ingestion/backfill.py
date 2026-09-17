import argparse
import sys
import logging
from typing import List
from app.ingestion.connectors import CONNECTOR_MAP
from app.ingestion.base import IngestionResult

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("backfill")

def run_backfill(sources: List[str], start_date: str = "2010-01-01", end_date: str = "2026-12-31") -> List[IngestionResult]:
    """Execute backfill pipeline across specified source connectors."""
    results = []
    selected = list(CONNECTOR_MAP.keys()) if "all" in sources else sources

    logger.info("Starting historical data backfill for sources: %s", selected)
    for src in selected:
        if src not in CONNECTOR_MAP:
            logger.warning("Unknown source connector: %s. Skipping.", src)
            continue
        
        connector_cls = CONNECTOR_MAP[src]
        connector = connector_cls()
        logger.info("Executing connector '%s' (%s)...", connector.name, connector.source_id)
        res = connector.run(start_date=start_date, end_date=end_date)
        results.append(res)
        logger.info(
            "--> Connector %s finished: %d valid observations, %d quarantined, duration=%dms",
            src,
            res.records_ingested,
            res.records_quarantined,
            res.duration_ms,
        )

    total_ingested = sum(r.records_ingested for r in results)
    total_quarantined = sum(r.records_quarantined for r in results)
    logger.info("Historical backfill completed. Total valid: %d, Total quarantined: %d", total_ingested, total_quarantined)
    return results

def main():
    parser = argparse.ArgumentParser(description="FreightSense 2.0 Historical Data Backfill Engine")
    parser.add_argument("--source", type=str, default="all", help="Source connector name (unctad, comtrade, worldbank, noaa, baltic, marinetraffic, or 'all')")
    parser.add_argument("--start", type=str, default="2010-01-01", help="Start date in YYYY-MM-DD")
    parser.add_argument("--end", type=str, default="2026-12-31", help="End date in YYYY-MM-DD")
    args = parser.parse_args()

    sources = [s.strip() for s in args.source.split(",")]
    run_backfill(sources=sources, start_date=args.start, end_date=args.end)

if __name__ == "__main__":
    main()
