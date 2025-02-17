#!/bin/bash

# Exit on error
set -e

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
REPO_DIR="EduAid"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"

# Function to print error messages
error() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to print success messages
success() {
    echo -e "${GREEN}$1${NC}"
}

# Check if required commands are available
command -v python3 >/dev/null 2>&1 || error "python3 is required but not installed"
command -v git >/dev/null 2>&1 || error "git is required but not installed"
command -v wget >/dev/null 2>&1 || error "wget is required but not installed"

# Increase Git buffer size
echo "Increasing Git buffer size..."
git config --global http.postBuffer 524288000 || error "Failed to set Git buffer size"
success "Git buffer size increased to 500MB"

# Disable HTTP/2 for Git
echo "Disabling HTTP/2 for Git..."
git config --global http.version HTTP/1.1 || error "Failed to disable HTTP/2"
success "HTTP/2 disabled for Git"

# Create and activate virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv || error "Failed to create virtual environment"
    success "Virtual environment created successfully"
fi

# Activate virtual environment with error handling
if [ -f "venv/bin/activate" ]; then
    echo "Activating virtual environment..."
    # shellcheck disable=SC1091
    . venv/bin/activate || error "Failed to activate virtual environment"
    success "Virtual environment activated"
else
    error "Virtual environment activation script not found"
fi

# Clone repository if it doesn't exist
if [ ! -d "$REPO_DIR" ]; then
    echo "Cloning repository..."
    git clone "$REPO_URL" || error "Failed to clone repository"
    success "Repository cloned successfully"
fi

# Download sense2vec archive if it doesn't exist
if [ ! -f "$S2V_ARCHIVE" ]; then
    echo "Downloading sense2vec archive..."
    wget "$S2V_URL" -O "$S2V_ARCHIVE" || error "Failed to download sense2vec archive"
    success "Sense2vec archive downloaded successfully"
fi

# Extract sense2vec archive if not already extracted
if [ ! -d "$REPO_DIR/$S2V_DIR" ]; then
    echo "Extracting sense2vec archive..."
    mkdir -p "$REPO_DIR/$S2V_DIR" || error "Failed to create sense2vec directory"
    tar -xzvf "$S2V_ARCHIVE" -C "$REPO_DIR/$S2V_DIR" --strip-components=1 || error "Failed to extract archive"
    success "Sense2vec archive extracted successfully"
fi

# Deactivate virtual environment
echo "Deactivating virtual environment..."
deactivate || error "Failed to deactivate virtual environment"
success "Virtual environment deactivated"

success "Setup completed successfully!"
