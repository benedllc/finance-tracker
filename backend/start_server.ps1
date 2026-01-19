# Start Flask Backend Server
Write-Host "Starting Flask backend server..." -ForegroundColor Green

Set-Location C:\NFApps\backend
$env:PYTHONPATH = "C:\NFApps\backend"

# Start the server
& C:\NFApps\backend\venv\Scripts\python.exe C:\NFApps\backend\run.py
