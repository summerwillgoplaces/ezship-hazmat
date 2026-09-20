# EZShip Hazmat Launcher Script
# Starts FastAPI Compliance Engine Backend and React Vite Frontend

Write-Host "============================================================" -ForegroundColor DarkYellow
Write-Host "  Starting EZShip Hazmat & Dangerous Goods Platform" -ForegroundColor Cyan
Write-Host "  DOT 49 CFR & IATA DGR Compliant Engine" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor DarkYellow

$BackendDir = "$PSScriptRoot\backend"
$FrontendDir = "$PSScriptRoot\frontend"

# 1. Start Backend Server
Write-Host "`n[1/2] Launching FastAPI Backend Engine on http://127.0.0.1:8000..." -ForegroundColor Green
$BackendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c python -m uvicorn hazmat_app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $BackendDir -PassThru

# 2. Start Frontend Dev Server
Write-Host "[2/2] Launching Vite Frontend Server on http://localhost:3000..." -ForegroundColor Green
$FrontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $FrontendDir -PassThru

Start-Sleep -Seconds 2

Write-Host "`n============================================================" -ForegroundColor DarkYellow
Write-Host "  EZShip Hazmat is running!" -ForegroundColor Cyan
Write-Host "  Dashboard:       http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend API:     http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  API Swagger Doc: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "============================================================`n" -ForegroundColor DarkYellow

if ($Host.UI.RawUI.KeyAvailable -or [Environment]::UserInteractive) {
    Write-Host "Servers are running in background processes (PID: $($BackendProcess.Id), $($FrontendProcess.Id))." -ForegroundColor Gray
}
