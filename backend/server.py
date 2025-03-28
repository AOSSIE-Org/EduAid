from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
import os
import re
import random
import subprocess
import glob

# More modular and typed imports
from typing import Dict, List, Optional
from werkzeug.utils import secure_filename

# Centralized configuration
class Config:
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB file upload limit
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'vtt'}
    UPLOAD_FOLDER = 'uploads'
    SUBTITLES_FOLDER = 'subtitles'

# Enhanced error handling decorator
def handle_exceptions(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as ve:
            logging.error(f"Value Error: {ve}")
            return jsonify({'error': str(ve)}), 400
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            return jsonify({'error': 'Internal server error'}), 500
    return wrapper

class FileProcessor:
    @staticmethod
    def allowed_file(filename: str) -> bool:
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

    @staticmethod
    def clean_filename(filename: str) -> str:
        return secure_filename(filename)

class TranscriptProcessor:
    @staticmethod
    def clean_transcript(file_path: str) -> str:
        """Enhanced transcript cleaning with more robust parsing."""
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                lines = file.readlines()

            transcript_lines = []
            capture_text = False

            for line in lines:
                line = line.strip()
                if '-->' in line:
                    capture_text = True
                    continue
                
                if capture_text and line and not line.startswith(('WEBVTT', 'Kind:', 'Language:')):
                    # More advanced cleaning 
                    cleaned_line = re.sub(r'<[^>]+>', '', line)
                    cleaned_line = re.sub(r'\s+', ' ', cleaned_line)
                    transcript_lines.append(cleaned_line)

            return ' '.join(transcript_lines).strip()
        except IOError as e:
            logging.error(f"File reading error: {e}")
            return ""

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Rate limiting
    limiter = Limiter(
        app,
        key_func=get_remote_address,
        default_limits=["100 per day", "30 per hour"]
    )

    # Logging configuration
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s: %(message)s'
    )

    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
    app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
    
    @app.route('/upload', methods=['POST'])
    @handle_exceptions
    @limiter.limit("10 per minute")
    def upload_file():
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if file and FileProcessor.allowed_file(file.filename):
            filename = FileProcessor.clean_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Process file logic here
            return jsonify({"message": "File uploaded successfully"})
        
        return jsonify({"error": "File type not allowed"}), 400

    @app.route('/getTranscript', methods=['GET'])
    @handle_exceptions
    @limiter.limit("20 per hour")
    def get_transcript():
        video_id = request.args.get('videoId')
        if not video_id:
            return jsonify({"error": "No video ID provided"}), 400

        try:
            subprocess.run([
                "yt-dlp", 
                "--write-auto-sub", 
                "--sub-lang", "en", 
                "--skip-download",
                "--sub-format", "vtt", 
                "-o", f"{Config.SUBTITLES_FOLDER}/{video_id}.vtt", 
                f"https://www.youtube.com/watch?v={video_id}"
            ], check=True, capture_output=True, text=True)

            subtitle_files = glob.glob(f"{Config.SUBTITLES_FOLDER}/*.vtt")
            if not subtitle_files:
                return jsonify({"error": "No subtitles found"}), 404

            latest_subtitle = max(subtitle_files, key=os.path.getctime)
            transcript_text = TranscriptProcessor.clean_transcript(latest_subtitle)

            # Clean up
            os.remove(latest_subtitle)

            return jsonify({"transcript": transcript_text})
        
        except subprocess.CalledProcessError as e:
            logging.error(f"Subprocess error: {e}")
            return jsonify({"error": "Failed to download transcript"}), 500

    return app

def main():
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.SUBTITLES_FOLDER, exist_ok=True)
    
    app = create_app()
    app.run(debug=True)

if __name__ == "__main__":
    main()
