# 🎵 LEVEL AUDIO - Network Access Startup Script
# This script starts servers with network access for remote collaborators

Write-Host "`n" -NoNewline
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  🎵 LEVEL AUDIO - Network Access Mode (For Collaborators)" -ForegroundColor Magenta
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Starting development environment with network access...`n" -ForegroundColor Yellow

# Check if we're in the correct directory
if (-not (Test-Path "backend\main.py")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    pause
    exit 1
}

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" | Select-Object -First 1).IPAddress
if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet" | Select-Object -First 1).IPAddress
}
if (-not $localIP) {
    $localIP = "192.168.1.164"  # Fallback
}

Write-Host "✅ Network IP detected: $localIP" -ForegroundColor Green

# Function to start backend
function Start-Backend {
    Write-Host "`n📡 Starting Backend Server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🎚️  Starting LEVEL AUDIO Backend...' -ForegroundColor Green; .\start_with_credentials.ps1"
    Write-Host "   Backend will be accessible at:" -ForegroundColor White
    Write-Host "   • Local:   http://localhost:8000" -ForegroundColor Green
    Write-Host "   • Network: http://${localIP}:8000" -ForegroundColor Green
}

# Function to start frontend with network access
function Start-Frontend-Network {
    Write-Host "`n💻 Starting Frontend Dev Server (Network Mode)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\sonic-refine-suite'; Write-Host '⚡ Starting LEVEL AUDIO Frontend with Network Access...' -ForegroundColor Green; npm run dev -- --host"
    Write-Host "   Frontend will be accessible at:" -ForegroundColor White
    Write-Host "   • Local:   http://localhost:5173" -ForegroundColor Green
    Write-Host "   • Network: http://${localIP}:5173" -ForegroundColor Green
}

# Start servers
Start-Backend
Start-Frontend-Network

Write-Host "`n" -NoNewline
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "                    🚀 Servers Starting Up..." -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "📍 Local Access (You):" -ForegroundColor Yellow
Write-Host "   • http://localhost:5173" -ForegroundColor Green
Write-Host "`n"

Write-Host "🌐 Remote Access (Collaborator on same network):" -ForegroundColor Yellow
Write-Host "   • http://${localIP}:5173" -ForegroundColor Green
Write-Host "`n"
Write-Host "   Share this URL with your collaborator:" -ForegroundColor White
Write-Host "   http://${localIP}:5173" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "🔐 Admin Users (Both have full access):" -ForegroundColor Yellow
Write-Host "   • davidv111111@gmail.com (You)" -ForegroundColor White
Write-Host "   • santiagov.t068@gmail.com (Collaborator)" -ForegroundColor White
Write-Host "`n"

Write-Host "✨ Features Enabled:" -ForegroundColor Yellow
Write-Host "   ✓ Real AI Mastering with Matchering" -ForegroundColor Green
Write-Host "   ✓ Network Access for Collaborators" -ForegroundColor Green
Write-Host "   ✓ Google Cloud Storage" -ForegroundColor Green
Write-Host "   ✓ Admin Access for Both Users" -ForegroundColor Green
Write-Host "`n"

Write-Host "🔥 Firewall Note:" -ForegroundColor Yellow
Write-Host "   If collaborator can't access, allow ports 5173 and 8000 in Windows Firewall" -ForegroundColor White
Write-Host "`n"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   Ready! Share http://${localIP}:5173 with your collaborator 🚀" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

