"""Pytest configuration and fixtures for EduAid backend tests.

Heavy ML dependencies (transformers, spacy, Generator package, etc.) are
mocked at the ``sys.modules`` level **before** ``server.py`` is imported so
that the test suite runs in seconds without downloading multi-GB models.

The Flask test client is provided as a ``client`` fixture, and every mock
object used by the server is available as a named fixture for fine-grained
assertions.
"""

import copy
import sys
import os
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Default return values — defined ONCE, referenced everywhere
# ---------------------------------------------------------------------------

_DEFAULTS = {
    "mcq_gen": {
        "questions": [
            {
                "question_statement": "What is AI?",
                "answer": "simulation of human intelligence",
                "options": [
                    "simulation of human intelligence",
                    "a robot",
                    "a computer",
                    "a program",
                ],
            }
        ]
    },
    "boolq_gen": {
        "Boolean_Questions": ["Is AI a simulation of human intelligence?"]
    },
    "shortq_gen": {
        "questions": [
            {"Question": "What is AI?", "Answer": "simulation of human intelligence"}
        ]
    },
    "answer_predictor": [True],
    "question_generator": [
        {"question": "What is AI?", "answer": "simulation of human intelligence"}
    ],
    "file_processor": "Extracted text content from file",
    "qa_pipeline": {"answer": "simulation of human intelligence", "score": 0.95},
}

# ---------------------------------------------------------------------------
# Step 1: Mock heavy third-party / local modules BEFORE server.py is imported
# ---------------------------------------------------------------------------

# -- Generator package (local) — wraps T5, Sense2Vec, etc. -----------------

_mock_generator_main = MagicMock()
_mock_question_filters = MagicMock()
_mock_generator_pkg = MagicMock()

# MCQGenerator
_mock_mcq_gen = MagicMock()
_mock_mcq_gen.generate_mcq.return_value = copy.deepcopy(_DEFAULTS["mcq_gen"])

# BoolQGenerator
_mock_boolq_gen = MagicMock()
_mock_boolq_gen.generate_boolq.return_value = copy.deepcopy(_DEFAULTS["boolq_gen"])

# ShortQGenerator
_mock_shortq_gen = MagicMock()
_mock_shortq_gen.generate_shortq.return_value = copy.deepcopy(_DEFAULTS["shortq_gen"])

# AnswerPredictor
_mock_answer_predictor = MagicMock()
_mock_answer_predictor.predict_boolean_answer.return_value = copy.deepcopy(
    _DEFAULTS["answer_predictor"]
)

# QuestionGenerator (used by *_hard endpoints)
_mock_question_generator = MagicMock()
_mock_question_generator.generate.return_value = copy.deepcopy(
    _DEFAULTS["question_generator"]
)

# FileProcessor
_mock_file_processor = MagicMock()
_mock_file_processor.process_file.return_value = _DEFAULTS["file_processor"]

# GoogleDocsService
_mock_google_docs = MagicMock()

# Wire constructors
_mock_generator_main.MCQGenerator.return_value = _mock_mcq_gen
_mock_generator_main.BoolQGenerator.return_value = _mock_boolq_gen
_mock_generator_main.ShortQGenerator.return_value = _mock_shortq_gen
_mock_generator_main.AnswerPredictor.return_value = _mock_answer_predictor
_mock_generator_main.QuestionGenerator.return_value = _mock_question_generator
_mock_generator_main.FileProcessor.return_value = _mock_file_processor
_mock_generator_main.GoogleDocsService.return_value = _mock_google_docs

# Make `from Generator import main` resolve correctly
_mock_generator_pkg.main = _mock_generator_main
_mock_generator_pkg.question_filters = _mock_question_filters
_mock_question_filters.make_question_harder = lambda q: f"[HARDER] {q}"

sys.modules["Generator"] = _mock_generator_pkg
sys.modules["Generator.main"] = _mock_generator_main
sys.modules["Generator.question_filters"] = _mock_question_filters

# -- transformers (Hugging Face) — pipeline downloads large models ----------

_mock_transformers = MagicMock()
_mock_qa_pipeline = MagicMock()
_mock_qa_pipeline.return_value = copy.deepcopy(_DEFAULTS["qa_pipeline"])
_mock_transformers.pipeline.return_value = _mock_qa_pipeline
sys.modules["transformers"] = _mock_transformers

# -- spacy and sub-modules -------------------------------------------------

