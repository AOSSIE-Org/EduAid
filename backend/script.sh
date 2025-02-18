#!/bin/bash

REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"

# Color Codes
RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
RESET=$(tput sgr0)

# Function for error handling
handle_error() {
  echo "${RED}Error: $1${RESET}" 1>&2
  exit 1
}

echo "${GREEN}Set up your service_account_key.json before this, if you have not set it up first then run it ${RESET}"
# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "${GREEN}Creating virtual environment...${RESET}"
  python3.9 -m venv venv || handle_error "Failed to create virtual environment"
fi
source venv/bin/activate

# Download Sense2Vec model if it doesn't exist
if [ ! -f "$S2V_ARCHIVE" ]; then
  echo "${GREEN}Downloading Sense2Vec model...${RESET}"
  wget $S2V_URL -O $S2V_ARCHIVE || handle_error "Failed to download Sense2Vec model"
fi

# Extract Sense2Vec model if the directory doesn't exist
if [ ! -d "$S2V_DIR" ]; then
  echo "${GREEN}Extracting Sense2Vec model...${RESET}"
  tar -xzvf $S2V_ARCHIVE -C . --strip-components=1 || handle_error "Failed to extract Sense2Vec model"
fi

# Install dependencies
echo "${GREEN}Installing dependencies...${RESET}"
pip install torch -f https://download.pytorch.org/whl/cu113/torch_stable.html || handle_error "Failed to install torch"
python3.9 -m pip install -r ../requirements.txt || handle_error "Failed to install required Python packages"


# Start Flask server
echo "${GREEN}Press CTRL+C to stop the server and deactivate to exit fromn the virtual environment {RESET}"
echo "${GREEN}Starting Flask server...${RESET}"
python server.py || handle_error "Failed to start Flask server"
