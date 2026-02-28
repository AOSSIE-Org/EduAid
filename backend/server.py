import os
import re
import glob
import json
import random
import logging
import subprocess

from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from transformers import pipeline

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from Generator.nltk_utils import safe_nltk_download
safe_nltk_download('corpora/stopwords')
safe_nltk_download('tokenizers/punkt_tab')

from Generator import main
from Generator.question_filters import make_question_harder
from mediawikiapi import MediaWikiAPI

# Initialize Flask app
app = Flask(__name__)

# Security: Configure CORS with restricted origins
# Override in production via ALLOWED_ORIGINS env var (comma-separated)
_default_origins = ["http://localhost:3000", "http://localhost:19222"]
_origins_env = os.environ.get("ALLOWED_ORIGINS", "").strip()
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] if _origins_env else _default_origins

CORS(app, resources={
    r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "max_age": 3600
    }
})

logger.info("Flask app initialized")

# Initialize generators
try:
    MCQGen = main.MCQGenerator()
    logger.info("MCQGenerator loaded")
except Exception as e:
    logger.error(f"Failed to load MCQGenerator: {e}")
    MCQGen = None

try:
    BoolQGen = main.BoolQGenerator()
    logger.info("BoolQGenerator loaded")
except Exception as e:
    logger.error(f"Failed to load BoolQGenerator: {e}")
    BoolQGen = None

try:
    ShortQGen = main.ShortQGenerator()
    logger.info("ShortQGenerator loaded")
except Exception as e:
    logger.error(f"Failed to load ShortQGenerator: {e}")
    ShortQGen = None

try:
    file_processor = main.FileProcessor()
    logger.info("FileProcessor loaded")
except Exception as e:
    logger.error(f"Failed to load FileProcessor: {e}")
    file_processor = None

try:
    mediawikiapi = MediaWikiAPI()
    logger.info("MediaWiki API initialized")
except Exception as e:
    logger.warning(f"MediaWiki API unavailable: {e}")
    mediawikiapi = None

# Initialize answer prediction models
try:
    answer = main.AnswerPredictor()
    logger.info("AnswerPredictor loaded")
except Exception as e:
    logger.warning(f"AnswerPredictor unavailable: {e}")
    answer = None

try:
    qg = main.QuestionGenerator()
    logger.info("QuestionGenerator loaded")
except Exception as e:
    logger.warning(f"QuestionGenerator unavailable: {e}")
    qg = None

try:
    qa_model = pipeline("question-answering")
    logger.info("QA pipeline loaded")
except Exception as e:
    logger.warning(f"QA pipeline unavailable: {e}")
    qa_model = None

# Google Docs service - handle missing credentials gracefully
SERVICE_ACCOUNT_FILE = './service_account_key.json'
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']
docs_service = None

if os.path.exists(SERVICE_ACCOUNT_FILE):
    try:
        docs_service = main.GoogleDocsService(SERVICE_ACCOUNT_FILE, SCOPES)
        logger.info("GoogleDocsService initialized")
    except Exception as e:
        logger.warning(f"GoogleDocsService unavailable: {e}")
else:
    logger.info("service_account_key.json not found - Google Forms feature disabled")


def validate_input(input_text, max_length=50000):
    """Validate and sanitize input text"""
    if not isinstance(input_text, str):
        raise ValueError("Input must be a string")
    if len(input_text) > max_length:
        raise ValueError(f"Input exceeds maximum length of {max_length} characters")
    if len(input_text.strip()) == 0:
        raise ValueError("Input text cannot be empty")
    return input_text.strip()

def validate_max_questions(max_questions, min_val=1, max_val=50):
    """Validate max_questions parameter"""
    if not isinstance(max_questions, int) or max_questions < min_val or max_questions > max_val:
        raise ValueError(f"max_questions must be between {min_val} and {max_val}")
    return max_questions

def process_input_text(input_text, use_mediawiki):
    """Process input text, optionally enriching with Wikipedia summary"""
    if use_mediawiki == 1 and mediawikiapi:
        try:
            input_text = mediawikiapi.summary(input_text, 8)
        except Exception as e:
            logger.warning(f"Wikipedia enrichment failed: {e}")
    return input_text


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Backend is running"}), 200


