from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
import nltk
import subprocess
import os
import glob
import logging
from functools import wraps
from threading import Thread
from queue import Queue, Empty
import time

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

# Configure logging for monitoring
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
print("Starting Flask App...")

# Configuration constants
MAX_QUESTIONS = 20  # Maximum questions per request
MODEL_TIMEOUT = 60  # Timeout for model inference in seconds
QA_TIMEOUT = 45    # Timeout for QA model in seconds
API_TIMEOUT = 120  # Timeout for external API calls

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


# ============= TIMEOUT HANDLING =============
def execute_with_timeout(func, timeout_duration, *args, **kwargs):
    """
    Execute a function with timeout protection.
    Returns result or timeout error.
    """
    result_queue = Queue()
    exception_queue = Queue()
    
    def target():
        try:
            result = func(*args, **kwargs)
            result_queue.put(result)
        except Exception as e:
            exception_queue.put(e)
            logger.error(f"Error in {func.__name__}: {str(e)}")
    
    thread = Thread(target=target, daemon=True)
    start_time = time.time()
    thread.start()
    thread.join(timeout=timeout_duration)
    elapsed_time = time.time() - start_time
    
    if thread.is_alive():
        logger.warning(f"Timeout: {func.__name__} exceeded {timeout_duration}s limit")
        return None, f"Model inference timeout after {timeout_duration}s"
    
    # Check if exception occurred
    if not exception_queue.empty():
        exc = exception_queue.get()
        logger.error(f"Exception in {func.__name__}: {str(exc)}")
        return None, f"Error during inference: {str(exc)}"
    
    # Get result
    try:
        result = result_queue.get_nowait()
        logger.info(f"{func.__name__} completed in {elapsed_time:.2f}s")
        return result, None
    except Empty:
        return None, "No result received from model"


def validate_input(input_text, max_questions=None):
    """Validate and sanitize input data."""
    errors = []
    
    # Validate input_text
    if not input_text:
        errors.append("Input text is required and cannot be empty")
    elif isinstance(input_text, str):
        input_text = input_text.strip()
        if len(input_text) < 10:
            errors.append("Input text must be at least 10 characters long")
        elif len(input_text) > 50000:
            errors.append("Input text exceeds maximum length of 50,000 characters")
    
    # Validate max_questions
    if max_questions is not None:
        if not isinstance(max_questions, int):
            errors.append("max_questions must be an integer")
        elif max_questions < 1:
            errors.append("max_questions must be at least 1")
        elif max_questions > MAX_QUESTIONS:
            errors.append(f"max_questions cannot exceed {MAX_QUESTIONS}")
    
    return errors, input_text


