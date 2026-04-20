"""Unit tests for the LLMQuestionGenerator parsing and utility logic.

Tests the JSON parsing, fallback text parsing, boolean coercion, and
input preparation methods **without** loading any ML models.  The LLM
model itself is not invoked; only the deterministic parsing pipeline
is exercised.

NOTE: ``conftest.py`` replaces ``Generator.llm_generator`` in
``sys.modules`` with a ``MagicMock`` so that ``server.py`` loads
without downloading model weights.  This file needs the **real**
``LLMQuestionGenerator`` class, so we load it directly from the
source file using ``importlib``.
"""

import importlib.util
import os
import sys

import pytest

# Always stub llama_cpp so these parser tests never load native/model resources.
llama_cpp_stub = type(sys)("llama_cpp")
llama_cpp_stub.Llama = type(
    "Llama",
    (),
    {"from_pretrained": staticmethod(lambda **kw: None)},
)
sys.modules["llama_cpp"] = llama_cpp_stub

_llm_gen_path = os.path.join(os.path.dirname(__file__), "Generator", "llm_generator.py")
_spec = importlib.util.spec_from_file_location("_real_llm_generator", _llm_gen_path)
_real_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_real_module)
LLMQuestionGenerator = _real_module.LLMQuestionGenerator


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def generator():
    """Provide a bare LLMQuestionGenerator (model NOT loaded)."""
    gen = LLMQuestionGenerator()
    return gen


# ===========================================================================
# _prepare_text
# ===========================================================================


class TestPrepareText:
    """LLMQuestionGenerator._prepare_text"""

    def test_short_text_unchanged(self, generator):
        """Text within the word limit should pass through unchanged."""
        text = "Hello world this is a short text."
        assert generator._prepare_text(text) == text

    def test_long_text_truncated(self, generator):
        """Text exceeding the word limit should be truncated."""
        words = ["word"] * 5000
        result = generator._prepare_text(" ".join(words), max_words=3000)
        assert len(result.split()) == 3000

    def test_exact_limit_unchanged(self, generator):
        """Text at exactly the word limit should not be truncated."""
        words = ["word"] * 3000
        text = " ".join(words)
        result = generator._prepare_text(text, max_words=3000)
        assert len(result.split()) == 3000

    def test_empty_text(self, generator):
        """Empty text should return empty."""
        assert generator._prepare_text("") == ""


# ===========================================================================
# _coerce_to_bool
# ===========================================================================


class TestCoerceToBool:
    """LLMQuestionGenerator._coerce_to_bool"""

    def test_python_true(self, generator):
        """Python True should return True."""
        assert generator._coerce_to_bool(True) is True

    def test_python_false(self, generator):
        """Python False should return False."""
        assert generator._coerce_to_bool(False) is False

    def test_int_one(self, generator):
        """Integer 1 should return True."""
        assert generator._coerce_to_bool(1) is True

    def test_int_zero(self, generator):
        """Integer 0 should return False."""
        assert generator._coerce_to_bool(0) is False

    def test_int_other(self, generator):
        """Non-0/1 integers should return None."""
        assert generator._coerce_to_bool(42) is None

    def test_float_one(self, generator):
        """Float 1.0 should return True."""
        assert generator._coerce_to_bool(1.0) is True

    def test_float_zero(self, generator):
        """Float 0.0 should return False."""
        assert generator._coerce_to_bool(0.0) is False

    @pytest.mark.parametrize("value", ["true", "True", "TRUE", "t", "T", "yes", "Yes", "y", "1"])
    def test_truthy_strings(self, generator, value):
        """Various truthy string representations should return True."""
        assert generator._coerce_to_bool(value) is True

    @pytest.mark.parametrize("value", ["false", "False", "FALSE", "f", "F", "no", "No", "n", "0"])
    def test_falsy_strings(self, generator, value):
        """Various falsy string representations should return False."""
        assert generator._coerce_to_bool(value) is False

    def test_invalid_string(self, generator):
        """Unrecognized strings should return None."""
        assert generator._coerce_to_bool("maybe") is None

    def test_none_value(self, generator):
        """None should return None."""
        assert generator._coerce_to_bool(None) is None

    def test_list_value(self, generator):
        """List should return None."""
        assert generator._coerce_to_bool([True]) is None

    def test_padded_string(self, generator):
        """Strings with whitespace should still be coerced."""
        assert generator._coerce_to_bool("  true  ") is True


# ===========================================================================
# _parse_response (short-answer JSON parsing)
# ===========================================================================


