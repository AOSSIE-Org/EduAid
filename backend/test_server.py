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
import subprocess
from typing import ClassVar
from unittest.mock import patch, MagicMock

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
        """Verify the root endpoint returns HTTP 200."""
        resp = client.get("/")
        assert resp.status_code == 200

    def test_returns_expected_message(self, client):
        """Verify the root endpoint returns the health-check message."""
        resp = client.get("/")
        assert b"The server is working fine" in resp.data

    def test_post_not_allowed(self, client):
        """Verify POST is rejected on the GET-only root endpoint."""
        resp = client.post("/")
        assert resp.status_code == 405


# ===========================================================================
# MCQ Endpoint
# ===========================================================================


class TestGetMCQ:
    """POST /get_mcq"""

    def test_valid_request(self, client, mock_mcq_gen):
        """Verify MCQ generation with valid input text and max_questions."""
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
        """Verify empty input_text is rejected with 400."""
        resp = client.post("/get_mcq", json={"input_text": ""})
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_missing_input_text(self, client):
        """Verify missing input_text field is rejected with 400."""
        resp = client.post("/get_mcq", json={})
        assert resp.status_code == 400

    def test_whitespace_only_input(self, client):
        """Verify whitespace-only input_text is rejected with 400."""
        resp = client.post("/get_mcq", json={"input_text": "   \n\t  "})
        assert resp.status_code == 400

    def test_input_text_too_long(self, client):
        """Verify input_text exceeding the maximum length is rejected."""
        resp = client.post("/get_mcq", json={"input_text": "A" * 50_001})
        assert resp.status_code == 400
        assert "exceeds maximum length" in resp.get_json()["error"]

    def test_input_text_at_max_length(self, client):
        """Verify input_text at exactly the maximum length is accepted."""
        resp = client.post("/get_mcq", json={"input_text": "A" * 50_000})
        assert resp.status_code == 200

    def test_max_questions_clamped_high(self, client, mock_mcq_gen):
        """Verify max_questions above the limit is clamped to the maximum."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 100}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] <= 20

    def test_max_questions_clamped_low(self, client, mock_mcq_gen):
        """Verify negative max_questions is clamped to the minimum."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": -5}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] >= 1

    def test_max_questions_zero(self, client, mock_mcq_gen):
        """Verify max_questions of zero is clamped to the minimum."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 0}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] >= 1

    def test_max_questions_non_integer_string(self, client):
        """Verify non-integer string max_questions falls back to default."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": "abc"}
        )
        assert resp.status_code == 200  # falls back to default

    def test_input_text_not_string(self, client):
        """Verify non-string input_text is rejected with 400."""
        resp = client.post("/get_mcq", json={"input_text": 12345})
        assert resp.status_code == 400

    def test_input_text_is_null(self, client):
        """Verify null input_text is rejected with 400."""
        resp = client.post("/get_mcq", json={"input_text": None})
        assert resp.status_code == 400

    def test_unicode_input(self, client):
        """Verify unicode input text is accepted."""
        resp = client.post("/get_mcq", json={"input_text": UNICODE_TEXT})
        assert resp.status_code == 200

    def test_special_characters(self, client):
        """Verify input with special characters is accepted."""
        resp = client.post("/get_mcq", json={"input_text": SPECIAL_CHARS_TEXT})
        assert resp.status_code == 200

    def test_with_mediawiki_flag(self, client, mock_mediawiki):
        """Verify mediawiki expansion is triggered when use_mediawiki is set."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1}
        )
        assert resp.status_code == 200
        mock_mediawiki.summary.assert_called()

    def test_generator_exception_returns_500(self, client, mock_mcq_gen):
        """Verify a generator exception returns a 500 error response."""
        mock_mcq_gen.generate_mcq.side_effect = RuntimeError("Model crash")
        resp = client.post("/get_mcq", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 500
        assert "error" in resp.get_json()

    def test_no_json_body(self, client):
        """Verify sending a non-JSON body returns 400."""
        resp = client.post("/get_mcq", data="raw text", content_type="text/plain")
        assert resp.status_code == 400

    def test_get_method_not_allowed(self, client):
        """Verify GET is rejected on the POST-only MCQ endpoint."""
        resp = client.get("/get_mcq")
        assert resp.status_code == 405


# ===========================================================================
# Boolean Question Endpoint
# ===========================================================================


class TestGetBoolQ:
    """POST /get_boolq"""

    def test_valid_request(self, client):
        """Verify boolean question generation with valid input."""
        resp = client.post(
            "/get_boolq", json={"input_text": SAMPLE_TEXT, "max_questions": 3}
        )
        assert resp.status_code == 200
        assert "output" in resp.get_json()

    def test_empty_input_text(self, client):
        """Verify empty input_text is rejected with 400."""
        resp = client.post("/get_boolq", json={"input_text": ""})
        assert resp.status_code == 400

    def test_missing_input_text(self, client):
        """Verify missing input_text field is rejected with 400."""
        resp = client.post("/get_boolq", json={})
        assert resp.status_code == 400

    def test_input_text_too_long(self, client):
        """Verify input_text exceeding the maximum length is rejected."""
        resp = client.post("/get_boolq", json={"input_text": "B" * 50_001})
        assert resp.status_code == 400

    def test_unicode_input(self, client):
        """Verify unicode input text is accepted."""
        resp = client.post("/get_boolq", json={"input_text": UNICODE_TEXT})
        assert resp.status_code == 200

    def test_generator_exception_returns_500(self, client, mock_boolq_gen):
        """Verify a generator exception returns a 500 error response."""
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
        """Verify short question generation with valid input."""
        resp = client.post(
            "/get_shortq", json={"input_text": SAMPLE_TEXT, "max_questions": 4}
        )
        assert resp.status_code == 200
        assert "output" in resp.get_json()

    def test_empty_input_text(self, client):
        """Verify empty input_text is rejected with 400."""
        resp = client.post("/get_shortq", json={"input_text": ""})
        assert resp.status_code == 400

    def test_missing_input_text(self, client):
        """Verify missing input_text field is rejected with 400."""
        resp = client.post("/get_shortq", json={})
        assert resp.status_code == 400

    def test_input_text_too_long(self, client):
        """Verify input_text exceeding the maximum length is rejected."""
        resp = client.post("/get_shortq", json={"input_text": "C" * 50_001})
        assert resp.status_code == 400

    def test_generator_exception_returns_500(self, client, mock_shortq_gen):
        """Verify a generator exception returns a 500 error response."""
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
        """Verify combined problem generation returns all three question types."""
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
        """Verify empty input_text is rejected with 400."""
        resp = client.post("/get_problems", json={"input_text": ""})
        assert resp.status_code == 400

    def test_missing_input_text(self, client):
        """Verify missing input_text field is rejected with 400."""
        resp = client.post("/get_problems", json={})
        assert resp.status_code == 400

    def test_defaults_for_missing_max_questions(self, client):
        """Verify defaults are applied when max_questions fields are omitted."""
        resp = client.post("/get_problems", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 200

    def test_generator_exception_returns_500(self, client, mock_mcq_gen):
        """Verify a generator exception returns a 500 error response."""
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
        """Verify MCQ answer selection with valid questions and options."""
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
        """Verify empty question list returns an empty output."""
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
        """Verify mismatched question/option counts return an empty output."""
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
        """Verify missing input_question key returns an empty output."""
        resp = client.post(
            "/get_mcq_answer",
            json={"input_text": SAMPLE_TEXT, "input_options": [["A", "B"]]},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_missing_options_key(self, client):
        """Verify missing input_options key returns an empty output."""
        resp = client.post(
            "/get_mcq_answer",
            json={"input_text": SAMPLE_TEXT, "input_question": ["Q?"]},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_empty_input_text(self, client):
        """Verify empty input_text is rejected with 400."""
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
        """Verify short-answer generation with a valid question."""
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
        """Verify answers are generated for multiple questions at once."""
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
        """Verify empty question list returns an empty output."""
        resp = client.post(
            "/get_shortq_answer",
            json={"input_text": SAMPLE_TEXT, "input_question": []},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_missing_questions_returns_empty(self, client):
        """Verify missing input_question key returns an empty output."""
        resp = client.post(
            "/get_shortq_answer", json={"input_text": SAMPLE_TEXT}
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_empty_input_text(self, client):
        """Verify empty input_text is rejected with 400."""
        resp = client.post(
            "/get_shortq_answer",
            json={"input_text": "", "input_question": ["Q?"]},
        )
        assert resp.status_code == 400

    def test_pipeline_exception_returns_500(self, client, mock_qa_pipeline):
        """Verify a QA pipeline exception returns a 500 error response."""
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
        """Verify a true boolean prediction is returned as 'True'."""
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
        """Verify a false boolean prediction is returned as 'False'."""
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
        """Verify empty question list returns an empty output."""
        resp = client.post(
            "/get_boolean_answer",
            json={"input_text": SAMPLE_TEXT, "input_question": []},
        )
        assert resp.status_code == 200
        assert resp.get_json()["output"] == []

    def test_empty_input_text(self, client):
        """Verify empty input_text is rejected with 400."""
        resp = client.post(
            "/get_boolean_answer",
            json={"input_text": "", "input_question": ["Statement"]},
        )
        assert resp.status_code == 400

    def test_predictor_exception_returns_500(self, client, mock_answer_predictor):
        """Verify a predictor exception returns a 500 error response."""
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

    HARD_ENDPOINTS: ClassVar[list[str]] = ["/get_shortq_hard", "/get_mcq_hard", "/get_boolq_hard"]

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_valid_request(self, client, endpoint):
        """Verify hard question generation succeeds for each hard endpoint."""
        resp = client.post(endpoint, json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 200
        assert "output" in resp.get_json()

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_empty_input_text(self, client, endpoint):
        """Verify empty input_text is rejected with 400 for hard endpoints."""
        resp = client.post(endpoint, json={"input_text": ""})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_missing_input_text(self, client, endpoint):
        """Verify missing input_text is rejected with 400 for hard endpoints."""
        resp = client.post(endpoint, json={})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_input_text_too_long(self, client, endpoint):
        """Verify input_text exceeding max length is rejected for hard endpoints."""
        resp = client.post(endpoint, json={"input_text": "X" * 50_001})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_with_mediawiki(self, client, endpoint, mock_mediawiki):
        """Verify mediawiki expansion is triggered for hard endpoints."""
        resp = client.post(
            endpoint, json={"input_text": SAMPLE_TEXT, "use_mediawiki": 1}
        )
        assert resp.status_code == 200
        mock_mediawiki.summary.assert_called()

    @pytest.mark.parametrize("endpoint", HARD_ENDPOINTS)
    def test_with_input_questions(self, client, endpoint, mock_question_generator):
        """Verify num_questions matches the length of input_question list."""
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
        """Verify a generator exception returns a 500 error for hard endpoints."""
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
        """Verify a .txt file upload is accepted and content is extracted."""
        data = {"file": (io.BytesIO(b"Hello world content"), "test.txt")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200
        assert "content" in resp.get_json()

    def test_upload_pdf_file(self, client):
        """Verify a .pdf file upload is accepted."""
        data = {"file": (io.BytesIO(b"%PDF-1.4 fake pdf"), "document.pdf")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200

    def test_upload_docx_file(self, client):
        """Verify a .docx file upload is accepted."""
        data = {"file": (io.BytesIO(b"PK\x03\x04 fake docx"), "report.docx")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 200

    def test_upload_unsupported_html(self, client):
        """Verify a .html file upload is rejected with 400."""
        data = {"file": (io.BytesIO(b"<html>hi</html>"), "page.html")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "Unsupported file type" in resp.get_json()["error"]

    def test_upload_unsupported_exe(self, client):
        """Verify a .exe file upload is rejected with 400."""
        data = {"file": (io.BytesIO(b"\x00\x00"), "malware.exe")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400

    def test_upload_unsupported_py(self, client):
        """Verify a .py file upload is rejected with 400."""
        data = {"file": (io.BytesIO(b"print('hi')"), "script.py")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400

    def test_no_file_part(self, client):
        """Verify missing file part returns a 400 error."""
        resp = client.post("/upload", data={}, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "No file part" in resp.get_json()["error"]

    def test_empty_filename(self, client):
        """Verify an empty filename returns a 400 error."""
        data = {"file": (io.BytesIO(b"content"), "")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "No file selected" in resp.get_json()["error"]

    def test_processor_returns_empty_content(self, client, mock_file_processor):
        """Verify empty content from processor returns a 400 error."""
        mock_file_processor.process_file.return_value = ""
        data = {"file": (io.BytesIO(b"content"), "empty.txt")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400
        assert "Could not extract content" in resp.get_json()["error"]

    def test_processor_returns_none(self, client, mock_file_processor):
        """Verify None content from processor returns a 400 error."""
        mock_file_processor.process_file.return_value = None
        data = {"file": (io.BytesIO(b"content"), "empty.txt")}
        resp = client.post("/upload", data=data, content_type="multipart/form-data")
        assert resp.status_code == 400

    def test_processor_raises_exception(self, client, mock_file_processor):
        """Verify a processor exception returns a 500 error."""
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
        """Verify missing video ID returns a 400 error."""
        resp = client.get("/getTranscript")
        assert resp.status_code == 400
        assert "No video ID" in resp.get_json()["error"]

    def test_empty_video_id(self, client):
        """Verify empty video ID returns a 400 error."""
        resp = client.get("/getTranscript?videoId=")
        assert resp.status_code == 400

    def test_invalid_video_id_special_chars(self, client):
        """Verify video ID with special characters is rejected."""
        resp = client.get("/getTranscript?videoId=invalid!@#$")
        assert resp.status_code == 400
        assert "Invalid video ID" in resp.get_json()["error"]

    def test_video_id_too_short(self, client):
        """Verify a video ID shorter than 11 characters is rejected."""
        resp = client.get("/getTranscript?videoId=abc")
        assert resp.status_code == 400

    def test_video_id_too_long(self, client):
        """Verify a video ID longer than 11 characters is rejected."""
        resp = client.get("/getTranscript?videoId=abcdefghijklmno")
        assert resp.status_code == 400

    def test_post_method_not_allowed(self, client):
        """Verify POST is rejected on the GET-only transcript endpoint."""
        resp = client.post("/getTranscript")
        assert resp.status_code == 405

    @patch("server.glob.glob", return_value=["subtitles/dQw4w9WgXcQ.en.vtt"])
    @patch("server.clean_transcript", return_value="Hello world transcript text")
    @patch("server.subprocess.run")
    def test_happy_path_returns_transcript(
        self, mock_run, mock_clean, mock_glob, client
    ):
        """Verify a valid video ID returns the cleaned transcript."""
        resp = client.get("/getTranscript?videoId=dQw4w9WgXcQ")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "transcript" in data
        assert data["transcript"] == "Hello world transcript text"
        mock_run.assert_called_once()

    @patch("server.subprocess.run", side_effect=subprocess.TimeoutExpired(cmd="yt-dlp", timeout=30))
    def test_subprocess_timeout_returns_504(self, mock_run, client):
        """Verify a subprocess timeout returns a 504 error."""
        resp = client.get("/getTranscript?videoId=dQw4w9WgXcQ")
        assert resp.status_code == 504
        assert "timed out" in resp.get_json()["error"]

    @patch(
        "server.subprocess.run",
        side_effect=subprocess.CalledProcessError(1, "yt-dlp", stderr="error"),
    )
    def test_subprocess_error_returns_500(self, mock_run, client):
        """Verify a subprocess CalledProcessError returns a 500 error."""
        resp = client.get("/getTranscript?videoId=dQw4w9WgXcQ")
        assert resp.status_code == 500
        assert "Failed to download" in resp.get_json()["error"]

    @patch("server.glob.glob", return_value=[])
    @patch("server.subprocess.run")
    def test_no_subtitles_found_returns_404(self, mock_run, mock_glob, client):
        """Verify a 404 is returned when no subtitle files are found."""
        resp = client.get("/getTranscript?videoId=dQw4w9WgXcQ")
        assert resp.status_code == 404
        assert "No subtitles found" in resp.get_json()["error"]


# ===========================================================================
# Google Docs Content Endpoint
# ===========================================================================


class TestGetContent:
    """POST /get_content

    Note: In tests ``docs_service`` is a MagicMock (not ``None``), so the
    service-unavailable branch (503) is never reached by default.  All
    invalid-URL scenarios hit the validation logic and return 400.
    """

    def test_missing_document_url(self, client):
        """Verify missing document_url returns a 400 error."""
        resp = client.post("/get_content", json={})
        assert resp.status_code == 400

    def test_empty_document_url(self, client):
        """Verify empty document_url returns a 400 error."""
        resp = client.post("/get_content", json={"document_url": ""})
        assert resp.status_code == 400

    def test_null_document_url(self, client):
        """Verify null document_url returns a 400 error."""
        resp = client.post("/get_content", json={"document_url": None})
        assert resp.status_code == 400

    def test_non_string_document_url(self, client):
        """Verify non-string document_url returns a 400 error."""
        resp = client.post("/get_content", json={"document_url": 12345})
        assert resp.status_code == 400

    def test_get_method_not_allowed(self, client):
        """Verify GET is rejected on the POST-only content endpoint."""
        resp = client.get("/get_content")
        assert resp.status_code == 405

    def test_happy_path_returns_content(self, client):
        """Verify a valid document_url returns the fetched content."""
        with patch("server.docs_service") as mock_docs:
            mock_docs.get_document_content.return_value = {
                "content": "Document text here"
            }
            resp = client.post(
                "/get_content",
                json={"document_url": "https://docs.google.com/document/d/abc123"},
            )
            assert resp.status_code == 200
            mock_docs.get_document_content.assert_called_once()

    def test_service_unavailable_returns_503(self, client):
        """Verify a 503 is returned when docs_service is None."""
        with patch("server.docs_service", None):
            resp = client.post(
                "/get_content",
                json={"document_url": "https://docs.google.com/document/d/abc123"},
            )
            assert resp.status_code == 503
            assert "not configured" in resp.get_json()["error"]


# ===========================================================================
# Google Forms Endpoint
# ===========================================================================


class TestGenerateGForm:
    """POST /generate_gform"""

    def test_missing_qa_pairs(self, client):
        """Verify missing qa_pairs returns a 400 error."""
        resp = client.post(
            "/generate_gform", json={"question_type": "get_mcq"}
        )
        assert resp.status_code == 400
        assert "qa_pairs" in resp.get_json()["error"]

    def test_empty_qa_pairs(self, client):
        """Verify empty qa_pairs returns a 400 error."""
        resp = client.post(
            "/generate_gform",
            json={"qa_pairs": [], "question_type": "get_mcq"},
        )
        assert resp.status_code == 400

    def test_missing_question_type(self, client):
        """Verify missing question_type returns a 400 error."""
        resp = client.post(
            "/generate_gform",
            json={"qa_pairs": [{"question": "Q?", "answer": "A"}]},
        )
        assert resp.status_code == 400
        assert "question_type" in resp.get_json()["error"]

    def test_empty_question_type(self, client):
        """Verify empty question_type returns a 400 error."""
        resp = client.post(
            "/generate_gform",
            json={
                "qa_pairs": [{"question": "Q?", "answer": "A"}],
                "question_type": "",
            },
        )
        assert resp.status_code == 400

    def test_qa_pairs_not_list(self, client):
        """Verify non-list qa_pairs returns a 400 error."""
        resp = client.post(
            "/generate_gform",
            json={"qa_pairs": "not a list", "question_type": "get_mcq"},
        )
        assert resp.status_code == 400

    def test_get_method_not_allowed(self, client):
        """Verify GET is rejected on the POST-only gform endpoint."""
        resp = client.get("/generate_gform")
        assert resp.status_code == 405


# ===========================================================================
# Input Validation (Cross-Cutting)
# ===========================================================================


class TestInputValidation:
    """Cross-cutting validation tests for question-generation endpoints."""

    QUESTION_ENDPOINTS: ClassVar[list[str]] = ["/get_mcq", "/get_boolq", "/get_shortq", "/get_problems"]

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_empty_text_rejected(self, client, endpoint):
        """Verify empty text is rejected across question endpoints."""
        resp = client.post(endpoint, json={"input_text": ""})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_null_text_rejected(self, client, endpoint):
        """Verify null text is rejected across question endpoints."""
        resp = client.post(endpoint, json={"input_text": None})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_numeric_text_rejected(self, client, endpoint):
        """Verify numeric text is rejected across question endpoints."""
        resp = client.post(endpoint, json={"input_text": 42})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_list_text_rejected(self, client, endpoint):
        """Verify list input is rejected across question endpoints."""
        resp = client.post(endpoint, json={"input_text": ["not", "a", "string"]})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_boolean_text_rejected(self, client, endpoint):
        """Verify boolean input is rejected across question endpoints."""
        resp = client.post(endpoint, json={"input_text": True})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_text_exceeding_max_length(self, client, endpoint):
        """Verify oversized text is rejected across question endpoints."""
        resp = client.post(endpoint, json={"input_text": "X" * 50_001})
        assert resp.status_code == 400

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_no_body_at_all(self, client, endpoint):
        """Verify missing request body is rejected across question endpoints."""
        resp = client.post(endpoint)
        assert resp.status_code == 400


# ===========================================================================
# Edge Cases
# ===========================================================================


class TestEdgeCases:
    """Unicode, special characters, boundary values, and unusual payloads."""

    QUESTION_ENDPOINTS: ClassVar[list[str]] = ["/get_mcq", "/get_boolq", "/get_shortq"]

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_unicode_text(self, client, endpoint):
        """Verify unicode text is accepted across question endpoints."""
        resp = client.post(endpoint, json={"input_text": UNICODE_TEXT})
        assert resp.status_code == 200

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_special_characters(self, client, endpoint):
        """Verify special characters are accepted across endpoints."""
        resp = client.post(endpoint, json={"input_text": SPECIAL_CHARS_TEXT})
        assert resp.status_code == 200

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_text_exactly_at_max_length(self, client, endpoint):
        """Verify text at exactly max length is accepted."""
        resp = client.post(endpoint, json={"input_text": "A" * 50_000})
        assert resp.status_code == 200

    @pytest.mark.parametrize("endpoint", QUESTION_ENDPOINTS)
    def test_single_character_text(self, client, endpoint):
        """Verify a single character text is accepted."""
        resp = client.post(endpoint, json={"input_text": "A"})
        assert resp.status_code == 200

    def test_emoji_text(self, client):
        """Verify emoji-containing text is accepted."""
        text = "AI is powerful 🤖🧠💡 and processes data 📊 for insights 🔍"
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_newlines_and_tabs(self, client):
        """Verify text with newlines and tabs is accepted."""
        text = "AI is important.\n\nIt uses algorithms.\n\tML is a subset of AI."
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_html_in_text(self, client):
        """Verify HTML markup in text is accepted."""
        text = "<p>AI is the simulation of <b>human intelligence</b></p>"
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_json_in_text(self, client):
        """Verify JSON content in text is accepted."""
        text = '{"key": "AI is intelligence simulation", "nested": {"v": true}}'
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_repeated_text(self, client):
        """Verify highly repeated text is accepted."""
        text = "AI is intelligence. " * 500
        resp = client.post("/get_mcq", json={"input_text": text})
        assert resp.status_code == 200

    def test_max_questions_exact_lower_bound(self, client, mock_mcq_gen):
        """Verify max_questions at the lower boundary is passed through."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 1}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] == 1

    def test_max_questions_exact_upper_bound(self, client, mock_mcq_gen):
        """Verify max_questions at the upper boundary is passed through."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 20}
        )
        assert resp.status_code == 200
        assert mock_mcq_gen.generate_mcq.call_args[0][0]["max_questions"] == 20

    def test_max_questions_float(self, client):
        """Float max_questions should be truncated to int."""
        resp = client.post(
            "/get_mcq", json={"input_text": SAMPLE_TEXT, "max_questions": 3.7}
        )
        assert resp.status_code == 200

    def test_form_urlencoded_rejected(self, client):
        """Verify form-urlencoded content type is rejected."""
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

    POST_ONLY_ENDPOINTS: ClassVar[list[str]] = [
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
        """Verify GET requests are rejected on POST-only endpoints."""
        resp = client.get(endpoint)
        assert resp.status_code == 405

    def test_post_not_allowed_on_root(self, client):
        """Verify POST is rejected on the root endpoint."""
        resp = client.post("/")
        assert resp.status_code == 405

    def test_post_not_allowed_on_transcript(self, client):
        """Verify POST is rejected on the transcript endpoint."""
        resp = client.post("/getTranscript")
        assert resp.status_code == 405

    def test_put_not_allowed(self, client):
        """Verify PUT requests are rejected."""
        resp = client.put("/get_mcq", json={"input_text": SAMPLE_TEXT})
        assert resp.status_code == 405

    def test_delete_not_allowed(self, client):
        """Verify DELETE requests are rejected."""
        resp = client.delete("/get_mcq")
        assert resp.status_code == 405
