from flask import Flask, request, jsonify
from werkzeug.exceptions import HTTPException, BadRequest
from collections.abc import Mapping
from flask_cors import CORS
from pprint import pprint
import nltk
import subprocess
import os
import glob

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
nltk.download("stopwords")
nltk.download('punkt_tab')
from Generator import main
from Generator.question_filters import make_question_harder
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

app = Flask(__name__)
CORS(app)
print("Starting Flask App...")

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


@app.errorhandler(HTTPException)

def handle_http_exception(e):
    """Return standardized JSON for HTTP exceptions."""
    return jsonify({
        "error": e.description,
        "type": e.__class__.__name__,
    }), e.code

@app.errorhandler(Exception)
def handle_unexpected_exception(e):
    """Handle unexpected exceptions with a generic JSON response."""
    return jsonify({
        "error": "Internal server error",
        "type": "InternalServerError",
    }), 500

def require_json_field(data, field_name):
    """Validate JSON payload and return a required field."""
    if not isinstance(data, Mapping):
        raise BadRequest("JSON body must be an object")

    if field_name not in data:
        raise BadRequest(f"{field_name} is required")

    return data[field_name]

def process_input_text(input_text, use_mediawiki):
    """Optionally enrich input text using MediaWiki summaries."""
    if use_mediawiki == 1:
        input_text = mediawikiapi.summary(input_text,8)
    return input_text


@app.route("/get_mcq", methods=["POST"])
def get_mcq():
    """Generate multiple-choice questions from input text."""

    data = request.get_json(silent=True)

    input_text = require_json_field(data, "input_text")
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
    """Generate True/False questions from input text."""
    data = request.get_json(silent=True)

    input_text = require_json_field(data, "input_text")
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
    
    data = request.get_json(silent=True)
    
    input_text = require_json_field(data, "input_text")
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
    
    data = request.get_json(silent=True)

    input_text = require_json_field(data, "input_text")
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
    data = request.get_json(silent=True)
    input_text = require_json_field(data, "input_text")
    input_questions = data.get("input_question", [])
    input_options = data.get("input_options", [])
    outputs = []

    if not input_questions or not input_options:
        raise BadRequest("input_question and input_options are required")

    if len(input_questions) != len(input_options):
        raise BadRequest("input_question and input_options length mismatch")

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
    data = request.get_json(silent=True)
    input_text = require_json_field(data, "input_text")
    input_questions = data.get("input_question", [])
    answers = []
    for question in input_questions:
        qa_response = qa_model(question=question, context=input_text)
        answers.append(qa_response["answer"])

    return jsonify({"output": answers})


@app.route("/get_boolean_answer", methods=["POST"])
def get_boolean_answer():
    data = request.get_json(silent=True)
    input_text = require_json_field(data, "input_text")
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
    data = request.get_json(silent=True)
    document_url = require_json_field(data, "document_url")

    try:
        text = docs_service.get_document_content(document_url)
    except ValueError as e:
        raise BadRequest(str(e)) from e

    return jsonify(text)


@app.route("/generate_gform", methods=["POST"])
def generate_gform():
    data = request.get_json(silent=True)
    qa_pairs = require_json_field(data, "qa_pairs")
    question_type = require_json_field(data, "question_type")
    SCOPES = "https://www.googleapis.com/auth/forms.body"
    DISCOVERY_DOC = "https://forms.googleapis.com/$discovery/rest?version=v1"

    store = file.Storage("token.json")
    creds = None
    if not creds or creds.invalid:
        flow = client.flow_from_clientsecrets("credentials.json", SCOPES)
        creds = tools.run_flow(flow, store)

    form_service = discovery.build(
        "forms",
        "v1",
        http=creds.authorize(Http()),
        discoveryServiceUrl=DISCOVERY_DOC,
        static_discovery=False,
    )
    NEW_FORM = {
        "info": {
            "title": "EduAid form",
        }
    }
    requests_list = []

    if question_type == "get_shortq":
        for index, qapair in enumerate(qa_pairs):
            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
                        "questionItem": {
                            "question": {
                                "required": True,
                                "textQuestion": {},
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }
            requests_list.append(requests)
    elif question_type == "get_mcq":
        for index, qapair in enumerate(qa_pairs):
            # Extract and filter the options
            options = qapair.get("options", [])
            valid_options = [
                opt for opt in options if opt
            ]  # Filter out empty or None options

            # Ensure the answer is included in the choices
            choices = [qapair["answer"]] + valid_options[
                :3
            ]  # Include up to the first 3 options

            # Randomize the order of the choices
            random.shuffle(choices)

            # Prepare the request structure
            choices_list = [{"value": choice} for choice in choices]

            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
                        "questionItem": {
                            "question": {
                                "required": True,
                                "choiceQuestion": {
                                    "type": "RADIO",
                                    "options": choices_list,
                                },
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }

            requests_list.append(requests)
    elif question_type == "get_boolq":
        for index, qapair in enumerate(qa_pairs):
            choices_list = [
                {"value": "True"},
                {"value": "False"},
            ]
            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
                        "questionItem": {
                            "question": {
                                "required": True,
                                "choiceQuestion": {
                                    "type": "RADIO",
                                    "options": choices_list,
                                },
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }

            requests_list.append(requests)
    else:
        for index, qapair in enumerate(qa_pairs):
            if "options" in qapair and qapair["options"]:
                options = qapair["options"]
                valid_options = [
                    opt for opt in options if opt
                ]  # Filter out empty or None options
                choices = [qapair["answer"]] + valid_options[
                    :3
                ]  # Include up to the first 3 options
                random.shuffle(choices)
                choices_list = [{"value": choice} for choice in choices]
                question_structure = {
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": choices_list,
                    }
                }
            elif "answer" in qapair:
                question_structure = {"textQuestion": {}}
            else:
                question_structure = {
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": [
                            {"value": "True"},
                            {"value": "False"},
                        ],
                    }
                }

            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
                        "questionItem": {
                            "question": {
                                "required": True,
                                **question_structure,
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }
            requests_list.append(requests)

    NEW_QUESTION = {"requests": requests_list}

    result = form_service.forms().create(body=NEW_FORM).execute()
    form_service.forms().batchUpdate(
        formId=result["formId"], body=NEW_QUESTION
    ).execute()

    edit_url = jsonify(result["responderUri"])
    webbrowser.open_new_tab(
        "https://docs.google.com/forms/d/" + result["formId"] + "/edit"
    )
    return edit_url


@app.route("/get_shortq_hard", methods=["POST"])
def get_shortq_hard():
    data = request.get_json(silent=True)
    input_text = require_json_field(data, "input_text")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])

    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="sentences"
    )

    for item in output:
        item["question"] = make_question_harder(item["question"])

    return jsonify({"output": output})


