# EduAid - Running Instructions

This document provides step-by-step instructions to set up and run the EduAid project on Windows using PowerShell.

## Prerequisites

- Python 3.13 (or Python 3.11 for better compatibility)
- Git
- Node.js (for web/extension/desktop components)

## Environment Setup

### Option 1: Using Python venv (Recommended for Python 3.13)

```powershell
# Navigate to project directory
cd C:\Users\HP\Music\ASSIOE\EduAid

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip, setuptools, and wheel
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt

# Install spaCy model
python -m spacy download en_core_web_sm
```

### Option 2: Using Python 3.11 (Better compatibility)

If you encounter issues with Python 3.13 (e.g., numpy build issues), use Python 3.11:

```powershell
# Create virtual environment with Python 3.11
py -3.11 -m venv .venv

# Activate and install (same as above)
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Configure Google APIs (if needed):**
   - Place `service_account_key.json` in the `backend` folder for Google Docs API
   - Place `credentials.json` in the `backend` folder for Google Forms API
   - See README.md for detailed Google API setup instructions

3. **Start the Flask server:**
   ```powershell
   python server.py
   ```
   
   The server will start on `http://localhost:5000` by default.

4. **Test the server:**
   ```powershell
   # In a new terminal
   python test_server.py
   ```

## Web App Setup

1. **Navigate to web app directory:**
   ```powershell
   cd eduaid_web
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start development server:**
   ```powershell
   npm start
   ```

   The web app will be available at `http://localhost:3000` (or another port if 3000 is busy).

## Extension Setup

1. **Navigate to extension directory:**
   ```powershell
   cd extension
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Build the extension:**
   ```powershell
   npm run build
   ```

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Desktop App Setup

1. **Navigate to desktop app directory:**
   ```powershell
   cd eduaid_desktop
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start in development mode:**
   ```powershell
   npm run dev
   ```

## Dependency Changes

This project has been updated to replace deprecated packages:

- **sense2vec** → **sentence-transformers** (for word similarity)
- **pke** → **keybert** (for keyphrase extraction)
- **flashtext** → **regex-based matching** (for keyword extraction)
- **similarity.normalized_levenshtein** → **rapidfuzz** (for string similarity)
- **oauth2client/apiclient/httplib2** → **google-auth/google-api-python-client** (for Google APIs)

## Troubleshooting

### NumPy Build Issues

If you encounter NumPy build errors (GCC version issues):
- Use Python 3.11 instead of 3.13
- Or ensure you have pre-built wheels available

### spaCy Model Issues

If the spaCy model fails to load:
```powershell
python -m spacy download en_core_web_sm
```

### Import Errors

If you see import errors for deprecated packages:
- Ensure you've activated the virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`

### Google API Issues

- Ensure `service_account_key.json` and `credentials.json` are in the `backend` folder
- For Google Forms API, you may need to complete OAuth flow on first use

## Running Tests

```powershell
# From backend directory
python test_server.py
```

## Notes

- The backend server must be running before using the web app, extension, or desktop app
- First run will download NLTK data and transformer models (may take time)
- GPU support is optional but recommended for faster inference

