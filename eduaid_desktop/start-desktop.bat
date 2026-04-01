@echo off
REM EduAid Desktop App Launcher Script for Windows
REM This script helps launch the desktop app with proper setup

echo 🚀 Starting EduAid Desktop App...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js version 16 or higher.
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the eduaid_desktop directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing desktop app dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if web app dependencies are installed
if not exist "..\eduaid_web\node_modules" (
    echo 📦 Installing web app dependencies...
    cd ..\eduaid_web
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install web app dependencies
        pause
        exit /b 1
    )
    cd ..\eduaid_desktop
)

echo 🔧 Starting development mode...
echo This will:
echo   1. Start the React development server (http://localhost:3000)
echo   2. Launch the Electron desktop app
echo.
echo Press Ctrl+C to stop both processes
echo.

REM Start the desktop app in development mode
call npm run dev

pause
