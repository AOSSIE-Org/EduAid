#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

VENV_DIR="$SCRIPT_DIR/venv"
S2V_DIR="$SCRIPT_DIR/s2v_old"
S2V_ARCHIVE="$SCRIPT_DIR/s2v_reddit_2015_md.tar.gz"
S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"

TMP_DOWNLOAD=""
TMP_EXTRACT=""

cleanup() {
    if [[ -n "$TMP_DOWNLOAD" && -f "$TMP_DOWNLOAD" ]]; then
        rm -f "$TMP_DOWNLOAD"
    fi

    if [[ -n "$TMP_EXTRACT" && -d "$TMP_EXTRACT" ]]; then
        rm -rf "$TMP_EXTRACT"
    fi
}

trap cleanup EXIT

die() {
    echo "ERROR: $*" >&2
    exit 1
}

# Verify required files and commands
[[ -f "$PROJECT_ROOT/requirements.txt" ]] ||
    die "requirements.txt not found at $PROJECT_ROOT"

command -v python3 >/dev/null 2>&1 ||
    die "Python 3 is required. Install Python 3 and its venv support."

# Create and activate the virtual environment
if [[ ! -x "$VENV_DIR/bin/python" ]]; then
    [[ ! -e "$VENV_DIR" ]] ||
        die "Incomplete virtual environment found at $VENV_DIR. Remove it and rerun."

    if ! python3 -m venv "$VENV_DIR"; then
        rm -rf "$VENV_DIR"
        die "Could not create virtual environment. On Ubuntu/Debian, install python3-venv."
    fi
fi

source "$VENV_DIR/bin/activate"

# Install project dependencies
python -m pip install --upgrade pip
python -m pip install -r "$PROJECT_ROOT/requirements.txt"

# Download and validate the Sense2Vec archive if necessary
if [[ ! -d "$S2V_DIR/cfg" ]]; then

    if [[ ! -s "$S2V_ARCHIVE" ]] ||
       ! tar -tzf "$S2V_ARCHIVE" >/dev/null 2>&1; then

        rm -f "$S2V_ARCHIVE"

        TMP_DOWNLOAD="$(mktemp "$SCRIPT_DIR/.s2v_download.XXXXXX")"

        if command -v curl >/dev/null 2>&1; then
            curl -fL --retry 3 "$S2V_URL" -o "$TMP_DOWNLOAD"
        elif command -v wget >/dev/null 2>&1; then
            wget -O "$TMP_DOWNLOAD" "$S2V_URL"
        else
            die "Neither curl nor wget is available. Install one to download Sense2Vec."
        fi

        tar -tzf "$TMP_DOWNLOAD" >/dev/null ||
            die "Downloaded Sense2Vec archive is invalid."

        mv "$TMP_DOWNLOAD" "$S2V_ARCHIVE"
        TMP_DOWNLOAD=""
    fi

    # Extract into a temporary directory before publishing the model
    TMP_EXTRACT="$(mktemp -d "$SCRIPT_DIR/.s2v_extract.XXXXXX")"

    tar -xzf "$S2V_ARCHIVE" -C "$TMP_EXTRACT"

    # Verify the expected model structure before publishing it
    [[ -d "$TMP_EXTRACT/s2v_old/cfg" ]] ||
        die "Sense2Vec archive does not contain s2v_old/cfg."

    # Remove an existing empty model directory before moving the extracted model
    if [[ -d "$S2V_DIR" ]]; then
        rmdir "$S2V_DIR" ||
            die "Existing Sense2Vec directory is not empty."
    elif [[ -e "$S2V_DIR" ]]; then
        die "Sense2Vec model path exists but is not a directory."
    fi

    mv "$TMP_EXTRACT/s2v_old" "$S2V_DIR"

    # Remove the remaining temporary extraction directory
    rm -rf "$TMP_EXTRACT"
    TMP_EXTRACT=""

fi

echo "Sense2Vec model is ready."
echo "Starting EduAid Flask backend..."

cd "$SCRIPT_DIR"
exec python server.py