def timeout_route(timeout_duration=MODEL_TIMEOUT):
    """Decorator for routes with timeout protection."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                result, error = execute_with_timeout(f, timeout_duration, *args, **kwargs)
                if error:
                    return jsonify({"error": error, "status": "timeout"}), 504
                return result
            except Exception as e:
                logger.error(f"Unexpected error in {f.__name__}: {str(e)}")
                return jsonify({"error": str(e), "status": "error"}), 500
        return decorated_function
    return decorator


def process_input_text(input_text, use_mediawiki):
    """Process input text, optionally fetching from MediaWiki."""
    try:
        if use_mediawiki == 1:
            # Add timeout for MediaWiki API call
            def fetch_from_mediawiki():
                return mediawikiapi.summary(input_text, 8)
            
            result, error = execute_with_timeout(fetch_from_mediawiki, API_TIMEOUT)
            if error:
                logger.warning(f"MediaWiki fetch failed: {error}")
                return input_text  # Fall back to original text
            return result if result else input_text
        return input_text
    except Exception as e:
        logger.error(f"Error in process_input_text: {str(e)}")
        return input_text


@app.route("/get_mcq", methods=["POST"])
def get_mcq():
    """Generate MCQ questions with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        
        # Validate input
        errors, input_text = validate_input(input_text, max_questions)
        if errors:
            logger.warning(f"Validation errors in /get_mcq: {errors}")
            return jsonify({"error": "; ".join(errors), "output": []}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        # Execute with timeout
        def generate():
            return MCQGen.generate_mcq(
                {"input_text": input_text, "max_questions": max_questions}
            )
        
        output, error = execute_with_timeout(generate, MODEL_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        questions = output.get("questions", []) if output else []
        return jsonify({"output": questions})
    except Exception as e:
        logger.error(f"Error in /get_mcq: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500


@app.route("/get_boolq", methods=["POST"])
def get_boolq():
    """Generate Boolean questions with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        
        # Validate input
        errors, input_text = validate_input(input_text, max_questions)
        if errors:
            logger.warning(f"Validation errors in /get_boolq: {errors}")
            return jsonify({"error": "; ".join(errors), "output": []}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        # Execute with timeout
        def generate():
            return BoolQGen.generate_boolq(
                {"input_text": input_text, "max_questions": max_questions}
            )
        
        output, error = execute_with_timeout(generate, MODEL_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        boolean_questions = output.get("Boolean_Questions", []) if output else []
        return jsonify({"output": boolean_questions})
    except Exception as e:
        logger.error(f"Error in /get_boolq: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500


@app.route("/get_shortq", methods=["POST"])
def get_shortq():
    """Generate Short Answer questions with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        
        # Validate input
        errors, input_text = validate_input(input_text, max_questions)
        if errors:
            logger.warning(f"Validation errors in /get_shortq: {errors}")
            return jsonify({"error": "; ".join(errors), "output": []}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        # Execute with timeout
        def generate():
            return ShortQGen.generate_shortq(
                {"input_text": input_text, "max_questions": max_questions}
            )
        
        output, error = execute_with_timeout(generate, MODEL_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        questions = output.get("questions", []) if output else []
        return jsonify({"output": questions})
    except Exception as e:
        logger.error(f"Error in /get_shortq: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500


@app.route("/get_problems", methods=["POST"])
def get_problems():
    """Generate all question types with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "error": "Request body is required",
                "output_mcq": {},
                "output_boolq": {},
                "output_shortq": {}
            }), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions_mcq = data.get("max_questions_mcq", 4)
        max_questions_boolq = data.get("max_questions_boolq", 4)
        max_questions_shortq = data.get("max_questions_shortq", 4)
        
        # Validate input
        errors, input_text = validate_input(input_text, max(max_questions_mcq, max_questions_boolq, max_questions_shortq))
        if errors:
            logger.warning(f"Validation errors in /get_problems: {errors}")
            return jsonify({
                "error": "; ".join(errors),
                "output_mcq": {},
                "output_boolq": {},
                "output_shortq": {}
            }), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        # Execute all generators with timeout
        results = {}
        
        def generate_mcq():
            return MCQGen.generate_mcq({"input_text": input_text, "max_questions": max_questions_mcq})
        
        def generate_boolq():
            return BoolQGen.generate_boolq({"input_text": input_text, "max_questions": max_questions_boolq})
        
        def generate_shortq():
            return ShortQGen.generate_shortq({"input_text": input_text, "max_questions": max_questions_shortq})
        
        output1, error1 = execute_with_timeout(generate_mcq, MODEL_TIMEOUT)
        output2, error2 = execute_with_timeout(generate_boolq, MODEL_TIMEOUT)
        output3, error3 = execute_with_timeout(generate_shortq, MODEL_TIMEOUT)
        
        # Return partial results if some fail, but total timeout
        if error1 and error2 and error3:
            return jsonify({"error": "All generators timed out", "output_mcq": {}, "output_boolq": {}, "output_shortq": {}}), 504
        
        results["output_mcq"] = output1 or {}
        results["output_boolq"] = output2 or {}
        results["output_shortq"] = output3 or {}
        
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error in /get_problems: {str(e)}")
        return jsonify({"error": str(e), "output_mcq": {}, "output_boolq": {}, "output_shortq": {}}), 500

@app.route("/get_mcq_answer", methods=["POST"])
def get_mcq_answer():
    """Get MCQ answers with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        input_questions = data.get("input_question", [])
        input_options = data.get("input_options", [])
        outputs = []

        if not input_questions or not input_options or len(input_questions) != len(input_options):
            return jsonify({"error": "Invalid questions or options format", "output": outputs}), 400
        
        if len(input_questions) > MAX_QUESTIONS:
            return jsonify({"error": f"Too many questions (max {MAX_QUESTIONS})", "output": outputs}), 400

        def answer_questions():
            results = []
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
                results.append(best_option)
            
            return results
        
        result, error = execute_with_timeout(answer_questions, QA_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": outputs}), 504
        
        return jsonify({"output": result if result else outputs})
    except Exception as e:
        logger.error(f"Error in /get_mcq_answer: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500


@app.route("/get_shortq_answer", methods=["POST"])
def get_answer():
    """Get Short Answer answers with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        input_questions = data.get("input_question", [])
        
        if not input_questions:
            return jsonify({"error": "Questions are required", "output": []}), 400
        
        if len(input_questions) > MAX_QUESTIONS:
            return jsonify({"error": f"Too many questions (max {MAX_QUESTIONS})", "output": []}), 400
        
        def answer_questions():
            answers = []
            for question in input_questions:
                qa_response = qa_model(question=question, context=input_text)
                answers.append(qa_response["answer"])
            return answers
        
        result, error = execute_with_timeout(answer_questions, QA_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        return jsonify({"output": result if result else []})
    except Exception as e:
        logger.error(f"Error in /get_shortq_answer: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500


@app.route("/get_boolean_answer", methods=["POST"])
def get_boolean_answer():
    """Get Boolean answers with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        input_questions = data.get("input_question", [])
        
        if not input_questions:
            return jsonify({"error": "Questions are required", "output": []}), 400
        
        if len(input_questions) > MAX_QUESTIONS:
            return jsonify({"error": f"Too many questions (max {MAX_QUESTIONS})", "output": []}), 400
        
        def answer_questions():
            output = []
            for question in input_questions:
                qa_response = answer.predict_boolean_answer(
                    {"input_text": input_text, "input_question": question}
                )
                if qa_response:
                    output.append("True")
                else:
                    output.append("False")
            return output
        
        result, error = execute_with_timeout(answer_questions, QA_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        return jsonify({"output": result if result else []})
    except Exception as e:
        logger.error(f"Error in /get_boolean_answer: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500


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
    qa_pairs = data.get("qa_pairs", "")
    question_type = data.get("question_type", "")
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
    """Generate hard Short Answer questions with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("input_question", 4)
        
        if isinstance(max_questions, list):
            max_questions = len(max_questions)
        
        errors, input_text = validate_input(input_text, max_questions)
        if errors:
            logger.warning(f"Validation errors in /get_shortq_hard: {errors}")
            return jsonify({"error": "; ".join(errors), "output": []}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        def generate():
            output = qg.generate(
                article=input_text, num_questions=max_questions, answer_style="sentences"
            )
            for item in output:
                item["question"] = make_question_harder(item["question"])
            return output
        
        result, error = execute_with_timeout(generate, MODEL_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        return jsonify({"output": result if result else []})
    except Exception as e:
        logger.error(f"Error in /get_shortq_hard: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500


@app.route("/get_mcq_hard", methods=["POST"])
def get_mcq_hard():
    """Generate hard MCQ questions with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("input_question", 4)
        
        if isinstance(max_questions, list):
            max_questions = len(max_questions)
        
        errors, input_text = validate_input(input_text, max_questions)
        if errors:
            logger.warning(f"Validation errors in /get_mcq_hard: {errors}")
            return jsonify({"error": "; ".join(errors), "output": []}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        def generate():
            output = qg.generate(
                article=input_text, num_questions=max_questions, answer_style="multiple_choice"
            )
            for q in output:
                q["question"] = make_question_harder(q["question"])
            return output
        
        result, error = execute_with_timeout(generate, MODEL_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        return jsonify({"output": result if result else []})
    except Exception as e:
        logger.error(f"Error in /get_mcq_hard: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500

@app.route("/get_boolq_hard", methods=["POST"])
def get_boolq_hard():
    """Generate hard Boolean questions with timeout protection."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required", "output": []}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("input_question", 4)
        
        if isinstance(max_questions, list):
            max_questions = len(max_questions)
        
        errors, input_text = validate_input(input_text, max_questions)
        if errors:
            logger.warning(f"Validation errors in /get_boolq_hard: {errors}")
            return jsonify({"error": "; ".join(errors), "output": []}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        def generate():
            generated = qg.generate(
                article=input_text,
                num_questions=max_questions,
                answer_style="true_false"
            )
            harder_questions = [make_question_harder(q) for q in generated]
            return harder_questions
        
        result, error = execute_with_timeout(generate, MODEL_TIMEOUT)
        if error:
            return jsonify({"error": error, "output": []}), 504
        
        return jsonify({"output": result if result else []})
    except Exception as e:
        logger.error(f"Error in /get_boolq_hard: {str(e)}")
        return jsonify({"error": str(e), "output": []}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    content = file_processor.process_file(file)
    
    if content:
        return jsonify({"content": content})
    else:
        return jsonify({"error": "Unsupported file type or error processing file"}), 400

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
    """Get YouTube transcript with timeout protection."""
    try:
        video_id = request.args.get('videoId')
        if not video_id:
            return jsonify({"error": "No video ID provided", "transcript": ""}), 400
        
        # Validate video ID format (basic check)
        if len(video_id) != 11 or not video_id.replace('-', '').replace('_', '').isalnum():
            return jsonify({"error": "Invalid video ID format", "transcript": ""}), 400
        
        def fetch_transcript():
            try:
                subprocess.run(["yt-dlp", "--write-auto-sub", "--sub-lang", "en", "--skip-download",
                            "--sub-format", "vtt", "-o", f"subtitles/{video_id}.vtt", 
                            f"https://www.youtube.com/watch?v={video_id}"],
                           check=True, capture_output=True, text=True, timeout=API_TIMEOUT)

                # Find the latest .vtt file in the "subtitles" folder
                subtitle_files = glob.glob("subtitles/*.vtt")
                if not subtitle_files:
                    return None, "No subtitles found"

                latest_subtitle = max(subtitle_files, key=os.path.getctime)
                transcript_text = clean_transcript(latest_subtitle)

                # Clean up the file after reading
                try:
                    os.remove(latest_subtitle)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up subtitle file: {cleanup_error}")

                return transcript_text, None
            except subprocess.TimeoutExpired:
                return None, "yt-dlp timeout: video download took too long"
            except subprocess.CalledProcessError as e:
                logger.error(f"yt-dlp error: {e.stderr}")
                return None, "Failed to fetch video subtitles"
        
        result, error = execute_with_timeout(fetch_transcript, API_TIMEOUT)
        if error:
            return jsonify({"error": error, "transcript": ""}), 504
        
        return jsonify({"transcript": result if result else ""})
    except Exception as e:
        logger.error(f"Error in /getTranscript: {str(e)}")
        return jsonify({"error": str(e), "transcript": ""}), 500

if __name__ == "__main__":
    os.makedirs("subtitles", exist_ok=True)
    app.run()