@app.errorhandler(400)
def bad_request(error):
    """Handle bad requests"""
    return jsonify({"error": "Bad request", "message": str(error)}), 400


@app.errorhandler(500)
def internal_error(error):
    """Handle server errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500


@app.route("/get_mcq", methods=["POST"])
def get_mcq():
    try:
        if not MCQGen:
            return jsonify({"error": "MCQ Generator not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        input_text = validate_input(data.get("input_text", ""))
        max_questions = validate_max_questions(data.get("max_questions", 4))
        use_mediawiki = data.get("use_mediawiki", 0)
        
        input_text = process_input_text(input_text, use_mediawiki)
        output = MCQGen.generate_mcq({
            "input_text": input_text,
            "max_questions": max_questions
        })
        
        return jsonify({"output": output.get("questions", [])}), 200
    except ValueError as e:
        logger.warning(f"Validation error in /get_mcq: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /get_mcq: {e}")
        return jsonify({"error": "Failed to generate MCQ"}), 500


@app.route("/get_boolq", methods=["POST"])
def get_boolq():
    try:
        if not BoolQGen:
            return jsonify({"error": "Boolean Generator not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        input_text = validate_input(data.get("input_text", ""))
        max_questions = validate_max_questions(data.get("max_questions", 4))
        use_mediawiki = data.get("use_mediawiki", 0)
        
        input_text = process_input_text(input_text, use_mediawiki)
        output = BoolQGen.generate_boolq({
            "input_text": input_text,
            "max_questions": max_questions
        })
        
        return jsonify({"output": output.get("Boolean_Questions", [])}), 200
    except ValueError as e:
        logger.warning(f"Validation error in /get_boolq: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /get_boolq: {e}")
        return jsonify({"error": "Failed to generate Boolean questions"}), 500


@app.route("/get_shortq", methods=["POST"])
def get_shortq():
    try:
        if not ShortQGen:
            return jsonify({"error": "Short Answer Generator not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        input_text = validate_input(data.get("input_text", ""))
        max_questions = validate_max_questions(data.get("max_questions", 4))
        use_mediawiki = data.get("use_mediawiki", 0)
        
        input_text = process_input_text(input_text, use_mediawiki)
        output = ShortQGen.generate_shortq({
            "input_text": input_text,
            "max_questions": max_questions
        })
        
        return jsonify({"output": output.get("questions", [])}), 200
    except ValueError as e:
        logger.warning(f"Validation error in /get_shortq: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /get_shortq: {e}")
        return jsonify({"error": "Failed to generate short answer questions"}), 500


@app.route("/get_problems", methods=["POST"])
def get_problems():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        input_text = validate_input(data.get("input_text", ""))
        max_questions_mcq = validate_max_questions(data.get("max_questions_mcq", 4))
        max_questions_boolq = validate_max_questions(data.get("max_questions_boolq", 4))
        max_questions_shortq = validate_max_questions(data.get("max_questions_shortq", 4))
        use_mediawiki = data.get("use_mediawiki", 0)
        
        input_text = process_input_text(input_text, use_mediawiki)
        
        output = {}
        
        if MCQGen:
            try:
                output["output_mcq"] = MCQGen.generate_mcq({
                    "input_text": input_text,
                    "max_questions": max_questions_mcq
                })
            except Exception as e:
                logger.error(f"MCQ generation failed: {e}")
                output["output_mcq"] = {"questions": []}
        
        if BoolQGen:
            try:
                output["output_boolq"] = BoolQGen.generate_boolq({
                    "input_text": input_text,
                    "max_questions": max_questions_boolq
                })
            except Exception as e:
                logger.error(f"Boolean generation failed: {e}")
                output["output_boolq"] = {"Boolean_Questions": []}
        
        if ShortQGen:
            try:
                output["output_shortq"] = ShortQGen.generate_shortq({
                    "input_text": input_text,
                    "max_questions": max_questions_shortq
                })
            except Exception as e:
                logger.error(f"Short answer generation failed: {e}")
                output["output_shortq"] = {"questions": []}
        
        return jsonify(output), 200
    except ValueError as e:
        logger.warning(f"Validation error in /get_problems: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /get_problems: {e}")
        return jsonify({"error": "Failed to generate problems"}), 500

@app.route("/get_mcq_answer", methods=["POST"])
def get_mcq_answer():
    """Predict MCQ answers using QA model with proper validation."""
    try:
        if not qa_model:
            return jsonify({"error": "QA model not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON provided"}), 400
        
        input_text = data.get("input_text", "")
        input_questions = data.get("input_question", [])
        input_options = data.get("input_options", [])
        outputs = []
        
        # Validate inputs
        try:
            input_text = validate_input(input_text)
        except ValueError as e:
            logger.warning(f"MCQ answer validation error: {e}")
            return jsonify({"error": str(e)}), 400
        
        # Validate questions and options
        if not input_questions or not input_options:
            return jsonify({"output": []})
        
        if len(input_questions) != len(input_options):
            logger.warning(f"Question/option mismatch: {len(input_questions)} != {len(input_options)}")
            return jsonify({"error": "Questions and options length mismatch"}), 400
        
        if len(input_questions) > 100:
            logger.warning(f"Too many questions requested: {len(input_questions)}")
            return jsonify({"error": "Too many questions (max 100)"}), 400

        for question, options in zip(input_questions, input_options):
            try:
                # Validate question and options
                if not isinstance(question, str) or not question.strip():
                    logger.warning("Empty question provided")
                    continue
                
                if not isinstance(options, list) or not options:
                    logger.warning("Empty options provided")
                    continue
                
                # Generate answer using the QA model
                qa_response = qa_model(question=question, context=input_text)
                generated_answer = qa_response.get("answer", "")
                
                if not generated_answer:
                    logger.warning("QA model returned empty answer")
                    continue

                # Calculate similarity between generated answer and each option
                filtered_options = [(i, str(opt)) for i, opt in enumerate(options) if opt]
                if not filtered_options:
                    continue
                
                option_texts = [opt for _, opt in filtered_options]
                options_with_answer = option_texts + [generated_answer]
                if len(options_with_answer) < 2:
                    continue
                    
                vectorizer = TfidfVectorizer().fit_transform(options_with_answer)
                vectors = vectorizer.toarray()
                generated_answer_vector = vectors[-1].reshape(1, -1)

                similarities = cosine_similarity(vectors[:-1], generated_answer_vector).flatten()
                max_similarity_index = similarities.argmax()

                # Return the option with the highest similarity (map back to original index)
                orig_index = filtered_options[max_similarity_index][0]
                best_option = options[orig_index]
                outputs.append(best_option)
            except Exception as e:
                logger.error(f"Error processing MCQ answer: {e}")
                continue

        return jsonify({"output": outputs}), 200
    except Exception as e:
        logger.error(f"Error in get_mcq_answer: {e}")
        return jsonify({"error": "Failed to process MCQ answers"}), 500


@app.route("/get_shortq_answer", methods=["POST"])
def get_answer():
    """Get answers for short answer questions with validation."""
    try:
        if not qa_model:
            return jsonify({"error": "QA model not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON provided"}), 400
        
        input_text = data.get("input_text", "")
        input_questions = data.get("input_question", [])
        answers = []
        
        # Validate text input
        try:
            input_text = validate_input(input_text)
        except ValueError as e:
            logger.warning(f"Short answer validation error: {e}")
            return jsonify({"error": str(e)}), 400
        
        if not input_questions:
            return jsonify({"output": []})
        
        if len(input_questions) > 100:
            logger.warning(f"Too many questions requested: {len(input_questions)}")
            return jsonify({"error": "Too many questions (max 100)"}), 400

        for question in input_questions:
            try:
                if not isinstance(question, str) or not question.strip():
                    logger.warning("Empty question provided")
                    continue
                
                qa_response = qa_model(question=question, context=input_text)
                answer = qa_response.get("answer", "")
                answers.append(answer)
            except Exception as e:
                logger.error(f"Error generating answer for question: {e}")
                answers.append("")

        return jsonify({"output": answers}), 200
    except Exception as e:
        logger.error(f"Error in get_shortq_answer: {e}")
        return jsonify({"error": "Failed to process questions"}), 500


@app.route("/get_boolean_answer", methods=["POST"])
def get_boolean_answer():
    """Get answers for boolean questions with validation."""
    try:
        if not answer:
            return jsonify({"error": "Answer predictor not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON provided"}), 400
        
        input_text = data.get("input_text", "")
        input_questions = data.get("input_question", [])
        output = []
        
        # Validate text input
        try:
            input_text = validate_input(input_text)
        except ValueError as e:
            logger.warning(f"Boolean answer validation error: {e}")
            return jsonify({"error": str(e)}), 400
        
        if not input_questions:
            return jsonify({"output": []})
        
        if len(input_questions) > 100:
            logger.warning(f"Too many questions requested: {len(input_questions)}")
            return jsonify({"error": "Too many questions (max 100)"}), 400

        for question in input_questions:
            try:
                if not isinstance(question, str) or not question.strip():
                    logger.warning("Empty question provided")
                    continue
                
                qa_response = answer.predict_boolean_answer(
                    {"input_text": input_text, "input_question": [question]}
                )
                output.append("True" if qa_response and qa_response[0] else "False")
            except Exception as e:
                logger.error(f"Error predicting boolean answer: {e}")
                output.append("False")

        return jsonify({"output": output}), 200
    except Exception as e:
        logger.error(f"Error in get_boolean_answer: {e}")
        return jsonify({"error": "Failed to process boolean questions"}), 500


@app.route('/get_content', methods=['POST'])
def get_content():
    """Fetch Google Docs content with proper error handling."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON provided'}), 400
        
        document_url = data.get('document_url', '').strip()
        if not document_url:
            logger.warning("No document URL provided")
            return jsonify({'error': 'Document URL is required'}), 400
        
        # Validate URL format (basic check)
        if not document_url.startswith(('http://', 'https://')):
            logger.warning(f"Invalid document URL format: {document_url[:20]}...")
            return jsonify({'error': 'Invalid document URL'}), 400
        
        if not docs_service:
            logger.error("Google Docs service not configured")
            return jsonify({'error': 'Google Docs service not available'}), 503
        
        text = docs_service.get_document_content(document_url)
        if not text:
            logger.warning("Document returned empty content")
            return jsonify({'content': ''})
        
        return jsonify({'content': text}), 200
    except ValueError as e:
        logger.warning(f"Invalid document URL: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error fetching document content: {e}")
        return jsonify({'error': 'Failed to fetch document content'}), 500


