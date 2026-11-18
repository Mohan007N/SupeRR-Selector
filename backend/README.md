# SupeRR Selector - Python Backend

FastAPI backend with real-time analytics for IPL and T20I cricket data.

## Features

- Real-time analytics pipeline using pandas
- Pressure index calculation matching frontend logic
- Player rating system (0-100 scale)
- Confidence levels based on sample size
- RESTful API matching frontend contracts
- CORS enabled for development

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Add Your Dataset

Place your cricket data files in the `backend/data/` directory:

- **deliveries.csv** - Ball-by-ball delivery data
- **matches.csv** - Match metadata

#### Required Columns for deliveries.csv:

```
match_id, competition, season, match_date, innings, over, ball,
batting_team, bowling_team, batsman, batsman_name, bowler, bowler_name,
batsman_runs, extra_runs, total_runs, is_wicket, wickets_lost
```

#### Required Columns for matches.csv:

```
match_id, competition, season, match_date, team1, team2, venue
```

**Note:** The backend will automatically use demo data if these files are not found.

### 3. Configure Data Source

Edit `app/config.py`:

```python
DATA_CONFIG = {
    "deliveries_file": "data/deliveries.csv",
    "matches_file": "data/matches.csv",
    "use_demo": False  # Set to False to use real data
}
```

### 4. Run the Server

```bash
# From the backend directory
python -m app.main

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 5. Connect Frontend

Update frontend `.env`:

```bash
VITE_DEMO_MODE=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## API Endpoints

All endpoints are prefixed with `/api/v1`:

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health check |
| `GET /filters` | Available filter options |
| `GET /players` | Player directory |
| `GET /overview` | Overview statistics |
| `GET /batting` | Batting analytics table |
| `GET /bowling` | Bowling analytics table |
| `GET /rankings/{type}` | Top 10 rankings |
| `GET /players/{type}/{id}` | Player profile |
| `GET /comparison/{type}` | Compare two players |
| `GET /pressure/bins` | Pressure analysis |
| `GET /methodology` | Methodology info |

## Data Format Example

### deliveries.csv

```csv
match_id,competition,season,match_date,innings,over,ball,batting_team,bowling_team,batsman,batsman_name,bowler,bowler_name,batsman_runs,extra_runs,total_runs,is_wicket,wickets_lost
1,IPL,2024,2024-03-22,1,1,1,CSK,MI,b01,MS Dhoni,w01,Jasprit Bumrah,0,0,0,0,0
1,IPL,2024,2024-03-22,1,1,2,CSK,MI,b01,MS Dhoni,w01,Jasprit Bumrah,4,0,4,0,0
```

### matches.csv

```csv
match_id,competition,season,match_date,team1,team2,venue
1,IPL,2024,2024-03-22,CSK,MI,Wankhede Stadium
2,IPL,2024,2024-03-23,RCB,KKR,Eden Gardens
```

## Real-Time Dashboard Updates

The backend automatically recalculates all metrics when:
- New data is added to CSV files
- Server is restarted (automatically reloads data)
- Filters are changed via API

### To Update Data in Real-Time:

1. Add new rows to `deliveries.csv` and `matches.csv`
2. Restart the server or implement file watching
3. Frontend will fetch updated data on next request

### Optional: Auto-Reload on Data Change

Add file watching (requires `watchdog`):

```bash
pip install watchdog
```

Then modify `app/main.py` to reload data when files change.

## Analytics Pipeline

The backend implements:

1. **Pressure Tagging**: Each delivery is tagged as pressure/normal based on:
   - Match state (wickets, runs, overs)
   - Run rate requirements
   - Stage of innings

2. **Rating Calculation**: 
   - Bayesian shrinkage toward league average
   - Weighted combination of metrics
   - Normalized to 0-100 scale

3. **Confidence Levels**:
   - High: 150+ pressure balls (batting), 220+ (bowling)
   - Medium: 75-149 (batting), 110-219 (bowling)
   - Low: Below thresholds

## Performance

- Handles 100K+ deliveries efficiently
- Response times: <500ms for most queries
- Memory usage: ~200MB with moderate dataset

## Troubleshooting

### Demo mode won't disable

Check that:
1. CSV files exist in `backend/data/`
2. Required columns are present
3. `use_demo` is set to `False` in config

### CORS errors

Add your frontend URL to `allow_origins` in `app/main.py`:

```python
allow_origins=["http://localhost:5173", "http://your-frontend-url"]
```

### Slow queries

- Reduce data size or add indexes
- Implement caching for common queries
- Use database instead of CSV for large datasets

## Development

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app & endpoints
│   ├── analytics.py     # Analytics engine
│   ├── data_loader.py   # Data loading & demo generation
│   └── config.py        # Configuration
├── data/
│   ├── deliveries.csv   # YOUR DATASET HERE
│   └── matches.csv      # YOUR DATASET HERE
├── requirements.txt
└── README.md
```

### Adding New Endpoints

1. Add route to `app/main.py`
2. Implement analytics logic in `app/analytics.py`
3. Update frontend contracts if needed

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```bash
export API_HOST=0.0.0.0
export API_PORT=8000
export DATA_PATH=/path/to/data
export CORS_ORIGINS=https://your-frontend.com
```

## License

Same as the main project.
