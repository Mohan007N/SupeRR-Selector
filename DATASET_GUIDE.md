# Dataset Guide - Where to Update Your Data

## 📁 Location

Place your cricket dataset files here:

```
superr-selector/
└── backend/
    └── data/           👈 PUT YOUR FILES HERE
        ├── deliveries.csv    # Ball-by-ball data
        └── matches.csv       # Match metadata
```

## 📋 Step-by-Step Instructions

### Step 1: Prepare Your Data Files

Create or obtain two CSV files:

#### **deliveries.csv** - Ball-by-ball delivery data

Minimum required columns:
```
match_id, competition, season, match_date, innings, over, ball,
batting_team, bowling_team, batsman, batsman_name, bowler, bowler_name,
batsman_runs, extra_runs, total_runs, is_wicket, wickets_lost
```

Example rows:
```csv
match_id,competition,season,match_date,innings,over,ball,batting_team,bowling_team,batsman,batsman_name,bowler,bowler_name,batsman_runs,extra_runs,total_runs,is_wicket,wickets_lost
1,IPL,2024,2024-03-22,1,1,1,CSK,MI,p001,MS Dhoni,p101,J Bumrah,0,0,0,0,0
1,IPL,2024,2024-03-22,1,1,2,CSK,MI,p001,MS Dhoni,p101,J Bumrah,4,0,4,0,0
1,IPL,2024,2024-03-22,1,1,3,CSK,MI,p001,MS Dhoni,p101,J Bumrah,1,0,1,0,0
2,IPL,2024,2024-03-23,1,1,1,RCB,KKR,p002,V Kohli,p102,S Narine,0,0,0,0,0
```

#### **matches.csv** - Match information

Minimum required columns:
```
match_id, competition, season, match_date, team1, team2, venue
```

Example rows:
```csv
match_id,competition,season,match_date,team1,team2,venue
1,IPL,2024,2024-03-22,CSK,MI,Wankhede Stadium
2,IPL,2024,2024-03-23,RCB,KKR,Eden Gardens
3,T20I,2024,2024-06-01,India,Australia,MCG
```

### Step 2: Place Files in Correct Location

1. Copy `deliveries.csv` to: `backend/data/deliveries.csv`
2. Copy `matches.csv` to: `backend/data/matches.csv`

### Step 3: Configure Backend

Edit `backend/app/config.py` and set:

```python
DATA_CONFIG = {
    "deliveries_file": "data/deliveries.csv",
    "matches_file": "data/matches.csv",
    "use_demo": False  # 👈 Change this to False
}
```

### Step 4: Restart Backend

Stop the backend (Ctrl+C) and restart it:

```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate     # Linux/Mac
python -m uvicorn app.main:app --reload
```

### Step 5: Verify Data Loaded

Check the startup logs:
```
Loading data...
Loaded 150000 deliveries from 500 matches  👈 Should see your data count
Analytics engine initialized with 150000 deliveries
```

If you see:
```
Using demo data (generated)  👈 Something is wrong
```

Then check:
- CSV files exist in `backend/data/`
- All required columns are present
- `use_demo = False` in config.py
- Backend was restarted

### Step 6: Test API

Open browser to: http://localhost:8000/docs

Or test with curl:
```bash
curl http://localhost:8000/
curl http://localhost:8000/api/v1/filters
```

Should see: `"isDemo": false` in the response

## 🔍 Data Format Details

### Column Descriptions

**deliveries.csv**:
- `match_id` - Integer, links to matches.csv
- `competition` - String: "IPL" or "T20I"
- `season` - Integer year: 2022, 2023, 2024, 2025
- `match_date` - Date: YYYY-MM-DD format
- `innings` - Integer: 1 or 2
- `over` - Integer: 1 to 20
- `ball` - Integer: 1 to 6 (legal deliveries)
- `batting_team` - String: team name
- `bowling_team` - String: team name
- `batsman` - String: unique player ID
- `batsman_name` - String: display name
- `bowler` - String: unique player ID
- `bowler_name` - String: display name
- `batsman_runs` - Integer: 0, 1, 2, 3, 4, 6
- `extra_runs` - Integer: wides, no-balls, byes, leg-byes
- `total_runs` - Integer: batsman_runs + extra_runs
- `is_wicket` - Integer: 1 if wicket, 0 otherwise
- `wickets_lost` - Integer: cumulative wickets in innings (0-10)

