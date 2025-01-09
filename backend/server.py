from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
import nltk

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
nltk.download("stopwords")
nltk.download('punkt_tab')
from Generator import main
import re
import json
import spacy
from transformers import pipeline
from spacy.lang.en.stop_words import STOP_WORDS
from string import punctuation
from heapq import nlargest
import random
import webbrowser
from apiclient import discovery
from httplib2 import Http
from oauth2client import client, file, tools
from mediawikiapi import MediaWikiAPI
from flask import Flask, request, jsonify
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
import os, random
import moviepy as mp
import speech_recognition as sr
from werkzeug.utils import secure_filename
import tempfile
import shutil
from pydub import AudioSegment
from moviepy import AudioFileClip

app = Flask(__name__)
CORS(app)
print("Starting Flask App...")
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

SERVICE_ACCOUNT_FILE = './service_account_key.json'
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

MCQGen = main.MCQGenerator()
answer = main.AnswerPredictor()
BoolQGen = main.BoolQGenerator()
ShortQGen = main.ShortQGenerator()
qg = main.QuestionGenerator()
docs_service = main.GoogleDocsService(SERVICE_ACCOUNT_FILE, SCOPES)
file_processor = main.FileProcessor()
mediawikiapi = MediaWikiAPI()
qa_model = pipeline("question-answering")


def process_input_text(input_text, use_mediawiki):
    if use_mediawiki == 1:
        input_text = mediawikiapi.summary(input_text,8)
    return input_text


@app.route("/get_mcq", methods=["POST"])
def get_mcq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    output = MCQGen.generate_mcq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    questions = output["questions"]
    return jsonify({"output": questions})


@app.route("/get_boolq", methods=["POST"])
def get_boolq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    output = BoolQGen.generate_boolq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    boolean_questions = output["Boolean_Questions"]
    return jsonify({"output": boolean_questions})


@app.route("/get_shortq", methods=["POST"])
def get_shortq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    output = ShortQGen.generate_shortq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    questions = output["questions"]
    return jsonify({"output": questions})


@app.route("/get_problems", methods=["POST"])
def get_problems():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions_mcq = data.get("max_questions_mcq", 4)
    max_questions_boolq = data.get("max_questions_boolq", 4)
    max_questions_shortq = data.get("max_questions_shortq", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    output1 = MCQGen.generate_mcq(
        {"input_text": input_text, "max_questions": max_questions_mcq}
    )
    output2 = BoolQGen.generate_boolq(
        {"input_text": input_text, "max_questions": max_questions_boolq}
    )
    output3 = ShortQGen.generate_shortq(
        {"input_text": input_text, "max_questions": max_questions_shortq}
    )
    return jsonify(
        {"output_mcq": output1, "output_boolq": output2, "output_shortq": output3}
    )

@app.route("/get_mcq_answer", methods=["POST"])
def get_mcq_answer():
    data = request.get_json()
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    input_options = data.get("input_options", [])
    outputs = []

    if not input_questions or not input_options or len(input_questions) != len(input_options):
        return jsonify({"outputs": outputs})

    for question, options in zip(input_questions, input_options):
        # Generate answer using the QA model
        qa_response = qa_model(question=question, context=input_text)
        generated_answer = qa_response["answer"]

        # Calculate similarity between generated answer and each option
        options_with_answer = options + [generated_answer]
        vectorizer = TfidfVectorizer().fit_transform(options_with_answer)
        vectors = vectorizer.toarray()
        generated_answer_vector = vectors[-1].reshape(1, -1)

        similarities = cosine_similarity(vectors[:-1], generated_answer_vector).flatten()
        max_similarity_index = similarities.argmax()

        # Return the option with the highest similarity
        best_option = options[max_similarity_index]
        
        outputs.append(best_option)

    return jsonify({"output": outputs})


@app.route("/get_shortq_answer", methods=["POST"])
def get_answer():
    data = request.get_json()
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    answers = []
    for question in input_questions:
        qa_response = qa_model(question=question, context=input_text)
        answers.append(qa_response["answer"])

    return jsonify({"output": answers})


@app.route("/get_boolean_answer", methods=["POST"])
def get_boolean_answer():
    data = request.get_json()
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    output = []

    for question in input_questions:
        qa_response = answer.predict_boolean_answer(
            {"input_text": input_text, "input_question": question}
        )
        if(qa_response):
            output.append("True")
        else:
            output.append("False")

    return jsonify({"output": output})


@app.route('/get_content', methods=['POST'])
def get_content():
    try:
        data = request.get_json()
        document_url = data.get('document_url')
        if not document_url:
            return jsonify({'error': 'Document URL is required'}), 400

        text = docs_service.get_document_content(document_url)
        return jsonify(text)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/generate_gform", methods=["POST"])
def generate_gform():
    data = request.get_json()
    qa_pairs = data.get("qa_pairs", [])
    question_type = data.get("question_type", "")
    SCOPES = ["https://www.googleapis.com/auth/forms.body"]
    
    # Load credentials
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
        creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token_file:
            token_file.write(creds.to_json())
    
    # Initialize Forms service
    form_service = build('forms', 'v1', credentials=creds)

    NEW_FORM = {"info": {"title": "EduAid Form"}}
    requests_list = []

    # Add questions based on type
    for index, qapair in enumerate(qa_pairs):
        try:
            question = qapair.get("question", "")
            if question_type == "get_shortq":
                requests = {
                    "createItem": {
                        "item": {"title": question, "questionItem": {"question": {"required": True, "textQuestion": {}}}},
                        "location": {"index": index}
                    }
                }
            elif question_type == "get_mcq":
                choices = [{"value": option} for option in [qapair.get("answer")] + qapair.get("options", [])]
                random.shuffle(choices)
                requests = {
                    "createItem": {
                        "item": {"title": question, "questionItem": {"question": {"required": True, "choiceQuestion": {"type": "RADIO", "options": choices}}}},
                        "location": {"index": index}
                    }
                }
            elif question_type == "get_boolq":
                requests = {
                    "createItem": {
                        "item": {"title": question, "questionItem": {"question": {"required": True, "choiceQuestion": {"type": "RADIO", "options": [{"value": "True"}, {"value": "False"}]}}}},
                        "location": {"index": index}
                    }
                }
            else:
                continue  # Skip invalid types
            requests_list.append(requests)
        except KeyError as e:
            print(f"Invalid question data: {qapair}. Error: {e}")
    
    NEW_QUESTION = {"requests": requests_list}

    try:
        result = form_service.forms().create(body=NEW_FORM).execute()
        form_service.forms().batchUpdate(formId=result["formId"], body=NEW_QUESTION).execute()
        return jsonify({"edit_url": f"https://docs.google.com/forms/d/{result['formId']}/edit"})
    except Exception as e:
        print(f"Error creating form: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get_shortq_hard", methods=["POST"])
def get_shortq_hard():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])
    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="sentences"
    )
    return jsonify({"output": output})


