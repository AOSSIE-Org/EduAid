"""Shared pytest fixtures for the EduAid backend test suite.

All heavy ML models, NLP pipelines, and external services are mocked so that
tests run instantly without a GPU or network access.

The session-scoped ``_prevent_model_initialization`` fixture patches the heavy
constructors **before** ``server.py`` is first imported, preventing module-level
instantiations (``MCQGenerator()``, ``pipeline("question-answering")``, etc.)
from triggering real model downloads or GPU usage.
"""

import sys
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Lightweight mock objects that replace the heavy ML classes
# ---------------------------------------------------------------------------

def _make_mcq_gen_mock():
    mock = MagicMock()
    mock.generate_mcq.return_value = {
        "statement": "Mock statement",
        "questions": [
            {
                "question_statement": "What is AI?",
                "question_type": "MCQ",
                "answer": "Artificial Intelligence",
                "id": 1,
                "options": ["Machine Learning", "Deep Learning", "Robotics"],
                "options_algorithm": "sense2vec",
                "extra_options": ["Neural Networks", "NLP"],
                "context": "AI is the simulation of human intelligence.",
            }
        ],
        "time_taken": 0.01,
    }
    return mock


def _make_shortq_gen_mock():
    mock = MagicMock()
    mock.generate_shortq.return_value = {
        "statement": "Mock statement",
        "questions": [
            {
                "Question": "What is AI?",
                "Answer": "Artificial Intelligence",
                "id": 1,
                "context": "AI is the simulation.",
            }
        ],
    }
    return mock


def _make_boolq_gen_mock():
    mock = MagicMock()
    mock.generate_boolq.return_value = {
        "Text": "Mock text",
        "Count": 4,
        "Boolean_Questions": [
            "Is AI a simulation of human intelligence?",
            "Does machine learning use algorithms?",
        ],
    }
    return mock


def _make_question_generator_mock():
    mock = MagicMock()
    mock.generate.return_value = [
        {"question": "What is AI?", "answer": "Artificial Intelligence"},
        {"question": "What is ML?", "answer": "Machine Learning"},
    ]
    return mock


def _make_answer_predictor_mock():
    mock = MagicMock()
    mock.predict_boolean_answer.return_value = [True]
    return mock


# ---------------------------------------------------------------------------
# Session-scoped fixture: prevent heavy model loading at import time
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def _prevent_model_initialization():
    """Patch heavy constructors *before* ``server.py`` is imported.

    ``server.py`` instantiates heavy objects at module level::

        MCQGen   = main.MCQGenerator()      # loads T5-large, spacy, sense2vec
        answer   = main.AnswerPredictor()    # loads T5-large, NLI model
        BoolQGen = main.BoolQGenerator()     # loads T5-base
        ShortQGen = main.ShortQGenerator()   # loads T5-large, spacy
        qg       = main.QuestionGenerator()  # loads t5-base-question-generator
        qa_model = pipeline("question-answering")  # loads QA model

    Without these patches, importing ``server.py`` would download several
    gigabytes of model weights and require a GPU or significant RAM.
    """
    import nltk                         # noqa: E402 – must import before patching
    import transformers                  # noqa: E402
    import mediawikiapi as mwapi        # noqa: E402
    import Generator.main as gen_main   # noqa: E402

    patches = [
        # Prevent NLTK data downloads
        patch.object(nltk, "download", lambda *_a, **_kw: None),
        # Prevent transformers QA pipeline loading
        patch.object(transformers, "pipeline", return_value=MagicMock()),
        # Prevent MediaWikiAPI instantiation
        patch.object(mwapi, "MediaWikiAPI", return_value=MagicMock()),
        # Prevent Generator class instantiation (each __init__ loads models)
        patch.object(gen_main, "MCQGenerator", MagicMock),
        patch.object(gen_main, "BoolQGenerator", MagicMock),
        patch.object(gen_main, "ShortQGenerator", MagicMock),
        patch.object(gen_main, "QuestionGenerator", MagicMock),
        patch.object(gen_main, "AnswerPredictor", MagicMock),
        patch.object(gen_main, "GoogleDocsService", MagicMock),
        patch.object(gen_main, "FileProcessor", MagicMock),
    ]
    for p in patches:
        p.start()
    yield
    for p in patches:
        p.stop()


# ---------------------------------------------------------------------------
# Per-test fixtures: override module-level mocks with specific behaviour
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _patch_heavy_imports(monkeypatch):
    """Per-test NLTK download suppression (belt-and-suspenders)."""
    monkeypatch.setattr("nltk.download", lambda *_a, **_kw: None)


@pytest.fixture()
def mock_mcq_gen():
    mock = _make_mcq_gen_mock()
    with patch("server.MCQGen", mock):
        yield mock


@pytest.fixture()
def mock_shortq_gen():
    mock = _make_shortq_gen_mock()
    with patch("server.ShortQGen", mock):
        yield mock


@pytest.fixture()
def mock_boolq_gen():
    mock = _make_boolq_gen_mock()
    with patch("server.BoolQGen", mock):
        yield mock


@pytest.fixture()
def mock_question_generator():
    mock = _make_question_generator_mock()
    with patch("server.qg", mock):
        yield mock


@pytest.fixture()
def mock_answer_predictor():
    mock = _make_answer_predictor_mock()
    with patch("server.answer", mock):
        yield mock


@pytest.fixture()
def mock_mediawiki():
    mock = MagicMock()
    mock.summary.return_value = "Expanded text from MediaWiki."
    with patch("server.mediawikiapi", mock):
        yield mock


@pytest.fixture()
def mock_qa_pipeline():
    mock = MagicMock(return_value={"answer": "mocked answer", "score": 0.99})
    with patch("server.qa_model", mock):
        yield mock


@pytest.fixture()
def mock_file_processor():
    mock = MagicMock()
    mock.process_file.return_value = "Extracted text content"
    with patch("server.file_processor", mock):
        yield mock


@pytest.fixture()
def mock_docs_service():
    mock = MagicMock()
    mock.get_document_content.return_value = "Document content"
    with patch("server.docs_service", mock):
        yield mock


@pytest.fixture()
def app():
    """Create the Flask app for testing."""
    sys.path.insert(0, ".")
    from server import app as flask_app
    flask_app.config["TESTING"] = True
    return flask_app


@pytest.fixture()
def client(app, mock_mcq_gen, mock_shortq_gen, mock_boolq_gen,
           mock_question_generator, mock_answer_predictor, mock_mediawiki,
           mock_qa_pipeline, mock_file_processor, mock_docs_service):
    """A Flask test client with all ML models mocked."""
    return app.test_client()
