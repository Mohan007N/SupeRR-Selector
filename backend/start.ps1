# SupeRR Selector Backend - Start Script

Write-Host "Starting SupeRR Selector Backend..." -ForegroundColor Green

# Check if Python is installed
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Python version:" -ForegroundColor Cyan
python --version

# Check if virtual environment exists
if (Test-Path "venv") {
    Write-Host "`nActivating virtual environment..." -ForegroundColor Cyan
    .\venv\Scripts\Activate.ps1
} else {
    Write-Host "`nVirtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    
    Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
    pip install -r requirements.txt
}

# Check if data directory exists
if (-not (Test-Path "data")) {
    Write-Host "`nCreating data directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# Check for data files
$hasDeliveries = Test-Path "data\deliveries.csv"
$hasMatches = Test-Path "data\matches.csv"

if (-not $hasDeliveries -or -not $hasMatches) {
    Write-Host "`nWarning: Dataset files not found in data/" -ForegroundColor Yellow
    Write-Host "The backend will use DEMO mode with synthetic data" -ForegroundColor Yellow
    Write-Host "`nTo use real data:" -ForegroundColor Cyan
    Write-Host "  1. Place your deliveries.csv in backend/data/" -ForegroundColor White
    Write-Host "  2. Place your matches.csv in backend/data/" -ForegroundColor White
    Write-Host "  3. Edit app/config.py and set use_demo = False" -ForegroundColor White
} else {
    Write-Host "`nDataset files found!" -ForegroundColor Green
}

Write-Host "`nStarting FastAPI server..." -ForegroundColor Green
Write-Host "API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API documentation at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