@app.route("/get_mcq_hard", methods=["POST"])
def get_mcq_hard():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])
    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="multiple_choice"
    )
    return jsonify({"output": output})


@app.route('/upload_video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(video_file.filename)[1]) as temp_video_file:
            video_file.save(temp_video_file.name)
            temp_video_path = temp_video_file.name

        filename = secure_filename(video_file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        shutil.move(temp_video_path, video_path)

        video = mp.VideoFileClip(video_path)
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], "audio.wav")
        video.audio.write_audiofile(audio_path)
        video.close() # Close the video clip to release the file handle

        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_path) as source:
            audio_data = recognizer.record(source)

        try:
            text = recognizer.recognize_google(audio_data)
        except sr.UnknownValueError:
            text = "Could not understand audio"
        except sr.RequestError as e:
            text = f"Could not request results from Google Speech Recognition service; {e}"

        return jsonify({"text": text})

    except Exception as e:
        try:
            os.remove(temp_video_path)  # Clean up temporary file on error
        except FileNotFoundError:
            pass
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            os.remove(video_path)
            os.remove(audio_path)
        except FileNotFoundError:
            pass



@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_mp3_file:
            audio_file.save(temp_mp3_file.name)
            temp_mp3_path = temp_mp3_file.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav_file:
            temp_wav_path = temp_wav_file.name
            audio_clip = AudioFileClip(temp_mp3_path)
            audio_clip.write_audiofile(temp_wav_path)

        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_wav_path) as source:
            audio_data = recognizer.record(source)

        try:
            text = recognizer.recognize_google(audio_data)
        except sr.UnknownValueError:
            text = "Could not understand audio"
        except sr.RequestError as e:
            text = f"Could not request results from Google Speech Recognition service; {e}"

        return jsonify({"text": text})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            os.remove(temp_mp3_path)
            os.remove(temp_wav_path)
        except FileNotFoundError:
            pass


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    text = file_processor.process_file(file)
    
    if text:
        return jsonify({"text": text})
    else:
        return jsonify({"error": "Unsupported file type or error processing file"}), 400

@app.route("/", methods=["GET"])
def hello():
    return "The server is working fine"


if __name__ == "__main__":
    app.run()
