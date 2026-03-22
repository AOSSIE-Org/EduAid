import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_limiter.util import get_remote_address
from flask_limiter import Limiter
from flask_limiter.errors import RateLimitExceeded
import nltk
import subprocess
import os
import tempfile
import glob
import shutil

YT_DLP_PATH = shutil.which("yt-dlp")
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

from apiclient import discovery
from httplib2 import Http
from oauth2client import client, file, tools
from mediawikiapi import MediaWikiAPI
from werkzeug.exceptions import RequestEntityTooLarge


def execute_with_timeout(func, timeout, *args, **kwargs):
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(func, *args, **kwargs)

    try:
        result = future.result(timeout=timeout)
        executor.shutdown(wait=False)
        return result, None

    except TimeoutError:
        future.cancel()
        executor.shutdown(wait=False)
        return None, "timeout"

    except Exception:
        logging.exception("Error occurred during execution")
        executor.shutdown(wait=False)
        return None, {
            "code": "internal_server_error",
            "message": "An internal error occurred"
        }

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)
CORS(app)
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
)
# Limit request payload size to 2MB
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024
print("Starting Flask App...")





@app.errorhandler(RateLimitExceeded)
def rate_limit_handler(_e):
    return jsonify({
        "error": "Rate limit exceeded",
        "code": "rate_limit_exceeded"
    }), 429

@app.errorhandler(RequestEntityTooLarge)
def request_entity_too_large(e):
    return jsonify({
        "error": "Request payload too large",
        "code": "payload_too_large"
    }), 413
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
@limiter.limit("20 per minute")
def get_mcq():
    data = request.get_json(silent=True)

    # ✅ JSON validation
    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid JSON",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)

    # ✅ Validate max_questions (IMPORTANT FIX)
    if not isinstance(max_questions, int):
        return jsonify({
            "error": "max_questions must be integer",
            "code": "invalid_type"
        }), 400

    if max_questions <= 0 or max_questions > 20:
        return jsonify({
            "error": "max_questions must be between 1 and 20",
            "code": "invalid_range"
        }), 400

    # ✅ Validate input_text
    if not isinstance(input_text, str):
        return jsonify({
            "error": "input_text must be string",
            "code": "invalid_type"
        }), 400

    input_text = input_text.strip()

    if len(input_text) < 10:
        return jsonify({
            "error": "Input too short",
            "code": "too_short"
        }), 400

    if len(input_text) > 50000:
        return jsonify({
            "error": "Input too long",
            "code": "too_long"
        }), 400

    # ✅ MediaWiki with timeout
    input_text, error = execute_with_timeout(
        process_input_text,
        10,
        input_text=input_text,
        use_mediawiki=use_mediawiki
    )

    if error == "timeout":
        return jsonify({
            "error": "MediaWiki timeout",
            "code": "mediawiki_timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "mediawiki_error"
        }), 500

    # ✅ MCQ generation with timeout
    output, error = execute_with_timeout(
        MCQGen.generate_mcq,
        60,
        input_text=input_text,
        max_questions=max_questions
    )

    if error == "timeout":
        return jsonify({
            "error": "Request timed out",
            "code": "timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "internal_error"
        }), 500

    # ✅ Validate model response
    if not output or not isinstance(output, dict) or "questions" not in output:
        return jsonify({
            "error": "Invalid model response",
            "code": "invalid_response"
        }), 500

    return jsonify({
        "output": output["questions"],
        "status": "success"
    })
    
