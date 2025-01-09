#!/bin/bash

REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
REPO_DIR="EduAid"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"

# Step 1: Set up Python virtual environment
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv || { echo "Failed to create virtual environment"; exit 1; }
fi
source venv/bin/activate

# Step 2: Clone repository if it doesn't exist
if [ ! -d "$REPO_DIR" ]; then
  echo "Cloning repository..."
  git clone $REPO_URL || { echo "Failed to clone repository"; deactivate; exit 1; }
else
  echo "Repository already exists. Skipping clone."
fi

# Step 3: Download Sense2Vec archive if not present
if [ ! -f "$S2V_ARCHIVE" ]; then
  echo "Downloading Sense2Vec model..."
  wget $S2V_URL -O $S2V_ARCHIVE || { echo "Failed to download Sense2Vec model"; deactivate; exit 1; }
else
  echo "Sense2Vec archive already exists. Skipping download."
fi

# Step 4: Extract archive to target directory
if [ ! -d "$REPO_DIR/$S2V_DIR" ]; then
  echo "Extracting Sense2Vec archive..."
  mkdir -p "$REPO_DIR/$S2V_DIR" &&
  tar -xzvf $S2V_ARCHIVE -C "$REPO_DIR/$S2V_DIR" --strip-components=1 || {
    echo "Failed to extract Sense2Vec archive"; 
    deactivate; 
    exit 1; 
  }
else
  echo "Sense2Vec directory already exists. Skipping extraction."
fi

# Deactivate virtual environment
deactivate

echo "Setup completed successfully."
