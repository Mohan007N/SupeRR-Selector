# ⚡ Quick Start Guide

Get the SupeRR Selector dashboard running in 5 minutes!

## 🎯 What You'll Get

- **Backend**: Python FastAPI serving real-time cricket analytics
- **Frontend**: React dashboard with interactive visualizations
- **Data**: Works with demo data out of the box

## 📋 Prerequisites

- Python 3.11+ 
- Node.js 18+
- 5 minutes of your time

## 🚀 Steps

### 1. Start Backend (Terminal 1)

```powershell
# Navigate to backend
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
Loading data...
Using demo data (generated)
Analytics engine initialized with 47371 deliveries
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Backend is running at http://localhost:8000

### 2. Start Frontend (Terminal 2)

```powershell
# Navigate to frontend
cd superr-selector

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

**Expected Output:**
```
VITE v8.3.8  ready in 498 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ Frontend is running at http://localhost:5173

### 3. Open Browser

Visit: **http://localhost:5173**

You should see:
- 🎨 Modern cricket analytics dashboard
- 📊 Seven pages of insights
- 🔍 Global search and filters
- 📈 Charts and visualizations

## 🎪 Demo Mode

The system starts in **demo mode** with synthetic data:
- 200 matches (IPL and T20I)
- 50+ synthetic players
- 47,000+ deliveries
- Full analytics working

## 📊 Using Real Data

Want to use your own cricket dataset?

### Step 1: Prepare Data

Create two CSV files:
- `deliveries.csv` - Ball-by-ball data
- `matches.csv` - Match information

See [DATASET_GUIDE.md](DATASET_GUIDE.md) for format details.

### Step 2: Place Files

```
backend/
  └── data/
      ├── deliveries.csv    👈 Your file here
      └── matches.csv       👈 Your file here
```

### Step 3: Configure

Edit `backend/app/config.py`:
```python
DATA_CONFIG = {
    "deliveries_file": "data/deliveries.csv",
    "matches_file": "data/matches.csv",
    "use_demo": False  # 👈 Change to False
}
```

### Step 4: Update Frontend

Edit `superr-selector/.env`:
```
VITE_DEMO_MODE=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Step 5: Restart Both Servers

Stop both (Ctrl+C) and start again.

✅ Now using your real data!

## 🧪 Testing

### Test Backend

```powershell
# Health check
curl http://localhost:8000/

# Get filters
curl http://localhost:8000/api/v1/filters

# Get batting data
curl http://localhost:8000/api/v1/batting
```

### Test Frontend

1. Open http://localhost:5173
2. Try search (press `/` key)
3. Click on a player
4. Change filters
5. Export CSV from Rankings page

## 📱 Pages Available

1. **Overview** - Dashboard with KPIs and trends
2. **Batting Analytics** - Full batting table
3. **Bowling Analytics** - Full bowling table  
4. **Player Rankings** - Top 10 batters and bowlers
5. **Player Comparison** - Compare two players
6. **Pressure Analysis** - Pressure index insights
7. **Methodology** - How it works

## 🛠️ Common Issues

### Backend won't start

**Error**: `Python not found`
- Install Python 3.11+
- Add to PATH

**Error**: `Module not found`
- Activate virtual environment
- Run `pip install -r requirements.txt`

### Frontend won't start

**Error**: `npm not found`
- Install Node.js 18+
- Add to PATH

**Error**: `Module not found`
- Run `npm install` first

### CORS errors

- Ensure backend is running on port 8000
- Check `.env` file has correct `VITE_API_BASE_URL`
- Restart frontend after changing `.env`

### Demo mode won't disable

- Check CSV files exist in `backend/data/`
- Verify `use_demo = False` in config.py
- Restart backend server
- Check logs say "Loaded X deliveries"

## 🎯 One-Command Start (Advanced)

### Windows

Create `start-all.ps1`:
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload"
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd superr-selector; npm run dev"
```

Run: `.\start-all.ps1`

### Linux/Mac

Create `start-all.sh`:
```bash
#!/bin/bash
cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload &
sleep 3
cd superr-selector && npm run dev
```

Run: `./start-all.sh`

## 📚 Next Steps

Once running:

1. **Explore Features**: Try all 7 pages
2. **Test Filters**: Change competition, season, dates
3. **Search Players**: Press `/` for quick search
4. **Export Data**: Use CSV export on Rankings
5. **Add Real Data**: Follow DATASET_GUIDE.md

## 📖 Documentation

- [README.md](README.md) - Full project overview
- [DATASET_GUIDE.md](DATASET_GUIDE.md) - How to add your data
- [backend/README.md](backend/README.md) - Backend details
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical details

## 🌐 URLs

After starting both servers:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main dashboard |
| **Backend** | http://localhost:8000 | Health check |
| **API Docs** | http://localhost:8000/docs | Interactive API docs |
| **ReDoc** | http://localhost:8000/redoc | Alternative API docs |

## 💡 Pro Tips

1. **Keep terminals open**: Don't close the terminal windows
2. **Watch for errors**: Check terminal output for issues
3. **Auto-reload**: Both servers reload on file changes
4. **Demo first**: Test with demo data before adding real data
5. **API docs**: Explore `/docs` to understand endpoints

## ⏱️ Time Breakdown

- Install dependencies: 2-3 minutes (one time)
- Start backend: 10 seconds
- Start frontend: 10 seconds  
- Total: **<5 minutes** to running dashboard

## 🎉 Success!

You should now see:
- ✅ Backend running on :8000
- ✅ Frontend running on :5173
- ✅ Dashboard loading in browser
- ✅ Data flowing through system

Ready to analyze cricket pressure performance! 🏏

---

**Need help?** Check the logs in both terminal windows for error messages.
**Want real data?** See [DATASET_GUIDE.md](DATASET_GUIDE.md)
**Questions?** Review [README.md](README.md) for full documentation
