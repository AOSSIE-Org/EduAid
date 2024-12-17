# #!/bin/bash

S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_DIR="s2v_old"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

if [ -d "$S2V_DIR" ]; then
  echo "Directory exists, skipping"
  exit 0
fi

if [ ! -f "$S2V_ARCHIVE" ]; then
  echo "Downloading S2V.."
  wget $S2V_URL -O $S2V_ARCHIVE
fi

# Extract the archive
mkdir -p $S2V_DIR
echo "Extracting archive into '$S2V_DIR'..."
tar -xzvf $S2V_ARCHIVE

# Cleanup
rm $S2V_ARCHIVE
