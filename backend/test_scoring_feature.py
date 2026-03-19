"""
Clean, production-quality pytest tests for Question Quality Scoring & Ranking.

Covers:
- Core ranking logic with mocked evaluator
- Edge cases (empty lists, small datasets)
- Failure handling (evaluator exceptions)
- API validation (input_text, max_questions)
"""

import pytest
from unittest.mock import Mock, patch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import score_and_rank_questions, parse_max_questions, app


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_questions():
    """Sample questions for testing."""
    return [
        {"question": "What is AI?", "answer": "Artificial Intelligence"},
        {"question": "What is ML?", "answer": "Machine Learning"},
        {"question": "What is DL?", "answer": "Deep Learning"},
        {"question": "What is NLP?", "answer": "Natural Language Processing"},
        {"question": "What is CV?", "answer": "Computer Vision"}
    ]


@pytest.fixture
def mock_evaluator():
    """Mock QAEvaluator returning specific ranking."""
    evaluator = Mock()
    evaluator.encode_qa_pairs = Mock(return_value=[Mock()] * 5)
    # Indices in descending score order: [4, 2, 0, 3, 1]
    evaluator.get_scores = Mock(return_value=[4, 2, 0, 3, 1])
    return evaluator


@pytest.fixture
def client():
    """Flask test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


# ============================================================================
# UNIT TESTS: Ranking Logic
# ============================================================================

class TestRankingLogic:
    """Test core ranking functionality."""
    
    def test_ranks_questions_correctly(self, sample_questions, mock_evaluator):
        """Questions are ranked by evaluator scores."""
        with patch('server.get_qa_evaluator', return_value=mock_evaluator):
            result = score_and_rank_questions(sample_questions)
            
            # Verify order matches mock scores: [4, 2, 0, 3, 1]
            assert result[0] == sample_questions[4]  # CV (highest)
            assert result[1] == sample_questions[2]  # DL
            assert result[2] == sample_questions[0]  # AI
            assert result[3] == sample_questions[3]  # NLP
            assert result[4] == sample_questions[1]  # ML (lowest)
            
            mock_evaluator.encode_qa_pairs.assert_called_once()
            mock_evaluator.get_scores.assert_called_once()
    
    def test_returns_all_questions(self, sample_questions, mock_evaluator):
        """All questions are returned after ranking."""
        with patch('server.get_qa_evaluator', return_value=mock_evaluator):
            result = score_and_rank_questions(sample_questions)
            assert len(result) == len(sample_questions)


# ============================================================================
# EDGE CASES
# ============================================================================

class TestEdgeCases:
    """Test boundary conditions."""
    
    def test_empty_list(self):
        """Empty list returns empty."""
        assert score_and_rank_questions([]) == []
    
    def test_small_list_no_scoring(self):
        """Lists with < 3 questions skip scoring."""
        questions = [{"question": "Q1?", "answer": "A1"}]
        assert score_and_rank_questions(questions) == questions
        
        questions = [
            {"question": "Q1?", "answer": "A1"},
            {"question": "Q2?", "answer": "A2"}
        ]
        assert score_and_rank_questions(questions) == questions
    
    def test_exactly_three_triggers_scoring(self, mock_evaluator):
        """Exactly 3 questions trigger scoring."""
        questions = [
            {"question": "Q1?", "answer": "A1"},
            {"question": "Q2?", "answer": "A2"},
            {"question": "Q3?", "answer": "A3"}
        ]
        mock_evaluator.get_scores = Mock(return_value=[2, 0, 1])
        
        with patch('server.get_qa_evaluator', return_value=mock_evaluator):
            result = score_and_rank_questions(questions)
            
            assert len(result) == 3
            mock_evaluator.encode_qa_pairs.assert_called_once()


# ============================================================================
# FAILURE HANDLING
# ============================================================================

class TestFailureHandling:
    """Test fallback behavior on errors."""
    
    def test_encoding_failure_returns_original(self, sample_questions):
        """Encoding exception returns original questions."""
        mock_eval = Mock()
        mock_eval.encode_qa_pairs = Mock(side_effect=Exception("Encoding failed"))
        
        with patch('server.get_qa_evaluator', return_value=mock_eval):
            result = score_and_rank_questions(sample_questions)
            assert result == sample_questions
    
    def test_scoring_failure_returns_original(self, sample_questions):
        """Scoring exception returns original questions."""
        mock_eval = Mock()
        mock_eval.encode_qa_pairs = Mock(return_value=[Mock()] * 5)
        mock_eval.get_scores = Mock(side_effect=RuntimeError("Scoring failed"))
        
        with patch('server.get_qa_evaluator', return_value=mock_eval):
            result = score_and_rank_questions(sample_questions)
            assert result == sample_questions
    
    def test_invalid_indices_returns_original(self, sample_questions):
        """Invalid indices from evaluator returns original questions."""
        mock_eval = Mock()
        mock_eval.encode_qa_pairs = Mock(return_value=[Mock()] * 5)
        mock_eval.get_scores = Mock(return_value=[99, 100, 101])  # Out of range
        
        with patch('server.get_qa_evaluator', return_value=mock_eval):
            result = score_and_rank_questions(sample_questions)
            assert result == sample_questions


# ============================================================================
# INPUT VALIDATION
# ============================================================================

class TestInputValidation:
    """Test parse_max_questions validation."""
    
    def test_valid_integer(self):
        """Valid positive integer is accepted."""
        assert parse_max_questions({"max_questions": 5}) == 5
    
    def test_default_value(self):
        """Missing parameter uses default."""
        assert parse_max_questions({}) == 4
        assert parse_max_questions({}, default=10) == 10
    
    def test_invalid_types_rejected(self):
        """Invalid types raise ValueError."""
        with pytest.raises(ValueError):
            parse_max_questions({"max_questions": "5"})
        
        with pytest.raises(ValueError):
            parse_max_questions({"max_questions": 3.5})
        
        with pytest.raises(ValueError):
            parse_max_questions({"max_questions": -5})
        
        with pytest.raises(ValueError):
            parse_max_questions({"max_questions": 0})


# ============================================================================
# API TESTS
# ============================================================================

class TestAPIValidation:
    """Test Flask endpoint validation."""
    
    @patch('server.MCQGen')
    def test_valid_request(self, mock_gen, client):
        """Valid request returns 200."""
        mock_gen.generate_mcq.return_value = {
            "questions": [{"question": "Q?", "answer": "A"}]
        }
        
        response = client.post('/get_mcq', json={
            "input_text": "AI is great.",
            "max_questions": 4
        })
        
        assert response.status_code == 200
        assert isinstance(response.json.get("output"), list)
    
    @pytest.mark.parametrize("payload", [
        {"input_text": "", "max_questions": 4},  # Empty string
        {"input_text": "   ", "max_questions": 4},  # Whitespace only
        {"input_text": 123, "max_questions": 4},  # Non-string
        {"max_questions": 4},  # Missing input_text
    ])
    def test_invalid_input_text(self, client, payload):
        """Invalid input_text returns 400."""
        response = client.post('/get_mcq', json=payload)
        assert response.status_code == 400
    
    @pytest.mark.parametrize("payload", [
        {"input_text": "AI", "max_questions": "5"},  # String
        {"input_text": "AI", "max_questions": -5},  # Negative
        {"input_text": "AI", "max_questions": 0},  # Zero
    ])
    def test_invalid_max_questions(self, client, payload):
        """Invalid max_questions returns 400."""
        response = client.post('/get_mcq', json=payload)
        assert response.status_code == 400
    
    @patch('server.MCQGen')
    @patch('server.get_qa_evaluator')
    def test_scoring_returns_top_k(self, mock_eval_fn, mock_gen, client):
        """Scoring enabled returns top k ranked questions."""
        # Generate 8 questions (2x requested)
        mock_gen.generate_mcq.return_value = {
            "questions": [{"question": f"Q{i}?", "answer": f"A{i}"} for i in range(8)]
        }
        
        # Mock evaluator ranking
        mock_eval = Mock()
        mock_eval.encode_qa_pairs = Mock(return_value=[Mock()] * 8)
        mock_eval.get_scores = Mock(return_value=[7, 5, 3, 1, 6, 4, 2, 0])
        mock_eval_fn.return_value = mock_eval
        
        response = client.post('/get_mcq', json={
            "input_text": "AI is great.",
            "max_questions": 4,
            "use_scoring": True
        })
        
        assert response.status_code == 200
        result = response.json["output"]
        
        # Returns exactly 4 top-ranked questions
        assert isinstance(result, list)
        assert len(result) == 4
        assert result[0]["question"] == "Q7?"
        assert result[1]["question"] == "Q5?"
        assert result[2]["question"] == "Q3?"
        assert result[3]["question"] == "Q1?"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
