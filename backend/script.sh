#!/bin/bash

REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
REPO_DIR="EduAid"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate

if [ ! -d "$REPO_DIR" ]; then

  git clone $REPO_URL
  rm -rf "$REPO_DIR/.git"
fi

if [ ! -f "$S2V_ARCHIVE" ]; then
  wget $S2V_URL -O $S2V_ARCHIVE
else
  echo "Sense2Vec archive already exists, skipping download."
fi

if [ ! -d "$REPO_DIR/$S2V_DIR" ]; then
  echo "Extracting Sense2Vec model..."
  mkdir -p $REPO_DIR/$S2V_DIR
  tar -xzvf $S2V_ARCHIVE -C $REPO_DIR/$S2V_DIR --strip-components=1
else
  echo "Sense2Vec model already extracted."
fi

deactivate
