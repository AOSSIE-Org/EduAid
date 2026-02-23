from unittest.mock import patch

def test_get_mcq_partial_generation(client):
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
        assert len(data["output"]) == 1