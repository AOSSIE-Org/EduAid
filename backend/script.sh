#!/bin/bash

REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate

# Download Sense2Vec model if it doesn't exist
if [ ! -f "$S2V_ARCHIVE" ]; then
  wget $S2V_URL -O $S2V_ARCHIVE
fi

# Extract Sense2Vec model if the directory doesn't exist
if [ ! -d "$S2V_DIR" ]; then
  tar -xzvf $S2V_ARCHIVE -C . --strip-components=1
fi


# Install dependencies
# If you're using 'python' instead of 'python3', replace 'python3' with 'python' here
python3 -m pip install -r ../requirements.txt


# Start Flask server
python server.py

#  To Deactivate virtual environment
deactivate