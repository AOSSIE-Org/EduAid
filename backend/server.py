from __future__ import annotations

import glob
import os
import random
import re
import subprocess
from typing import Any, Dict, List, Optional

from flask import Flask, current_app, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

GOOGLE_DOCS_SCOPES = ["https://www.googleapis.com/auth/documents.readonly"]
GOOGLE_FORMS_SCOPES = "https://www.googleapis.com/auth/forms.body"
GOOGLE_FORMS_DISCOVERY_DOC = "https://forms.googleapis.com/$discovery/rest?version=v1"
DEFAULT_MAX_QUESTIONS = 4
MAX_QUESTION_LIMIT = 25
ALLOWED_UPLOAD_EXTENSIONS = {"txt", "pdf", "docx"}


class InvalidRequest(Exception):
    """Raised when a request payload is malformed."""


class ServiceUnavailable(Exception):
    """Raised when an optional integration or model is not available."""


class ServiceRegistry:
    """Lazily initializes heavyweight services the first time they are used."""

    def __init__(self, service_overrides: Optional[Dict[str, Any]] = None):
        self._overrides = service_overrides or {}
        self._instances: Dict[str, Any] = {}
        self._shared: Dict[str, Any] = {}

    def get(self, name: str) -> Any:
        if name in self._overrides:
            return self._overrides[name]

        if name not in self._instances:
            builder = getattr(self, f"_build_{name}", None)
            if builder is None:
                raise KeyError(f"Unknown service '{name}'")
            try:
                self._instances[name] = builder()
            except (ImportError, FileNotFoundError, OSError) as exc:
                raise ServiceUnavailable(
                    f"Required service '{name}' is unavailable: {exc}"
                ) from exc

        return self._instances[name]

    def _ensure_nltk(self) -> None:
        if self._shared.get("nltk_ready"):
            return

        import nltk

        nltk.download("stopwords", quiet=True)
        nltk.download("punkt_tab", quiet=True)
        self._shared["nltk_ready"] = True

    def _get_generator_main(self):
        if "generator_main" not in self._shared:
            self._ensure_nltk()
            from Generator import main as generator_main

            self._shared["generator_main"] = generator_main
        return self._shared["generator_main"]

    def _build_mcq_generator(self):
        return self._get_generator_main().MCQGenerator()

    def _build_answer_predictor(self):
        return self._get_generator_main().AnswerPredictor()

    def _build_boolq_generator(self):
        return self._get_generator_main().BoolQGenerator()

    def _build_shortq_generator(self):
        return self._get_generator_main().ShortQGenerator()

    def _build_question_generator(self):
        return self._get_generator_main().QuestionGenerator()

    def _build_google_docs_service(self):
        service_account_file = current_app.config["SERVICE_ACCOUNT_FILE"]
        if not os.path.exists(service_account_file):
            return None
        return self._get_generator_main().GoogleDocsService(
            service_account_file, GOOGLE_DOCS_SCOPES
        )

    def _build_file_processor(self):
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        return self._get_generator_main().FileProcessor(upload_folder=upload_folder)

    def _build_mediawiki(self):
        from mediawikiapi import MediaWikiAPI

        return MediaWikiAPI()

    def _build_qa_model(self):
        from transformers import pipeline

        return pipeline("question-answering")

    def _build_llm_generator(self):
        from Generator.llm_generator import LLMQuestionGenerator

        return LLMQuestionGenerator()

    def _build_make_question_harder(self):
        from Generator.question_filters import make_question_harder

        return make_question_harder

    def _build_forms_service(self):
        client_secrets_file = current_app.config["CLIENT_SECRETS_FILE"]
        token_file = current_app.config["FORMS_TOKEN_FILE"]

        if not os.path.exists(client_secrets_file):
            return None

        from apiclient import discovery
        from httplib2 import Http
        from oauth2client import client, file, tools

        store = file.Storage(token_file)
        creds = store.get()

        if not creds or creds.invalid:
            flow = client.flow_from_clientsecrets(
                client_secrets_file, GOOGLE_FORMS_SCOPES
            )
            creds = tools.run_flow(flow, store)

        return discovery.build(
            "forms",
            "v1",
            http=creds.authorize(Http()),
            discoveryServiceUrl=GOOGLE_FORMS_DISCOVERY_DOC,
            static_discovery=False,
        )


