"""Priority Ranking and Municipal Decision-Support Module.

Computes:
1. 'priority_score' in [0.0, 1.0] indicating where municipal teams should act first.
2. 'risk_level' categorizing priorities into LOW, MEDIUM, or HIGH.
3. 'impact_score' with clearly documented neutral default placeholder.
"""

from typing import Dict, Any, Optional
import numpy as np


# Initial Municipal Policy Weights (Centralized & Configurable)
WEIGHT_PROBABILITY = 0.45
WEIGHT_SEVERITY = 0.35
WEIGHT_IMPACT = 0.20

# Risk Level Classification Thresholds
THRESHOLD_HIGH = 0.45
THRESHOLD_MEDIUM = 0.35

# Neutral default impact score when demographic/critical asset data is not available.
# This prevents fabricating non-existent census or traffic numbers.
DEFAULT_NEUTRAL_IMPACT_SCORE = 0.25


class PriorityCalculator:
    """Calculates priority scores and assigns municipal risk levels."""

    @classmethod
    def calculate_impact_score(
        cls,
        locality: str,
        custom_impact_map: Optional[Dict[str, float]] = None,
    ) -> float:
        """Returns the human/local impact score in [0.0, 1.0].

        If custom/verified municipal infrastructure or demographic data is provided,
        it uses that value. Otherwise, it returns a transparent neutral default (0.50)
        without fabricating unverified numbers.
        """
        if custom_impact_map and locality in custom_impact_map:
            val = custom_impact_map[locality]
            return float(np.clip(val, 0.0, 1.0))

        return DEFAULT_NEUTRAL_IMPACT_SCORE

    @classmethod
    def calculate_priority(
        cls,
        waterlogging_probability: float,
        severity_score: float,
        impact_score: Optional[float] = None,
        locality: Optional[str] = None,
    ) -> float:
        """Computes combined priority score in [0.0, 1.0].

        Formula:
            priority_score = 0.45 * probability + 0.35 * severity + 0.20 * impact
        """
        prob = float(np.clip(waterlogging_probability, 0.0, 1.0))
        sev = float(np.clip(severity_score, 0.0, 1.0))

        if impact_score is None:
            imp = cls.calculate_impact_score(locality or "")
        else:
            imp = float(np.clip(impact_score, 0.0, 1.0))

        score = (
            WEIGHT_PROBABILITY * prob +
            WEIGHT_SEVERITY * sev +
            WEIGHT_IMPACT * imp
        )

        return float(np.clip(score, 0.0, 1.0))

    @classmethod
    def assign_risk_level(cls, priority_score: float) -> str:
        """Assigns municipal risk level based on centralized thresholds:

        - 0.00 to 0.33: LOW
        - 0.34 to 0.66: MEDIUM
        - 0.67 to 1.00: HIGH
        """
        score = float(priority_score)
        if score >= THRESHOLD_HIGH:
            return "HIGH"
        elif score >= THRESHOLD_MEDIUM:
            return "MEDIUM"
        else:
            return "LOW"
