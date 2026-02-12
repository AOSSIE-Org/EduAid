"""Comprehensive test suite for the EduAid backend API.

Uses **pytest** and Flask's built-in test client — no running server or GPU
required.  All heavy ML models are mocked in ``conftest.py``.

Coverage:
  - Every API endpoint with valid input
  - Every endpoint with invalid / missing input
  - Edge cases (unicode, special characters, very long text, emoji)
  - File upload with various file types
  - HTTP-method enforcement
  - Boundary-value validation for ``max_questions``
"""

import io

import pytest

# ---------------------------------------------------------------------------
# Shared test data
# ---------------------------------------------------------------------------

SAMPLE_TEXT = (
    "Artificial intelligence (AI) is the simulation of human intelligence "
    "processes by machines, especially computer systems. These processes "
    "include learning, reasoning, and self-correction. AI applications "
    "include speech recognition, natural language processing, machine "
    "vision, expert systems, and robotics. Machine learning is a subset "
    "of AI that focuses on algorithms that learn from data."
)

UNICODE_TEXT = (
    "L'intelligence artificielle (IA) est la simulation de l'intelligence "
    "humaine. Les réseaux de neurones profonds ont révolutionné le domaine. "
    "日本語のテキストも含まれています。Ñoño también funciona. "
    "Ελληνικά и Кириллица тоже работают."
)

SPECIAL_CHARS_TEXT = (
    "AI uses algorithms & data structures. It's based on math: "
    "f(x) = Σ(wi * xi) + b. Special chars: <html>, 'quotes', "
    '"double quotes", $dollars$, @mentions, #hashtags, and more!'
)


# ===========================================================================
# Root Endpoint
# ===========================================================================


class TestRootEndpoint:
    """GET /"""

    def test_returns_200(self, client):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_returns_expected_message(self, client):
        resp = client.get("/")
        assert b"The server is working fine" in resp.data

    def test_post_not_allowed(self, client):
        resp = client.post("/")
        assert resp.status_code == 405


# ===========================================================================
# MCQ Endpoint
# ===========================================================================


