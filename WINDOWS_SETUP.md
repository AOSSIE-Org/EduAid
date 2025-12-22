# Windows Setup Guide for EduAid

The default installation script (`script.sh`) is designed for **Unix/Linux** systems.  
On **Windows**, developers often face:

- Hash mismatch errors during dependency installation  
- Issues with the automatic model download script  

Follow the **manual steps below** to run the project correctly on Windows.

---

## 1. Environment Setup & Dependencies

The `requirements.txt` file contains strict version hashes generated on other operating systems, which often causes conflicts on Windows.

Run the following commands in **PowerShell** or **Terminal**:

```powershell
# 1. Create a virtual environment
python -m venv venv
```
```powershell
# 2. Activate the virtual environment
.\venv\Scripts\activate
```
```powershell
# 3. Install packages while ignoring strict hash checks
pip install -r requirements.txt --no-deps --ignore-installed
```
```powershell
# 4. Finalize installation
pip install -r requirements.txt
```

---

## 2. Manual Model Setup (Sense2Vec)

The `script.sh` file uses **Linux-specific commands** (`wget`, `tar`).  
On **Windows**, the model must be set up **manually**.

### Download the Model

Download the following file from the official source:

```text
https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz
```

### Extract the File

Extract the archive using any of the following tools:

- **7-Zip**  
- **WinRAR**  
- Any tool that supports `.tar.gz`

### Rename and Move

1. Rename the extracted folder to:
   ```text
   s2v_old
   ```

2. Move the `s2v_old` folder inside the `backend/` directory.

### Expected Folder Structure

```text
EduAid/
├── backend/
│   ├── s2v_old/
│   ├── Generator/
│   ├── server.py
│   └── ...
```

---

## 3. Running the Server

After installing dependencies and placing the model correctly, run:

```bash
cd backend
python server.py
```

The server should start at:

```text
http://127.0.0.1:5000
```

---

## Troubleshooting

### Hash Mismatch Errors
If you still face hash errors, try:
```powershell
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

### Model Not Found
Ensure the folder structure is exactly as shown above. The server expects `s2v_old/` inside `backend/`.

### Port Already in Use
If port 5000 is occupied, modify `server.py` to use a different port:
```python
app.run(port=5001)
```

---

## Additional Notes

- Make sure Python 3.7+ is installed
- Use a virtual environment to avoid conflicts
- For detailed error logs, check the terminal output

---

## Happy Coding! 🚀