**matches.csv**:
- `match_id` - Integer, must match deliveries.csv
- `competition` - String: "IPL" or "T20I"
- `season` - Integer year
- `match_date` - Date: YYYY-MM-DD
- `team1` - String: first team name
- `team2` - String: second team name
- `venue` - String: stadium name

## 📦 Where to Get Cricket Data

### Free Sources

1. **Cricsheet** (Recommended)
   - URL: https://cricsheet.org/
   - Format: JSON, YAML, CSV available
   - Coverage: IPL, T20I, ODI, Test
   - License: Open data

2. **Kaggle**
   - Search: "IPL ball by ball"
   - Many datasets available
   - Some preprocessing may be needed

3. **ESPNcricinfo Stats**
   - Manual export
   - Good for specific matches

### Preprocessing Tips

If your data is in a different format:

1. **Convert to CSV** with required columns
2. **Ensure date format** is YYYY-MM-DD
3. **Use consistent player IDs** across all matches
4. **Mark wickets correctly** (is_wicket = 1)
5. **Track cumulative wickets** per innings
6. **Remove incomplete matches**

Example Python preprocessing:
```python
import pandas as pd

# Load your data
df = pd.read_csv('raw_data.csv')

# Convert date format
df['match_date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')

# Create player IDs if needed
df['batsman'] = 'p' + df['batsman_id'].astype(str).str.zfill(3)
df['bowler'] = 'p' + df['bowler_id'].astype(str).str.zfill(3)

# Calculate cumulative wickets
df['wickets_lost'] = df.groupby(['match_id', 'innings'])['is_wicket'].cumsum()

# Save processed data
df.to_csv('backend/data/deliveries.csv', index=False)
```

## 🧪 Testing Your Data

After loading, verify:

1. **Player count**: Should match expected
2. **Match count**: Check matches.csv count
3. **Date range**: Verify seasons are correct
4. **Pressure tagging**: Check deliveries marked as pressure
5. **Ratings**: Top players should have reasonable ratings (40-60 range)

Test endpoints:
```bash
# Check filters
curl http://localhost:8000/api/v1/filters

# Get batting table
curl "http://localhost:8000/api/v1/batting?competition=IPL&season=2024"

# Get rankings
curl "http://localhost:8000/api/v1/rankings/batting?min_pressure_balls=100"
```

## 🔄 Updating Data

To add new matches:

1. Add new rows to `deliveries.csv` and `matches.csv`
2. Keep existing data intact
3. Restart backend server
4. New data will be automatically loaded

For large datasets (>100K deliveries):
- Consider using Parquet format (requires code changes)
- Implement caching for common queries
- Use database instead of CSV files

## ❓ Troubleshooting

### "Using demo data (generated)"
- ✅ Check files exist in `backend/data/`
- ✅ Verify `use_demo = False` in config.py
- ✅ Restart backend

### "Missing required column"
- ✅ Check CSV headers match exactly
- ✅ No extra spaces in column names
- ✅ All required columns present

### "Empty data or no players"
- ✅ CSV files are not empty
- ✅ Data format is correct
- ✅ Player IDs are consistent

### Performance is slow
- ✅ Reduce dataset size for testing
- ✅ Use compressed formats
- ✅ Consider database migration

## 📊 Sample Dataset Sizes

For reference:

- **Small**: 10 matches, ~2,400 deliveries
- **Medium**: 100 matches, ~24,000 deliveries
- **Large**: 1,000 matches, ~240,000 deliveries
- **Very Large**: Full IPL history, ~1M+ deliveries

Recommended for testing: Start with 50-100 matches

## 🎯 Quick Checklist

Before starting:
- [ ] CSV files prepared
- [ ] Files placed in `backend/data/`
- [ ] `use_demo = False` in config.py
- [ ] Backend restarted
- [ ] Logs show "Loaded X deliveries"
- [ ] API returns `"isDemo": false`
- [ ] Frontend connects successfully

## 📞 Need Help?

Check:
1. Backend logs for error messages
2. CSV file encoding (should be UTF-8)
3. Date formats (YYYY-MM-DD)
4. Player ID consistency
5. Required columns present

The backend will fall back to demo mode if there's any issue, so you can always test the system while debugging data problems.

---

**Remember**: The exact location to update dataset is:
```
backend/data/deliveries.csv
backend/data/matches.csv
```

Then change `use_demo = False` in `backend/app/config.py` and restart!
