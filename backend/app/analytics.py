"""Core analytics engine - converts ball-by-ball data into player ratings."""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from .config import (
    RATING_CONFIG, CONFIDENCE_THRESHOLDS, MIN_PRESSURE_BALLS,
    DEFAULT_PRESSURE_CONFIG, RATE_REFERENCE, TOTAL_BALLS
)


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp value between min and max."""
    return max(min_val, min(max_val, value))


def confidence_level(player_type: str, pressure_balls: int) -> str:
    """Determine confidence level based on pressure balls faced/bowled."""
    limits = CONFIDENCE_THRESHOLDS[player_type]
    if pressure_balls >= limits["high"]:
        return "High"
    elif pressure_balls >= limits["medium"]:
        return "Medium"
    else:
        return "Low"


def reliability_percent(player_type: str, pressure_balls: int) -> float:
    """Calculate reliability percentage."""
    prior = RATING_CONFIG[player_type]["prior_balls"]
    return (pressure_balls / (pressure_balls + prior)) * 100


def rate_component(innings: str, rate: float) -> float:
    """Calculate rate component of pressure index."""
    if innings == "first":
        par = RATE_REFERENCE["par_rate"]
        slow = RATE_REFERENCE["slow_rate"]
        return clamp((par - rate) / (par - slow), 0, 1)
    else:
        easy = RATE_REFERENCE["chase_easy"]
        hard = RATE_REFERENCE["chase_hard"]
        return clamp((rate - easy) / (hard - easy), 0, 1)


def pressure_index(innings: str, state: Dict, config: Dict) -> float:
    """Calculate pressure index for a delivery state."""
    weights = config["weights"]
    total_weight = sum(weights.values())
    
    if total_weight <= 0:
        return 0
    
    f_rate = rate_component(innings, state["rate"])
    f_wickets = clamp(state["wickets_lost"] / 10, 0, 1)
    f_stage = clamp(1 - state["balls_remaining"] / TOTAL_BALLS, 0, 1)
    
    weighted = (
        weights["rate"] * f_rate +
        weights["wickets"] * f_wickets +
        weights["stage"] * f_stage
    )
    
    return (100 * weighted) / total_weight


def pressure_level(index: float, thresholds: Dict) -> str:
    """Determine pressure level from index."""
    if index < thresholds["low_max"]:
        return "Low"
    elif index < thresholds["medium_max"]:
        return "Medium"
    else:
        return "High"


def calculate_batting_metrics(totals: Dict, baseline: Dict) -> Dict:
    """Calculate all batting metrics for a player."""
    has_balls = totals["balls"] > 0
    
    # Pressure vs normal metrics
    pressure_sr = (totals["p_runs"] * 100 / totals["p_balls"]) if totals["p_balls"] > 0 else None
    normal_sr = (totals["n_runs"] * 100 / totals["n_balls"]) if totals["n_balls"] > 0 else None
    
    pressure_improvement = None
    if pressure_sr is not None and normal_sr is not None:
        pressure_improvement = pressure_sr - normal_sr
    
    # Calculate rating
    rating = None
    if totals["p_balls"] > 0 and baseline.get("pressure_strike_rate"):
        k = RATING_CONFIG["batting"]["prior_balls"]
        league_sr = baseline["pressure_strike_rate"]
        league_dr = baseline.get("pressure_dismissal_per_ball", 0)
        
        adjusted_sr = ((totals["p_runs"] + (k * league_sr / 100)) / (totals["p_balls"] + k)) * 100
        adjusted_dr = (totals["p_dismissals"] + k * league_dr) / (totals["p_balls"] + k)
        
        limits = RATING_CONFIG["index_limits"]
        sr_index = clamp(adjusted_sr / league_sr, limits["min"], limits["max"])
        
        dismiss_index = 1
        if adjusted_dr > 0 and league_dr > 0:
            dismiss_index = clamp(league_dr / adjusted_dr, limits["min"], limits["max"])
        
        score = (
            RATING_CONFIG["batting"]["weight_strike_rate"] * sr_index +
            RATING_CONFIG["batting"]["weight_dismissal"] * dismiss_index
        )
        rating = clamp(50 + RATING_CONFIG["scale"] * (score - 1), 0, 100)
    
    return {
        "matches": int(totals["matches"]),
        "runs": int(totals["runs"]),
        "balls": int(totals["balls"]),
        "dismissals": int(totals["dismissals"]),
        "strikeRate": float(totals["runs"] * 100 / totals["balls"]) if has_balls else None,
        "average": float(totals["runs"] / totals["dismissals"]) if totals["dismissals"] > 0 else None,
        "boundaryPct": float((totals["fours"] + totals["sixes"]) * 100 / totals["balls"]) if has_balls else None,
        "dismissalRate": float(totals["dismissals"] * 100 / totals["balls"]) if has_balls else None,
        "pressureBalls": int(totals["p_balls"]),
        "normalBalls": int(totals["n_balls"]),
        "pressureStrikeRate": float(pressure_sr) if pressure_sr is not None else None,
        "normalStrikeRate": float(normal_sr) if normal_sr is not None else None,
        "pressureImprovement": float(pressure_improvement) if pressure_improvement is not None else None,
        "pressureDismissalRate": float(totals["p_dismissals"] * 100 / totals["p_balls"]) if totals["p_balls"] > 0 else None,
        "normalDismissalRate": float(totals["n_dismissals"] * 100 / totals["n_balls"]) if totals["n_balls"] > 0 else None,
        "pressureBoundaryPct": float(totals["p_boundaries"] * 100 / totals["p_balls"]) if totals["p_balls"] > 0 else None,
        "normalBoundaryPct": float(totals["n_boundaries"] * 100 / totals["n_balls"]) if totals["n_balls"] > 0 else None,
        "rating": float(rating) if rating is not None else None,
        "reliability": float(reliability_percent("batting", totals["p_balls"])),
        "confidence": confidence_level("batting", totals["p_balls"])
    }


def calculate_bowling_metrics(totals: Dict, baseline: Dict) -> Dict:
    """Calculate all bowling metrics for a player."""
    has_balls = totals["balls"] > 0
    
    # Pressure vs normal metrics
    pressure_econ = (totals["p_runs"] * 6 / totals["p_balls"]) if totals["p_balls"] > 0 else None
    normal_econ = (totals["n_runs"] * 6 / totals["n_balls"]) if totals["n_balls"] > 0 else None
    
    improvement = None
    if pressure_econ is not None and normal_econ is not None:
        improvement = normal_econ - pressure_econ
    
    # Calculate rating
    rating = None
    if totals["p_balls"] > 0 and baseline.get("pressure_economy"):
        k = RATING_CONFIG["bowling"]["prior_balls"]
        league_econ = baseline["pressure_economy"]
        league_wr = baseline.get("pressure_wickets_per_ball", 0)
        
        adjusted_econ = ((totals["p_runs"] + (k * league_econ / 6)) / (totals["p_balls"] + k)) * 6
        adjusted_wr = (totals["p_wickets"] + k * league_wr) / (totals["p_balls"] + k)
        
        limits = RATING_CONFIG["index_limits"]
        econ_index = clamp(league_econ / adjusted_econ, limits["min"], limits["max"])
        
        wicket_index = 1
        if league_wr > 0:
            wicket_index = clamp(adjusted_wr / league_wr, limits["min"], limits["max"])
        
        score = (
            RATING_CONFIG["bowling"]["weight_economy"] * econ_index +
            RATING_CONFIG["bowling"]["weight_wickets"] * wicket_index
        )
        rating = clamp(50 + RATING_CONFIG["scale"] * (score - 1), 0, 100)
    
    return {
        "matches": int(totals["matches"]),
        "wickets": int(totals["wickets"]),
        "legalBalls": int(totals["balls"]),
        "runsConceded": int(totals["runs"]),
        "economy": float(totals["runs"] * 6 / totals["balls"]) if has_balls else None,
        "wicketRate": float(totals["wickets"] * 24 / totals["balls"]) if has_balls else None,
        "dotPct": float(totals["dots"] * 100 / totals["balls"]) if has_balls else None,
        "boundaryPctConceded": float(totals["boundaries"] * 100 / totals["balls"]) if has_balls else None,
        "pressureBalls": int(totals["p_balls"]),
        "normalBalls": int(totals["n_balls"]),
        "pressureWickets": int(totals["p_wickets"]),
        "pressureEconomy": float(pressure_econ) if pressure_econ is not None else None,
        "normalEconomy": float(normal_econ) if normal_econ is not None else None,
        "improvement": float(improvement) if improvement is not None else None,
        "pressureWicketRate": float(totals["p_wickets"] * 24 / totals["p_balls"]) if totals["p_balls"] > 0 else None,
        "normalWicketRate": float(totals["n_wickets"] * 24 / totals["n_balls"]) if totals["n_balls"] > 0 else None,
        "pressureDotPct": float(totals["p_dots"] * 100 / totals["p_balls"]) if totals["p_balls"] > 0 else None,
        "normalDotPct": float(totals["n_dots"] * 100 / totals["n_balls"]) if totals["n_balls"] > 0 else None,
        "pressureBoundaryPct": float(totals["p_boundaries"] * 100 / totals["p_balls"]) if totals["p_balls"] > 0 else None,
        "normalBoundaryPct": float(totals["n_boundaries"] * 100 / totals["n_balls"]) if totals["n_balls"] > 0 else None,
        "rating": float(rating) if rating is not None else None,
        "reliability": float(reliability_percent("bowling", totals["p_balls"])),
        "confidence": confidence_level("bowling", totals["p_balls"])
    }


class AnalyticsEngine:
    """Main analytics engine for processing ball-by-ball cricket data."""
    
    def __init__(self, deliveries_df: pd.DataFrame, matches_df: pd.DataFrame):
        """Initialize with deliveries and matches dataframes."""
        self.deliveries = deliveries_df
        self.matches = matches_df
        
        # Preprocess data
        self._preprocess()
    
    def _preprocess(self):
        """Preprocess and enrich the data."""
        # Add pressure flag to deliveries
        self.deliveries = self._tag_pressure_deliveries(self.deliveries)
        
        # Cache player lists
        self._cache_players()
    
    def _tag_pressure_deliveries(self, df: pd.DataFrame) -> pd.DataFrame:
        """Tag each delivery with pressure level based on match state."""
        # This is a simplified version - you can enhance based on actual match state
        df = df.copy()
        df["is_pressure"] = False
        
        # Example: tag deliveries in overs 16-20 or when 6+ wickets down as pressure
        # You should implement proper pressure index calculation based on match state
        if "over" in df.columns and "wickets_lost" in df.columns:
            df["is_pressure"] = (df["over"] >= 16) | (df["wickets_lost"] >= 6)
        
        return df
    
    def _cache_players(self):
        """Cache unique players from data."""
        self.batters = self.deliveries["batsman"].unique().tolist() if "batsman" in self.deliveries.columns else []
        self.bowlers = self.deliveries["bowler"].unique().tolist() if "bowler" in self.deliveries.columns else []
    
    def get_batting_baseline(self, filters: Dict) -> Dict:
        """Calculate league-wide batting baseline."""
        df = self._apply_filters(self.deliveries, filters)
        
        if df.empty:
            return {}
        
        pressure_df = df[df["is_pressure"] == True]
        normal_df = df[df["is_pressure"] == False]
        
        baseline = {
            "pressure_balls": len(pressure_df),
            "pressure_strike_rate": None,
            "pressure_dismissal_per_ball": None,
            "normal_strike_rate": None,
            "normal_dismissal_per_ball": None
        }
        
        if len(pressure_df) > 0:
            baseline["pressure_strike_rate"] = (pressure_df["batsman_runs"].sum() * 100) / len(pressure_df)
            baseline["pressure_dismissal_per_ball"] = pressure_df["is_wicket"].sum() / len(pressure_df)
        
        if len(normal_df) > 0:
            baseline["normal_strike_rate"] = (normal_df["batsman_runs"].sum() * 100) / len(normal_df)
            baseline["normal_dismissal_per_ball"] = normal_df["is_wicket"].sum() / len(normal_df)
        
        return baseline
    
    def get_bowling_baseline(self, filters: Dict) -> Dict:
        """Calculate league-wide bowling baseline."""
        df = self._apply_filters(self.deliveries, filters)
        
        if df.empty:
            return {}
        
        pressure_df = df[df["is_pressure"] == True]
        normal_df = df[df["is_pressure"] == False]
        
        baseline = {
            "pressure_balls": len(pressure_df),
            "pressure_economy": None,
            "pressure_wickets_per_ball": None,
            "normal_economy": None,
            "normal_wickets_per_ball": None
        }
        
        if len(pressure_df) > 0:
            baseline["pressure_economy"] = (pressure_df["total_runs"].sum() * 6) / len(pressure_df)
            baseline["pressure_wickets_per_ball"] = pressure_df["is_wicket"].sum() / len(pressure_df)
        
        if len(normal_df) > 0:
            baseline["normal_economy"] = (normal_df["total_runs"].sum() * 6) / len(normal_df)
            baseline["normal_wickets_per_ball"] = normal_df["is_wicket"].sum() / len(normal_df)
        
        return baseline
    
    def _apply_filters(self, df: pd.DataFrame, filters: Dict) -> pd.DataFrame:
        """Apply competition, season, and date filters."""
        filtered = df.copy()
        
        if filters.get("competition") and filters["competition"] != "All":
            filtered = filtered[filtered["competition"] == filters["competition"]]
        
        if filters.get("season") and filters["season"] != "All":
            filtered = filtered[filtered["season"] == int(filters["season"])]
        
        if filters.get("date_from"):
            filtered = filtered[filtered["match_date"] >= filters["date_from"]]
        
        if filters.get("date_to"):
            filtered = filtered[filtered["match_date"] <= filters["date_to"]]
        
        return filtered
    
    def get_player_batting_stats(self, player_id: str, filters: Dict) -> Dict:
        """Get batting statistics for a specific player."""
        df = self._apply_filters(self.deliveries, filters)
        player_df = df[df["batsman"] == player_id]
        
        if player_df.empty:
            return None
        
        pressure_df = player_df[player_df["is_pressure"] == True]
        normal_df = player_df[player_df["is_pressure"] == False]
        
        totals = {
            "matches": player_df["match_id"].nunique(),
            "balls": len(player_df),
            "runs": player_df["batsman_runs"].sum(),
            "fours": (player_df["batsman_runs"] == 4).sum(),
            "sixes": (player_df["batsman_runs"] == 6).sum(),
            "dismissals": player_df["is_wicket"].sum(),
            "p_balls": len(pressure_df),
            "p_runs": pressure_df["batsman_runs"].sum(),
            "p_dismissals": pressure_df["is_wicket"].sum(),
            "p_boundaries": ((pressure_df["batsman_runs"] == 4) | (pressure_df["batsman_runs"] == 6)).sum(),
            "n_balls": len(normal_df),
            "n_runs": normal_df["batsman_runs"].sum(),
            "n_dismissals": normal_df["is_wicket"].sum(),
            "n_boundaries": ((normal_df["batsman_runs"] == 4) | (normal_df["batsman_runs"] == 6)).sum()
        }
        
        return totals
    
    def get_player_bowling_stats(self, player_id: str, filters: Dict) -> Dict:
        """Get bowling statistics for a specific player."""
        df = self._apply_filters(self.deliveries, filters)
        player_df = df[df["bowler"] == player_id]
        
        if player_df.empty:
            return None
        
        pressure_df = player_df[player_df["is_pressure"] == True]
        normal_df = player_df[player_df["is_pressure"] == False]
        
        totals = {
            "matches": player_df["match_id"].nunique(),
            "balls": len(player_df),
            "runs": player_df["total_runs"].sum(),
            "wickets": player_df["is_wicket"].sum(),
            "dots": (player_df["total_runs"] == 0).sum(),
            "boundaries": ((player_df["batsman_runs"] == 4) | (player_df["batsman_runs"] == 6)).sum(),
            "p_balls": len(pressure_df),
            "p_runs": pressure_df["total_runs"].sum(),
            "p_wickets": pressure_df["is_wicket"].sum(),
            "p_dots": (pressure_df["total_runs"] == 0).sum(),
            "p_boundaries": ((pressure_df["batsman_runs"] == 4) | (pressure_df["batsman_runs"] == 6)).sum(),
            "n_balls": len(normal_df),
            "n_runs": normal_df["total_runs"].sum(),
            "n_wickets": normal_df["is_wicket"].sum(),
            "n_dots": (normal_df["total_runs"] == 0).sum(),
            "n_boundaries": ((normal_df["batsman_runs"] == 4) | (normal_df["batsman_runs"] == 6)).sum()
        }
        
        return totals
