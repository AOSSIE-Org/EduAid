import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from server import create_app


INPUT_TEXT = """
Artificial intelligence (AI) is the simulation of human intelligence processes
by machines, especially computer systems. These processes include learning,
reasoning, and self-correction. Machine learning is a subset of AI, and deep
learning is a technique within machine learning.
""".strip()


class StubMCQGenerator:
    def generate_mcq(self, payload):
        return {
            "questions": [
                {
                    "question_statement": "What is AI?",
                    "answer": "Artificial intelligence",
                    "options": ["Artistic input", "Applied internet", "Analog interface"],
                    "context": payload["input_text"],
                }
            ]
        }


class StubShortQGenerator:
    def generate_shortq(self, payload):
        return {
            "questions": [
                {
                    "Question": "What is deep learning?",
                    "Answer": "A technique within machine learning",
                    "context": payload["input_text"],
                }
            ]
        }


class StubBoolQGenerator:
    def generate_boolq(self, payload):
        count = payload["max_questions"]
        return {
            "Boolean_Questions": [f"Boolean question {index + 1}?" for index in range(count)],
            "Text": payload["input_text"],
        }


class StubAnswerPredictor:
    def predict_boolean_answer(self, payload):
        return [True, False][: len(payload["input_question"])]


class StubQuestionGenerator:
    def generate(self, article, answer_style):
        if answer_style == "multiple_choice":
            return [
                {
                    "question": "Original MCQ one?",
                    "answer": [
                        {"answer": "Correct 1", "correct": True},
                        {"answer": "Wrong 1", "correct": False},
                    ],
                },
                {
                    "question": "Original MCQ two?",
                    "answer": [
                        {"answer": "Correct 2", "correct": True},
                        {"answer": "Wrong 2", "correct": False},
                    ],
                },
                {
                    "question": "Original MCQ three?",
                    "answer": [
                        {"answer": "Correct 3", "correct": True},
                        {"answer": "Wrong 3", "correct": False},
                    ],
                },
            ]

        return [
            {"question": "Original short one?", "answer": "A1"},
            {"question": "Original short two?", "answer": "A2"},
            {"question": "Original short three?", "answer": "A3"},
        ]


class StubLLMGenerator:
    def generate_short_questions(self, input_text, max_questions):
        return [{"question": "Short?", "answer": "Yes"}][:max_questions]

    def generate_mcq_questions(self, input_text, max_questions):
        return [
            {
                "question": "MCQ?",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
            }
        ][:max_questions]

    def generate_boolean_questions(self, input_text, max_questions):
        return [{"question": "Boolean?", "answer": True}][:max_questions]

    def generate_all_questions(self, input_text, mcq_count, bool_count, short_count):
        return [
            {"type": "mcq", "question": "MCQ?", "options": ["A", "B"], "answer": "A"},
            {"type": "boolean", "question": "Boolean?", "answer": True},
            {"type": "short_answer", "question": "Short?", "answer": "Answer"},
        ]


class StubQAModel:
    def __call__(self, question, context):
        return {"answer": "Artificial intelligence"}


class StubDocsService:
    def get_document_content(self, document_url):
        return "Document body"


class StubMediaWiki:
    def summary(self, topic, sentences):
        return f"Summary for {topic}"


class StubFileProcessor:
    def process_file(self, uploaded_file):
        return "Processed file content"


class StubFormsExecute:
    def __init__(self, payload):
        self.payload = payload

    def execute(self):
        return self.payload


class StubFormsEndpoint:
    def create(self, body):
        return StubFormsExecute(
            {"formId": "form-123", "responderUri": "https://example.com/form-123"}
        )

    def batchUpdate(self, formId, body):
        return StubFormsExecute({"updated": True, "formId": formId, "body": body})


class StubFormsService:
    def forms(self):
        return StubFormsEndpoint()


class ServerRouteTests(unittest.TestCase):
    def setUp(self):
        services = {
            "mcq_generator": StubMCQGenerator(),
            "shortq_generator": StubShortQGenerator(),
            "boolq_generator": StubBoolQGenerator(),
            "answer_predictor": StubAnswerPredictor(),
            "question_generator": StubQuestionGenerator(),
            "llm_generator": StubLLMGenerator(),
            "qa_model": StubQAModel(),
            "google_docs_service": StubDocsService(),
            "mediawiki": StubMediaWiki(),
            "file_processor": StubFileProcessor(),
            "make_question_harder": lambda question: f"Hard: {question}",
            "forms_service": StubFormsService(),
        }
        self.app = create_app(service_overrides=services)
        self.client = self.app.test_client()

    def test_boolean_answers_use_predictor_output(self):
        response = self.client.post(
            "/get_boolean_answer",
            json={
                "input_text": INPUT_TEXT,
                "input_question": ["Question one?", "Question two?"],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["output"], ["True", "False"])

    def test_hard_short_questions_respect_max_questions(self):
        response = self.client.post(
            "/get_shortq_hard",
            json={"input_text": INPUT_TEXT, "max_questions": 2},
        )

        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(payload["output"]), 2)
        self.assertEqual(payload["output"][0]["question"], "Hard: Original short one?")
        self.assertEqual(payload["output"][1]["question"], "Hard: Original short two?")

    def test_hard_boolean_questions_respect_max_questions(self):
        response = self.client.post(
            "/get_boolq_hard",
            json={"input_text": INPUT_TEXT, "max_questions": 2},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["output"],
            ["Hard: Boolean question 1?", "Hard: Boolean question 2?"],
        )

    def test_generate_gform_returns_structured_links(self):
        response = self.client.post(
            "/generate_gform",
            json={
                "question_type": "get_mcq",
                "qa_pairs": [
                    {
                        "question": "What is AI?",
                        "answer": "Artificial intelligence",
                        "options": ["Applied internet", "Analog interface"],
                    }
                ],
            },
        )

        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["form_id"], "form-123")
        self.assertEqual(payload["form_link"], "https://example.com/form-123")
        self.assertTrue(payload["edit_link"].endswith("/form-123/edit"))

    def test_get_content_returns_503_when_docs_service_is_missing(self):
        app = create_app(service_overrides={"google_docs_service": None})
        client = app.test_client()

        response = client.post(
            "/get_content",
            json={"document_url": "https://docs.google.com/document/d/example/edit"},
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn("Google Docs integration is not configured", response.get_json()["error"])

    def test_get_problems_llm_normalizes_mcq_answer_key(self):
        response = self.client.post(
            "/get_problems_llm",
            json={
                "input_text": INPUT_TEXT,
                "max_questions_mcq": 1,
                "max_questions_boolq": 1,
                "max_questions_shortq": 1,
            },
        )

        payload = response.get_json()["output"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload[0]["type"], "mcq")
        self.assertEqual(payload[0]["correct_answer"], "A")

    def test_health_reports_missing_integrations_without_loading_models(self):
        app = create_app(service_overrides={})
        client = app.test_client()

        response = client.get("/health")
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["status"], "ok")
        self.assertIn("google_docs_configured", payload)
        self.assertIn("google_forms_configured", payload)


if __name__ == "__main__":
    unittest.main()