@app.route("/get_boolq", methods=["POST"])
@limiter.limit("20 per minute")
def get_boolq():
    data = request.get_json(silent=True)

    # ✅ JSON validation
    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid JSON",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)

    # ✅ Validate max_questions (IMPORTANT FIX)
    if not isinstance(max_questions, int):
        return jsonify({
            "error": "max_questions must be integer",
            "code": "invalid_type"
        }), 400

    if max_questions <= 0 or max_questions > 20:
        return jsonify({
            "error": "max_questions must be between 1 and 20",
            "code": "invalid_range"
        }), 400

    # ✅ Validate input_text
    if not isinstance(input_text, str):
        return jsonify({
            "error": "input_text must be string",
            "code": "invalid_type"
        }), 400

    input_text = input_text.strip()

    if len(input_text) < 10:
        return jsonify({
            "error": "Input too short",
            "code": "too_short"
        }), 400

    if len(input_text) > 50000:
        return jsonify({
            "error": "Input too long",
            "code": "too_long"
        }), 400

    # ✅ MediaWiki with timeout
    input_text, error = execute_with_timeout(
        process_input_text,
        10,
        input_text=input_text,
        use_mediawiki=use_mediawiki
    )

    if error == "timeout":
        return jsonify({
            "error": "MediaWiki timeout",
            "code": "mediawiki_timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "mediawiki_error"
        }), 500

    # ✅ Boolean generation with timeout
    output, error = execute_with_timeout(
        BoolQGen.generate_boolq,
        60,
        input_text=input_text,
        max_questions=max_questions
    )

    if error == "timeout":
        return jsonify({
            "error": "Request timed out",
            "code": "timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "internal_error"
        }), 500

    # ✅ Validate model response
    if not output or not isinstance(output, dict) or "Boolean_Questions" not in output:
        return jsonify({
            "error": "Invalid model response",
            "code": "invalid_response"
        }), 500

    return jsonify({
        "output": output["Boolean_Questions"],
        "status": "success"
    })


@app.route("/get_shortq", methods=["POST"])
@limiter.limit("20 per minute")
def get_shortq():
    data = request.get_json(silent=True)

    # ✅ JSON validation
    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid JSON",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)

    # ✅ Validate max_questions (IMPORTANT FIX)
    if not isinstance(max_questions, int):
        return jsonify({
            "error": "max_questions must be integer",
            "code": "invalid_type"
        }), 400

    if max_questions <= 0 or max_questions > 20:
        return jsonify({
            "error": "max_questions must be between 1 and 20",
            "code": "invalid_range"
        }), 400

    # ✅ Validate input_text
    if not isinstance(input_text, str):
        return jsonify({
            "error": "input_text must be string",
            "code": "invalid_type"
        }), 400

    input_text = input_text.strip()

    if len(input_text) < 10:
        return jsonify({
            "error": "Input too short",
            "code": "too_short"
        }), 400

    if len(input_text) > 50000:
        return jsonify({
            "error": "Input too long",
            "code": "too_long"
        }), 400

    # ✅ MediaWiki with timeout
    input_text, error = execute_with_timeout(
        process_input_text,
        10,
        input_text=input_text,
        use_mediawiki=use_mediawiki
    )

    if error == "timeout":
        return jsonify({
            "error": "MediaWiki timeout",
            "code": "mediawiki_timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "mediawiki_error"
        }), 500

    # ✅ Short question generation with timeout
    output, error = execute_with_timeout(
        ShortQGen.generate_shortq,
        60,
        input_text=input_text,
        max_questions=max_questions
    )

    if error == "timeout":
        return jsonify({
            "error": "Request timed out",
            "code": "timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "internal_error"
        }), 500

    # ✅ Validate model response
    if not output or not isinstance(output, dict) or "questions" not in output:
        return jsonify({
            "error": "Invalid model response",
            "code": "invalid_response"
        }), 500

    return jsonify({
        "output": output["questions"],
        "status": "success"
    })