class TestParseResponse:
    """LLMQuestionGenerator._parse_response"""

    def test_valid_json_array(self, generator):
        """Valid JSON array with question/answer pairs should be parsed."""
        raw = '[{"question": "What is AI?", "answer": "Intelligence simulation"}]'
        result = generator._parse_response(raw, 5)
        assert len(result) == 1
        assert result[0]["question"] == "What is AI?"
        assert result[0]["answer"] == "Intelligence simulation"
        assert "context" in result[0]

    def test_multiple_questions(self, generator):
        """Multiple questions should all be returned within max_questions."""
        raw = (
            '[{"question": "Q1?", "answer": "A1"}, '
            '{"question": "Q2?", "answer": "A2"}, '
            '{"question": "Q3?", "answer": "A3"}]'
        )
        result = generator._parse_response(raw, 2)
        assert len(result) == 2

    def test_thinking_tags_stripped(self, generator):
        """<think>...</think> blocks should be removed before parsing."""
        raw = '<think>internal reasoning</think>[{"question": "Q?", "answer": "A"}]'
        result = generator._parse_response(raw, 5)
        assert len(result) == 1
        assert result[0]["question"] == "Q?"

    def test_missing_question_field_filtered(self, generator):
        """Items missing the 'question' key should be filtered out."""
        raw = '[{"answer": "A"}, {"question": "Q?", "answer": "A"}]'
        result = generator._parse_response(raw, 5)
        assert len(result) == 1

    def test_missing_answer_field_filtered(self, generator):
        """Items missing the 'answer' key should be filtered out."""
        raw = '[{"question": "Q?"}, {"question": "Q2?", "answer": "A2"}]'
        result = generator._parse_response(raw, 5)
        assert len(result) == 1

    def test_empty_input(self, generator):
        """Empty input should return an empty list."""
        result = generator._parse_response("", 5)
        assert result == []

    def test_non_json_input(self, generator):
        """Non-JSON input should fall through to fallback parser."""
        raw = "This is not JSON at all"
        result = generator._parse_response(raw, 5)
        assert isinstance(result, list)

    def test_json_with_surrounding_text(self, generator):
        """JSON array embedded in surrounding text should be extracted."""
        raw = 'Here are the questions: [{"question": "Q?", "answer": "A"}] Done.'
        result = generator._parse_response(raw, 5)
        assert len(result) == 1

    def test_whitespace_trimmed(self, generator):
        """Whitespace in question/answer fields should be trimmed."""
        raw = '[{"question": "  Q?  ", "answer": "  A  "}]'
        result = generator._parse_response(raw, 5)
        assert result[0]["question"] == "Q?"
        assert result[0]["answer"] == "A"


# ===========================================================================
# _parse_mcq_response
# ===========================================================================


class TestParseMCQResponse:
    """LLMQuestionGenerator._parse_mcq_response"""

    def test_valid_mcq_json(self, generator):
        """Valid MCQ JSON with all required fields should be parsed."""
        raw = (
            '[{"question": "What is AI?", '
            '"options": ["A) sim", "B) robot", "C) car", "D) planet"], '
            '"correct_answer": "A"}]'
        )
        result = generator._parse_mcq_response(raw, 5)
        assert len(result) == 1
        assert result[0]["question"] == "What is AI?"
        assert len(result[0]["options"]) == 4
        assert result[0]["correct_answer"] == "A"

    def test_missing_options_filtered(self, generator):
        """Items missing 'options' key should be filtered out."""
        raw = '[{"question": "Q?", "correct_answer": "A"}]'
        result = generator._parse_mcq_response(raw, 5)
        assert len(result) == 0

    def test_missing_correct_answer_filtered(self, generator):
        """Items missing 'correct_answer' key should be filtered out."""
        raw = '[{"question": "Q?", "options": ["A", "B", "C", "D"]}]'
        result = generator._parse_mcq_response(raw, 5)
        assert len(result) == 0

    def test_max_questions_honored(self, generator):
        """Only max_questions items should be returned."""
        items = [
            '{"question": "Q%d?", "options": ["A","B","C","D"], "correct_answer": "A"}' % i
            for i in range(5)
        ]
        raw = "[" + ", ".join(items) + "]"
        result = generator._parse_mcq_response(raw, 2)
        assert len(result) == 2

    def test_thinking_tags_stripped(self, generator):
        """<think>...</think> blocks should be removed before parsing."""
        raw = (
            '<think>reasoning</think>'
            '[{"question": "Q?", "options": ["A","B","C","D"], "correct_answer": "A"}]'
        )
        result = generator._parse_mcq_response(raw, 5)
        assert len(result) == 1

    def test_empty_input(self, generator):
        """Empty input should return an empty list."""
        result = generator._parse_mcq_response("", 5)
        assert result == []


# ===========================================================================
# _parse_bool_response
# ===========================================================================


