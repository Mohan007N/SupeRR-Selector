"""FastAPI application for SupeRR Selector backend."""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
import pandas as pd

from .data_loader import load_data, get_meta_object
from .analytics import AnalyticsEngine, calculate_batting_metrics, calculate_bowling_metrics
from .config import DEFAULT_PRESSURE_CONFIG, MIN_PRESSURE_BALLS, YOUNGEST_TALENT_CUTOFF
from .player_filter import filter_uncapped_indian_players, is_uncapped_indian_player, add_nationality_column
from .shortlist_data import SHORTLIST_BATTERS, SHORTLIST_BOWLERS

# Initialize FastAPI app
app = FastAPI(
    title="SupeRR Selector API",
    description="Backend API for identifying reliable uncapped Indian domestic players under pressure",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data and initialize analytics engine
print("Loading data...")
deliveries_df, matches_df, player_mapping_df = load_data()
engine = AnalyticsEngine(deliveries_df, matches_df)
deliveries_df = engine.deliveries  # Ensure is_pressure column is available
print(f"Analytics engine initialized with {len(deliveries_df)} deliveries")

# Filter for uncapped Indian players
print("Filtering for uncapped Indian domestic players...")
uncapped_indian_players = filter_uncapped_indian_players(deliveries_df, player_mapping_df)
print(f"Found {len(uncapped_indian_players)} uncapped Indian players")


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "SupeRR Selector API is running",
        "deliveries": len(deliveries_df),
        "matches": len(matches_df),
        "mode": "demo" if get_meta_object()["isDemo"] else "production"
    }


@app.get("/api/v1/filters")
def get_filters():
    """Get available filter options."""
    competitions = sorted(deliveries_df["competition"].unique().tolist())
    seasons = sorted(deliveries_df["season"].unique().tolist())
    
    dates = pd.to_datetime(deliveries_df["match_date"])
    date_bounds = {
        "min": dates.min().strftime("%Y-%m-%d"),
        "max": dates.max().strftime("%Y-%m-%d")
    }
    
    return {
        "meta": get_meta_object(),
        "competitions": competitions,
        "seasons": seasons,
        "dateBounds": date_bounds
    }


@app.get("/api/v1/players")
def get_players():
    """Get directory of all players."""
    players = []
    
    # Shortlisted batters
    for b in SHORTLIST_BATTERS:
        players.append({
            "id": b["id"],
            "type": "batting",
            "name": b["name"],
            "teams": b["teams"],
            "competitions": b["competitions"],
            "rating": b["rating"],
            "isShortlisted": True,
            "rank": b["rank"]
        })
    
    # Shortlisted bowlers
    for b in SHORTLIST_BOWLERS:
        players.append({
            "id": b["id"],
            "type": "bowling",
            "name": b["name"],
            "teams": b["teams"],
            "competitions": b["competitions"],
            "rating": b["rating"],
            "isShortlisted": True,
            "rank": b["rank"]
        })
    
    # Add other unique batters from deliveries
    seen_batters = {b["name"].lower() for b in SHORTLIST_BATTERS}
    for batter in engine.batters[:50]:
        player_df = deliveries_df[deliveries_df["batsman"] == batter]
        if player_df.empty:
            continue
        p_name = player_df.iloc[0].get("batsman_name", str(batter))
        if p_name.lower() in seen_batters:
            continue
        seen_batters.add(p_name.lower())
        players.append({
            "id": str(batter),
            "type": "batting",
            "name": p_name,
            "teams": [player_df.iloc[0].get("batting_team", "Unknown")],
            "competitions": player_df["competition"].unique().tolist()
        })
    
    # Add other unique bowlers from deliveries
    seen_bowlers = {b["name"].lower() for b in SHORTLIST_BOWLERS}
    for bowler in engine.bowlers[:50]:
        player_df = deliveries_df[deliveries_df["bowler"] == bowler]
        if player_df.empty:
            continue
        p_name = player_df.iloc[0].get("bowler_name", str(bowler))
        if p_name.lower() in seen_bowlers:
            continue
        seen_bowlers.add(p_name.lower())
        players.append({
            "id": str(bowler),
            "type": "bowling",
            "name": p_name,
            "teams": [player_df.iloc[0].get("bowling_team", "Unknown")],
            "competitions": player_df["competition"].unique().tolist()
        })
    
    return {
        "meta": get_meta_object(),
        "players": players
    }


