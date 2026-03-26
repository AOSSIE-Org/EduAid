from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
import nltk
import subprocess
import os
import glob
import logging

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
nltk.download("stopwords")
nltk.download('punkt')
from Generator import main
from Generator.question_filters import make_question_harder
from Generator.llm_generator import LLMQuestionGenerator
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

# Import async routes
from routes.async_generation_routes import async_routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Register async routes blueprint
app.register_blueprint(async_routes)

print("Starting Flask App...")

SERVICE_ACCOUNT_FILE = './service_account_key.json'
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

# Check if we should use Celery for inference (memory-efficient mode)
USE_CELERY_INFERENCE = os.getenv('USE_CELERY_INFERENCE', 'false').lower() in ('true', '1', 'yes')

# Initialize models only if NOT using Celery inference
# This prevents memory duplication when Celery workers are available
if USE_CELERY_INFERENCE:
    logger.info("🚀 Running in CELERY INFERENCE mode - models will be loaded in workers only")
    MCQGen = None
    answer = None
    BoolQGen = None
    ShortQGen = None
    qg = None
    qa_model = None
    
    # Import inference service for sync calls to Celery
    try:
        from inference_service import (
            generate_mcq_sync,
            generate_boolq_sync,
            generate_shortq_sync,
            generate_all_questions_sync,
            predict_mcq_answer_sync,
            predict_shortq_answer_sync,
            predict_boolean_answer_sync,
            generate_hard_shortq_sync,
            generate_hard_mcq_sync,
            generate_hard_boolq_sync
        )
        logger.info("✅ Inference service imported successfully")
    except ImportError as e:
        logger.error(f"❌ Failed to import inference service: {e}")
        logger.error("Falling back to direct model loading...")
        USE_CELERY_INFERENCE = False

# Load models directly if not using Celery inference (backward compatibility)
if not USE_CELERY_INFERENCE:
    logger.info("⚠️  Running in LEGACY mode - loading models directly in Flask process")
    logger.info("   This uses more memory. Consider setting USE_CELERY_INFERENCE=true")
    MCQGen = main.MCQGenerator()
    answer = main.AnswerPredictor()
    BoolQGen = main.BoolQGenerator()
    ShortQGen = main.ShortQGenerator()
    qg = main.QuestionGenerator()
    qa_model = pipeline("question-answering")

# These services don't use heavy ML models, so always initialize them
docs_service = main.GoogleDocsService(SERVICE_ACCOUNT_FILE, SCOPES)
file_processor = main.FileProcessor()
mediawikiapi = MediaWikiAPI()

qa_model = pipeline("question-answering")
llm_generator = LLMQuestionGenerator()

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
    
    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        output = generate_mcq_sync(input_text, max_questions, use_mediawiki)
    else:
        # Use direct model inference (legacy mode)
        output = MCQGen.generate_mcq(
            {"input_text": input_text, "max_questions": max_questions}
        )
    
    questions = output.get("questions", [])
    return jsonify({"output": questions})


@app.route("/get_boolq", methods=["POST"])
def get_boolq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    
    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        output = generate_boolq_sync(input_text, max_questions, use_mediawiki)
    else:
        # Use direct model inference (legacy mode)
        output = BoolQGen.generate_boolq(
            {"input_text": input_text, "max_questions": max_questions}
        )
    
    boolean_questions = output.get("Boolean_Questions", [])
    return jsonify({"output": boolean_questions})


@app.route("/get_shortq", methods=["POST"])
def get_shortq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    
    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        output = generate_shortq_sync(input_text, max_questions, use_mediawiki)
    else:
        # Use direct model inference (legacy mode)
        output = ShortQGen.generate_shortq(
            {"input_text": input_text, "max_questions": max_questions}
        )
    
    questions = output.get("questions", [])
    return jsonify({"output": questions})


