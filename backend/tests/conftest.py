import sys
import os
import types
import pytest

# -------------------------------------------------
# Ensure repo root is on PYTHONPATH
# -------------------------------------------------
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# -------------------------------------------------
# Fake Generator package (blocks heavy ML imports)
# -------------------------------------------------

fake_generator = types.ModuleType("Generator")
fake_main = types.ModuleType("Generator.main")
fake_filters = types.ModuleType("Generator.question_filters")

# -------------------------------------------------
# Fake classes matching real backend interfaces
# -------------------------------------------------

class FakeMCQGenerator:
    def generate_mcq(self, *args, **kwargs):
        return {
            "statement": "",
            "questions": [],
            "time_taken": 0.0,
        }

class FakeShortQGenerator:
    def generate_shortq(self, *args, **kwargs):
        return {
            "statement": "",
            "questions": [],
        }

class FakeBoolQGenerator:
    def generate_boolq(self, *args, **kwargs):
        return {
            "Text": "",
            "Count": 0,
            "Boolean_Questions": [],
        }

class FakeAnswerPredictor:
    def predict_answer(self, *args, **kwargs):
        return ""

    def predict_boolean_answer(self, *args, **kwargs):
        return True

class FakeQuestionGenerator:
    def generate(self, *args, **kwargs):
        return []

class FakeFileProcessor:
    def process_file(self, *args, **kwargs):
        return {"content": ""}

def make_question_harder(*args, **kwargs):
    return args[0] if args else None

# -------------------------------------------------
# Attach attributes expected by server.py
# -------------------------------------------------

fake_main.MCQGenerator = FakeMCQGenerator
fake_main.ShortQGenerator = FakeShortQGenerator
fake_main.BoolQGenerator = FakeBoolQGenerator
fake_main.AnswerPredictor = FakeAnswerPredictor
fake_main.QuestionGenerator = FakeQuestionGenerator
fake_main.FileProcessor = FakeFileProcessor

fake_filters.make_question_harder = make_question_harder

# -------------------------------------------------
# Register fake modules BEFORE importing server
# -------------------------------------------------

sys.modules["Generator"] = fake_generator
sys.modules["Generator.main"] = fake_main
sys.modules["Generator.question_filters"] = fake_filters

# -------------------------------------------------
# Safe import of Flask app
# -------------------------------------------------

from backend.server import app

# -------------------------------------------------
# Pytest client fixture
# -------------------------------------------------

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client