from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
import nltk
import requests
import subprocess
import os
import glob
import logging
from collections import defaultdict

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

app = Flask(__name__)
CORS(app)
print("Starting Flask App...")

SERVICE_ACCOUNT_FILE = './service_account_key.json'
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

CANVAS_TOKEN = "enter your token here"  # Hardcoded for demo
CANVAS_URL = "https://k12.instructure.com"

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

@app.route('/export/canvas', methods=['POST'])
def export_to_canvas():
    try:
        data = request.json
        logger.debug(f"Received data: {data}")
        course_id = data.get("course_id")
        quiz_data = data.get("quiz")

        # Validate required fields
        if not course_id or not quiz_data:
            logger.error("Missing course_id or quiz data")
            return jsonify({"error": "Missing course_id or quiz data"}), 400
        if not quiz_data.get("title"):
            logger.error("Missing quiz title")
            return jsonify({"error": "Missing quiz title"}), 400
        if not quiz_data.get("questions"):
            logger.error("Missing quiz questions")
            return jsonify({"error": "Missing quiz questions"}), 400

        headers = {"Authorization": f"Bearer {CANVAS_TOKEN}"}
        logger.debug(f"Headers: {headers}")

        # Step 1: Create the quiz in Canvas
        quiz_payload = {
            "quiz[title]": quiz_data["title"],
            "quiz[description]": quiz_data.get("description", "Generated by EduAid"),  # Use provided description or default
            "quiz[quiz_type]": "assignment",
            "quiz[published]": True
        }
        quiz_url = f"{CANVAS_URL}/api/v1/courses/{course_id}/quizzes"
        logger.debug(f"Creating quiz at: {quiz_url}")
        quiz_response = requests.post(quiz_url, headers=headers, data=quiz_payload)

        if quiz_response.status_code not in (200, 201):
            logger.error(f"Failed to create quiz: {quiz_response.status_code} - {quiz_response.text}")
            return jsonify({"error": "Failed to create quiz in Canvas", "details": quiz_response.text}), 500

        quiz_id = quiz_response.json()["id"]
        logger.debug(f"Quiz created with ID: {quiz_id}")

        # Step 2: Add questions to the quiz
        question_url = f"{CANVAS_URL}/api/v1/courses/{course_id}/quizzes/{quiz_id}/questions"
        for q in quiz_data["questions"]:
            logger.debug(f"Processing question: {q}")
            if q["question_type"] == "MCQ":
                options = q.get("options", [])
                if q["answer"] not in options:
                    options.append(q["answer"])  # Ensure answer is in options
                question_payload = {
                    "question[question_text]": q["question"],
                    "question[question_type]": "multiple_choice_question",
                    "question[points_possible]": 1,
                }
                # Dynamically add all options
                for i, option in enumerate(options):
                    question_payload[f"question[answers][{i}][text]"] = option
                    question_payload[f"question[answers][{i}][weight]"] = 100 if option == q["answer"] else 0

            elif q["question_type"] == "Boolean":
                question_payload = {
                    "question[question_text]": q["question"],
                    "question[question_type]": "true_false_question",
                    "question[points_possible]": 1,
                    "question[answers][0][text]": "True",
                    "question[answers][0][weight]": 100 if q["answer"].lower() == "true" else 0,
                    "question[answers][1][text]": "False",
                    "question[answers][1][weight]": 100 if q["answer"].lower() == "false" else 0,
                }
            elif q["question_type"] == "Short":
                question_payload = {
                    "question[question_text]": q["question"],
                    "question[question_type]": "essay_question",
                    "question[points_possible]": 1
                }
            else:
                logger.warning(f"Skipping unsupported question type: {q['question_type']}")
                continue

            logger.debug(f"Posting question: {question_payload}")
            question_response = requests.post(question_url, headers=headers, data=question_payload)
            if question_response.status_code not in (200, 201):
                logger.error(f"Failed to add question: {question_response.status_code} - {question_response.text}")
                return jsonify({"error": "Failed to add question", "details": question_response.text}), 500

        quiz_link = f"{CANVAS_URL}/courses/{course_id}/quizzes/{quiz_id}"
        logger.info(f"Quiz exported successfully: {quiz_link}")
        return jsonify({"message": "Quiz exported to Canvas", "url": quiz_link})

    except Exception as e:
        logger.exception("An error occurred in export_to_canvas")
        return jsonify({"error": "Server error", "details": str(e)}), 500

@app.route('/summarize', methods=['POST'])
def summarize_text():
    from collections import defaultdict  # Keep this for local scope
    try:
        data = request.get_json()
        input_text = data.get("input_text", "")
        if not input_text:
            return jsonify({"error": "No input text provided"}), 400

        # Load spaCy model
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(input_text)

        # Word frequency for scoring
        word_freq = defaultdict(int)
        for token in doc:
            if token.text.lower() not in STOP_WORDS and token.text not in punctuation:
                word_freq[token.text.lower()] += 1

        # Sentence scoring
        sent_scores = defaultdict(float)
        for sent in doc.sents:
            for word in sent:
                if word.text.lower() in word_freq:
                    sent_scores[sent] += word_freq[word.text.lower()]

        # Get top 3 sentences (one per card, max 3 cards)
        top_sents = nlargest(5, sent_scores, key=sent_scores.get)
        top_sents_text = [sent.text.strip() for sent in top_sents]

        # Create 2-3 cards with dynamic headers
        notes_cards = []
        for sent_text in top_sents_text:
            # Re-process each sentence with spaCy to extract a header
            sent_doc = nlp(sent_text)
            # Look for the first noun chunk or verb phrase as the header
            header = None
            for chunk in sent_doc.noun_chunks:
                if chunk.text.lower() not in STOP_WORDS:
                    header = chunk.text
                    break
            if not header:  # Fallback to first verb or main subject
                for token in sent_doc:
                    if token.pos_ in ("VERB", "NOUN") and token.text.lower() not in STOP_WORDS:
                        header = token.text
                        break
            if not header:  # Ultimate fallback
                header = "Note"

            notes_cards.append({
                "header": header.capitalize(),  # Capitalize for readability
                "points": [f"- {sent_text}"]
            })

        # Fallback: ensure at least 2 cards if possible
        if len(notes_cards) < 2 and top_sents_text:
            all_points = [f"- {top_sents_text[0]}"] + ([f"- {top_sents_text[0]}"] if len(top_sents_text) == 1 else [f"- {top_sents_text[1]}"])
            notes_cards = [
                {"header": nlp(top_sents_text[0]).noun_chunks.__next__().text.capitalize(), "points": [all_points[0]]},
                {"header": nlp(top_sents_text[1] if len(top_sents_text) > 1 else top_sents_text[0]).noun_chunks.__next__().text.capitalize(), "points": [all_points[1]]}
            ]

        return jsonify({"notes": notes_cards})
    except Exception as e:
        logger.exception("Error in summarization")
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    os.makedirs("subtitles", exist_ok=True)
    app.run()
