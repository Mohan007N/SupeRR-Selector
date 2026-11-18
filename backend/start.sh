#!/bin/bash
# SupeRR Selector Backend - Start Script

echo "Starting SupeRR Selector Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

echo "Python version:"
python3 --version

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo -e "\nActivating virtual environment..."
    source venv/bin/activate
else
    echo -e "\nVirtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    
    echo -e "\nInstalling dependencies..."
    pip install -r requirements.txt
fi

# Check if data directory exists
if [ ! -d "data" ]; then
    echo -e "\nCreating data directory..."
    mkdir data
fi

# Check for data files
if [ ! -f "data/deliveries.csv" ] || [ ! -f "data/matches.csv" ]; then
    echo -e "\nWarning: Dataset files not found in data/"
    echo "The backend will use DEMO mode with synthetic data"
    echo -e "\nTo use real data:"
    echo "  1. Place your deliveries.csv in backend/data/"
    echo "  2. Place your matches.csv in backend/data/"
    echo "  3. Edit app/config.py and set use_demo = False"
else
    echo -e "\nDataset files found!"
fi

echo -e "\nStarting FastAPI server..."
echo "API will be available at: http://localhost:8000"
echo "API documentation at: http://localhost:8000/docs"
echo -e "\nPress Ctrl+C to stop the server\n"

# Start the server
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
