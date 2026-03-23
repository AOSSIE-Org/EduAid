"""
Tests for the /get_mcq endpoint.

These tests validate correct behavior when the MCQ generator
returns fewer questions than requested or returns no questions.
"""
from unittest.mock import patch


def test_get_mcq_partial_generation(client):
    """
    Verify that /get_mcq returns partial results when fewer MCQs
    are generated than requested.
    """
    with patch("backend.server.MCQGen.generate_mcq") as mock_generate:
        mock_generate.return_value = {
            "questions": [
                {
                    "question_statement": "What is photosynthesis?",
                    "answer": "photosynthesis",
                    "options": ["Respiration", "Digestion"],
                    "question_type": "MCQ",
                }
            ]
        }

        response = client.post(
            "/get_mcq",
            json={
                "input_text": "Photosynthesis text",
                "max_questions": 5,
            },
        )

        assert response.status_code == 200

        data = response.get_json()
        assert data is not None, "Expected JSON response from /get_mcq"
        assert "output" in data
        assert len(data["output"]) == 1