class TestGetMCQ:
    """POST /get_mcq"""

    def test_valid_request(self, client, mock_mcq_gen):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 3}
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        mock_mcq_gen.generate_mcq.assert_called()

    def test_default_max_questions(self, client, mock_mcq_gen):
        """Omitting max_questions should default to 4."""
        resp = client.post("/get_mcq", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 200
        call_args = mock_mcq_gen.generate_mcq.call_args[0][0]
        assert call_args["max_questions"] == 4

    def test_empty_input_text(self, client):
        resp = client.post("/get_mcq", json={"input_text": ""})
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_missing_input_text(self, client):
        resp = client.post("/get_mcq", json={})
        assert resp.status_code == 400

    def test_whitespace_only_input(self, client):
        resp = client.post("/get_mcq", json={"input_text": "   \n\t  "})
        assert resp.status_code == 400

    def test_input_text_too_long(self, client):
        resp = client.post("/get_mcq", json={"input_text": "A" * 50_001})
        assert resp.status_code == 400
        assert "exceeds maximum length" in resp.get_json()["error"]

    def test_input_text_at_max_length(self, client):
        resp = client.post("/get_mcq", json={"input_text": "A" * 50_000})
        assert resp.status_code == 200

    def test_max_questions_clamped_high(self, client, mock_mcq_gen):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 100}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] <= 20

    def test_max_questions_clamped_low(self, client, mock_mcq_gen):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": -5}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] >= 1

    def test_max_questions_zero(self, client, mock_mcq_gen):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 0}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] >= 1

    def test_max_questions_non_integer_string(self, client):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": "abc"}
        )
        assert resp.status_code == 200  # falls back to default

    def test_input_text_not_string(self, client):
        resp = client.post("/get_mcq", json={"input_text": 12345})
        assert resp.status_code == 400

    def test_input_text_is_null(self, client):
        resp = client.post("/get_mcq", json={"input_text": None})
        assert resp.status_code == 400

    def test_unicode_input(self, client):
        resp = client.post("/get_mcq", json={"input_text": UNICODE_TEXT})
        assert resp.status_code == 200

    def test_special_characters(self, client):
        resp = client.post("/get_mcq", json={"input_text": SPECIAL_CHARS_TEXT})
        assert resp.status_code == 200

    def test_with_mediawiki_flag(self, client, mock_mediawiki):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1}
        )
        assert resp.status_code == 200
        mock_mediawiki.summary.assert_called()

    def test_generator_exception_returns_500(self, client, mock_mcq_gen):
        mock_mcq_gen.generate_mcq.side_effect = RuntimeError("Model crash")
        resp = client.post("/get_mcq", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 500
        assert "error" in resp.get_json()

    def test_no_json_body(self, client):
        resp = client.post("/get_mcq", data="raw text", content_type="text/plain")
        assert resp.status_code == 400

    def test_get_method_not_allowed(self, client):
        resp = client.get("/get_mcq")
        assert resp.status_code == 405


# ===========================================================================
# Boolean Question Endpoint
# ===========================================================================


class TestGetBoolQ:
    """POST /get_boolq"""

    def test_valid_request(self, client):
        resp = client.post(
            "/get_boolq", json={"input_text": SAMPLE_TEXT, "max_questions": 3}
        )
        assert resp.status_code == 200
        assert "output" in resp.get_json()

    def test_empty_input_text(self, client):
        resp = client.post("/get_boolq", json={"input_text": ""})
        assert resp.status_code == 400

    def test_missing_input_text(self, client):
        resp = client.post("/get_boolq", json={})
        assert resp.status_code == 400

    def test_input_text_too_long(self, client):
        resp = client.post("/get_boolq", json={"input_text": "B" * 50_001})
        assert resp.status_code == 400

    def test_unicode_input(self, client):
        resp = client.post("/get_boolq", json={"input_text": UNICODE_TEXT})
        assert resp.status_code == 200

    def test_generator_exception_returns_500(self, client, mock_boolq_gen):
        mock_boolq_gen.generate_boolq.side_effect = RuntimeError("Model crash")
        resp = client.post("/get_boolq", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ===========================================================================
# Short Question Endpoint
# ===========================================================================


class TestGetShortQ:
    """POST /get_shortq"""

    def test_valid_request(self, client):
        resp = client.post(
            "/get_shortq", json={"input_text": SAMPLE_TEXT, "max_questions": 4}
        )
        assert resp.status_code == 200
        assert "output" in resp.get_json()

    def test_empty_input_text(self, client):
        resp = client.post("/get_shortq", json={"input_text": ""})
        assert resp.status_code == 400

    def test_missing_input_text(self, client):
        resp = client.post("/get_shortq", json={})
        assert resp.status_code == 400

    def test_input_text_too_long(self, client):
        resp = client.post("/get_shortq", json={"input_text": "C" * 50_001})
        assert resp.status_code == 400

    def test_generator_exception_returns_500(self, client, mock_shortq_gen):
        mock_shortq_gen.generate_shortq.side_effect = RuntimeError("Model crash")
        resp = client.post("/get_shortq", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ===========================================================================
# Combined Problems Endpoint
# ===========================================================================


class TestGetProblems:
    """POST /get_problems"""

    def test_valid_request(self, client):
        resp = client.post(
            "/get_problems",
            json={
                "input_text": SAMPLE_TEXT,
                "max_questions_mcq": 3,
                "max_questions_boolq": 2,
                "max_questions_shortq": 4,
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output_mcq" in data
        assert "output_boolq" in data
        assert "output_shortq" in data

    def test_empty_input_text(self, client):
        resp = client.post("/get_problems", json={"input_text": ""})
        assert resp.status_code == 400

    def test_missing_input_text(self, client):
        resp = client.post("/get_problems", json={})
        assert resp.status_code == 400

    def test_defaults_for_missing_max_questions(self, client):
        resp = client.post("/get_problems", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 200

    def test_generator_exception_returns_500(self, client, mock_mcq_gen):
        mock_mcq_gen.generate_mcq.side_effect = RuntimeError("Model crash")
        resp = client.post("/get_problems", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ===========================================================================
# MCQ Answer Endpoint
# ===========================================================================


class TestGetMCQAnswer:
    """POST /get_mcq_answer"""

    def test_valid_request(self, client):
        resp = client.post(
            "/get_mcq_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["What is AI?"],
                "input_options": [
                    ["simulation", "a robot", "a car", "a planet"]
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert len(data["output"]) == 1

    def test_empty_questions_returns_empty(self, client):
        resp = client.post(
            "/get_mcq_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": [],
                "input_options": [],
            },
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_mismatched_questions_and_options_count(self, client):
        resp = client.post(
            "/get_mcq_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["Q1?", "Q2?"],
                "input_options": [["A", "B"]],
            },
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_missing_questions_key(self, client):
        resp = client.post(
            "/get_mcq_answer",
            json={"input_text": SAMPLE_TEXT, "input_options": [["A", "B"]]},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_missing_options_key(self, client):
        resp = client.post(
            "/get_mcq_answer",
            json={"input_text": SAMPLE_TEXT, "input_question": ["Q?"]},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_empty_input_text(self, client):
        resp = client.post(
            "/get_mcq_answer",
            json={
                "input_text": "",
                "input_question": ["Q?"],
                "input_options": [["A", "B"]],
            },
        )
        assert resp.status_code == 400

    def test_empty_options_for_question(self, client):
        """When options list for a specific question is empty, append empty."""
        resp = client.post(
            "/get_mcq_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["Q?"],
                "input_options": [[]],
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["output"][0] == ""


# ===========================================================================
# Short Question Answer Endpoint
# ===========================================================================


class TestGetShortQAnswer:
    """POST /get_shortq_answer"""

    def test_valid_request(self, client):
        resp = client.post(
            "/get_shortq_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["What is AI?"],
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "output" in data
        assert len(data["output"]) == 1

    def test_multiple_questions(self, client):
        resp = client.post(
            "/get_shortq_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": [
                    "What is AI?",
                    "What is ML?",
                    "What is deep learning?",
                ],
            },
        )
        assert resp.status_code == 200
        assert len(resp.get_json()["output"]) == 3

    def test_empty_questions_returns_empty(self, client):
        resp = client.post(
            "/get_shortq_answer",
            json={"input_text": SAMPLE_TEXT, "input_question": []},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_missing_questions_returns_empty(self, client):
        resp = client.post(
            "/get_shortq_answer", json={"input_text": SAMPLE_TEXT}
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_empty_input_text(self, client):
        resp = client.post(
            "/get_shortq_answer",
            json={"input_text": "", "input_question": ["Q?"]},
        )
        assert resp.status_code == 400

    def test_pipeline_exception_returns_500(self, client, mock_qa_pipeline):
        mock_qa_pipeline.side_effect = RuntimeError("Pipeline crash")
        resp = client.post(
            "/get_shortq_answer",
            json={"input_text": SAMPLE_TEXT, "input_question": ["Q?"]},
        )
        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ===========================================================================
# Boolean Answer Endpoint
# ===========================================================================


class TestGetBooleanAnswer:
    """POST /get_boolean_answer"""

    def test_valid_request_true(self, client, mock_answer_predictor):
        mock_answer_predictor.predict_boolean_answer.return_value = [True]
        resp = client.post(
            "/get_boolean_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["AI simulates human intelligence."],
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["output"] == ["True"]

    def test_valid_request_false(self, client, mock_answer_predictor):
        mock_answer_predictor.predict_boolean_answer.return_value = [False]
        resp = client.post(
            "/get_boolean_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["The earth is flat."],
            },
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == ["False"]

    def test_empty_questions_returns_empty(self, client):
        resp = client.post(
            "/get_boolean_answer",
            json={"input_text": SAMPLE_TEXT, "input_question": []},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_empty_input_text(self, client):
        resp = client.post(
            "/get_boolean_answer",
            json={"input_text": "", "input_question": ["Statement"]},
        )
        assert resp.status_code == 400

    def test_predictor_exception_returns_500(self, client, mock_answer_predictor):
        mock_answer_predictor.predict_boolean_answer.side_effect = RuntimeError(
            "Crash"
        )
        resp = client.post(
            "/get_boolean_answer",
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["Statement"],
            },
        )
        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ===========================================================================
# Hard Question Endpoints
# ===========================================================================


class TestHardQuestionEndpoints:
    """POST /get_shortq_hard, /get_mcq_hard, /get_boolq_hard"""

    HARD_ENDPOINTS = ["/get_shortq_hard", "/get_mcq_hard", "/get_boolq_hard"]

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_valid_request(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 200
        assert "output" in resp.get_json()

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_empty_input_text(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": ""})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_missing_input_text(self, client, endpoint):
        resp = client.post(endpoint, json={})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_input_text_too_long(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": "X" * 50_001})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_with_mediawiki(self, client, endpoint, mock_mediawiki):
        resp = client.post(
            endpoint, json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1}
        )
        assert resp.status_code == 200
        mock_mediawiki.summary.assert_called()

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_with_input_questions(self, client, endpoint, mock_question_generator):
        resp = client.post(
            endpoint,
            json={
                "input_text": SAMPLE_TEXT,
                "input_question": ["Q1?", "Q2?"],
            },
        )
        assert resp.status_code == 200
        # num_questions should match len(input_question) = 2
        call_kwargs = mock_question_generator.generate.call_args
        assert call_kwargs[1]["num_questions"] == 2

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_generator_exception_returns_500(
        self, client, endpoint, mock_question_generator
    ):
        mock_question_generator.generate.side_effect = RuntimeError("Crash")
        resp = client.post(endpoint, json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ===========================================================================
# File Upload Endpoint
# ===========================================================================


class TestFileUpload:
    """POST /upload"""

    def test_upload_txt_file(self, client):
        data = {"file": (io.BytesIO(b"Hello world content"), "test.txt")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200
        assert "content" in resp.get_json()

    def test_upload_pdf_file(self, client):
        data = {"file": (io.BytesIO(b"%PDF-1.4 fake pdf"), "document.pdf")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200

    def test_upload_docx_file(self, client):
        data = {"file": (io.BytesIO(b"PK\x03\x04 fake docx"), "report.docx")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200

    def test_upload_unsupported_html(self, client):
        data = {"file": (io.BytesIO(b"<html>hi</html>"), "page.html")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "Unsupported file type" in resp.get_json()["error"]

    def test_upload_unsupported_exe(self, client):
        data = {"file": (io.BytesIO(b"\x00\x00"), "malware.exe")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400

    def test_upload_unsupported_py(self, client):
        data = {"file": (io.BytesIO(b"print('hi')"), "script.py")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400

    def test_no_file_part(self, client):
        resp = client.post("/upload", data={}, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "No file part" in resp.get_json()["error"]

    def test_empty_filename(self, client):
        data = {"file": (io.BytesIO(b"content"), "")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "No file selected" in resp.get_json()["error"]

    def test_processor_returns_empty_content(self, client, mock_file_processor):
        mock_file_processor.process_file.return_value = ""
        data = {"file": (io.BytesIO(b"content"), "empty.txt")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "Could not extract content" in resp.get_json()["error"]

    def test_processor_returns_none(self, client, mock_file_processor):
        mock_file_processor.process_file.return_value = None
        data = {"file": (io.BytesIO(b"content"), "empty.txt")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400

    def test_processor_raises_exception(self, client, mock_file_processor):
        mock_file_processor.process_file.side_effect = RuntimeError("Parse error")
        data = {"file": (io.BytesIO(b"content"), "test.txt")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ===========================================================================
# Transcript Endpoint
# ===========================================================================


class TestGetTranscript:
    """GET /getTranscript"""

    def test_missing_video_id(self, client):
        resp = client.get("/getTranscript")
        assert resp.status_code == 400
        assert "No video ID" in resp.get_json()["error"]

    def test_empty_video_id(self, client):
        resp = client.get("/getTranscript?videoId=")
        assert resp.status_code == 400

    def test_invalid_video_id_special_chars(self, client):
        resp = client.get("/getTranscript?videoId=invalid!@#$")
        assert resp.status_code == 400
        assert "Invalid video ID" in resp.get_json()["error"]

    def test_video_id_too_short(self, client):
        resp = client.get("/getTranscript?videoId=abc")
        assert resp.status_code == 400

    def test_video_id_too_long(self, client):
        resp = client.get("/getTranscript?videoId=abcdefghijklmno")
        assert resp.status_code == 400

    def test_post_method_not_allowed(self, client):
        resp = client.post("/getTranscript")
        assert resp.status_code == 405


# ===========================================================================
# Google Docs Content Endpoint
# ===========================================================================


class TestGetContent:
    """POST /get_content

    Note: In tests ``docs_service`` is a MagicMock (not ``None``), so the
    service-unavailable branch (503) is never reached.  All invalid-URL
    scenarios hit the validation logic and return 400.
    """

    def test_missing_document_url(self, client):
        resp = client.post("/get_content", json={})
        assert resp.status_code == 400

    def test_empty_document_url(self, client):
        resp = client.post("/get_content", json={"document_url": ""})
        assert resp.status_code == 400

    def test_null_document_url(self, client):
        resp = client.post("/get_content", json={"document_url": None})
        assert resp.status_code == 400

    def test_non_string_document_url(self, client):
        resp = client.post("/get_content", json={"document_url": 12345})
        assert resp.status_code == 400

    def test_get_method_not_allowed(self, client):
        resp = client.get("/get_content")
        assert resp.status_code == 405


# ===========================================================================
# Google Forms Endpoint
# ===========================================================================


class TestGenerateGForm:
    """POST /generate_gform"""

    def test_missing_qa_pairs(self, client):
        resp = client.post(
            "/generate_gform", json={"question_type": "get_mcq"}
        )
        assert resp.status_code == 400
        assert "qa_pairs" in resp.get_json()["error"]

    def test_empty_qa_pairs(self, client):
        resp = client.post(
            "/generate_gform",
            json={"qa_pairs": [], "question_type": "get_mcq"},
        )
        assert resp.status_code == 400

    def test_missing_question_type(self, client):
        resp = client.post(
            "/generate_gform",
            json={"qa_pairs": [{"question": "Q?", "answer": "A"}]},
        )
        assert resp.status_code == 400
        assert "question_type" in resp.get_json()["error"]

    def test_empty_question_type(self, client):
        resp = client.post(
            "/generate_gform",
            json={
                "qa_pairs": [{"question": "Q?", "answer": "A"}],
                "question_type": "",
            },
        )
        assert resp.status_code == 400

    def test_qa_pairs_not_list(self, client):
        resp = client.post(
            "/generate_gform",
            json={"qa_pairs": "not a list", "question_type": "get_mcq"},
        )
        assert resp.status_code == 400

    def test_get_method_not_allowed(self, client):
        resp = client.get("/generate_gform")
        assert resp.status_code == 405


# ===========================================================================
# Input Validation (Cross-Cutting)
# ===========================================================================


class TestInputValidation:
    """Cross-cutting validation tests for question-generation endpoints."""

    QUESTION_ENDPOINTS = ["/get_mcq", "/get_boolq", "/get_shortq", "/get_problems"]

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_empty_text_rejected(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": ""})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_null_text_rejected(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": None})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_numeric_text_rejected(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": 42})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_list_text_rejected(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": ["not", "a", "string"]})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_boolean_text_rejected(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": True})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_text_exceeding_max_length(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": "X" * 50_001})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_no_body_at_all(self, client, endpoint):
        resp = client.post(endpoint)
        assert resp.status_code == 400


# ===========================================================================
# Edge Cases
# ===========================================================================


class TestEdgeCases:
    """Unicode, special characters, boundary values, and unusual payloads."""

    QUESTION_ENDPOINTS = ["/get_mcq", "/get_boolq", "/get_shortq"]

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_unicode_text(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": UNICODE_TEXT})
        assert resp.status_code == 200

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_special_characters(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": SPECIAL_CHARS_TEXT})
        assert resp.status_code == 200

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_text_exactly_at_max_length(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": "A" * 50_000})
        assert resp.status_code == 200

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_single_character_text(self, client, endpoint):
        resp = client.post(endpoint, json={"input_text": "A"})
        assert resp.status_code == 200

    def test_emoji_text(self, client):
        text = "AI is powerful 🤖🧠💡 and processes data 📊 for insights 🔍"
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_newlines_and_tabs(self, client):
        text = "AI is important.\n\nIt uses algorithms.\n\tML is a subset of AI."
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_html_in_text(self, client):
        text = "<p>AI is the simulation of <b>human intelligence</b></p>"
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_json_in_text(self, client):
        text = '{"key": "AI is intelligence simulation", "nested": {"v": true}}'
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_repeated_text(self, client):
        text = "AI is intelligence. " * 500
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_max_questions_exact_lower_bound(self, client, mock_mcq_gen):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 1}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] == 1

    def test_max_questions_exact_upper_bound(self, client, mock_mcq_gen):
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 20}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] == 20

    def test_max_questions_float(self, client, mock_mcq_gen):
        """Float max_questions should be truncated to int."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 3.7}
        )
        assert resp.status_code == 200

    def test_form_urlencoded_rejected(self, client):
        resp = client.post(
            "/get_mcq",
            data="input_text=hello",
            content_type="application/x-www-form-urlencoded",
        )
        assert resp.status_code == 400

    def test_extra_fields_ignored(self, client):
        """Extra fields in the payload should not cause errors."""
        resp = client.post(
            "/get_mcq",
            json={
                "input_text": SAMPLE_TEXT,
                "unknown_field": "value",
                "another": 123,
            },
        )
        assert resp.status_code == 200


# ===========================================================================
# HTTP Method Enforcement
# ===========================================================================


class TestHTTPMethods:
    """Ensure every endpoint rejects the wrong HTTP method."""

    POST_ONLY_ENDPOINTS = [
        "/get_mcq",
        "/get_boolq",
        "/get_shortq",
        "/get_problems",
        "/get_mcq_answer",
        "/get_shortq_answer",
        "/get_boolean_answer",
        "/get_content",
        "/generate_gform",
        "/get_shortq_hard",
        "/get_mcq_hard",
        "/get_boolq_hard",
        "/upload",
    ]

    @pytest.mark.parametrize("endpoint", POST_ONLY_ENDPOINTS)
    def test_get_not_allowed_on_post_endpoints(self, client, endpoint):
        resp = client.get(endpoint)
        assert resp.status_code == 405

    def test_post_not_allowed_on_root(self, client):
        resp = client.post("/")
        assert resp.status_code == 405

    def test_post_not_allowed_on_transcript(self, client):
        resp = client.post("/getTranscript")
        assert resp.status_code == 405

    def test_put_not_allowed(self, client):
        resp = client.put("/get_mcq", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 405

    def test_delete_not_allowed(self, client):
        resp = client.delete("/get_mcq")
        assert resp.status_code == 405
