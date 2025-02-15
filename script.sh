#!/bin/bash

S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"

BACKEND_DIR="backend"
WEB_DIR="eduaid_web"
EXTENSION_DIR="extension"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"

echo "Setting up EduAid"

if [ ! -d "venv" ]; then
    echo "creating virtual environment"
    python -m venv venv
fi

echo "virtual environment activating"

VENV_PATH="./venv/Scripts/activate"
source "$VENV_PATH"
echo "insstalling requirements for python"
pip install -r requirements.txt

echo "going to backend"

cd backend

if [ ! -f "$S2V_ARCHIVE" ]; then
    echo "Downloading sense2vec archive"
    curl -L $S2V_URL --output $S2V_ARCHIVE

fi

if [ -f "$S2V_ARCHIVE" ]; then

    echo "Extracting"
    tar -xvf "$S2V_ARCHIVE"
else
    echo "Error: Archive file not found: $S2V_ARCHIVE"
    exit 1
fi

rm -rf ${S2V_ARCHIVE}

cd ..
# React dependencies for web app
echo "Setting up web application dependencies"
cd "$WEB_DIR"
npm install
cd ..

# React dependencies for extension
echo "Setting up extension dependencies"
cd "$EXTENSION_DIR"
npm install
cd ..

echo "Setup complete! All components are ready."
