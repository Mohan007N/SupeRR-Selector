# Dataset Directory

Place your cricket ball-by-ball dataset files here:

- **deliveries.csv** - Ball-by-ball delivery data
- **matches.csv** - Match information

## Format Requirements

### deliveries.csv

Required columns:
```
match_id          - Unique match identifier (integer)
competition       - Competition name (e.g., "IPL", "T20I")
season            - Year (e.g., 2024)
match_date        - Date in YYYY-MM-DD format
innings           - Innings number (1 or 2)
over              - Over number (1-20)
ball              - Ball number in over (1-6)
batting_team      - Batting team name
bowling_team      - Bowling team name
batsman           - Batsman ID (unique identifier)
batsman_name      - Batsman display name
bowler            - Bowler ID (unique identifier)
bowler_name       - Bowler display name
batsman_runs      - Runs scored by batsman (0, 1, 2, 3, 4, 6)
extra_runs        - Extra runs (wides, no-balls, etc.)
total_runs        - Total runs on this delivery
is_wicket         - 1 if wicket, 0 otherwise
wickets_lost      - Cumulative wickets lost in innings
```

Optional columns (will be calculated if missing):
```
total_runs_so_far - Cumulative runs in innings
required_rate     - Required run rate for chasing team
is_pressure       - Pre-tagged pressure flag (will be calculated if missing)
```

### matches.csv

Required columns:
```
match_id          - Unique match identifier (must match deliveries.csv)
competition       - Competition name (e.g., "IPL", "T20I")
season            - Year (e.g., 2024)
match_date        - Date in YYYY-MM-DD format
team1             - First team name
team2             - Second team name
venue             - Match venue
```

Optional columns:
```
winner            - Winning team name
win_by_runs       - If applicable
win_by_wickets    - If applicable
player_of_match   - Player of the match
```

## Example Data

### deliveries.csv
```csv
match_id,competition,season,match_date,innings,over,ball,batting_team,bowling_team,batsman,batsman_name,bowler,bowler_name,batsman_runs,extra_runs,total_runs,is_wicket,wickets_lost
1,IPL,2024,2024-03-22,1,1,1,CSK,MI,player_001,MS Dhoni,player_101,Jasprit Bumrah,0,0,0,0,0
1,IPL,2024,2024-03-22,1,1,2,CSK,MI,player_001,MS Dhoni,player_101,Jasprit Bumrah,4,0,4,0,0
1,IPL,2024,2024-03-22,1,1,3,CSK,MI,player_001,MS Dhoni,player_101,Jasprit Bumrah,1,0,1,0,0
```

### matches.csv
```csv
match_id,competition,season,match_date,team1,team2,venue
1,IPL,2024,2024-03-22,CSK,MI,Wankhede Stadium
2,IPL,2024,2024-03-23,RCB,KKR,Eden Gardens
3,T20I,2024,2024-06-01,India,Australia,Melbourne Cricket Ground
```

## Data Sources

You can obtain IPL and T20I ball-by-ball data from:

1. **Kaggle**: Search for "IPL ball by ball" or "T20I cricket data"
2. **Cricsheet**: https://cricsheet.org/ (free cricket data in various formats)
3. **ESPNcricinfo Stats**: Manual export or scraping
4. **Custom datasets**: Your own collected data

## Processing Your Data

If your data is in a different format:

1. Convert to CSV with required columns
2. Ensure date format is YYYY-MM-DD
3. Use consistent IDs for players across matches
4. Mark wickets correctly (is_wicket = 1)
5. Track cumulative wickets per innings

## Demo Mode

If no data files are present, the backend automatically generates synthetic demo data with:
- 200+ matches across IPL and T20I
- 50+ synthetic players
- 24,000+ deliveries
- Realistic score distributions

To disable demo mode:
1. Place your CSV files here
2. Edit `../app/config.py` and set `use_demo = False`

## Performance Tips

- Keep deliveries.csv under 1M rows for optimal performance
- Use numeric IDs for players (strings work but are slower)
- Remove unnecessary columns to reduce memory usage
- Consider using Parquet format for large datasets (requires code change)

## Data Privacy

Do not commit actual player names or identifiable information to version control if using private/sensitive data.
