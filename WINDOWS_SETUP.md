# Windows Setup Guide for EduAid

The default installation script (`script.sh`) is designed for Unix-based systems. If you are setting up EduAid on Windows, follow these manual steps to avoid "Hash Mismatch" and "Missing Model" errors.

## 1. Environment Setup & Dependencies
The `requirements.txt` contains strict version hashes that may conflict on Windows. To install dependencies smoothly, run:

```bash
# Create Virtual Environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies ignoring strict hash checks
pip install -r requirements.txt --no-deps --ignore-installed
pip install -r requirements.txt