@echo off
REM ML Model & Backend Diagnostic Script
REM Run this to check if everything is working

echo.
echo ======================================
echo  EduAid Diagnostic Script
echo ======================================
echo.

REM Check if venv is activated
echo [1/5] Checking Python environment...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python not found. Activate venv first:
    echo    C:\venv\Scripts\Activate.ps1
    exit /b 1
)
echo ✅ Python found

echo.
echo [2/5] Checking required packages...
python -c "import torch; print(f'✅ PyTorch {torch.__version__}')" || echo "❌ PyTorch missing"
python -c "import transformers; print(f'✅ Transformers {transformers.__version__}')" || echo "❌ Transformers missing"
python -c "import spacy; print('✅ SpaCy found')" || echo "❌ SpaCy missing"
python -c "import fitz; print('✅ PyMuPDF found')" || echo "❌ PyMuPDF missing"
python -c "import mammoth; print('✅ Mammoth found')" || echo "❌ Mammoth missing"
python -c "import sense2vec; print('✅ Sense2Vec found')" || echo "❌ Sense2Vec missing"

echo.
echo [3/5] Checking SpaCy model...
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✅ en_core_web_sm loaded')" || (
    echo ❌ SpaCy model missing. Download it:
    echo    python -m spacy download en_core_web_sm
)

echo.
echo [4/5] Checking sense2vec model...
if exist "backend\s2v_old" (
    echo ✅ sense2vec model found
) else (
    echo ⚠️  sense2vec model folder not found
    echo    Check if s2v_old exists in backend/
)

echo.
echo [5/5] Testing Flask backend...
timeout /t 2 /nobreak >nul
python -c "from Generator.main import MCQGenerator; print('✅ MCQGenerator loads')" || echo "❌ MCQGenerator failed to load"

echo.
echo ======================================
echo  Diagnostic Complete
echo ======================================
echo.
echo Next step: Start the backend server
echo   python server.py
echo.
pause
