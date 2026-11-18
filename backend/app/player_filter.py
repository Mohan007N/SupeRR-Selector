"""Player filtering for uncapped Indian domestic players."""

import pandas as pd
from typing import List, Dict, Set
import re

# Known capped Indian players (as of 2024) - players who have played international cricket
# This is a comprehensive list but should be updated regularly
CAPPED_INDIAN_PLAYERS = {
    # Current regulars
    "Rohit Sharma", "Virat Kohli", "KL Rahul", "Shubman Gill", "Ishan Kishan",
    "Suryakumar Yadav", "Hardik Pandya", "Ravindra Jadeja", "Axar Patel",
    "Jasprit Bumrah", "Mohammed Shami", "Mohammed Siraj", "Yuzvendra Chahal",
    "Kuldeep Yadav", "Rishabh Pant", "Shreyas Iyer", "Sanju Samson",
    
    # Recent players
    "Ruturaj Gaikwad", "Shivam Dube", "Washington Sundar", "Shardul Thakur",
    "Deepak Chahar", "Bhuvneshwar Kumar", "Arshdeep Singh", "Avesh Khan",
    "Mukesh Kumar", "Prasidh Krishna", "Ravi Bishnoi", "Tilak Varma",
    "Rinku Singh", "Yashasvi Jaiswal", "Shubman Gill", "Rajat Patidar",
    
    # Slightly older generation
    "Dinesh Karthik", "MS Dhoni", "Ajinkya Rahane", "Cheteshwar Pujara",
    "Ravichandran Ashwin", "Umesh Yadav", "Ishant Sharma", "Prithvi Shaw",
    "Hanuma Vihari", "Mayank Agarwal", "Wriddhiman Saha", "KS Bharat",
    
    # T20 specialists who got caps
    "Venkatesh Iyer", "Varun Chakravarthy", "Rahul Chahar", "Rahul Tripathi",
    "Harshal Patel", "Natarajan", "T Natarajan", "Manish Pandey",
    "Krunal Pandya", "Khaleel Ahmed", "Siddharth Kaul", "Sandeep Sharma",
    
    # Add more as needed
}

# Indian domestic teams (IPL teams and state teams)
INDIAN_DOMESTIC_TEAMS = {
    # IPL Teams
    "Chennai Super Kings", "CSK", "Mumbai Indians", "MI",
    "Royal Challengers Bangalore", "RCB", "Kolkata Knight Riders", "KKR",
    "Delhi Capitals", "DC", "Rajasthan Royals", "RR",
    "Punjab Kings", "PBKS", "Sunrisers Hyderabad", "SRH",
    "Gujarat Titans", "GT", "Lucknow Super Giants", "LSG",
    
    # State Teams
    "India A", "India B", "India C", "India Red", "India Blue", "India Green",
    "Mumbai", "Delhi", "Karnataka", "Tamil Nadu", "Punjab", "Rajasthan",
    "Maharashtra", "Gujarat", "Uttar Pradesh", "Bengal", "Madhya Pradesh",
    "Hyderabad", "Baroda", "Vidarbha", "Saurashtra", "Railways",
    "Kerala", "Jharkhand", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
    "Andhra", "Goa", "Assam", "Odisha", "Tripura", "Services",
    
    # Franchise abbreviations
    "CSK", "MI", "RCB", "KKR", "DC", "RR", "PBKS", "SRH", "GT", "LSG",
}

# International teams (foreign players)
FOREIGN_TEAMS = {
    "England", "Australia", "South Africa", "New Zealand", "Pakistan",
    "West Indies", "Sri Lanka", "Bangladesh", "Afghanistan", "Zimbabwe",
    "Ireland", "Netherlands", "Scotland", "UAE", "Oman", "Nepal",
}


def is_indian_name(name: str) -> bool:
    """
    Heuristic to determine if a player name is likely Indian.
    This is a basic check - should be combined with team information.
    """
    if not name:
        return False
    
    # Common Indian name patterns
    indian_patterns = [
        r'^[A-Z]\s+',  # Initial + surname (common in South India)
        r'\b(Kumar|Singh|Sharma|Patel|Yadav|Reddy|Rao|Nair|Iyer|Pandey|Mishra)\b',
        r'\b(Raju|Raja|Krishna|Ravi|Prasad|Srinivas|Venkat|Ramesh)\b',
    ]
    
    name_lower = name.lower()
    
    # Check for common Indian name components
    for pattern in indian_patterns:
        if re.search(pattern, name, re.IGNORECASE):
            return True
    
    return False


def normalize_player_name(name: str) -> str:
    """Normalize player name for comparison."""
    if not name:
        return ""
    # Remove extra spaces, lowercase
    return " ".join(name.strip().split()).title()


def is_capped_player(player_name: str) -> bool:
    """Check if a player has played international cricket for India."""
    normalized = normalize_player_name(player_name)
    
    # Check against known capped players
    for capped in CAPPED_INDIAN_PLAYERS:
        if normalized == normalize_player_name(capped):
            return True
        # Also check if it's a substring match (handles different name formats)
        if normalized in normalize_player_name(capped) or normalize_player_name(capped) in normalized:
            return True
    
    return False


def is_indian_domestic_team(team_name: str) -> bool:
    """Check if a team is an Indian domestic team."""
    if not team_name:
        return False
    
    team_normalized = team_name.strip()
    
    # Check exact matches
    if team_normalized in INDIAN_DOMESTIC_TEAMS:
        return True
    
    # Check if it contains Indian domestic team names
    for indian_team in INDIAN_DOMESTIC_TEAMS:
        if indian_team.lower() in team_normalized.lower():
            return True
    
    return False