@app.route("/get_problems", methods=["POST"])
@limiter.limit("10 per minute")
def get_problems():
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)

    max_questions_mcq = data.get("max_questions_mcq", 4)
    max_questions_boolq = data.get("max_questions_boolq", 4)
    max_questions_shortq = data.get("max_questions_shortq", 4)

    # ✅ Validate max_questions (CRITICAL FIX)
    for val in [max_questions_mcq, max_questions_boolq, max_questions_shortq]:
        if not isinstance(val, int):
            return jsonify({
                "error": "max_questions must be integer",
                "code": "invalid_type"
            }), 400

        if val <= 0 or val > 20:
            return jsonify({
                "error": "max_questions must be between 1 and 20",
                "code": "invalid_range"
            }), 400

    # ✅ Validate input_text
    if not isinstance(input_text, str):
        return jsonify({"error": "input_text must be string"}), 400

    input_text = input_text.strip()

    if len(input_text) < 10:
        return jsonify({"error": "Input too short"}), 400

    if len(input_text) > 50000:
        return jsonify({"error": "Input too long"}), 400

    # ✅ MediaWiki with timeout
    input_text, error = execute_with_timeout(
        process_input_text,
        10,
        input_text=input_text,
        use_mediawiki=use_mediawiki
    )

    if error == "timeout":
        return jsonify({
            "error": "MediaWiki timeout",
            "code": "mediawiki_timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "mediawiki_error"
        }), 500

    # ✅ Parallel execution
    def run_mcq():
        return execute_with_timeout(
            MCQGen.generate_mcq,
            60,
            input_text=input_text,
            max_questions=max_questions_mcq
        )

    def run_boolq():
        return execute_with_timeout(
            BoolQGen.generate_boolq,
            60,
            input_text=input_text,
            max_questions=max_questions_boolq
        )

    def run_shortq():
        return execute_with_timeout(
            ShortQGen.generate_shortq,
            60,
            input_text=input_text,
            max_questions=max_questions_shortq
        )

    # 🚀 Run in parallel
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(run_mcq),
            executor.submit(run_boolq),
            executor.submit(run_shortq)
        ]

        results = [f.result() for f in futures]

    (mcq_out, mcq_err), (bool_out, bool_err), (short_out, short_err) = results

    response = {}

    if mcq_err:
        response["mcq_error"] = mcq_err
    else:
        response["output_mcq"] = (mcq_out or {}).get("questions", [])

    if bool_err:
        response["boolq_error"] = bool_err
    else:
        response["output_boolq"] = (bool_out or {}).get("Boolean_Questions", [])

    if short_err:
        response["shortq_error"] = short_err
    else:
        response["output_shortq"] = (short_out or {}).get("questions", [])

    # ✅ If ALL failed
    if mcq_err and bool_err and short_err:
        all_errors = [mcq_err, bool_err, short_err]

        status = 504 if all(e == "timeout" for e in all_errors) else 500
        code = "timeout" if status == 504 else "all_failed"

        return jsonify({
            "error": "All generators failed",
            "code": code
        }), status

    return jsonify(response)
    
@app.route("/get_mcq_answer", methods=["POST"])
@limiter.limit("20 per minute")
def get_mcq_answer():
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    input_options = data.get("input_options", [])
    outputs = []

    if not input_questions or not input_options or len(input_questions) != len(input_options):
        return jsonify({"outputs": outputs})

    for question, options in zip(input_questions, input_options):
        qa_response = qa_model(question=question, context=input_text)
        generated_answer = qa_response["answer"]

        options_with_answer = options + [generated_answer]
        vectorizer = TfidfVectorizer().fit_transform(options_with_answer)
        vectors = vectorizer.toarray()
        generated_answer_vector = vectors[-1].reshape(1, -1)

        similarities = cosine_similarity(vectors[:-1], generated_answer_vector).flatten()
        max_similarity_index = similarities.argmax()

        best_option = options[max_similarity_index]
        outputs.append(best_option)

    return jsonify({"output": outputs})

@app.route("/get_shortq_answer", methods=["POST"])
@limiter.limit("20 per minute")
def get_answer():
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    answers = []

    for question in input_questions:
        qa_response = qa_model(question=question, context=input_text)
        answers.append(qa_response["answer"])

    return jsonify({"output": answers})

@app.route("/get_boolean_answer", methods=["POST"])
@limiter.limit("20 per minute")
def get_boolean_answer():
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    output = []

    for question in input_questions:
        qa_response = answer.predict_boolean_answer(
            {"input_text": input_text, "input_question": question}
        )

        if qa_response:
            output.append("True")
        else:
            output.append("False")

    return jsonify({"output": output})