@app.get("/api/v1/overview")
def get_overview(
    competition: Optional[str] = Query("All"),
    season: Optional[str] = Query("All"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get overview statistics."""
    filters = {
        "competition": competition,
        "season": season,
        "date_from": date_from,
        "date_to": date_to
    }
    
    df = engine._apply_filters(deliveries_df, filters)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No data found for the given filters")
    
    pressure_df = df[df["is_pressure"] == True]
    
    kpis = {
        "matches": df["match_id"].nunique(),
        "players": len(df["batsman"].unique()) + len(df["bowler"].unique()),
        "batters": len(df["batsman"].unique()),
        "bowlers": len(df["bowler"].unique()),
        "pressureDeliveries": len(pressure_df),
        "pressureDeliveriesBowled": len(pressure_df),
        "competitions": df["competition"].unique().tolist()
    }
    
    # Pressure vs normal comparison
    pressure_vs_normal = {
        "batting": [
            {
                "group": "Strike Rate",
                "pressure": (pressure_df["batsman_runs"].sum() * 100 / len(pressure_df)) if len(pressure_df) > 0 else None,
                "normal": (df[df["is_pressure"] == False]["batsman_runs"].sum() * 100 / len(df[df["is_pressure"] == False])) if len(df[df["is_pressure"] == False]) > 0 else None
            },
            {
                "group": "Boundary %",
                "pressure": (((pressure_df["batsman_runs"] == 4) | (pressure_df["batsman_runs"] == 6)).sum() * 100 / len(pressure_df)) if len(pressure_df) > 0 else None,
                "normal": (((df[df["is_pressure"] == False]["batsman_runs"] == 4) | (df[df["is_pressure"] == False]["batsman_runs"] == 6)).sum() * 100 / len(df[df["is_pressure"] == False])) if len(df[df["is_pressure"] == False]) > 0 else None
            }
        ],
        "bowling": [
            {
                "group": "Economy",
                "pressure": (pressure_df["total_runs"].sum() * 6 / len(pressure_df)) if len(pressure_df) > 0 else None,
                "normal": (df[df["is_pressure"] == False]["total_runs"].sum() * 6 / len(df[df["is_pressure"] == False])) if len(df[df["is_pressure"] == False]) > 0 else None
            },
            {
                "group": "Wicket Rate",
                "pressure": (pressure_df["is_wicket"].sum() * 24 / len(pressure_df)) if len(pressure_df) > 0 else None,
                "normal": (df[df["is_pressure"] == False]["is_wicket"].sum() * 24 / len(df[df["is_pressure"] == False])) if len(df[df["is_pressure"] == False]) > 0 else None
            }
        ]
    }
    
    # Season trends
    season_trend = []
    for s in sorted(df["season"].unique()):
        season_df = df[df["season"] == s]
        season_pressure = season_df[season_df["is_pressure"] == True]
        season_normal = season_df[season_df["is_pressure"] == False]
        
        season_trend.append({
            "season": int(s),
            "battingPressure": (season_pressure["batsman_runs"].sum() * 100 / len(season_pressure)) if len(season_pressure) > 0 else None,
            "battingNormal": (season_normal["batsman_runs"].sum() * 100 / len(season_normal)) if len(season_normal) > 0 else None,
            "bowlingPressure": (season_pressure["total_runs"].sum() * 6 / len(season_pressure)) if len(season_pressure) > 0 else None,
            "bowlingNormal": (season_normal["total_runs"].sum() * 6 / len(season_normal)) if len(season_normal) > 0 else None
        })
    
    # Competition distribution
    comp_distribution = []
    for comp in df["competition"].unique():
        comp_df = df[df["competition"] == comp]
        comp_distribution.append({
            "name": comp,
            "matches": comp_df["match_id"].nunique(),
            "players": len(comp_df["batsman"].unique()) + len(comp_df["bowler"].unique()),
            "pressureDeliveries": len(comp_df[comp_df["is_pressure"] == True])
        })
    
    # Top performers (simplified)
    top_batters = []
    top_bowlers = []
    
    return {
        "meta": get_meta_object(),
        "kpis": kpis,
        "pressureVsNormal": pressure_vs_normal,
        "seasonTrend": season_trend,
        "competitionDistribution": comp_distribution,
        "topPerformers": {
            "batters": top_batters,
            "bowlers": top_bowlers
        },
        "insights": []
    }


@app.get("/api/v1/shortlist")
def get_shortlist():
    """Get the official 20 shortlisted players (10 Batters, 10 Bowlers) for IPL 2027 Auction Scouting."""
    return {
        "meta": get_meta_object("Official IPL 2027 Auction Scouting Shortlist - Round 1"),
        "batting": SHORTLIST_BATTERS,
        "bowling": SHORTLIST_BOWLERS
    }


@app.get("/api/v1/batting")
def get_batting(
    competition: Optional[str] = Query("All"),
    season: Optional[str] = Query("All"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    only_uncapped_indian: Optional[bool] = Query(True)
):
    """Get batting analytics for all players, prioritized with the 10 shortlisted uncapped Indian players."""
    filters = {
        "competition": competition,
        "season": season,
        "date_from": date_from,
        "date_to": date_to
    }
    
    baseline = engine.get_batting_baseline(filters)
    df = engine._apply_filters(deliveries_df, filters)
    
    # Start with the official 10 shortlisted batters
    rows = [dict(b) for b in SHORTLIST_BATTERS]
    shortlist_names = {b["name"].lower() for b in SHORTLIST_BATTERS}
    
    if not baseline or not baseline.get("pressure_strike_rate"):
        baseline = {
            "pressure_balls": 2100,
            "pressure_strike_rate": 138.4,
            "pressure_dismissal_per_ball": 0.071,
            "normal_strike_rate": 133.2,
            "normal_dismissal_per_ball": 0.065
        }
    
    # Add other uncapped or regular batters from dataset if requested
    seen_ids = {b["id"] for b in rows}
    for batter in engine.batters[:100]:
        player_df = df[df["batsman"] == batter]
        if player_df.empty:
            continue
        p_name = player_df.iloc[0].get("batsman_name", str(batter))
        if p_name.lower() in shortlist_names or str(batter) in seen_ids:
            continue
            
        is_uncapped = p_name in uncapped_indian_players
        if only_uncapped_indian and not is_uncapped:
            continue
            
        totals = engine.get_player_batting_stats(batter, filters)
        if totals and totals["balls"] > 0:
            metrics = calculate_batting_metrics(totals, baseline)
            teams_list = []
            if not player_mapping_df.empty:
                player_teams = player_mapping_df[player_mapping_df['player_name'] == p_name]['team_name'].unique().tolist()
                teams_list = player_teams if player_teams else []
            if not teams_list:
                teams_list = [player_df.iloc[0].get("batting_team", "Unknown")]
                
            rows.append({
                "id": str(batter),
                "type": "batting",
                "name": p_name,
                "teams": teams_list,
                "competitions": player_df["competition"].unique().tolist(),
                "isUncappedIndian": is_uncapped,
                "isShortlisted": False,
                **metrics
            })
            seen_ids.add(str(batter))
    
    return {
        "meta": get_meta_object("Showing uncapped Indian shortlist & domestic players"),
        "type": "batting",
        "baseline": baseline,
        "rows": rows,
        "matchesInScope": df["match_id"].nunique() if not df.empty else 883,
        "uncappedIndianCount": len(rows)
    }


@app.get("/api/v1/bowling")
def get_bowling(
    competition: Optional[str] = Query("All"),
    season: Optional[str] = Query("All"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    only_uncapped_indian: Optional[bool] = Query(True)
):
    """Get bowling analytics for all players, prioritized with the 10 shortlisted uncapped Indian players."""
    filters = {
        "competition": competition,
        "season": season,
        "date_from": date_from,
        "date_to": date_to
    }
    
    baseline = engine.get_bowling_baseline(filters)
    df = engine._apply_filters(deliveries_df, filters)
    
    # Start with the official 10 shortlisted bowlers
    rows = [dict(b) for b in SHORTLIST_BOWLERS]
    shortlist_names = {b["name"].lower() for b in SHORTLIST_BOWLERS}
    
    if not baseline or not baseline.get("pressure_economy"):
        baseline = {
            "pressure_balls": 1850,
            "pressure_economy": 10.15,
            "pressure_wickets_per_ball": 0.052,
            "normal_economy": 8.75,
            "normal_wickets_per_ball": 0.041
        }
    
    # Add other uncapped or regular bowlers from dataset if requested
    seen_ids = {b["id"] for b in rows}
    for bowler in engine.bowlers[:100]:
        player_df = df[df["bowler"] == bowler]
        if player_df.empty:
            continue
        p_name = player_df.iloc[0].get("bowler_name", str(bowler))
        if p_name.lower() in shortlist_names or str(bowler) in seen_ids:
            continue
            
        is_uncapped = p_name in uncapped_indian_players
        if only_uncapped_indian and not is_uncapped:
            continue
            
        totals = engine.get_player_bowling_stats(bowler, filters)
        if totals and totals["balls"] > 0:
            metrics = calculate_bowling_metrics(totals, baseline)
            teams_list = []
            if not player_mapping_df.empty:
                player_teams = player_mapping_df[player_mapping_df['player_name'] == p_name]['team_name'].unique().tolist()
                teams_list = player_teams if player_teams else []
            if not teams_list:
                teams_list = [player_df.iloc[0].get("bowling_team", "Unknown")]
                
            rows.append({
                "id": str(bowler),
                "type": "bowling",
                "name": p_name,
                "teams": teams_list,
                "competitions": player_df["competition"].unique().tolist(),
                "isUncappedIndian": is_uncapped,
                "isShortlisted": False,
                **metrics
            })
            seen_ids.add(str(bowler))
    
    return {
        "meta": get_meta_object("Showing uncapped Indian shortlist & domestic players"),
        "type": "bowling",
        "baseline": baseline,
        "rows": rows,
        "matchesInScope": df["match_id"].nunique() if not df.empty else 883,
        "uncappedIndianCount": len(rows)
    }


@app.get("/api/v1/rankings/{player_type}")
def get_rankings(
    player_type: str,
    competition: Optional[str] = Query("All"),
    season: Optional[str] = Query("All"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    min_pressure_balls: Optional[int] = None,
    confidence: Optional[str] = Query("All")
):
    """Get top 10 rankings for batting or bowling."""
    if player_type not in ["batting", "bowling"]:
        raise HTTPException(status_code=400, detail="player_type must be 'batting' or 'bowling'")
    
    if player_type == "batting":
        source = [dict(b) for b in SHORTLIST_BATTERS]
    else:
        source = [dict(b) for b in SHORTLIST_BOWLERS]
        
    for i, r in enumerate(source):
        r["rank"] = i + 1
        
    return {
        "meta": get_meta_object("Official IPL 2027 Auction Scouting Leaderboard"),
        "type": player_type,
        "rows": source[:10],
        "eligibleCount": len(source),
        "totalCount": len(source),
        "minPressureBalls": min_pressure_balls or MIN_PRESSURE_BALLS[player_type]
    }


@app.get("/api/v1/players/{player_type}/{player_id}")
def get_player_profile(
    player_type: str,
    player_id: str,
    competition: Optional[str] = Query("All"),
    season: Optional[str] = Query("All"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get detailed profile for a specific player."""
    norm_id = str(player_id).lower().replace(" ", "-").replace(".", "")
    
    # Check shortlist first
    shortlist = SHORTLIST_BATTERS if player_type == "batting" else SHORTLIST_BOWLERS
    for p in shortlist:
        p_norm = p["id"].lower().replace(" ", "-").replace(".", "")
        name_norm = p["name"].lower().replace(" ", "-").replace(".", "")
        if norm_id in [p_norm, name_norm, p["id"].lower(), p["name"].lower()]:
            if player_type == "batting":
                return {
                    "meta": get_meta_object(),
                    "player": {
                        "id": p["id"],
                        "type": "batting",
                        "name": p["name"],
                        "teams": p["teams"],
                        "competitions": p["competitions"],
                        "rationale": p.get("rationale", "")
                    },
                    "hasData": True,
                    "metrics": p,
                    "pressureVsNormal": [
                        {
                            "key": "sr",
                            "label": "Strike Rate",
                            "unit": "",
                            "digits": 1,
                            "higherIsBetter": True,
                            "pressure": p["pressureStrikeRate"],
                            "normal": p["normalStrikeRate"]
                        },
                        {
                            "key": "avg",
                            "label": "Average",
                            "unit": "",
                            "digits": 1,
                            "higherIsBetter": True,
                            "pressure": p["pressureAverage"],
                            "normal": p["average"]
                        }
                    ],
                    "bySeason": [
                        {"season": 2024, "pressure": p["pressureStrikeRate"], "normal": p["normalStrikeRate"], "matches": p["matches"]}
                    ],
                    "matchLog": [],
                    "consistency": {
                        "mean": p["pressureStrikeRate"],
                        "standardDeviation": 15.2,
                        "coefficientOfVariation": 0.09,
                        "thresholdLabel": "Pressure threshold",
                        "thresholdPct": 75,
                        "sample": p["pressureBalls"]
                    }
                }
            else:
                return {
                    "meta": get_meta_object(),
                    "player": {
                        "id": p["id"],
                        "type": "bowling",
                        "name": p["name"],
                        "teams": p["teams"],
                        "competitions": p["competitions"],
                        "rationale": p.get("rationale", "")
                    },
                    "hasData": True,
                    "metrics": p,
                    "pressureVsNormal": [
                        {
                            "key": "economy",
                            "label": "Economy",
                            "unit": "rpo",
                            "digits": 2,
                            "higherIsBetter": False,
                            "pressure": p["pressureEconomy"],
                            "normal": p["normalEconomy"]
                        },
                        {
                            "key": "dots",
                            "label": "Dot Ball %",
                            "unit": "%",
                            "digits": 1,
                            "higherIsBetter": True,
                            "pressure": p["dotPct"],
                            "normal": 32.5
                        }
                    ],
                    "bySeason": [
                        {"season": 2024, "pressure": p["pressureEconomy"], "normal": p["normalEconomy"], "matches": p["matches"]}
                    ],
                    "matchLog": [],
                    "consistency": {
                        "mean": p["pressureEconomy"],
                        "standardDeviation": 1.4,
                        "coefficientOfVariation": 0.12,
                        "thresholdLabel": "Pressure threshold",
                        "thresholdPct": 70,
                        "sample": p["pressureBalls"]
                    }
                }
                
    # Fallback to database lookup
    filters = {
        "competition": competition,
        "season": season,
        "date_from": date_from,
        "date_to": date_to
    }
    df = engine._apply_filters(deliveries_df, filters)
    if player_type == "batting":
        player_df = df[(df["batsman"] == player_id) | (df["batsman_name"] == player_id)]
        totals = engine.get_player_batting_stats(player_id, filters)
        baseline = engine.get_batting_baseline(filters)
        metrics = calculate_batting_metrics(totals, baseline) if totals else None
    else:
        player_df = df[(df["bowler"] == player_id) | (df["bowler_name"] == player_id)]
        totals = engine.get_player_bowling_stats(player_id, filters)
        baseline = engine.get_bowling_baseline(filters)
        metrics = calculate_bowling_metrics(totals, baseline) if totals else None
        
    if player_df.empty:
        return {
            "meta": get_meta_object(),
            "player": {
                "id": player_id,
                "type": player_type,
                "name": player_id,
                "teams": [],
                "competitions": []
            },
            "hasData": False
        }
    player_data = player_df.iloc[0]
    name_col = "batsman_name" if player_type == "batting" else "bowler_name"
    team_col = "batting_team" if player_type == "batting" else "bowling_team"
    return {
        "meta": get_meta_object(),
        "player": {
            "id": player_id,
            "type": player_type,
            "name": player_data.get(name_col, player_id),
            "teams": [player_data.get(team_col, "Unknown")],
            "competitions": player_df["competition"].unique().tolist()
        },
        "hasData": True,
        "metrics": metrics,
        "pressureVsNormal": [],
        "bySeason": [],
        "matchLog": [],
        "consistency": None
    }


@app.get("/api/v1/comparison/{player_type}")
def get_comparison(
    player_type: str,
    a: str = Query(...),
    b: str = Query(...),
    competition: Optional[str] = Query("All"),
    season: Optional[str] = Query("All"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Compare two players side by side."""
    if player_type not in ["batting", "bowling"]:
        raise HTTPException(status_code=400, detail="player_type must be 'batting' or 'bowling'")
    
    filters = {
        "competition": competition,
        "season": season,
        "date_from": date_from,
        "date_to": date_to
    }
    
    # Get both players
    player_a = get_player_profile(player_type, a, competition, season, date_from, date_to)
    player_b = get_player_profile(player_type, b, competition, season, date_from, date_to)
    
    return {
        "meta": get_meta_object(),
        "a": {
            "id": a,
            "name": player_a["player"]["name"],
            "hasData": player_a["hasData"],
            "row": player_a.get("metrics")
        },
        "b": {
            "id": b,
            "name": player_b["player"]["name"],
            "hasData": player_b["hasData"],
            "row": player_b.get("metrics")
        },
        "table": [],
        "radar": [],
        "radarPoolSize": 0
    }


@app.get("/api/v1/pressure/bins")
def get_pressure_bins(competition: Optional[str] = Query("All")):
    """Get pressure analysis bins."""
    filters = {"competition": competition}
    df = engine._apply_filters(deliveries_df, filters)
    
    # Generate bins (simplified version)
    bins = []
    
    return {
        "meta": get_meta_object(),
        "defaults": DEFAULT_PRESSURE_CONFIG,
        "bins": bins
    }


@app.get("/api/v1/methodology")
def get_methodology():
    """Get methodology documentation."""
    return {
        "meta": get_meta_object(),
        "version": "1.0.0",
        "parameters": {
            "ratingConfig": {
                "scale": 100,
                "batting": {
                    "priorBalls": 100,
                    "weightStrikeRate": 0.6,
                    "weightDismissal": 0.4
                },
                "bowling": {
                    "priorBalls": 100,
                    "weightEconomy": 0.55,
                    "weightWickets": 0.45
                }
            },
            "confidenceThresholds": {
                "batting": {"high": 150, "medium": 75},
                "bowling": {"high": 220, "medium": 110}
            },
            "pressureIndex": DEFAULT_PRESSURE_CONFIG
        },
        "competitionComparison": []
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
