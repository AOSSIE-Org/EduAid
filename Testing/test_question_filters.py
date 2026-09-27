import os
import sys
import pytest

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from Generator.question_filters import QuestionEnhancer


@pytest.fixture
def enhancer():
    return QuestionEnhancer()


class TestQuestionEnhancer:
    """Unit tests for QuestionEnhancer in question_filters.py."""

    def test_enhancer_initialization(self, enhancer):
        """Test that QuestionEnhancer initializes properly with required structures."""
        assert enhancer is not None
        assert isinstance(enhancer.question_word_map, dict)
        assert isinstance(enhancer.verb_enhancements, dict)
        assert len(enhancer.stop_words) > 0

    def test_enhance_standard_question(self, enhancer):
        """Test enhancing standard English questions."""
        question = "What is artificial intelligence?"
        result = enhancer.enhance(question)
        assert isinstance(result, str)
        assert len(result) > 0
        assert result[0].isupper()

    def test_enhance_empty_string(self, enhancer):
        """Test that enhancing an empty string returns an empty string without crashing."""
        assert enhancer.enhance("") == ""

    def test_enhance_none_input(self, enhancer):
        """Test that passing None returns None safely."""
        assert enhancer.enhance(None) is None

    def test_enhance_non_string_input(self, enhancer):
        """Test that non-string inputs are returned as-is safely."""
        assert enhancer.enhance(12345) == 12345
        assert enhancer.enhance(["What is this?"]) == ["What is this?"]

    def test_enhance_single_character(self, enhancer):
        """Test that single character inputs do not cause out-of-bounds indexing."""
        assert enhancer.enhance("a") == "A"
        assert enhancer.enhance("?") == "?"

    def test_generate_question_word_alternatives_valid(self, enhancer):
        """Test generating alternatives for valid question words."""
        alternatives = enhancer._generate_question_word_alternatives("what")
        assert alternatives in ['which specific', 'what particular', 'what exact']

        why_alternatives = enhancer._generate_question_word_alternatives("why")
        assert why_alternatives in ['for what reason', 'with what purpose']

    def test_generate_question_word_alternatives_case_insensitive(self, enhancer):
        """Test that question word alternatives are case-insensitive."""
        alternatives = enhancer._generate_question_word_alternatives("WHAT")
        assert alternatives in ['which specific', 'what particular', 'what exact']

    def test_generate_question_word_alternatives_unknown(self, enhancer):
        """Test that non-question words return None."""
        assert enhancer._generate_question_word_alternatives("algorithm") is None
        assert enhancer._generate_question_word_alternatives("") is None

    def test_get_complex_synonym_stops(self, enhancer):
        """Test that stop words or short words do not return complex synonyms."""
        assert enhancer._get_complex_synonym("the", "DT") is None
        assert enhancer._get_complex_synonym("is", "VB") is None
        assert enhancer._get_complex_synonym("why", "WRB") is None

    def test_punctuation_spacing_cleanup(self, enhancer):
        """Test that extra spaces before punctuation marks are cleaned up."""
        question = "What is machine learning ?"
        result = enhancer.enhance(question)
        assert " ?" not in result
        assert result.endswith("?")
