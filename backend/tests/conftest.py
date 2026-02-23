import pytest
import sys
import os
from unittest.mock import MagicMock

# Make backend importable
sys.path.insert(
    0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
)

# --------------------------------------------------
# MOCK ALL ML GENERATORS BEFORE importing server
# --------------------------------------------------

import Generator.main as main

# Mock MCQ Generator
mock_mcq = MagicMock()
mock_mcq.generate_mcq.return_value = {
    "questions": [
        {
            "question_statement": "Mock MCQ question?",
            "answer": "Mock answer",
            "options": ["A", "B", "C"],
        }
    ]
}

# Mock ShortQ Generator
mock_short = MagicMock()
mock_short.generate_shortq.return_value = {
    "questions": [
        {
            "question": "Mock short question?",
            "answer": "Mock short answer",
        }
    ]
}

main.MCQGenerator = MagicMock(return_value=mock_mcq)
main.ShortQGenerator = MagicMock(return_value=mock_short)

# --------------------------------------------------
# NOW safe to import Flask app
# --------------------------------------------------

from server import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client