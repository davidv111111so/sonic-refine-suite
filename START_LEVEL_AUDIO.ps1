# 🎵 LEVEL AUDIO - Development Startup Script
# This script starts both the backend and frontend servers for local development

Write-Host "`n" -NoNewline
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "       🎵 LEVEL AUDIO - Professional Audio Mastering Suite" -ForegroundColor Magenta
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Starting development environment...`n" -ForegroundColor Yellow

# Check if we're in the correct directory
if (-not (Test-Path "backend\main.py")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $PWD" -ForegroundColor Yellow
    Write-Host "   Expected: sonic-refine-suite-project\" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Project directory verified" -ForegroundColor Green

# Function to start backend in a new window
function Start-Backend {
    Write-Host "`n📡 Starting Backend Server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🎚️  Starting LEVEL AUDIO Backend...' -ForegroundColor Green; .\start_with_credentials.ps1"
    Write-Host "   Backend will start at: http://localhost:8000" -ForegroundColor White
}

# Function to start frontend dev server in a new window
function Start-Frontend {
    Write-Host "`n💻 Starting Frontend Dev Server..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3  # Wait for backend to initialize
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\sonic-refine-suite'; Write-Host '⚡ Starting LEVEL AUDIO Frontend...' -ForegroundColor Green; npm run dev"
    Write-Host "   Frontend will start at: http://localhost:5173" -ForegroundColor White
}

# Start servers
Start-Backend
Start-Frontend

Write-Host "`n" -NoNewline
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "                    🚀 Servers Starting Up..." -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "📍 Access Points:" -ForegroundColor Yellow
Write-Host "   • Frontend (Dev):  " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host "   • Backend API:     " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Green
Write-Host "   • API Docs:        " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Green
Write-Host "`n"

Write-Host "🔐 Admin Users:" -ForegroundColor Yellow
Write-Host "   • davidv111111@gmail.com" -ForegroundColor White
Write-Host "   • santiagov.t068@gmail.com" -ForegroundColor White
Write-Host "`n"

Write-Host "🌐 Network Access (for collaborators):" -ForegroundColor Yellow
Write-Host "   Run this in frontend terminal for network access:" -ForegroundColor White
Write-Host "   npm run dev -- --host" -ForegroundColor Cyan
Write-Host "   Then access at: http://192.168.1.164:5173" -ForegroundColor Green
Write-Host "`n"

Write-Host "✨ Features Enabled:" -ForegroundColor Yellow
Write-Host "   ✓ Real AI Mastering with Matchering" -ForegroundColor Green
Write-Host "   ✓ Google Cloud Storage" -ForegroundColor Green
Write-Host "   ✓ Admin Access" -ForegroundColor Green
Write-Host "   ✓ All Enhancement Features" -ForegroundColor Green
Write-Host "`n"

Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Wait 10-15 seconds for servers to fully start" -ForegroundColor White
Write-Host "   • Check the new terminal windows for startup logs" -ForegroundColor White
Write-Host "   • Press Ctrl+C in each window to stop servers" -ForegroundColor White
Write-Host "`n"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   Ready! Open http://localhost:5173 in your browser 🚀" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

