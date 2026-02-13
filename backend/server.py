from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import nltk
import subprocess
import os
import glob
import logging
import re
import json
import random
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

nltk.download("stopwords")
nltk.download('punkt_tab')

from Generator import main
from Generator.question_filters import make_question_harder
import spacy
from transformers import pipeline
from spacy.lang.en.stop_words import STOP_WORDS
from string import punctuation
from heapq import nlargest
from apiclient import discovery
from httplib2 import Http
from oauth2client import client, file, tools
from mediawikiapi import MediaWikiAPI

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Validation Constants
# ---------------------------------------------------------------------------
MAX_INPUT_TEXT_LENGTH = 50000  # characters
MAX_QUESTIONS_LIMIT = 20
MIN_QUESTIONS_LIMIT = 1
MAX_UPLOAD_SIZE_MB = 10
ALLOWED_UPLOAD_EXTENSIONS = {"txt", "pdf", "docx"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}
# YouTube video IDs are exactly 11 chars: alphanumeric, hyphens, underscores
VIDEO_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{11}$")

# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_SIZE_MB * 1024 * 1024  # 10 MB
os.makedirs("subtitles", exist_ok=True)

CORS(app)
logger.info("Starting Flask App...")

SERVICE_ACCOUNT_FILE = os.environ.get(
    "GOOGLE_SERVICE_ACCOUNT_FILE", "./service_account_key.json"
)
SCOPES = ["https://www.googleapis.com/auth/documents.readonly"]

MCQGen = main.MCQGenerator()
answer = main.AnswerPredictor()
BoolQGen = main.BoolQGenerator()
ShortQGen = main.ShortQGenerator()
qg = main.QuestionGenerator()
try:
    docs_service = main.GoogleDocsService(SERVICE_ACCOUNT_FILE, SCOPES)
except Exception as e:
    logger.warning("Could not initialize Google Docs service: %s", e)
    logger.warning("Google Docs features will be unavailable.")
    docs_service = None
file_processor = main.FileProcessor()
mediawikiapi = MediaWikiAPI()
qa_model = pipeline("question-answering")


# ---------------------------------------------------------------------------
# Validation Helpers
# ---------------------------------------------------------------------------

def _validate_input_text(input_text):
    """Validate that input_text is a non-empty string within length limits.

    Returns (cleaned_text, error_response) – if error_response is not None the
    caller should return it immediately.
    """
    if input_text is None or not isinstance(input_text, str):
        return None, (jsonify({"error": "input_text must be a non-empty string"}), 400)
    input_text = input_text.strip()
    if len(input_text) == 0:
        return None, (jsonify({"error": "input_text must not be empty"}), 400)
    if len(input_text) > MAX_INPUT_TEXT_LENGTH:
        return None, (
            jsonify({
                "error": f"input_text exceeds maximum length of {MAX_INPUT_TEXT_LENGTH} characters"
            }),
            400,
        )
    return input_text, None


def _validate_max_questions(value, default=4):
    """Clamp max_questions to a safe integer range."""
    try:
        value = int(value)
    except (TypeError, ValueError):
        value = default
    return max(MIN_QUESTIONS_LIMIT, min(value, MAX_QUESTIONS_LIMIT))