class TestParseBoolResponse:
    """LLMQuestionGenerator._parse_bool_response"""

    def test_valid_bool_json_true(self, generator):
        """Valid boolean JSON with true answer should be parsed."""
        raw = '[{"question": "Is AI intelligent?", "answer": true}]'
        result = generator._parse_bool_response(raw, 5)
        assert len(result) == 1
        assert result[0]["answer"] is True

    def test_valid_bool_json_false(self, generator):
        """Valid boolean JSON with false answer should be parsed."""
        raw = '[{"question": "Is the sky green?", "answer": false}]'
        result = generator._parse_bool_response(raw, 5)
        assert len(result) == 1
        assert result[0]["answer"] is False

    def test_string_true_coerced(self, generator):
        """String 'true' should be coerced to boolean True."""
        raw = '[{"question": "Q?", "answer": "true"}]'
        result = generator._parse_bool_response(raw, 5)
        assert len(result) == 1
        assert result[0]["answer"] is True

    def test_string_false_coerced(self, generator):
        """String 'false' should be coerced to boolean False."""
        raw = '[{"question": "Q?", "answer": "false"}]'
        result = generator._parse_bool_response(raw, 5)
        assert len(result) == 1
        assert result[0]["answer"] is False

    def test_invalid_answer_filtered(self, generator):
        """Non-boolean answer values should be filtered from JSON parsing."""
        # "maybe" can't be coerced to bool — the JSON parser drops it.
        # However the raw text may still hit the fallback parser which is
        # more lenient, so we only assert the JSON path works by giving
        # a well-formed JSON array.
        raw = '[{"question": "Q?", "answer": "maybe"}, {"question": "Q2?", "answer": true}]'
        result = generator._parse_bool_response(raw, 5)
        # Only the valid bool answer should survive
        assert len(result) == 1
        assert result[0]["answer"] is True

    def test_max_questions_honored(self, generator):
        """Only max_questions items should be returned."""
        items = ['{"question": "Q%d?", "answer": true}' % i for i in range(5)]
        raw = "[" + ", ".join(items) + "]"
        result = generator._parse_bool_response(raw, 2)
        assert len(result) == 2

    def test_thinking_tags_stripped(self, generator):
        """<think>...</think> blocks should be removed before parsing."""
        raw = '<think>thinking</think>[{"question": "Q?", "answer": true}]'
        result = generator._parse_bool_response(raw, 5)
        assert len(result) == 1

    def test_empty_input(self, generator):
        """Empty input should return an empty list."""
        result = generator._parse_bool_response("", 5)
        assert result == []


# ===========================================================================
# Fallback Parsers
# ===========================================================================


class TestFallbackParse:
    """LLMQuestionGenerator._fallback_parse"""

    def test_qa_pattern(self, generator):
        """Standard Q:/A: patterns should be parsed."""
        text = "Q: What is AI?\nA: Intelligence simulation"
        result = generator._fallback_parse(text, 5)
        assert len(result) == 1
        assert result[0]["question"] == "What is AI?"
        assert result[0]["answer"] == "Intelligence simulation"

    def test_numbered_qa_pattern(self, generator):
        """Numbered question patterns should be parsed."""
        text = "1. Question: What is AI?\nAnswer: Intelligence"
        result = generator._fallback_parse(text, 5)
        assert len(result) == 1

    def test_max_questions_limit(self, generator):
        """Only max_questions results should be returned."""
        text = "Q: Q1?\nA: A1\nQ: Q2?\nA: A2\nQ: Q3?\nA: A3"
        result = generator._fallback_parse(text, 2)
        assert len(result) == 2

    def test_empty_text(self, generator):
        """Empty text should return an empty list."""
        result = generator._fallback_parse("", 5)
        assert result == []


class TestFallbackMCQParse:
    """LLMQuestionGenerator._fallback_mcq_parse"""

    def test_mcq_pattern(self, generator):
        """Standard MCQ patterns with options and correct answer should be parsed."""
        text = (
            "Question: What is AI?\n"
            "A) Simulation\n"
            "B) Robot\n"
            "C) Car\n"
            "D) Planet\n"
            "Correct: A"
        )
        result = generator._fallback_mcq_parse(text, 5)
        assert len(result) == 1
        assert result[0]["correct_answer"] == "A"
        assert len(result[0]["options"]) == 4

    def test_max_questions_limit(self, generator):
        """Only max_questions results should be returned."""
        text = (
            "Q: Q1?\nA) a\nB) b\nCorrect: A\n"
            "Q: Q2?\nA) a\nB) b\nCorrect: B\n"
            "Q: Q3?\nA) a\nB) b\nCorrect: A"
        )
        result = generator._fallback_mcq_parse(text, 1)
        assert len(result) == 1

    def test_empty_text(self, generator):
        """Empty text should return an empty list."""
        result = generator._fallback_mcq_parse("", 5)
        assert result == []


class TestFallbackBoolParse:
    """LLMQuestionGenerator._fallback_bool_parse"""

    def test_qa_bool_pattern(self, generator):
        """Question with true/false answer should be parsed."""
        text = "1. Is AI intelligent?\nAnswer: true"
        result = generator._fallback_bool_parse(text, 5)
        assert len(result) >= 1

    def test_inline_answer(self, generator):
        """Question with inline true/false answer should be parsed."""
        text = "Is AI intelligent? Answer: true"
        result = generator._fallback_bool_parse(text, 5)
        assert len(result) >= 1

    def test_max_questions_limit(self, generator):
        """Only max_questions results should be returned."""
        text = "Q1?\nAnswer: true\nQ2?\nAnswer: false\nQ3?\nAnswer: true"
        result = generator._fallback_bool_parse(text, 1)
        assert len(result) <= 1

    def test_empty_text(self, generator):
        """Empty text should return an empty list."""
        result = generator._fallback_bool_parse("", 5)
        assert result == []
