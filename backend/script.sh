#!/bin/bash

REPO_URL="https://github.com/AOSSIE-Org/EduAid.git"
S2V_URL="https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz"
REPO_DIR="EduAid"
S2V_ARCHIVE="s2v_reddit_2015_md.tar.gz"
S2V_TARGET_DIR="backend/Generator/s2v_old"

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting EduAid setup...${NC}"

# Detect Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Python not found. Please install Python 3.7+${NC}"
    exit 1
fi

echo -e "${GREEN}Using Python command: $PYTHON_CMD${NC}"

# Check if we're already inside the EduAid repository
if [ -f "README.md" ] || [ -d "backend" ]; then
    echo -e "${YELLOW}Already in EduAid repository. Using current directory.${NC}"
    WORKING_DIR="."
else
    echo -e "${YELLOW}Setting up in $REPO_DIR directory...${NC}"
    WORKING_DIR="$REPO_DIR"
    
    # Clone or update repository
    if [ ! -d "$REPO_DIR" ]; then
        echo -e "${GREEN}Cloning EduAid repository...${NC}"
        git clone $REPO_URL
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to clone repository${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}EduAid repository already exists. Updating...${NC}"
        cd $REPO_DIR
        git fetch origin
        git pull origin main
        cd ..
    fi
fi

# Change to working directory once
cd "$WORKING_DIR"
echo -e "${GREEN}Working directory: $(pwd)${NC}"

# Create and activate virtual environment
if [ ! -d "venv" ]; then
    echo -e "${GREEN}Creating virtual environment...${NC}"
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Virtual environment already exists.${NC}"
fi

# Cross-platform virtual environment activation
echo -e "${GREEN}Activating virtual environment...${NC}"
if [ -f "venv/bin/activate" ]; then
    # Linux/macOS
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    # Windows (Git Bash, WSL)
    source venv/Scripts/activate
elif [ -f "venv/Scripts/Activate.ps1" ]; then
    # Windows PowerShell
    echo -e "${YELLOW}Please activate virtual environment manually in PowerShell:${NC}"
    echo -e "${YELLOW}  .\\venv\\Scripts\\Activate.ps1${NC}"
    echo -e "${YELLOW}Then run: pip install -r requirements.txt${NC}"
    echo -e "${YELLOW}And: $PYTHON_CMD backend/server.py${NC}"
    exit 1
else
    echo -e "${RED}Virtual environment activation script not found${NC}"
    exit 1
fi

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}Installing dependencies from requirements.txt...${NC}"
    pip install --upgrade pip
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}requirements.txt not found!${NC}"
    exit 1
fi

# Download S2V model if not exists
if [ ! -f "$S2V_ARCHIVE" ]; then
    echo -e "${GREEN}Downloading Sense2Vec model...${NC}"
    # Use curl if wget not available
    if command -v wget &> /dev/null; then
        wget $S2V_URL -O $S2V_ARCHIVE
    elif command -v curl &> /dev/null; then
        curl -L $S2V_URL -o $S2V_ARCHIVE
    else
        echo -e "${RED}Neither wget nor curl available. Please install one of them.${NC}"
        exit 1
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to download Sense2Vec model${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Sense2Vec model already downloaded.${NC}"
fi

# Extract S2V model to correct directory
if [ ! -d "$S2V_TARGET_DIR" ] || [ -z "$(ls -A $S2V_TARGET_DIR 2>/dev/null)" ]; then
    echo -e "${GREEN}Extracting Sense2Vec model to $S2V_TARGET_DIR...${NC}"
    mkdir -p $S2V_TARGET_DIR
    # Use non-verbose extraction for cleaner output
    tar -xzf $S2V_ARCHIVE -C $S2V_TARGET_DIR --strip-components=1
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to extract Sense2Vec model${NC}"
        exit 1
    fi
    echo -e "${GREEN}Model extracted successfully to $S2V_TARGET_DIR${NC}"
else
    echo -e "${YELLOW}Sense2Vec model already extracted in $S2V_TARGET_DIR${NC}"
fi

# Verify the model extraction
if [ -d "$S2V_TARGET_DIR" ] && [ "$(ls -A $S2V_TARGET_DIR)" ]; then
    echo -e "${GREEN}✓ Sense2Vec model verified in $S2V_TARGET_DIR${NC}"
    
    # Show model contents for debugging
    echo -e "${YELLOW}Model contents:${NC}"
    ls -la "$S2V_TARGET_DIR" | head -10
else
    echo -e "${RED}✗ Sense2Vec model extraction failed or directory is empty${NC}"
    exit 1
fi

# Verify server.py can find the model
echo -e "${GREEN}Verifying server paths...${NC}"
if [ -f "backend/server.py" ]; then
    # Check if server.py references the correct model path
    if grep -q "s2v_old" backend/server.py; then
        echo -e "${GREEN}✓ server.py references s2v_old model path${NC}"
    else
        echo -e "${YELLOW}⚠ server.py may not reference the expected model path${NC}"
    fi
else
    echo -e "${RED}✗ backend/server.py not found!${NC}"
    exit 1
fi

# Start the Flask server
echo -e "${GREEN}Starting Flask server...${NC}"
echo -e "${GREEN}Server will be available at: http://localhost:5000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"

# Start server with error handling
cd backend
echo -e "${YELLOW}Current directory: $(pwd)${NC}"
echo -e "${YELLOW}Model relative path: ../$S2V_TARGET_DIR${NC}"

$PYTHON_CMD server.py || {
    echo -e "${RED}Failed to start Flask server${NC}"
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo -e "${YELLOW}1. Check if port 5000 is already in use: netstat -tulpn | grep 5000${NC}"
    echo -e "${YELLOW}2. Verify model path in server.py expects: ../$S2V_TARGET_DIR${NC}"
    echo -e "${YELLOW}3. Check server.py can find the model file${NC}"
    echo -e "${YELLOW}4. Ensure all dependencies are installed${NC}"
    echo -e "${YELLOW}5. Check server.py error messages above${NC}"
    exit 1
}