@app.route("/generate_gform", methods=["POST"])
def generate_gform():
    """Generate Google Forms with proper security and validation."""
    try:
        # Lazy import OAuth2 dependencies (only needed for this feature)
        try:
            from apiclient import discovery
            from httplib2 import Http
            from oauth2client import client, file as oauth_file, tools
        except ImportError as e:
            logger.error(f"Google Forms dependencies not installed: {e}")
            return jsonify({'error': 'Google Forms feature not available (missing dependencies)'}), 503
        
        # Validate credentials file exists
        if not os.path.exists("credentials.json"):
            logger.warning("credentials.json not found for Google Forms")
            return jsonify({'error': 'Google Forms credentials not configured'}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON provided'}), 400
        
        qa_pairs = data.get("qa_pairs", [])
        question_type = data.get("question_type", "")
        
        # Validate inputs
        if not qa_pairs or not isinstance(qa_pairs, list):
            logger.warning("Invalid qa_pairs provided")
            return jsonify({'error': 'qa_pairs must be a non-empty list'}), 400
        
        if len(qa_pairs) > 100:
            logger.warning(f"Too many QA pairs: {len(qa_pairs)}")
            return jsonify({'error': 'Maximum 100 questions allowed'}), 400
        
        if question_type not in ['get_shortq', 'get_mcq', 'get_boolq', '']:
            logger.warning(f"Invalid question type: {question_type}")
            return jsonify({'error': 'Invalid question type'}), 400
        
        # Build OAuth2 credentials
        FORM_SCOPES = "https://www.googleapis.com/auth/forms.body"
        DISCOVERY_DOC = "https://forms.googleapis.com/$discovery/rest?version=v1"
        
        store = oauth_file.Storage("token.json")
        creds = store.get()
        if not creds or creds.invalid:
            flow = client.flow_from_clientsecrets("credentials.json", FORM_SCOPES)
            creds = tools.run_flow(flow, store)
        
        form_service = discovery.build(
            "forms",
            "v1",
            http=creds.authorize(Http()),
            discoveryServiceUrl=DISCOVERY_DOC,
            static_discovery=False,
        )
        
        # Create form structure
        NEW_FORM = {
            "info": {
                "title": "EduAid Form",
                "documentTitle": "EduAid Assessment"
            }
        }
        
        requests_list = []
        
        try:
            if question_type == "get_shortq":
                for index, qapair in enumerate(qa_pairs):
                    if not isinstance(qapair, dict) or 'question' not in qapair:
                        logger.warning(f"Invalid qa_pair at index {index}")
                        continue
                    
                    question_text = str(qapair.get("question", ""))[:1000]  # Limit to 1000 chars
                    if not question_text.strip():
                        continue
                    
                    requests = {
                        "createItem": {
                            "item": {
                                "title": question_text,
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
                    if not isinstance(qapair, dict) or 'question' not in qapair:
                        logger.warning(f"Invalid qa_pair at index {index}")
                        continue
                    
                    question_text = str(qapair.get("question", ""))[:1000]
                    options = qapair.get("options", [])
                    answer = qapair.get("answer", "")
                    
                    if not question_text.strip():
                        continue
                    
                    # Filter valid options
                    valid_options = [str(opt)[:500] for opt in options if opt][:3]
                    
                    # Create choices with answer included
                    choices = []
                    if answer:
                        choices.append({"value": str(answer)[:500]})
                    choices.extend([{"value": opt} for opt in valid_options])
                    
                    if not choices:
                        continue
                    
                    requests = {
                        "createItem": {
                            "item": {
                                "title": question_text,
                                "questionItem": {
                                    "question": {
                                        "required": True,
                                        "choiceQuestion": {
                                            "type": "RADIO",
                                            "options": choices[:10],  # Max 10 options
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
                    if not isinstance(qapair, dict) or 'question' not in qapair:
                        logger.warning(f"Invalid qa_pair at index {index}")
                        continue
                    
                    question_text = str(qapair.get("question", ""))[:1000]
                    if not question_text.strip():
                        continue
                    
                    requests = {
                        "createItem": {
                            "item": {
                                "title": question_text,
                                "questionItem": {
                                    "question": {
                                        "required": True,
                                        "choiceQuestion": {
                                            "type": "RADIO",
                                            "options": [
                                                {"value": "True"},
                                                {"value": "False"},
                                            ],
                                        },
                                    }
                                },
                            },
                            "location": {"index": index},
                        }
                    }
                    requests_list.append(requests)
            
            if not requests_list:
                logger.warning("No valid questions to add to form")
                return jsonify({'error': 'No valid questions provided'}), 400
            
            # Create the form
            result = form_service.forms().create(body=NEW_FORM).execute()
            form_id = result.get("formId")
            
            if not form_id:
                logger.error("Failed to create form - no form ID returned")
                return jsonify({'error': 'Failed to create form'}), 500
            
            # Add questions to the form
            NEW_QUESTIONS = {"requests": requests_list}
            form_service.forms().batchUpdate(
                formId=form_id, body=NEW_QUESTIONS
            ).execute()
            
            # Return the responder URI (where users fill the form)
            responder_uri = result.get("responderUri", "")
            edit_uri = f"https://docs.google.com/forms/d/{form_id}/edit"
            
            logger.info(f"Form created successfully: {form_id}")
            return jsonify({
                'form_id': form_id,
                'responder_uri': responder_uri,
                'edit_uri': edit_uri
            }), 200
        
        except Exception as e:
            logger.error(f"Error creating Google Form: {e}")
            return jsonify({'error': 'Failed to create form'}), 500
    
    except Exception as e:
        logger.error(f"Error in generate_gform: {e}")
        return jsonify({'error': 'Failed to process form generation request'}), 500


@app.route("/get_shortq_hard", methods=["POST"])
def get_shortq_hard():
    """Generate harder short answer questions with validation."""
    try:
        if not qg:
            return jsonify({"error": "Question Generator not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON provided"}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        input_questions = data.get("input_question", [])
        
        try:
            input_text = validate_input(input_text)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)

        output = qg.generate(
            article=input_text, num_questions=input_questions, answer_style="sentences"
        )

        for item in output:
            try:
                item["question"] = make_question_harder(item["question"])
            except Exception as e:
                logger.warning(f"Failed to make question harder: {e}")

        return jsonify({"output": output}), 200
    except ValueError as e:
        logger.warning(f"Validation error in /get_shortq_hard: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /get_shortq_hard: {e}")
        return jsonify({"error": "Failed to generate hard short questions"}), 500


@app.route("/get_mcq_hard", methods=["POST"])
def get_mcq_hard():
    """Generate harder MCQ questions with validation."""
    try:
        if not qg:
            return jsonify({"error": "Question Generator not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON provided"}), 400
        
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        input_questions = data.get("input_question", [])
        
        try:
            input_text = validate_input(input_text)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        input_text = process_input_text(input_text, use_mediawiki)
        output = qg.generate(
            article=input_text, num_questions=input_questions, answer_style="multiple_choice"
        )
        
        for q in output:
            try:
                q["question"] = make_question_harder(q["question"])
            except Exception as e:
                logger.warning(f"Failed to make question harder: {e}")
            
        return jsonify({"output": output}), 200
    except ValueError as e:
        logger.warning(f"Validation error in /get_mcq_hard: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /get_mcq_hard: {e}")
        return jsonify({"error": "Failed to generate hard MCQ questions"}), 500

@app.route("/get_boolq_hard", methods=["POST"])
def get_boolq_hard():
    """Generate harder boolean questions with validation."""
    try:
        if not BoolQGen:
            return jsonify({"error": "Boolean Generator not available"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON provided"}), 400
        
        input_text = data.get("input_text", "")
        max_questions = validate_max_questions(data.get("max_questions", 4))
        use_mediawiki = data.get("use_mediawiki", 0)
        
        try:
            input_text = validate_input(input_text)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        input_text = process_input_text(input_text, use_mediawiki)

        output = BoolQGen.generate_boolq({
            "input_text": input_text,
            "max_questions": max_questions
        })

        generated = output.get("Boolean_Questions", [])

        harder_questions = []
        for q in generated:
            try:
                harder_questions.append(make_question_harder(q))
            except Exception as e:
                logger.warning(f"Failed to make question harder: {e}")
                harder_questions.append(q)

        return jsonify({"output": harder_questions}), 200
    except ValueError as e:
        logger.warning(f"Validation error in /get_boolq_hard: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in /get_boolq_hard: {e}")
        return jsonify({"error": "Failed to generate hard boolean questions"}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file uploads with security validation."""
    try:
        # File size limit: 10MB
        MAX_FILE_SIZE = 10 * 1024 * 1024
        # Supported formats must match FileProcessor extraction pipeline
        ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}
        
        if 'file' not in request.files:
            logger.warning("Upload attempt with no file part")
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']

        if not file.filename or file.filename == '':
            logger.warning("Upload attempt with empty filename")
            return jsonify({"error": "No selected file"}), 400
        
        # Validate file extension
        file_ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if file_ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"Unsupported file type: {file_ext}")
            return jsonify({"error": f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        # Check file size (read content length)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Seek back to start
        
        if file_size > MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_size} bytes")
            return jsonify({"error": f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"}), 400
        
        if file_size == 0:
            logger.warning("Empty file uploaded")
            return jsonify({"error": "Uploaded file is empty"}), 400
        
        if not file_processor:
            logger.error("FileProcessor not available")
            return jsonify({"error": "File processing service unavailable"}), 503

        content = file_processor.process_file(file)

        if content:
            logger.info(f"File processed successfully: {file.filename}")
            return jsonify({"content": content}), 200
        else:
            logger.warning(f"No content extracted from file: {file.filename}")
            return jsonify({"error": "Could not extract content from file"}), 400
    except Exception as e:
        logger.error(f"Error processing uploaded file: {e}")
        return jsonify({"error": "Failed to process uploaded file"}), 500

@app.route("/", methods=["GET"])
def hello():
    return "The server is working fine"

def clean_transcript(file_path):
    """Extracts and cleans transcript from a VTT file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except (IOError, OSError) as e:
        logger.error(f"Failed to read transcript file: {e}")
        return ""

    transcript_lines = []
    skip_metadata = True

    for line in lines:
        line = line.strip()

        # Skip metadata lines
        if line.lower().startswith(("kind:", "language:", "webvtt")):
            continue
        
        # Detect timestamps
        if "-->" in line:
            skip_metadata = False
            continue
        
        if not skip_metadata:
            # Remove formatting tags
            line = re.sub(r"<[^>]+>", "", line)
            if line:
                transcript_lines.append(line)

    return " ".join(transcript_lines).strip()

@app.route('/getTranscript', methods=['GET'])
def get_transcript():
    """Get YouTube video transcript with input sanitization."""
    try:
        video_id = request.args.get('videoId', '').strip()
        if not video_id:
            return jsonify({"error": "No video ID provided"}), 400
        
        # Sanitize video ID - YouTube IDs are alphanumeric with hyphens and underscores
        if not re.match(r'^[a-zA-Z0-9_-]{6,20}$', video_id):
            logger.warning(f"Invalid video ID format: {video_id[:30]}")
            return jsonify({"error": "Invalid video ID format"}), 400
        
        # Ensure subtitles directory exists
        subtitles_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "subtitles")
        os.makedirs(subtitles_dir, exist_ok=True)
        
        # Use safe path construction to prevent path traversal
        output_path = os.path.join(subtitles_dir, f"{video_id}.vtt")
        
        try:
            result = subprocess.run(
                ["yt-dlp", "--write-auto-sub", "--sub-lang", "en", "--skip-download",
                 "--sub-format", "vtt", "-o", output_path,
                 f"https://www.youtube.com/watch?v={video_id}"],
                check=True, capture_output=True, text=True, timeout=60
            )
            if result.stdout:
                logger.debug(f"yt-dlp stdout: {result.stdout[:500]}")
            if result.stderr:
                logger.debug(f"yt-dlp stderr: {result.stderr[:500]}")
        except subprocess.TimeoutExpired:
            logger.error(f"Transcript download timed out for video: {video_id}")
            return jsonify({"error": "Transcript download timed out"}), 504
        except subprocess.CalledProcessError as e:
            logger.error(f"yt-dlp failed for video {video_id}: {e.stderr[:200]}")
            return jsonify({"error": "Failed to download transcript"}), 500
        except FileNotFoundError:
            logger.error("yt-dlp is not installed or not in PATH")
            return jsonify({"error": "Transcript service unavailable (yt-dlp not found)"}), 503

        # Find the VTT file for this specific video
        subtitle_files = glob.glob(os.path.join(subtitles_dir, f"{video_id}*.vtt"))
        if not subtitle_files:
            logger.warning(f"No subtitles found for video: {video_id}")
            return jsonify({"error": "No subtitles found for this video"}), 404

        latest_subtitle = max(subtitle_files, key=os.path.getctime)
        
        # Ensure the file is within the subtitles directory (path traversal prevention)
        if not os.path.abspath(latest_subtitle).startswith(os.path.abspath(subtitles_dir)):
            logger.error("Path traversal attempt detected in subtitle file")
            return jsonify({"error": "Security error"}), 403
        
        transcript_text = clean_transcript(latest_subtitle)

        # Clean up the file after reading
        try:
            os.remove(latest_subtitle)
        except OSError as e:
            logger.warning(f"Failed to clean up subtitle file: {e}")

        if not transcript_text:
            return jsonify({"error": "Could not extract transcript text"}), 404

        return jsonify({"transcript": transcript_text}), 200
    except Exception as e:
        logger.error(f"Error in get_transcript: {e}")
        return jsonify({"error": "Failed to get transcript"}), 500

if __name__ == "__main__":
    subtitles_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "subtitles")
    os.makedirs(subtitles_dir, exist_ok=True)
    logger.info("Starting EduAid backend server")
    app.run()
