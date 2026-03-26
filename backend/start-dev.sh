#!/bin/bash

# EduAid Backend Development Startup Script
# This script helps you start the backend in different modes

set -e

echo "🚀 EduAid Backend Startup Script"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please configure it if needed."
    echo ""
fi

# Load environment variables
if [ -f .env ]; then
    set -a
    source <(grep -v '^#' .env | grep -v '^$')
    set +a
fi

# Check USE_CELERY_INFERENCE setting
USE_CELERY=${USE_CELERY_INFERENCE:-false}

echo "Configuration:"
echo "  USE_CELERY_INFERENCE: $USE_CELERY"
echo ""

if [ "$USE_CELERY" = "true" ]; then
    echo "🔧 Running in CELERY INFERENCE mode (memory-efficient)"
    echo ""
    
    # Check if Redis is running
    if ! nc -z ${REDIS_HOST:-localhost} ${REDIS_PORT:-6379} 2>/dev/null; then
        echo "❌ Redis is not running!"
        echo ""
        echo "Please start Redis first:"
        echo "  Option 1 (Docker): docker run -d -p 6379:6379 redis:7-alpine"
        echo "  Option 2 (Local):  redis-server"
        echo "  Option 3 (Docker Compose): docker-compose up redis"
        echo ""
        exit 1
    fi
    echo "✅ Redis is running"
    
    # Check if Celery worker is running
    echo ""
    echo "⚠️  Make sure Celery worker is running in another terminal:"
    echo "  celery -A celery_worker.celery_app worker --pool=solo --concurrency=1 --loglevel=info"
    echo ""
    echo "Or use Docker Compose to start everything:"
    echo "  docker-compose up"
    echo ""
    read -p "Press Enter to continue once Celery worker is running..."
    
else
    echo "⚠️  Running in LEGACY mode (loads models directly in Flask)"
    echo "   This uses more memory (~8-10GB RAM)"
    echo ""
    echo "To enable memory-efficient mode:"
    echo "  1. Set USE_CELERY_INFERENCE=true in .env"
    echo "  2. Start Redis and Celery worker"
    echo "  3. Restart this script"
    echo ""
fi

echo "Starting Flask server..."
python server.py
