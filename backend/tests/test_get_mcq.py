from unittest.mock import patch

def test_get_mcq_partial_generation(client):
    mock_questions = [
        {
            "question_statement": "What is photosynthesis?",
            "answer": "photosynthesis",
            "options": ["Respiration", "Digestion"],
            "question_type": "MCQ",
        }
    ]

    with patch("server.MCQGen.generate_mcq") as mock_generate:
        mock_generate.return_value = {
            "questions": mock_questions
        }

        response = client.post(
            "/get_mcq",
            json={
                "input_text": "Photosynthesis is how plants make food.",
                "max_questions": 5,
                "use_mediawiki": 0,
            },
        )

        assert response.status_code == 200
        data = response.get_json()
        assert "output" in data
        assert len(data["output"]) == 1


def test_get_mcq_no_questions(client):
    with patch("server.MCQGen.generate_mcq") as mock_generate:
        mock_generate.return_value = {
            "questions": []
        }

        response = client.post(
            "/get_mcq",
            json={
                "input_text": "Too short.",
                "max_questions": 5,
                "use_mediawiki": 0,
            },
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["output"] == []