def is_foreign_team(team_name: str) -> bool:
    """Check if a team is a foreign national team."""
    if not team_name:
        return False
    
    team_normalized = team_name.strip()
    
    for foreign_team in FOREIGN_TEAMS:
        if foreign_team.lower() in team_normalized.lower():
            return True
    
    return False


def is_uncapped_indian_player(player_name: str, teams: List[str]) -> bool:
    """
    Determine if a player is an uncapped Indian domestic player.
    
    Criteria:
    1. Not in the capped players list
    2. Has played for Indian domestic teams
    3. Has not played for foreign teams (indicating foreign nationality)
    """
    # Check if capped
    if is_capped_player(player_name):
        return False
    
    # Check teams
    has_indian_team = False
    has_foreign_team = False
    
    for team in teams:
        if is_indian_domestic_team(team):
            has_indian_team = True
        if is_foreign_team(team):
            has_foreign_team = True
    
    # Must have played for Indian teams and not foreign teams
    if not has_indian_team:
        return False
    
    if has_foreign_team:
        return False
    
    # Additional name check as a safety
    if is_indian_name(player_name):
        return True
    
    # If we have Indian teams but name doesn't look Indian, still include
    # (handles cases like "Abhishek" which might not match patterns)
    return has_indian_team


def filter_uncapped_indian_players(
    deliveries_df: pd.DataFrame,
    player_mapping_df: pd.DataFrame = None,
    age_cutoff: int = None
) -> Set[str]:
    """
    Filter to get only uncapped Indian domestic players.
    
    Args:
        deliveries_df: Ball-by-ball dataframe
        player_mapping_df: Player-team mapping dataframe
        age_cutoff: Optional birth year cutoff (e.g., 1995 means born after 1995)
    
    Returns:
        Set of uncapped Indian player IDs/names
    """
    uncapped_players = set()
    
    # Get unique batsmen and bowlers
    if 'striker_name' in deliveries_df.columns:
        batsmen = deliveries_df[['striker_id', 'striker_name']].drop_duplicates()
        batsmen.columns = ['player_id', 'player_name']
    elif 'batsman' in deliveries_df.columns:
        batsmen = deliveries_df[['batsman', 'batsman_name']].drop_duplicates()
        batsmen.columns = ['player_id', 'player_name']
    else:
        batsmen = pd.DataFrame(columns=['player_id', 'player_name'])
    
    if 'bowler_id' in deliveries_df.columns:
        bowlers = deliveries_df[['bowler_id', 'bowler_name']].drop_duplicates()
        bowlers.columns = ['player_id', 'player_name']
    elif 'bowler' in deliveries_df.columns:
        bowlers = deliveries_df[['bowler', 'bowler_name']].drop_duplicates()
        bowlers.columns = ['player_id', 'player_name']
    else:
        bowlers = pd.DataFrame(columns=['player_id', 'player_name'])
    
    # Combine all players
    all_players = pd.concat([batsmen, bowlers]).drop_duplicates()
    
    # Get teams for each player
    if player_mapping_df is not None and not player_mapping_df.empty and 'team_name' in player_mapping_df.columns:
        player_teams = player_mapping_df.groupby('player_name')['team_name'].apply(list).to_dict()
    else:
        # Fallback: use batting_team/bowling_team from deliveries
        player_teams = {}
        
        # Check which columns exist
        striker_col = 'striker_name' if 'striker_name' in deliveries_df.columns else 'batsman_name'
        bowler_col = 'bowler_name'
        batting_team_col = 'batting_team_id' if 'batting_team_id' in deliveries_df.columns else 'batting_team'
        bowling_team_col = 'bowling_team_id' if 'bowling_team_id' in deliveries_df.columns else 'bowling_team'
        
        if striker_col in deliveries_df.columns:
            batting_teams = deliveries_df.groupby(striker_col)[batting_team_col].apply(list).to_dict()
            for player, teams in batting_teams.items():
                if player not in player_teams:
                    player_teams[player] = []
                player_teams[player].extend(teams)
        
        if bowler_col in deliveries_df.columns:
            bowling_teams = deliveries_df.groupby(bowler_col)[bowling_team_col].apply(list).to_dict()
            for player, teams in bowling_teams.items():
                if player not in player_teams:
                    player_teams[player] = []
                player_teams[player].extend(teams)
        
        # Deduplicate
        for player in player_teams:
            player_teams[player] = list(set([str(t) for t in player_teams[player]]))
    
    # Filter for uncapped Indian players
    for _, row in all_players.iterrows():
        player_name = row['player_name']
        if pd.isna(player_name):
            continue
        
        teams = player_teams.get(player_name, [])
        
        if is_uncapped_indian_player(player_name, teams):
            uncapped_players.add(player_name)
    
    return uncapped_players


def add_nationality_column(df: pd.DataFrame, player_col: str = 'player_name') -> pd.DataFrame:
    """Add a nationality/status column to identify player types."""
    df = df.copy()
    
    def classify_player(row):
        player_name = row[player_col]
        if pd.isna(player_name):
            return "Unknown"
        
        if is_capped_player(player_name):
            return "Capped Indian"
        
        # Check teams if available
        teams = []
        if 'teams' in row:
            teams = row['teams']
        
        if is_uncapped_indian_player(player_name, teams):
            return "Uncapped Indian"
        
        return "Foreign"
    
    df['player_status'] = df.apply(classify_player, axis=1)
    return df