@app.route('/get_content', methods=['POST'])
@limiter.limit("10 per minute")
def get_content():
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    # Accept both doc_id and document_url
    doc_id = data.get("doc_id")

    if not doc_id:
        document_url = data.get("document_url")
        if document_url:
            match = re.search(r'/d/([a-zA-Z0-9_-]+)', document_url)
            if match:
                doc_id = match.group(1)

    if not doc_id:
        return jsonify({"error": "doc_id or document_url is required"}), 400

    try:
        document_url = f"https://docs.google.com/document/d/{doc_id}/edit"
        content = docs_service.get_document_content(document_url)
        return jsonify({"content": content})

    # ✅ Client-side error
    except ValueError:
        return jsonify({
            "error": "Invalid document URL",
            "code": "invalid_request"
        }), 400

    # ✅ Server-side error
    except Exception as e:
        logging.exception("Error fetching document content")

        return jsonify({
            "error": "Internal server error",
            "code": "internal_server_error"
        }), 500

@app.route("/generate_gform", methods=["POST"])
@limiter.limit("5 per minute")
def generate_gform():
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    qa_pairs = data.get("qa_pairs", [])
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
            options = qapair.get("options") or []
            valid_options = [opt for opt in options if opt]

            choices = [qapair["answer"], *valid_options[:3]]
            random.shuffle(choices)

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
                options = qapair.get("options") or []
                valid_options = [opt for opt in options if opt]

                choices = [qapair["answer"], *valid_options[:3]]
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
        formId=result["formId"],
        body=NEW_QUESTION
    ).execute()

    return jsonify({
        "form_link": result["responderUri"],
        "responder_url": result["responderUri"],
        "edit_url": f"https://docs.google.com/forms/d/{result['formId']}/edit"
    })


@app.route("/get_shortq_hard", methods=["POST"])
@limiter.limit("20 per minute")
def get_shortq_hard():
    data = request.get_json(silent=True)

    # ✅ JSON validation
    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])

    # ✅ Validate input_question
    if not isinstance(input_questions, list):
        return jsonify({
            "error": "input_question must be a list",
            "code": "invalid_type"
        }), 400

    MAX_QUESTIONS = 20
    if len(input_questions) > MAX_QUESTIONS:
        return jsonify({
            "error": f"Max {MAX_QUESTIONS} questions allowed",
            "code": "limit_exceeded"
        }), 400

    # ✅ Validate input_text
    if not isinstance(input_text, str):
        return jsonify({
            "error": "input_text must be string",
            "code": "invalid_type"
        }), 400

    input_text = input_text.strip()

    if len(input_text) < 10:
        return jsonify({
            "error": "Input too short",
            "code": "too_short"
        }), 400

    if len(input_text) > 50000:
        return jsonify({
            "error": "Input too long",
            "code": "too_long"
        }), 400

    # ✅ MediaWiki processing with timeout (FIXED)
    input_text, error = execute_with_timeout(
        process_input_text,
        10,
        input_text=input_text,
        use_mediawiki=use_mediawiki
    )

    if error == "timeout":
        return jsonify({
            "error": "MediaWiki processing timed out",
            "code": "mediawiki_timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "mediawiki_error"
        }), 500

    # ✅ Question generation with timeout
    output, error = execute_with_timeout(
        qg.generate,
        60,
        article=input_text,
        num_questions=len(input_questions),
        answer_style="sentences"
    )

    if error == "timeout":
        return jsonify({
            "error": "Request timed out",
            "code": "timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "internal_error"
        }), 500

    if not output or not isinstance(output, list):
        return jsonify({
            "error": "Invalid model response",
            "code": "invalid_response"
        }), 500

    # ✅ Make questions harder
    for item in output:
        if isinstance(item, dict) and "question" in item:
            item["question"] = make_question_harder(item["question"])

    return jsonify({
        "output": output,
        "status": "success"
    })


