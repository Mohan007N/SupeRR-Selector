"""Data loader and demo data generator."""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple
from .config import DATA_CONFIG, YOUNGEST_TALENT_CUTOFF
import os


def load_real_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load data from the provided data pack."""
    
    base_path = os.path.join(os.path.dirname(__file__), "..")
    
    # Load all files
    ball_path = os.path.join(base_path, DATA_CONFIG["deliveries_file"])
    match_path = os.path.join(base_path, DATA_CONFIG["matches_file"])
    teams_path = os.path.join(base_path, DATA_CONFIG["teams_file"])
    player_map_path = os.path.join(base_path, DATA_CONFIG["player_mapping_file"])
    comp_path = os.path.join(base_path, DATA_CONFIG["competitions_file"])
    
    print(f"Loading data from: {ball_path}")
    
    # Load CSVs
    deliveries_df = pd.read_csv(ball_path)
    matches_df = pd.read_csv(match_path)
    teams_df = pd.read_csv(teams_path)
    player_mapping_df = pd.read_csv(player_map_path)
    competitions_df = pd.read_csv(comp_path)
    
    # Process deliveries to match expected format
    deliveries_df = deliveries_df.copy()
    
    # Rename columns to match expected format
    deliveries_df = deliveries_df.rename(columns={
        'striker_id': 'batsman',
        'striker_name': 'batsman_name',
        'runs': 'batsman_runs',
        'batting_team_id': 'batting_team',
        'bowling_team_id': 'bowling_team'
    })
    
    # Add required columns
    deliveries_df['extra_runs'] = deliveries_df['extras1_runs'].fillna(0) + deliveries_df['extras_2_runs'].fillna(0)
    deliveries_df['total_runs'] = deliveries_df['batsman_runs'] + deliveries_df['extra_runs']
    deliveries_df['is_wicket'] = deliveries_df['is_wicket'].fillna(False).astype(int)
    
    # Add over number
    deliveries_df['over'] = deliveries_df['overid']
    deliveries_df['ball'] = deliveries_df['over_ball_num']
    
    # Calculate wickets_lost per innings
    deliveries_df['wickets_lost'] = deliveries_df.groupby(['match_id', 'innings'])['is_wicket'].cumsum()
    
    # Merge with matches to get competition and season info
    matches_df = matches_df.rename(columns={'comp_id': 'competition_id'})
    deliveries_df = deliveries_df.merge(
        matches_df[['match_id', 'competition_id', 'match_date']],
        on='match_id',
        how='left'
    )
    
    # Merge with competitions to get competition name and season
    deliveries_df = deliveries_df.merge(
        competitions_df[['comp_id', 'comp_name', 'match_format', 'season']],
        left_on='competition_id',
        right_on='comp_id',
        how='left'
    )
    
    # Set competition to match_format (T20I, ODI, etc)
    deliveries_df['competition'] = deliveries_df['match_format']
    
    # Ensure season is integer - handle formats like "2022/23"
    def parse_season(season_str):
        if pd.isna(season_str):
            return 2024
        season_str = str(season_str)
        # Handle "2022/23" format - take first year
        if '/' in season_str:
            return int(season_str.split('/')[0])
        # Handle "2022-23" format
        if '-' in season_str:
            return int(season_str.split('-')[0])
        # Regular integer
        try:
            return int(season_str)
        except:
            return 2024
    
    deliveries_df['season'] = deliveries_df['season'].apply(parse_season)
    
    print(f"Loaded {len(deliveries_df)} deliveries from {len(matches_df)} matches")
    print(f"Competitions: {deliveries_df['competition'].unique()}")
    print(f"Seasons: {sorted(deliveries_df['season'].unique())}")
    
    return deliveries_df, matches_df, player_mapping_df


def generate_demo_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Generate synthetic demo data matching the frontend's demo structure."""
    
    # Competitions and seasons
    competitions = ["IPL", "T20I"]
    seasons = [2022, 2023, 2024, 2025]
    
    # Players
    batsmen = [
        {"id": f"b{i:02d}", "name": f"Batter {i}", "team": f"Team{i%8+1}"} 
        for i in range(1, 27)
    ]
    bowlers = [
        {"id": f"w{i:02d}", "name": f"Bowler {i}", "team": f"Team{i%8+1}"} 
        for i in range(1, 23)
    ]
    
    # Generate matches
    matches_data = []
    match_id = 1
    
    for season in seasons:
        for comp in competitions:
            num_matches = 30 if comp == "IPL" else 20
            
            for i in range(num_matches):
                match_date = datetime(season, 3 if comp == "IPL" else 8, 1) + timedelta(days=i*7)
                
                matches_data.append({
                    "match_id": match_id,
                    "competition": comp,
                    "season": season,
                    "match_date": match_date.strftime("%Y-%m-%d"),
                    "team1": f"Team{(i % 8) + 1}",
                    "team2": f"Team{((i + 1) % 8) + 1}",
                    "venue": f"Stadium {i % 10 + 1}"
                })
                match_id += 1
    
    matches_df = pd.DataFrame(matches_data)
    
    # Generate deliveries
    deliveries_data = []
    
    for match in matches_data:
        match_id = match["match_id"]
        
        # Generate two innings
        for innings in [1, 2]:
            wickets_lost = 0
            total_runs = 0
            
            # 20 overs, 6 balls each
            for over_num in range(1, 21):
                for ball_num in range(1, 7):
                    # Random batter and bowler
                    batter = np.random.choice(batsmen)
                    bowler = np.random.choice(bowlers)
                    
                    # Simulate ball outcome
                    outcome_prob = np.random.random()
                    
                    if outcome_prob < 0.05:  # Wicket
                        batsman_runs = 0
                        is_wicket = 1
                        wickets_lost += 1
                    elif outcome_prob < 0.35:  # Dot
                        batsman_runs = 0
                        is_wicket = 0
                    elif outcome_prob < 0.60:  # Single
                        batsman_runs = 1
                        is_wicket = 0
                    elif outcome_prob < 0.75:  # Two
                        batsman_runs = 2
                        is_wicket = 0
                    elif outcome_prob < 0.85:  # Four
                        batsman_runs = 4
                        is_wicket = 0
                    else:  # Six
                        batsman_runs = 6
                        is_wicket = 0
                    
                    total_runs += batsman_runs
                    extras = 1 if np.random.random() < 0.05 else 0  # 5% extras
                    
                    # Calculate required rate for chase
                    balls_remaining = (20 - over_num) * 6 + (6 - ball_num)
                    target = 180 if innings == 2 else 0
                    runs_needed = max(0, target - total_runs)
                    required_rate = (runs_needed * 6 / balls_remaining) if balls_remaining > 0 else 0
                    
                    deliveries_data.append({
                        "match_id": match_id,
                        "competition": match["competition"],
                        "season": match["season"],
                        "match_date": match["match_date"],
                        "innings": innings,
                        "over": over_num,
                        "ball": ball_num,
                        "batting_team": match["team1"] if innings == 1 else match["team2"],
                        "bowling_team": match["team2"] if innings == 1 else match["team1"],
                        "batsman": batter["id"],
                        "batsman_name": batter["name"],
                        "bowler": bowler["id"],
                        "bowler_name": bowler["name"],
                        "batsman_runs": batsman_runs,
                        "extra_runs": extras,
                        "total_runs": batsman_runs + extras,
                        "is_wicket": is_wicket,
                        "wickets_lost": wickets_lost,
                        "total_runs_so_far": total_runs,
                        "required_rate": required_rate if innings == 2 else 0,
                        "is_pressure": (over_num >= 16) or (wickets_lost >= 6) or (innings == 2 and required_rate > 10)
                    })
                    
                    if wickets_lost >= 10:
                        break
                
                if wickets_lost >= 10:
                    break
    
    deliveries_df = pd.DataFrame(deliveries_data)
    
    return deliveries_df, matches_df


def load_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load data from CSV files or generate demo data."""
    
    if DATA_CONFIG["use_demo"]:
        print("Using demo data (generated)")
        deliveries_df, matches_df = generate_demo_data()
        player_mapping_df = pd.DataFrame()  # Empty for demo
        return deliveries_df, matches_df, player_mapping_df
    
    # Load from CSV files
    try:
        deliveries_df, matches_df, player_mapping_df = load_real_data()
        print(f"Successfully loaded real data")
        return deliveries_df, matches_df, player_mapping_df
    except Exception as e:
        print(f"Error loading data: {e}")
        print("Falling back to demo data")
        DATA_CONFIG["use_demo"] = True
        deliveries_df, matches_df = generate_demo_data()
        player_mapping_df = pd.DataFrame()
        return deliveries_df, matches_df, player_mapping_df


def get_meta_object(notice: str = None) -> dict:
    """Generate metadata object for API responses."""
    return {
        "isDemo": DATA_CONFIG["use_demo"],
        "source": "synthetic-demo-data" if DATA_CONFIG["use_demo"] else "ball-by-ball-dataset",
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "notice": notice
    }
