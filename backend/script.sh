#!/bin/bash

REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
 S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
 
REPO_DIR="EduAid"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"

# this will  Detect OS
OS="$(uname -s)"

if [ [ "$OS" == "MINGW64_NT"* || "$OS" == "MSYS_NT"* ] ]; then
    echo "Detected Windows environment"
    PYTHON_CMD="python"   # Windows uses `python`
    VENV_ACTIVATE="venv\\Scripts\\activate"
    DOWNLOAD_CMD="curl -L -o"  
else
    echo "Detected Linux/macOS environment"
    PYTHON_CMD="python3"  
    VENV_ACTIVATE="source venv/bin/activate"
    DOWNLOAD_CMD="wget -O"  
fi


if [ ! -d "venv" ]; then
  $PYTHON_CMD -m venv venv
fi


if [[ "$OS" == "MINGW64_NT"* || "$OS" == "MSYS_NT"* ]]; then
    source $VENV_ACTIVATE
else
    source venv/bin/activate
fi


if [ ! -d "$REPO_DIR" ]; then
  git clone $REPO_URL
fi


if [ ! -f "$S2V_ARCHIVE" ]; then
  $DOWNLOAD_CMD $S2V_ARCHIVE $S2V_URL
fi


if [ ! -d "$REPO_DIR/$S2V_DIR" ]; then
  mkdir -p $REPO_DIR/$S2V_DIR
  tar -xzvf $S2V_ARCHIVE -C $REPO_DIR/$S2V_DIR --strip-components=1
fi


deactivate