@app.route("/get_boolq_hard", methods=["POST"])
@limiter.limit("20 per minute")
def get_boolq_hard():
    data = request.get_json(silent=True)

    # ✅ JSON validation
    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Invalid or missing JSON body",
            "code": "invalid_request"
        }), 400

    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])

    # ✅ Validate input_question
    if not isinstance(input_questions, list):
        return jsonify({
            "error": "input_question must be a list",
            "code": "invalid_type"
        }), 400

    MAX_QUESTIONS = 20
    if len(input_questions) > MAX_QUESTIONS:
        return jsonify({
            "error": f"Max {MAX_QUESTIONS} questions allowed",
            "code": "limit_exceeded"
        }), 400

    # ✅ Validate input_text
    if not isinstance(input_text, str):
        return jsonify({
            "error": "input_text must be string",
            "code": "invalid_type"
        }), 400

    input_text = input_text.strip()

    if len(input_text) < 10:
        return jsonify({
            "error": "Input too short",
            "code": "too_short"
        }), 400

    if len(input_text) > 50000:
        return jsonify({
            "error": "Input too long",
            "code": "too_long"
        }), 400

    # ✅ MediaWiki with timeout (FIXED)
    input_text, error = execute_with_timeout(
        process_input_text,
        10,
        input_text=input_text,
        use_mediawiki=use_mediawiki
    )

    if error == "timeout":
        return jsonify({
            "error": "MediaWiki processing timed out",
            "code": "mediawiki_timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "mediawiki_error"
        }), 500

    # ✅ Question generation with timeout
    generated, error = execute_with_timeout(
        qg.generate,
        60,
        article=input_text,
        num_questions=len(input_questions),
        answer_style="true_false"
    )

    if error == "timeout":
        return jsonify({
            "error": "Request timed out",
            "code": "timeout"
        }), 504

    elif error:
        return jsonify({
            "error": error,
            "code": "internal_error"
        }), 500

    if not generated or not isinstance(generated, list):
        return jsonify({
            "error": "Invalid model response",
            "code": "invalid_response"
        }), 500

    # ✅ Make questions harder (FIXED structure)
    for q in generated:
        if isinstance(q, dict) and "question" in q:
            q["question"] = make_question_harder(q["question"])

    return jsonify({
        "output": generated,
        "status": "success"
    })

@app.route('/upload', methods=['POST'])
@limiter.limit("10 per minute")
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
@limiter.limit("10 per minute")
def get_transcript():
    if not YT_DLP_PATH:
        return jsonify({"error": "yt-dlp is not installed on the server"}), 500
    video_id = request.args.get('videoId')

    # Validate video ID
    if not video_id or not re.match(r'^[A-Za-z0-9_-]{11}$', video_id):
        return jsonify({"error": "Invalid video ID"}), 400

    try:
        with tempfile.TemporaryDirectory() as tempdir:

            subprocess.run(
                [
                    YT_DLP_PATH,
                    "--write-auto-sub",
                    "--sub-lang", "en",
                    "--skip-download",
                    "--sub-format", "vtt",
                    f"https://www.youtube.com/watch?v={video_id}"
                ],
                cwd=tempdir,
                check=True,
                capture_output=True,
                text=True,
                timeout=30
            )

            vtt_files = sorted(glob.glob(os.path.join(tempdir, "*.vtt")))

            if not vtt_files:
                return jsonify({"error": "No subtitles found"}), 404

            transcript_text = clean_transcript(vtt_files[0])

            return jsonify({"transcript": transcript_text})

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Subtitle fetch timed out"}), 504

    except subprocess.CalledProcessError:
        return jsonify({"error": "Failed to fetch subtitles"}), 400

    except FileNotFoundError:
        return jsonify({"error": "yt-dlp is not installed on the server"}), 500
    
if __name__ == "__main__":
    os.makedirs("subtitles", exist_ok=True)
    app.run()
