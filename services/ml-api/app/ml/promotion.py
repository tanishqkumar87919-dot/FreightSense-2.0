import logging
from typing import Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

class PromotionEngine:
    """
    Evaluates candidate model performance against the production champion.
    Requires meeting threshold gains without unacceptable regressions on secondary metrics.
    """

    @classmethod
    def evaluate_promotion(
        cls,
        champion_metrics: Dict[str, float],
        candidate_metrics: Dict[str, float],
    ) -> Tuple[bool, str]:
        """
        Decision policy:
        1. Candidate MAE must be lower than or within 2% of Champion MAE.
        2. Candidate Directional Accuracy must not drop by more than 1.5 percentage points.
        3. Candidate Interval Coverage must stay above 90.0%.
        4. Auto-promotion flag must be verified.
        """
        champ_mae = champion_metrics.get("mae", float("inf"))
        cand_mae = candidate_metrics.get("mae", float("inf"))

        champ_dir = champion_metrics.get("directional_accuracy", 0.0)
        cand_dir = candidate_metrics.get("directional_accuracy", 0.0)

        cand_cov = candidate_metrics.get("interval_coverage", 0.0)

        # Safety Check 1: Coverage calibration
        if cand_cov < 90.0:
            return False, f"Rejected: Candidate interval coverage ({cand_cov}%) fell below 90.0% safety threshold."

        # Safety Check 2: Directional regression
        if (champ_dir - cand_dir) > 1.5:
            return False, f"Rejected: Candidate directional accuracy ({cand_dir}%) regressed by >1.5% compared to champion ({champ_dir}%)."

        # Primary Metric Check: MAE
        mae_delta_pct = ((cand_mae - champ_mae) / champ_mae) * 100.0
        if cand_mae < champ_mae:
            reason = f"Approved: Candidate MAE ({cand_mae:.2f}) outperformed Champion ({champ_mae:.2f}) by {abs(mae_delta_pct):.2f}%."
            if not settings.AUTO_PROMOTION_ENABLED:
                return False, f"Promotable, but manual gate active (AUTO_PROMOTION_ENABLED=false). Details: {reason}"
            return True, reason
        elif cand_mae <= champ_mae * 1.02:
            return False, f"Challenger retained in shadow mode: MAE ({cand_mae:.2f}) within 2% of champion, but does not strictly beat it."
        else:
            return False, f"Rejected: Candidate MAE ({cand_mae:.2f}) is worse than champion ({champ_mae:.2f})."
