#!/bin/bash

# EduAid Desktop App Launcher Script
# This script helps launch the desktop app with proper setup

echo "🚀 Starting EduAid Desktop App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js version 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the eduaid_desktop directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing desktop app dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if web app dependencies are installed
if [ ! -d "../eduaid_web/node_modules" ]; then
    echo "📦 Installing web app dependencies..."
    cd ../eduaid_web
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install web app dependencies"
        exit 1
    fi
    cd ../eduaid_desktop
fi

echo "🔧 Starting development mode..."
echo "This will:"
echo "  1. Start the React development server (http://localhost:3000)"
echo "  2. Launch the Electron desktop app"
echo ""
echo "Press Ctrl+C to stop both processes"
echo ""

# Start the desktop app in development mode
npm run dev