@app.route("/get_shortq_llm", methods=["POST"])
def get_shortq_llm():
    try:
        data = request.get_json()
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        input_text = process_input_text(input_text, use_mediawiki)
        questions = llm_generator.generate_short_questions(input_text, max_questions)
        return jsonify({"output": questions})
    except Exception as e:
        app.logger.exception("Error in /get_shortq_llm: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route("/get_mcq_llm", methods=["POST"])
def get_mcq_llm():
    try:
        data = request.get_json()
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        input_text = process_input_text(input_text, use_mediawiki)
        questions = llm_generator.generate_mcq_questions(input_text, max_questions)
        return jsonify({"output": questions})
    except Exception as e:
        app.logger.exception("Error in /get_mcq_llm: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route("/get_boolq_llm", methods=["POST"])
def get_boolq_llm():
    try:
        data = request.get_json()
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        input_text = process_input_text(input_text, use_mediawiki)
        questions = llm_generator.generate_boolean_questions(input_text, max_questions)
        return jsonify({"output": questions})
    except Exception as e:
        app.logger.exception("Error in /get_boolq_llm: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route("/get_problems_llm", methods=["POST"])
def get_problems_llm():
    try:
        data = request.get_json()
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        mcq_count = data.get("max_questions_mcq", 2)
        bool_count = data.get("max_questions_boolq", 2)
        short_count = data.get("max_questions_shortq", 2)
        input_text = process_input_text(input_text, use_mediawiki)
        questions = llm_generator.generate_all_questions(input_text, mcq_count, bool_count, short_count)
        return jsonify({"output": questions})
    except Exception as e:
        app.logger.exception("Error in /get_problems_llm: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route("/get_problems", methods=["POST"])
def get_problems():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions_mcq = data.get("max_questions_mcq", 4)
    max_questions_boolq = data.get("max_questions_boolq", 4)
    max_questions_shortq = data.get("max_questions_shortq", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    
    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        result = generate_all_questions_sync(
            input_text,
            max_questions_mcq,
            max_questions_boolq,
            max_questions_shortq,
            use_mediawiki
        )
        return jsonify(result)
    else:
        # Use direct model inference (legacy mode)
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
        return jsonify({"output": outputs})

    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        outputs = predict_mcq_answer_sync(input_text, input_questions, input_options)
    else:
        # Use direct model inference (legacy mode)
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
    
    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        answers = predict_shortq_answer_sync(input_text, input_questions)
    else:
        # Use direct model inference (legacy mode)
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

    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        output = predict_boolean_answer_sync(input_text, input_questions)
    else:
        # Use direct model inference (legacy mode)
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
        app.logger.exception("ValueError in /get_content: %s", e)
        return jsonify({'error': 'Bad request'}), 400
    except Exception as e:
        app.logger.exception("Unhandled exception in /get_content: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


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
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text, use_mediawiki)
    input_questions = data.get("input_question", [])

    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        output = generate_hard_shortq_sync(input_text, input_questions, use_mediawiki)
    else:
        # Use direct model inference (legacy mode)
        output = qg.generate(
            article=input_text, num_questions=input_questions, answer_style="sentences"
        )
        for item in output:
            item["question"] = make_question_harder(item["question"])

    return jsonify({"output": output})


@app.route("/get_mcq_hard", methods=["POST"])
def get_mcq_hard():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text, use_mediawiki)
    input_questions = data.get("input_question", [])
    
    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        output = generate_hard_mcq_sync(input_text, input_questions, use_mediawiki)
    else:
        # Use direct model inference (legacy mode)
        output = qg.generate(
            article=input_text, num_questions=input_questions, answer_style="multiple_choice"
        )
        for q in output:
            q["question"] = make_question_harder(q["question"])
        
    return jsonify({"output": output})

@app.route("/get_boolq_hard", methods=["POST"])
def get_boolq_hard():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])
    input_text = process_input_text(input_text, use_mediawiki)

    if USE_CELERY_INFERENCE:
        # Use Celery worker for inference (memory-efficient)
        harder_questions = generate_hard_boolq_sync(input_text, input_questions, use_mediawiki)
    else:
        # Use direct model inference (legacy mode)
        generated = qg.generate(
            article=input_text,
            num_questions=input_questions,
            answer_style="true_false"
        )
        harder_questions = [make_question_harder(q) for q in generated]

    return jsonify({"output": harder_questions})

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

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for monitoring and container orchestration."""
    health_status = {
        "status": "healthy",
        "mode": "celery_inference" if USE_CELERY_INFERENCE else "legacy",
        "async_enabled": os.getenv('USE_ASYNC', 'false').lower() in ('true', '1', 'yes'),
        "services": {
            "flask": "running"
        }
    }
    
    if USE_CELERY_INFERENCE:
        # Check if Celery is accessible
        try:
            from inference_service import CELERY_AVAILABLE
            health_status["services"]["celery"] = "available" if CELERY_AVAILABLE else "unavailable"
        except:
            health_status["services"]["celery"] = "unavailable"
    
    return jsonify(health_status)

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
        return jsonify({"error": "No video ID provided"}), 400

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
