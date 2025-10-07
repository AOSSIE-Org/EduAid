#!/bin/bash
set -e
set -o pipefail
set -u

print_message() {
    local type="$1"
    local message="$2"
    case "$type" in
        info) echo -e "\033[34m[INFO] $message\033[0m" ;;
        success) echo -e "\033[32m[SUCCESS] $message\033[0m" ;;
        error) echo -e "\033[31m[ERROR] $message\033[0m" ;;
        *) echo "$message" ;;
    esac
}

print_message info "Checking required dependencies..."

if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    print_message error "Python is not installed. Aborting."
    exit 1
fi

command -v git >/dev/null 2>&1 || { print_message error "Git is not installed."; exit 1; }
if ! command -v wget >/dev/null 2>&1 && ! command -v curl >/dev/null 2>&1; then
    print_message error "Neither wget nor curl is installed."; exit 1
fi
command -v tar >/dev/null 2>&1 || { print_message error "tar not found."; exit 1; }

print_message success "Dependency check passed."

REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git_root=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null); then
    REPO_DIR="$git_root"
    print_message info "Using existing repository at $REPO_DIR"
else
    REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/EduAid"
    print_message info "Will clone repository to $REPO_DIR"
fi

S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
S2V_ARCHIVE="$REPO_DIR/s2v_reddit_2015_md.tar.gz"
S2V_DIR="$REPO_DIR/s2v_old"
VENV_DIR="$REPO_DIR/venv"
OS_TYPE=$(uname -s)

if [ ! -d "$VENV_DIR" ]; then
    print_message info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv "$VENV_DIR" || { print_message error "Failed to create venv."; exit 1; }
    print_message success "Virtual environment created."
else
    print_message info "Virtual environment already exists."
fi

print_message info "Activating virtual environment..."
if [[ "$OS_TYPE" == "Linux" || "$OS_TYPE" == "Darwin" ]]; then
    source "$VENV_DIR/bin/activate" || { print_message error "Activation failed."; exit 1; }
elif [[ "$OS_TYPE" == *"MINGW"* || "$OS_TYPE" == *"CYGWIN"* || "$OS_TYPE" == *"MSYS"* ]]; then
    source "$VENV_DIR/Scripts/activate" || { print_message error "Activation failed."; exit 1; }
else
    print_message error "Unknown OS type: $OS_TYPE"
    exit 1
fi
print_message success "Virtual environment activated."

command -v pip >/dev/null 2>&1 || { print_message error "pip not found."; exit 1; }

print_message info "Upgrading pip..."
$PYTHON_CMD -m pip install --upgrade pip || { print_message error "pip upgrade failed."; exit 1; }
print_message success "pip upgraded."

if git -C "$REPO_DIR" rev-parse --git-dir >/dev/null 2>&1; then
    print_message info "Repository already exists at $REPO_DIR."
else
    print_message info "Cloning EduAid repository..."
    git clone "$REPO_URL" "$REPO_DIR" || { print_message error "Clone failed."; exit 1; }
    print_message success "Repository cloned."
fi

REQUIREMENTS_FILE="$REPO_DIR/requirements.txt"
if [ -f "$REQUIREMENTS_FILE" ] && grep -q "torch==" "$REQUIREMENTS_FILE"; then
    print_message info "Updating torch version..."
    sed -i.bak 's/torch==.*/torch==2.8.0/' "$REQUIREMENTS_FILE"
    rm -f "$REQUIREMENTS_FILE.bak"
    print_message success "torch updated to 2.8.0"
fi

if [ -f "$REQUIREMENTS_FILE" ]; then
    print_message info "Installing dependencies..."
    pip install -r "$REQUIREMENTS_FILE" || { print_message error "Dependency install failed."; exit 1; }
    print_message success "Dependencies installed."
else
    print_message info "No requirements.txt found."
fi

if [ ! -f "$S2V_ARCHIVE" ]; then
    print_message info "Downloading sense2vec archive..."
    if command -v wget >/dev/null 2>&1; then
        wget "$S2V_URL" -O "$S2V_ARCHIVE" || { print_message error "Download failed."; exit 1; }
    else
        curl -L "$S2V_URL" -o "$S2V_ARCHIVE" || { print_message error "Download failed."; exit 1; }
    fi
    print_message success "Archive downloaded."
else
    print_message info "Archive already exists."
fi

EXPECTED_SHA256="d41d8cd98f00b204e9800998ecf8427e"
ACTUAL_SHA256=$(sha256sum "$S2V_ARCHIVE" | awk '{print $1}')
if [[ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]]; then
    print_message error "Checksum mismatch for $S2V_ARCHIVE."
    exit 1
fi

if [ ! -d "$S2V_DIR" ]; then
    print_message info "Extracting sense2vec archive..."
    mkdir -p "$S2V_DIR"
    tar -xzf "$S2V_ARCHIVE" -C "$S2V_DIR" --strip-components=1 || { print_message error "Extraction failed."; exit 1; }
    rm -f "$S2V_ARCHIVE"
    print_message success "Extraction completed and archive removed."
else
    print_message info "Sense2vec directory already exists."
fi

if [[ -n "${VIRTUAL_ENV:-}" ]]; then
    print_message info "Deactivating virtual environment..."
    deactivate
    print_message success "Virtual environment deactivated."
fi

print_message success "EduAid setup completed successfully!"

if [[ "$OS_TYPE" == *"MINGW"* || "$OS_TYPE" == *"CYGWIN"* || "$OS_TYPE" == *"MSYS"* ]]; then
    read -p "Press Enter to exit..."
fi