sys.modules["spacy"] = MagicMock()
sys.modules["spacy.lang"] = MagicMock()
sys.modules["spacy.lang.en"] = MagicMock()
sys.modules["spacy.lang.en.stop_words"] = MagicMock(STOP_WORDS=set())

# -- Google API client libraries -------------------------------------------

sys.modules["apiclient"] = MagicMock()
sys.modules["apiclient.discovery"] = MagicMock()
sys.modules["httplib2"] = MagicMock()
sys.modules["oauth2client"] = MagicMock()
sys.modules["oauth2client.client"] = MagicMock()
sys.modules["oauth2client.file"] = MagicMock()
sys.modules["oauth2client.tools"] = MagicMock()

# -- mediawikiapi ----------------------------------------------------------

_mock_mediawiki_module = MagicMock()
_mock_mediawiki_instance = MagicMock()
_mock_mediawiki_instance.summary.return_value = (
    "Artificial intelligence is intelligence demonstrated by machines."
)
_mock_mediawiki_module.MediaWikiAPI.return_value = _mock_mediawiki_instance
sys.modules["mediawikiapi"] = _mock_mediawiki_module

# ---------------------------------------------------------------------------
# Step 2: Patch nltk.download, then import the Flask app
# ---------------------------------------------------------------------------

sys.path.insert(0, os.path.dirname(__file__))

with patch("nltk.download"):
    from server import app as _flask_app


# ---------------------------------------------------------------------------
# Step 3: Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _reset_mocks():
    """Automatically reset every mock's side_effect and return_value after
    each test so that one test cannot break another.

    Uses ``copy.deepcopy`` so that in-place mutation of a return value inside
    a test cannot corrupt the shared baseline.
    """
    yield
    # Clear side effects
    _mock_mcq_gen.generate_mcq.side_effect = None
    _mock_boolq_gen.generate_boolq.side_effect = None
    _mock_shortq_gen.generate_shortq.side_effect = None
    _mock_answer_predictor.predict_boolean_answer.side_effect = None
    _mock_question_generator.generate.side_effect = None
    _mock_file_processor.process_file.side_effect = None
    _mock_qa_pipeline.side_effect = None
    # Restore defaults (deepcopy to protect mutable structures)
    _mock_mcq_gen.generate_mcq.return_value = copy.deepcopy(_DEFAULTS["mcq_gen"])
    _mock_boolq_gen.generate_boolq.return_value = copy.deepcopy(_DEFAULTS["boolq_gen"])
    _mock_shortq_gen.generate_shortq.return_value = copy.deepcopy(
        _DEFAULTS["shortq_gen"]
    )
    _mock_answer_predictor.predict_boolean_answer.return_value = copy.deepcopy(
        _DEFAULTS["answer_predictor"]
    )
    _mock_question_generator.generate.return_value = copy.deepcopy(
        _DEFAULTS["question_generator"]
    )
    _mock_file_processor.process_file.return_value = _DEFAULTS["file_processor"]
    _mock_qa_pipeline.return_value = copy.deepcopy(_DEFAULTS["qa_pipeline"])


@pytest.fixture
def app():
    """Provide the Flask application configured for testing."""
    _flask_app.config["TESTING"] = True
    return _flask_app


@pytest.fixture
def client(app):
    """Provide a Flask test client (no running server needed)."""
    with app.test_client() as c:
        yield c


# -- Expose individual mocks for assertion in tests -------------------------


@pytest.fixture
def mock_mcq_gen():
    """Return the MCQGenerator mock for call assertions."""
    return _mock_mcq_gen


@pytest.fixture
def mock_boolq_gen():
    """Return the BoolQGenerator mock for call assertions."""
    return _mock_boolq_gen


@pytest.fixture
def mock_shortq_gen():
    """Return the ShortQGenerator mock for call assertions."""
    return _mock_shortq_gen


@pytest.fixture
def mock_answer_predictor():
    """Return the AnswerPredictor mock for call assertions."""
    return _mock_answer_predictor


@pytest.fixture
def mock_question_generator():
    """Return the QuestionGenerator mock for call assertions."""
    return _mock_question_generator


@pytest.fixture
def mock_file_processor():
    """Return the FileProcessor mock for call assertions."""
    return _mock_file_processor


@pytest.fixture
def mock_qa_pipeline():
    """Return the QA pipeline mock for call assertions."""
    return _mock_qa_pipeline


@pytest.fixture
def mock_mediawiki():
    """Return the MediaWikiAPI instance mock for call assertions."""
    return _mock_mediawiki_instance