@app.route("/get_mcq_hard", methods=["POST"])
def get_mcq_hard():
    data = request.get_json(silent=True)
    input_text = require_json_field(data, "input_text")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])
    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="multiple_choice"
    )
    
    for q in output:
        q["question"] = make_question_harder(q["question"])
        
    return jsonify({"output": output})

@app.route("/get_boolq_hard", methods=["POST"])
def get_boolq_hard():
    data = request.get_json(silent=True)
    input_text = require_json_field(data, "input_text")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])

    input_text = process_input_text(input_text, use_mediawiki)

    # Generate questions using the same QG model
    generated = qg.generate(
        article=input_text,
        num_questions=input_questions,
        answer_style="true_false"
    )

    # Apply transformation to make each question harder
    harder_questions = [make_question_harder(q) for q in generated]

    return jsonify({"output": harder_questions})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        raise BadRequest("file is required")

    file = request.files['file']

    if file.filename == '':
        raise BadRequest("empty filename")

    content = file_processor.process_file(file)

    if not content:
        raise BadRequest("Unsupported file type or error processing file")

    return jsonify({"content": content})

@app.route("/", methods=["GET"])
def hello():
    return "The server is working fine"

def clean_transcript(file_path):
    """Extracts and cleans transcript from a VTT file."""
    with open(file_path, "r", encoding="utf-8") as file:
        lines = file.readlines()

    transcript_lines = []
    skip_metadata = True  # Skip lines until we reach actual captions

    for line in lines:
        line = line.strip()

        # Skip metadata lines like "Kind: captions" or "Language: en"
        if line.lower().startswith(("kind:", "language:", "webvtt")):
            continue
        
        # Detect timestamps like "00:01:23.456 --> 00:01:25.789"
        if "-->" in line:
            skip_metadata = False  # Now real captions start
            continue
        
        if not skip_metadata:
            # Remove formatting tags like <c>...</c> and <00:00:00.000>
            line = re.sub(r"<[^>]+>", "", line)
            transcript_lines.append(line)

    return " ".join(transcript_lines).strip()

@app.route('/getTranscript', methods=['GET'])
def get_transcript():
    video_id = request.args.get('videoId')
    if not video_id:
        raise BadRequest("videoId query parameter is required")

    subprocess.run(["yt-dlp", "--write-auto-sub", "--sub-lang", "en", "--skip-download",
                "--sub-format", "vtt", "-o", f"subtitles/{video_id}.vtt", f"https://www.youtube.com/watch?v={video_id}"],
               check=True, capture_output=True, text=True)

    # Find the latest .vtt file in the "subtitles" folder
    subtitle_files = glob.glob("subtitles/*.vtt")
    if not subtitle_files:
        return jsonify({"error": "No subtitles found"}), 404

    latest_subtitle = max(subtitle_files, key=os.path.getctime)
    transcript_text = clean_transcript(latest_subtitle)

    # Optional: Clean up the file after reading
    os.remove(latest_subtitle)

    return jsonify({"transcript": transcript_text})

if __name__ == "__main__":
    os.makedirs("subtitles", exist_ok=True)
    app.run()