def _allowed_file(filename):
    """Check whether the uploaded file has an allowed extension."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_UPLOAD_EXTENSIONS
    )


def _validate_difficulty(value):
    """Validate and return the difficulty level.

    Accepts 'easy', 'medium', or 'hard'.  Falls back to 'medium' for any
    unrecognised value so that existing callers are unaffected.
    """
    if isinstance(value, str) and value.lower() in VALID_DIFFICULTIES:
        return value.lower()
    return "medium"


def _apply_difficulty_to_mcq(questions, difficulty):
    """Post-process MCQ questions based on difficulty level.

    * easy   – trim distractor options to at most 2.
    * medium – keep the default 3 distractors (unchanged).
    * hard   – expand options by merging in extra_options (up to 5 total)
               and enhance question text via make_question_harder().
    """
    for q in questions:
        if difficulty == "easy":
            q["options"] = q.get("options", [])[:2]
            q.pop("extra_options", None)
        elif difficulty == "hard":
            base = q.get("options", [])
            extra = q.get("extra_options", [])
            q["options"] = (base + extra)[:5]
            q.pop("extra_options", None)
            q["question_statement"] = make_question_harder(
                q.get("question_statement", "")
            )
        q["difficulty"] = difficulty
    return questions


def _apply_difficulty_to_shortq(questions, difficulty):
    """Post-process short-answer questions based on difficulty level.

    * hard – enhance question text via make_question_harder().
    """
    for q in questions:
        if difficulty == "hard":
            q["Question"] = make_question_harder(q.get("Question", ""))
        q["difficulty"] = difficulty
    return questions


def _apply_difficulty_to_boolq(questions, difficulty):
    """Post-process boolean questions based on difficulty level.

    * hard – enhance question text via make_question_harder().
    """
    processed = []
    for q in questions:
        if difficulty == "hard":
            q = make_question_harder(q) if isinstance(q, str) else q
        processed.append(q)
    return processed


def process_input_text(input_text, use_mediawiki):
    """Optionally expand input_text via MediaWiki if the flag is set."""
    if use_mediawiki == 1:
        input_text = mediawikiapi.summary(input_text, 8)
    return input_text


@app.route("/get_mcq", methods=["POST"])
def get_mcq():
    """Generate multiple-choice questions from the provided input text.

    Accepts an optional ``difficulty`` parameter (easy / medium / hard) that
    controls the number of distractor options and question complexity.
    """
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = _validate_max_questions(data.get("max_questions", 4))
    difficulty = _validate_difficulty(data.get("difficulty", "medium"))

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    try:
        input_text = process_input_text(input_text, use_mediawiki)
        output = MCQGen.generate_mcq(
            {"input_text": input_text, "max_questions": max_questions}
        )
        questions = output.get("questions", [])
        questions = _apply_difficulty_to_mcq(questions, difficulty)
        logger.info("Generated %d MCQs (difficulty=%s)", len(questions), difficulty)
        return jsonify({"output": questions, "difficulty": difficulty})
    except Exception:
        logger.exception("Error generating MCQs")
        return jsonify({"error": "Failed to generate MCQ questions"}), 500


@app.route("/get_boolq", methods=["POST"])
def get_boolq():
    """Generate boolean (true/false) questions from the provided input text.

    Accepts an optional ``difficulty`` parameter (easy / medium / hard) that
    controls question complexity.
    """
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = _validate_max_questions(data.get("max_questions", 4))
    difficulty = _validate_difficulty(data.get("difficulty", "medium"))

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    try:
        input_text = process_input_text(input_text, use_mediawiki)
        output = BoolQGen.generate_boolq(
            {"input_text": input_text, "max_questions": max_questions}
        )
        boolean_questions = output.get("Boolean_Questions", [])
        boolean_questions = _apply_difficulty_to_boolq(boolean_questions, difficulty)
        logger.info("Generated %d boolean questions (difficulty=%s)", len(boolean_questions), difficulty)
        return jsonify({"output": boolean_questions, "difficulty": difficulty})
    except Exception:
        logger.exception("Error generating boolean questions")
        return jsonify({"error": "Failed to generate boolean questions"}), 500


@app.route("/get_shortq", methods=["POST"])
def get_shortq():
    """Generate short-answer questions from the provided input text.

    Accepts an optional ``difficulty`` parameter (easy / medium / hard) that
    controls question complexity.
    """
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = _validate_max_questions(data.get("max_questions", 4))
    difficulty = _validate_difficulty(data.get("difficulty", "medium"))

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    try:
        input_text = process_input_text(input_text, use_mediawiki)
        output = ShortQGen.generate_shortq(
            {"input_text": input_text, "max_questions": max_questions}
        )
        questions = output.get("questions", [])
        questions = _apply_difficulty_to_shortq(questions, difficulty)
        logger.info("Generated %d short questions (difficulty=%s)", len(questions), difficulty)
        return jsonify({"output": questions, "difficulty": difficulty})
    except Exception:
        logger.exception("Error generating short questions")
        return jsonify({"error": "Failed to generate short questions"}), 500


@app.route("/get_problems", methods=["POST"])
def get_problems():
    """Generate a combined set of MCQ, boolean, and short-answer questions.

    Accepts an optional ``difficulty`` parameter (easy / medium / hard) applied
    uniformly to all three question types.
    """
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions_mcq = _validate_max_questions(data.get("max_questions_mcq", 4))
    max_questions_boolq = _validate_max_questions(data.get("max_questions_boolq", 4))
    max_questions_shortq = _validate_max_questions(data.get("max_questions_shortq", 4))
    difficulty = _validate_difficulty(data.get("difficulty", "medium"))

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    try:
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

        # Apply difficulty post-processing
        mcq_questions = _apply_difficulty_to_mcq(
            output1.get("questions", []), difficulty
        )
        output1["questions"] = mcq_questions
        bool_questions = _apply_difficulty_to_boolq(
            output2.get("Boolean_Questions", []), difficulty
        )
        output2["Boolean_Questions"] = bool_questions
        short_questions = _apply_difficulty_to_shortq(
            output3.get("questions", []), difficulty
        )
        output3["questions"] = short_questions

        logger.info("Generated combined problems (difficulty=%s)", difficulty)
        return jsonify(
            {
                "output_mcq": output1,
                "output_boolq": output2,
                "output_shortq": output3,
                "difficulty": difficulty,
            }
        )
    except Exception:
        logger.exception("Error generating combined problems")
        return jsonify({"error": "Failed to generate problems"}), 500

@app.route("/get_mcq_answer", methods=["POST"])
def get_mcq_answer():
    """Find the best matching option for each MCQ question using QA and cosine similarity."""
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    input_options = data.get("input_options", [])

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    if (
        not input_questions
        or not input_options
        or len(input_questions) != len(input_options)
    ):
        return jsonify({"output": []})

    try:
        outputs = []
        for question, options in zip(input_questions, input_options):
            if not options:
                outputs.append("")
                continue
            qa_response = qa_model(question=question, context=input_text)
            generated_answer = qa_response["answer"]

            options_with_answer = options + [generated_answer]
            vectorizer = TfidfVectorizer().fit_transform(options_with_answer)
            vectors = vectorizer.toarray()
            generated_answer_vector = vectors[-1].reshape(1, -1)

            similarities = cosine_similarity(
                vectors[:-1], generated_answer_vector
            ).flatten()
            max_similarity_index = similarities.argmax()
            best_option = options[max_similarity_index]
            outputs.append(best_option)

        logger.info("Generated answers for %d MCQ questions", len(outputs))
        return jsonify({"output": outputs})
    except Exception:
        logger.exception("Error generating MCQ answers")
        return jsonify({"error": "Failed to generate MCQ answers"}), 500


@app.route("/get_shortq_answer", methods=["POST"])
def get_answer():
    """Generate short answers to the provided questions using the QA pipeline."""
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    if not input_questions:
        return jsonify({"output": []})

    try:
        answers = []
        for question in input_questions:
            qa_response = qa_model(question=question, context=input_text)
            answers.append(qa_response["answer"])
        logger.info("Generated answers for %d short questions", len(answers))
        return jsonify({"output": answers})
    except Exception:
        logger.exception("Error generating short-question answers")
        return jsonify({"error": "Failed to generate answers"}), 500


@app.route("/get_boolean_answer", methods=["POST"])
def get_boolean_answer():
    """Predict boolean (true/false) answers for the provided questions."""
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    if not input_questions:
        return jsonify({"output": []})

    try:
        output = []
        for question in input_questions:
            qa_response = answer.predict_boolean_answer(
                {"input_text": input_text, "input_question": [question]}
            )
            output.append("True" if qa_response[0] else "False")
        logger.info("Generated answers for %d boolean questions", len(output))
        return jsonify({"output": output})
    except Exception:
        logger.exception("Error generating boolean answers")
        return jsonify({"error": "Failed to generate boolean answers"}), 500


@app.route("/get_content", methods=["POST"])
def get_content():
    """Fetch content from a Google Doc via the document URL."""
    try:
        if docs_service is None:
            return jsonify({"error": "Google Docs service is not configured"}), 503

        data = request.get_json(silent=True) or {}
        document_url = data.get("document_url")
        if not document_url or not isinstance(document_url, str):
            return jsonify({"error": "A valid document_url is required"}), 400

        text = docs_service.get_document_content(document_url)
        logger.info("Fetched content from Google Doc")
        return jsonify(text)
    except ValueError as e:
        logger.warning("Invalid document URL: %s", e)
        return jsonify({"error": str(e)}), 400
    except Exception:
        logger.exception("Error fetching Google Doc content")
        return jsonify({"error": "Failed to fetch document content"}), 500


@app.route("/generate_gform", methods=["POST"])
def generate_gform():
    """Create a Google Form from the provided question-answer pairs."""
    data = request.get_json(silent=True) or {}
    qa_pairs = data.get("qa_pairs", [])
    question_type = data.get("question_type", "")

    if not qa_pairs or not isinstance(qa_pairs, list):
        return jsonify({"error": "qa_pairs must be a non-empty list"}), 400

    if not question_type or not isinstance(question_type, str):
        return jsonify({"error": "question_type is required"}), 400
    SCOPES = "https://www.googleapis.com/auth/forms.body"
    DISCOVERY_DOC = "https://forms.googleapis.com/$discovery/rest?version=v1"

    store = file.Storage("token.json")
    creds = store.get()
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

    try:
        result = form_service.forms().create(body=NEW_FORM).execute()
        form_service.forms().batchUpdate(
            formId=result["formId"], body=NEW_QUESTION
        ).execute()

        edit_url = "https://docs.google.com/forms/d/" + result["formId"] + "/edit"
        responder_url = result["responderUri"]
        logger.info("Created Google Form: %s", result["formId"])
        return jsonify({"responder_url": responder_url, "edit_url": edit_url})
    except Exception:
        logger.exception("Error creating Google Form")
        return jsonify({"error": "Failed to create Google Form"}), 500


@app.route("/get_shortq_hard", methods=["POST"])
def get_shortq_hard():
    """Generate harder short-answer questions using the question generator and evaluator."""
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    try:
        input_text = process_input_text(input_text, use_mediawiki)
        output = qg.generate(
            article=input_text,
            num_questions=len(input_questions) if input_questions else 5,
            answer_style="sentences",
            use_evaluator=True,
        )
        for item in output:
            item["question"] = make_question_harder(item["question"])
        logger.info("Generated %d hard short questions", len(output))
        return jsonify({"output": output})
    except Exception:
        logger.exception("Error generating hard short questions")
        return jsonify({"error": "Failed to generate hard short questions"}), 500


@app.route("/get_mcq_hard", methods=["POST"])
def get_mcq_hard():
    """Generate harder multiple-choice questions using the question generator and evaluator."""
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    try:
        input_text = process_input_text(input_text, use_mediawiki)
        output = qg.generate(
            article=input_text,
            num_questions=len(input_questions) if input_questions else 5,
            answer_style="multiple_choice",
            use_evaluator=True,
        )
        for q in output:
            q["question"] = make_question_harder(q["question"])
        logger.info("Generated %d hard MCQs", len(output))
        return jsonify({"output": output})
    except Exception:
        logger.exception("Error generating hard MCQs")
        return jsonify({"error": "Failed to generate hard MCQ questions"}), 500


@app.route("/get_boolq_hard", methods=["POST"])
def get_boolq_hard():
    """Generate harder boolean questions using the question generator and evaluator."""
    data = request.get_json(silent=True) or {}
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])

    input_text, err = _validate_input_text(input_text)
    if err:
        return err

    try:
        input_text = process_input_text(input_text, use_mediawiki)
        generated = qg.generate(
            article=input_text,
            num_questions=len(input_questions) if input_questions else 5,
            answer_style="sentences",
            use_evaluator=True,
        )
        for item in generated:
            item["question"] = make_question_harder(item["question"])
        logger.info("Generated %d hard boolean questions", len(generated))
        return jsonify({"output": generated})
    except Exception:
        logger.exception("Error generating hard boolean questions")
        return jsonify({"error": "Failed to generate hard boolean questions"}), 500

@app.route("/upload", methods=["POST"])
def upload_file():
    """Handle file uploads and extract text content from the uploaded document."""
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    uploaded_file = request.files["file"]

    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not _allowed_file(uploaded_file.filename):
        return (
            jsonify({
                "error": f"Unsupported file type. Allowed types: {', '.join(ALLOWED_UPLOAD_EXTENSIONS)}"
            }),
            400,
        )

    # Sanitize filename to prevent path-traversal attacks
    uploaded_file.filename = secure_filename(uploaded_file.filename)

    try:
        content = file_processor.process_file(uploaded_file)
        if content:
            logger.info("Processed uploaded file: %s", uploaded_file.filename)
            return jsonify({"content": content})
        else:
            return jsonify({"error": "Could not extract content from the file"}), 400
    except Exception:
        logger.exception("Error processing uploaded file")
        return jsonify({"error": "Failed to process the uploaded file"}), 500

@app.route("/", methods=["GET"])
def hello():
    """Return a simple health-check message confirming the server is running."""
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

@app.route("/getTranscript", methods=["GET"])
def get_transcript():
    """Download and return the cleaned transcript for a YouTube video."""
    video_id = request.args.get("videoId", "").strip()

    if not video_id:
        return jsonify({"error": "No video ID provided"}), 400

    # Validate video_id format to prevent command injection
    if not VIDEO_ID_PATTERN.match(video_id):
        return jsonify({"error": "Invalid video ID format"}), 400

    # Use video_id-scoped file path to avoid race conditions between
    # concurrent requests for different videos.
    # Safety: subtitle_path is safe because VIDEO_ID_PATTERN (above) restricts
    # video_id to [a-zA-Z0-9_-]{11}, preventing path traversal and injection.
    subtitle_path = os.path.join("subtitles", f"{video_id}")

    try:
        subprocess.run(
            [
                "yt-dlp",
                "--write-auto-sub",
                "--sub-lang", "en",
                "--skip-download",
                "--sub-format", "vtt",
                "-o", f"{subtitle_path}.%(ext)s",
                f"https://www.youtube.com/watch?v={video_id}",
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired:
        logger.exception("yt-dlp timed out for video %s", video_id)
        return jsonify({"error": "Transcript download timed out"}), 504
    except subprocess.CalledProcessError as e:
        logger.exception("yt-dlp failed for video %s: %s", video_id, e.stderr)
        return jsonify({"error": "Failed to download subtitles"}), 500

    # Look for the VTT file specific to this video_id
    matching_files = glob.glob(f"subtitles/{video_id}.*.vtt")
    if not matching_files:
        return jsonify({"error": "No subtitles found for this video"}), 404

    subtitle_file = matching_files[0]
    try:
        transcript_text = clean_transcript(subtitle_file)
    except Exception:
        logger.exception("Error cleaning transcript for video %s", video_id)
        return jsonify({"error": "Failed to process transcript"}), 500
    finally:
        # Always clean up the subtitle files
        for f in matching_files:
            try:
                os.remove(f)
            except OSError:
                pass

    logger.info("Fetched transcript for video %s", video_id)
    return jsonify({"transcript": transcript_text})


# ---------------------------------------------------------------------------
# Global error handler for request entity too large (file upload size limit)
# ---------------------------------------------------------------------------
@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle 413 errors when an uploaded file exceeds the size limit."""
    return (
        jsonify({
            "error": f"File too large. Maximum upload size is {MAX_UPLOAD_SIZE_MB} MB"
        }),
        413,
    )


if __name__ == "__main__":
    app.run()
