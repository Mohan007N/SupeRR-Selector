"""Configuration and constants for the analytics engine."""

from typing import Dict, Any

# Rating parameters (matches frontend src/utils/stats.js)
RATING_CONFIG = {
    "scale": 100,
    "index_limits": {"min": 0.5, "max": 1.5},
    "batting": {
        "prior_balls": 100,
        "weight_strike_rate": 0.6,
        "weight_dismissal": 0.4
    },
    "bowling": {
        "prior_balls": 100,
        "weight_economy": 0.55,
        "weight_wickets": 0.45
    }
}

# Confidence thresholds
CONFIDENCE_THRESHOLDS = {
    "batting": {"high": 150, "medium": 75},
    "bowling": {"high": 220, "medium": 110}
}

# Minimum pressure balls required
MIN_PRESSURE_BALLS = {"batting": 60, "bowling": 40}

# Pressure index configuration (matches frontend src/utils/pressure.js)
TOTAL_BALLS = 120

DEFAULT_PRESSURE_CONFIG = {
    "first": {
        "weights": {"rate": 30, "wickets": 40, "stage": 30},
        "thresholds": {"low_max": 30, "medium_max": 55}
    },
    "second": {
        "weights": {"rate": 50, "wickets": 25, "stage": 25},
        "thresholds": {"low_max": 33, "medium_max": 60}
    }
}

RATE_REFERENCE = {
    "par_rate": 8.5,
    "slow_rate": 5,
    "chase_easy": 6,
    "chase_hard": 14
}

# Dataset file paths - UPDATE THESE WHEN YOU ADD YOUR DATA
DATA_CONFIG = {
    "deliveries_file": "../Data Pack/ball_by_ball.csv",  # Ball-by-ball data
    "matches_file": "../Data Pack/matches.csv",  # Match metadata
    "teams_file": "../Data Pack/teams.csv",  # Teams data
    "player_mapping_file": "../Data Pack/competition_team_player_mapping.csv",  # Player-team mapping
    "competitions_file": "../Data Pack/competitions.csv",  # Competitions data
    "use_demo": False  # Set to False when real data is available
}

# Age filter for young talents (birth year)
YOUNGEST_TALENT_CUTOFF = 1995  # Players born after 1995 (adjust as needed)
