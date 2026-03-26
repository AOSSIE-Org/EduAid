@echo off
REM EduAid Backend Development Startup Script (Windows)
REM This script helps you start the backend in different modes

echo.
echo [*] EduAid Backend Startup Script
echo ==================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [!] No .env file found. Creating from .env.example...
    copy .env.example .env
    echo [+] Created .env file. Please configure it if needed.
    echo.
)

REM Load USE_CELERY_INFERENCE from .env
for /f "tokens=1,2 delims==" %%a in ('findstr /v "^#" .env ^| findstr "USE_CELERY_INFERENCE"') do set %%a=%%b

echo Configuration:
echo   USE_CELERY_INFERENCE: %USE_CELERY_INFERENCE%
echo.

if /i "%USE_CELERY_INFERENCE%"=="true" (
    echo [*] Running in CELERY INFERENCE mode ^(memory-efficient^)
    echo.
    
    echo [!] Make sure Redis and Celery worker are running:
    echo   Redis: docker run -d -p 6379:6379 redis:7-alpine
    echo   Celery: celery -A celery_worker.celery_app worker --loglevel=info
    echo.
    echo Or use Docker Compose to start everything:
    echo   docker-compose up
    echo.
    pause
) else (
    echo [!] Running in LEGACY mode ^(loads models directly in Flask^)
    echo    This uses more memory ^(~8-10GB RAM^)
    echo.
    echo To enable memory-efficient mode:
    echo   1. Set USE_CELERY_INFERENCE=true in .env
    echo   2. Start Redis and Celery worker
    echo   3. Restart this script
    echo.
)

echo Starting Flask server...
python server.py