def _get_registry() -> ServiceRegistry:
    return current_app.extensions["eduaid_services"]


def _get_service(name: str) -> Any:
    return _get_registry().get(name)


def _get_json_payload() -> Dict[str, Any]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise InvalidRequest("Expected a JSON object in the request body.")
    return data


def _coerce_question_count(value: Any, default: int = DEFAULT_MAX_QUESTIONS) -> int:
    if value in (None, ""):
        return default

    try:
        count = int(value)
    except (TypeError, ValueError) as exc:
        raise InvalidRequest("Question count must be an integer.") from exc

    if count < 1:
        raise InvalidRequest("Question count must be at least 1.")

    return min(count, MAX_QUESTION_LIMIT)


def _coerce_flag(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def _require_text(value: Any, field_name: str = "input_text") -> str:
    text = (value or "").strip()
    if not text:
        raise InvalidRequest(f"'{field_name}' is required.")
    return text


def _require_list(value: Any, field_name: str) -> List[Any]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise InvalidRequest(f"'{field_name}' must be a list.")
    return value


def _normalize_mcq_choices(qapair: Dict[str, Any]) -> List[str]:
    options = [option for option in qapair.get("options", []) if option]
    answer = qapair.get("answer")

    if isinstance(answer, list):
        correct_answer = next(
            (item.get("answer") for item in answer if item.get("correct")),
            None,
        )
        distractors = [
            item.get("answer") for item in answer if item.get("answer") and not item.get("correct")
        ]
        answer = correct_answer
        options = distractors or options

    combined: List[str] = []
    for choice in [answer, *options]:
        if choice and choice not in combined:
            combined.append(choice)

    random.shuffle(combined)
    return combined


def _infer_form_question_type(question_type: str, qapair: Dict[str, Any]) -> str:
    normalized_question_type = (question_type or "").strip().lower()
    pair_question_type = (qapair.get("question_type") or "").strip().lower()

    if normalized_question_type == "get_boolq" or "boolean" in pair_question_type:
        return "boolean"

    answer = qapair.get("answer")
    if (
        normalized_question_type == "get_mcq"
        or pair_question_type.startswith("mcq")
        or qapair.get("options")
        or isinstance(answer, list)
    ):
        return "mcq"

    return "short"


def _build_form_requests(qa_pairs: List[Dict[str, Any]], question_type: str) -> List[Dict[str, Any]]:
    requests_list: List[Dict[str, Any]] = []

    for index, qapair in enumerate(qa_pairs):
        question = (qapair.get("question") or "").strip()
        if not question:
            continue

        form_question_type = _infer_form_question_type(question_type, qapair)
        question_config: Dict[str, Any] = {"required": True}

        if form_question_type == "mcq":
            choices = _normalize_mcq_choices(qapair)
            if not choices:
                continue
            question_config["choiceQuestion"] = {
                "type": "RADIO",
                "options": [{"value": choice} for choice in choices],
            }
        elif form_question_type == "boolean":
            question_config["choiceQuestion"] = {
                "type": "RADIO",
                "options": [{"value": "True"}, {"value": "False"}],
            }
        else:
            question_config["textQuestion"] = {}

        requests_list.append(
            {
                "createItem": {
                    "item": {
                        "title": question,
                        "questionItem": {"question": question_config},
                    },
                    "location": {"index": index},
                }
            }
        )

    return requests_list


def _process_input_text(input_text: str, use_mediawiki: Any) -> str:
    text = _require_text(input_text)

    if _coerce_flag(use_mediawiki):
        try:
            mediawiki = _get_service("mediawiki")
            summary = mediawiki.summary(text, 8)
        except Exception as exc:
            raise InvalidRequest("Unable to fetch MediaWiki content for the supplied topic.") from exc

        text = (summary or "").strip()
        if not text:
            raise InvalidRequest("MediaWiki did not return any content for the supplied topic.")

    return text


def _normalize_problem_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized_items: List[Dict[str, Any]] = []
    for item in items or []:
        normalized = dict(item)
        if normalized.get("type") == "mcq" and "correct_answer" not in normalized:
            normalized["correct_answer"] = normalized.get("answer")
        normalized_items.append(normalized)
    return normalized_items


def clean_transcript(file_path: str) -> str:
    """Extract and clean transcript text from a VTT file."""
    with open(file_path, "r", encoding="utf-8") as file:
        lines = file.readlines()

    transcript_lines = []
    skip_metadata = True

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        if line.lower().startswith(("kind:", "language:", "webvtt")):
            continue
        if "-->" in line:
            skip_metadata = False
            continue
        if skip_metadata:
            continue

        line = re.sub(r"<[^>]+>", "", line)
        transcript_lines.append(line)

    return " ".join(transcript_lines).strip()


def create_app(service_overrides: Optional[Dict[str, Any]] = None) -> Flask:
    app = Flask(__name__)
    CORS(app)
    app.config.update(
        SERVICE_ACCOUNT_FILE=os.getenv("EDUAID_SERVICE_ACCOUNT_FILE", "./service_account_key.json"),
        CLIENT_SECRETS_FILE=os.getenv("EDUAID_CLIENT_SECRETS_FILE", "credentials.json"),
        FORMS_TOKEN_FILE=os.getenv("EDUAID_FORMS_TOKEN_FILE", "token.json"),
        UPLOAD_FOLDER=os.getenv("EDUAID_UPLOAD_FOLDER", "uploads"),
        SUBTITLES_FOLDER=os.getenv("EDUAID_SUBTITLES_FOLDER", "subtitles"),
    )
    app.extensions["eduaid_services"] = ServiceRegistry(service_overrides)

    @app.errorhandler(InvalidRequest)
    def handle_invalid_request(error: InvalidRequest):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(ServiceUnavailable)
    def handle_service_unavailable(error: ServiceUnavailable):
        return jsonify({"error": str(error)}), 503

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify(
            {
                "status": "ok",
                "google_docs_configured": os.path.exists(app.config["SERVICE_ACCOUNT_FILE"]),
                "google_forms_configured": os.path.exists(app.config["CLIENT_SECRETS_FILE"]),
            }
        )

    @app.route("/get_mcq", methods=["POST"])
    def get_mcq():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        output = _get_service("mcq_generator").generate_mcq(
            {"input_text": input_text, "max_questions": max_questions}
        ) or {}
        return jsonify({"output": output.get("questions", [])})

    @app.route("/get_boolq", methods=["POST"])
    def get_boolq():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        output = _get_service("boolq_generator").generate_boolq(
            {"input_text": input_text, "max_questions": max_questions}
        ) or {}
        return jsonify({"output": output.get("Boolean_Questions", [])})

    @app.route("/get_shortq", methods=["POST"])
    def get_shortq():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        output = _get_service("shortq_generator").generate_shortq(
            {"input_text": input_text, "max_questions": max_questions}
        ) or {}
        return jsonify({"output": output.get("questions", [])})

    @app.route("/get_shortq_llm", methods=["POST"])
    def get_shortq_llm():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        questions = _get_service("llm_generator").generate_short_questions(
            input_text, max_questions
        )
        return jsonify({"output": questions})

    @app.route("/get_mcq_llm", methods=["POST"])
    def get_mcq_llm():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        questions = _get_service("llm_generator").generate_mcq_questions(
            input_text, max_questions
        )
        return jsonify({"output": questions})

    @app.route("/get_boolq_llm", methods=["POST"])
    def get_boolq_llm():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        questions = _get_service("llm_generator").generate_boolean_questions(
            input_text, max_questions
        )
        return jsonify({"output": questions})

    @app.route("/get_problems_llm", methods=["POST"])
    def get_problems_llm():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        questions = _get_service("llm_generator").generate_all_questions(
            input_text,
            _coerce_question_count(data.get("max_questions_mcq"), 2),
            _coerce_question_count(data.get("max_questions_boolq"), 2),
            _coerce_question_count(data.get("max_questions_shortq"), 2),
        )
        return jsonify({"output": _normalize_problem_items(questions)})

    @app.route("/get_problems", methods=["POST"])
    def get_problems():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )

        output_mcq = _get_service("mcq_generator").generate_mcq(
            {
                "input_text": input_text,
                "max_questions": _coerce_question_count(data.get("max_questions_mcq")),
            }
        ) or {}
        output_boolq = _get_service("boolq_generator").generate_boolq(
            {
                "input_text": input_text,
                "max_questions": _coerce_question_count(data.get("max_questions_boolq")),
            }
        ) or {}
        output_shortq = _get_service("shortq_generator").generate_shortq(
            {
                "input_text": input_text,
                "max_questions": _coerce_question_count(data.get("max_questions_shortq")),
            }
        ) or {}

        return jsonify(
            {
                "output_mcq": output_mcq,
                "output_boolq": output_boolq,
                "output_shortq": output_shortq,
            }
        )

    @app.route("/get_mcq_answer", methods=["POST"])
    def get_mcq_answer():
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        data = _get_json_payload()
        input_text = _require_text(data.get("input_text", ""))
        input_questions = _require_list(data.get("input_question"), "input_question")
        input_options = _require_list(data.get("input_options"), "input_options")

        if not input_questions or not input_options or len(input_questions) != len(input_options):
            raise InvalidRequest(
                "'input_question' and 'input_options' must be non-empty lists of the same length."
            )

        qa_model = _get_service("qa_model")
        outputs = []

        for question, options in zip(input_questions, input_options):
            if not options:
                outputs.append("")
                continue

            qa_response = qa_model(question=question, context=input_text)
            generated_answer = qa_response["answer"]

            vectorizer = TfidfVectorizer().fit_transform([*options, generated_answer])
            vectors = vectorizer.toarray()
            generated_answer_vector = vectors[-1].reshape(1, -1)
            similarities = cosine_similarity(
                vectors[:-1], generated_answer_vector
            ).flatten()
            best_option = options[similarities.argmax()]
            outputs.append(best_option)

        return jsonify({"output": outputs})

    @app.route("/get_shortq_answer", methods=["POST"])
    def get_shortq_answer():
        data = _get_json_payload()
        input_text = _require_text(data.get("input_text", ""))
        input_questions = _require_list(data.get("input_question"), "input_question")
        qa_model = _get_service("qa_model")

        answers = []
        for question in input_questions:
            qa_response = qa_model(question=question, context=input_text)
            answers.append(qa_response["answer"])

        return jsonify({"output": answers})

    @app.route("/get_boolean_answer", methods=["POST"])
    def get_boolean_answer():
        data = _get_json_payload()
        input_text = _require_text(data.get("input_text", ""))
        input_questions = _require_list(data.get("input_question"), "input_question")

        if not input_questions:
            raise InvalidRequest("'input_question' must contain at least one question.")

        predictions = _get_service("answer_predictor").predict_boolean_answer(
            {"input_text": input_text, "input_question": input_questions}
        )
        output = ["True" if prediction else "False" for prediction in predictions]

        return jsonify({"output": output})

    @app.route("/get_content", methods=["POST"])
    def get_content():
        data = _get_json_payload()
        document_url = _require_text(data.get("document_url", ""), "document_url")
        docs_service = _get_service("google_docs_service")

        if docs_service is None:
            raise ServiceUnavailable(
                "Google Docs integration is not configured. Set EDUAID_SERVICE_ACCOUNT_FILE to a valid service account key."
            )

        text = docs_service.get_document_content(document_url)
        return jsonify(text)

    @app.route("/generate_gform", methods=["POST"])
    def generate_gform():
        data = _get_json_payload()
        qa_pairs = _require_list(data.get("qa_pairs"), "qa_pairs")
        question_type = (data.get("question_type") or "").strip()
        requests_list = _build_form_requests(qa_pairs, question_type)

        if not requests_list:
            raise InvalidRequest("No valid questions were provided to generate a form.")

        form_service = _get_service("forms_service")
        if form_service is None:
            raise ServiceUnavailable(
                "Google Forms integration is not configured. Add the client secrets file configured by EDUAID_CLIENT_SECRETS_FILE."
            )

        result = form_service.forms().create(body={"info": {"title": "EduAid form"}}).execute()
        form_service.forms().batchUpdate(
            formId=result["formId"], body={"requests": requests_list}
        ).execute()

        return jsonify(
            {
                "form_link": result["responderUri"],
                "edit_link": f"https://docs.google.com/forms/d/{result['formId']}/edit",
                "form_id": result["formId"],
            }
        )

    @app.route("/get_shortq_hard", methods=["POST"])
    def get_shortq_hard():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        qg = _get_service("question_generator")
        harder = _get_service("make_question_harder")

        output = qg.generate(article=input_text, answer_style="sentences")[:max_questions]
        for item in output:
            item["question"] = harder(item.get("question", ""))

        return jsonify({"output": output})

    @app.route("/get_mcq_hard", methods=["POST"])
    def get_mcq_hard():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        qg = _get_service("question_generator")
        harder = _get_service("make_question_harder")

        output = qg.generate(article=input_text, answer_style="multiple_choice")[
            :max_questions
        ]
        for item in output:
            item["question"] = harder(item.get("question", ""))

        return jsonify({"output": output})

    @app.route("/get_boolq_hard", methods=["POST"])
    def get_boolq_hard():
        data = _get_json_payload()
        input_text = _process_input_text(
            data.get("input_text", ""), data.get("use_mediawiki", 0)
        )
        max_questions = _coerce_question_count(data.get("max_questions"))
        harder = _get_service("make_question_harder")
        generated = _get_service("boolq_generator").generate_boolq(
            {"input_text": input_text, "max_questions": max_questions}
        ) or {}
        harder_questions = [
            harder(question)
            for question in generated.get("Boolean_Questions", [])[:max_questions]
        ]
        return jsonify({"output": harder_questions})

    @app.route("/upload", methods=["POST"])
    def upload_file():
        uploaded_file = request.files.get("file")
        if uploaded_file is None:
            raise InvalidRequest("No file was uploaded.")

        filename = secure_filename(uploaded_file.filename or "")
        if not filename:
            raise InvalidRequest("No file was selected.")

        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if extension not in ALLOWED_UPLOAD_EXTENSIONS:
            raise InvalidRequest(
                "Unsupported file type. Supported extensions are: txt, pdf, docx."
            )

        uploaded_file.filename = filename
        content = _get_service("file_processor").process_file(uploaded_file)
        if not content:
            raise InvalidRequest("No readable content could be extracted from the uploaded file.")

        return jsonify({"content": content})

    @app.route("/", methods=["GET"])
    def hello():
        return "The server is working fine"

    @app.route("/getTranscript", methods=["GET"])
    def get_transcript():
        video_id = (request.args.get("videoId") or "").strip()
        if not video_id:
            raise InvalidRequest("No video ID provided.")
        if not re.fullmatch(r"[A-Za-z0-9_-]{6,20}", video_id):
            raise InvalidRequest("Invalid video ID.")

        subtitles_folder = current_app.config["SUBTITLES_FOLDER"]
        os.makedirs(subtitles_folder, exist_ok=True)

        output_template = os.path.join(subtitles_folder, f"{video_id}.%(ext)s")
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"

        try:
            subprocess.run(
                [
                    "yt-dlp",
                    "--write-auto-sub",
                    "--sub-lang",
                    "en",
                    "--skip-download",
                    "--sub-format",
                    "vtt",
                    "-o",
                    output_template,
                    youtube_url,
                ],
                check=True,
                capture_output=True,
                text=True,
            )
        except FileNotFoundError as exc:
            raise ServiceUnavailable(
                "yt-dlp is not installed, so transcript fetching is unavailable."
            ) from exc
        except subprocess.CalledProcessError as exc:
            current_app.logger.exception("Failed to download subtitles for %s", video_id)
            return jsonify({"error": exc.stderr or "Failed to download subtitles."}), 502

        subtitle_files = glob.glob(os.path.join(subtitles_folder, f"{video_id}*.vtt"))
        if not subtitle_files:
            return jsonify({"error": "No subtitles found"}), 404

        latest_subtitle = max(subtitle_files, key=os.path.getctime)
        transcript_text = clean_transcript(latest_subtitle)

        for subtitle_file in subtitle_files:
            try:
                os.remove(subtitle_file)
            except OSError:
                current_app.logger.warning("Failed to remove subtitle file %s", subtitle_file)

        return jsonify({"transcript": transcript_text})

    return app


app = create_app()


if __name__ == "__main__":
    os.makedirs(app.config["SUBTITLES_FOLDER"], exist_ok=True)
    app.run()
