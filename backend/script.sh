#!/bin/bash
set -e
set -o pipefail
set -u  # Treat unset variables as errors

# Colored messages function
print_message() {
    local type="$1"
    local message="$2"

    case "$type" in
        info)
            echo -e "\033[34m[INFO] $message\033[0m" ;;
        success)
            echo -e "\033[32m[SUCCESS] $message\033[0m" ;;
        error)
            echo -e "\033[31m[ERROR] $message\033[0m" ;;
        *)
            echo "$message" ;;
    esac
}

print_message info "Checking required dependencies..."

# Python detection
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    print_message error "Python is not installed. Aborting."
    exit 1
fi

# Git check
command -v git >/dev/null 2>&1 || { print_message error "Git is not installed. Aborting."; exit 1; }

# Wget or curl
if ! command -v wget >/dev/null 2>&1 && ! command -v curl >/dev/null 2>&1; then
    print_message error "Neither wget nor curl is installed. Aborting."
    exit 1
fi

# Tar check
command -v tar >/dev/null 2>&1 || { print_message error "tar command is not found. Needed for sense2vec extraction."; exit 1; }

print_message success "Dependency check passed."

# Variables
REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if the script is already inside a Git repo
if git_root=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null); then
    REPO_DIR="$git_root"
    print_message info "Using existing repository at $REPO_DIR"
else
    REPO_DIR="$SCRIPT_DIR/../EduAid"
    print_message info "Will clone repository to $REPO_DIR"
fi

S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"
VENV_DIR="venv"
OS_TYPE=$(uname -s)

# Create virtual environment
if [ ! -d "$VENV_DIR" ]; then
    print_message info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv "$VENV_DIR" || { print_message error "Failed to create virtual environment."; exit 1; }
    print_message success "Virtual environment created."
else
    print_message info "Virtual environment already exists, skipping creation."
fi

# Activate virtual environment
print_message info "Activating virtual environment..."
if [[ "$OS_TYPE" == "Linux" || "$OS_TYPE" == "Darwin" ]]; then
    source "$VENV_DIR/bin/activate" || { print_message error "Failed to activate virtual environment."; exit 1; }
elif [[ "$OS_TYPE" == *"MINGW"* || "$OS_TYPE" == *"CYGWIN"* ]]; then
    source "$VENV_DIR/Scripts/activate" || { print_message error "Failed to activate virtual environment."; exit 1; }
else
    print_message error "Unknown OS. Cannot activate virtual environment."
    exit 1
fi
print_message success "Virtual environment activated."

# Ensure pip exists
command -v pip >/dev/null 2>&1 || { print_message error "pip not found in virtual environment."; exit 1; }

# Upgrade pip
print_message info "Upgrading pip..."
$PYTHON_CMD -m pip install --upgrade pip || { print_message error "Failed to upgrade pip."; exit 1; }
print_message success "pip upgraded successfully."

# Clone EduAid repository if needed
if git -C "$REPO_DIR" rev-parse --git-dir >/dev/null 2>&1; then
    print_message info "Repository already exists at $REPO_DIR, skipping clone."
else
    print_message info "Cloning EduAid repository to $REPO_DIR..."
    git clone "$REPO_URL" "$REPO_DIR" || { print_message error "Failed to clone repository."; exit 1; }
    print_message success "Repository cloned."
fi

# Update torch version automatically
REQUIREMENTS_FILE="$REPO_DIR/requirements.txt"
if [ -f "$REQUIREMENTS_FILE" ]; then
    if grep -q "torch==" "$REQUIREMENTS_FILE"; then
        print_message info "Updating torch version in requirements.txt..."
        sed -i.bak 's/torch==.*/torch==2.8.0/' "$REQUIREMENTS_FILE"
        rm -f "$REQUIREMENTS_FILE.bak"
        print_message success "torch version updated to 2.8.0"
    fi
fi

# Install Python dependencies
if [ -f "$REQUIREMENTS_FILE" ]; then
    print_message info "Installing Python dependencies..."
    pip install -r "$REQUIREMENTS_FILE" || { print_message error "Failed to install Python dependencies."; exit 1; }
    print_message success "Python dependencies installed."
else
    print_message info "No requirements.txt found, skipping Python dependency installation."
fi

# Download sense2vec
if [ ! -f "$S2V_ARCHIVE" ]; then
    print_message info "Downloading sense2vec archive..."
    if command -v wget >/dev/null 2>&1; then
        wget "$S2V_URL" -O "$S2V_ARCHIVE" || { print_message error "Failed to download archive with wget."; exit 1; }
    elif command -v curl >/dev/null 2>&1; then
        curl -L "$S2V_URL" -o "$S2V_ARCHIVE" || { print_message error "Failed to download archive with curl."; exit 1; }
    fi
    print_message success "Sense2vec archive downloaded."
else
    print_message info "Sense2vec archive already exists, skipping download."
fi

# Extract sense2vec
if [ ! -d "$REPO_DIR/$S2V_DIR" ]; then
    print_message info "Extracting sense2vec archive..."
    mkdir -p "$REPO_DIR/$S2V_DIR"
    tar -xzf "$S2V_ARCHIVE" -C "$REPO_DIR/$S2V_DIR" --strip-components=1 || { print_message error "Failed to extract archive."; exit 1; }
    print_message success "Sense2vec archive extracted."
else
    print_message info "Sense2vec directory already exists, skipping extraction."
fi

# Deactivate virtual environment (safe with set -u)
if [[ -n "${VIRTUAL_ENV:-}" ]]; then
    print_message info "Deactivating virtual environment..."
    deactivate
    print_message success "Virtual environment deactivated."
fi

print_message success "EduAid setup completed successfully!"

# Optional pause for Windows
if [[ "$OS_TYPE" == *"MINGW"* || "$OS_TYPE" == *"CYGWIN"* ]]; then
    read -p "Press Enter to exit..."
fi