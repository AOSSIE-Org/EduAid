# tests/test_getQuestions.py
from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse

class QuestionGenerationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sample_text = """
        Python is a high-level programming language. It emphasizes code readability 
        with its notable use of significant indentation. Python's dynamic typing 
        and dynamic binding make it attractive for rapid application development.
        """
        self.base_payload = {
            "input_text": self.sample_text,
            "use_mediawiki": 0,
            "max_questions": 4
        }

    def test_get_mcq(self):
        url = reverse('get_mcq')
        
        # Test normal case
        response = self.client.post(url, self.base_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.data)
        self.assertIsInstance(response.data['output'], list)
        
        # Validate question count doesn't exceed max
        questions = response.data['output']
        self.assertLessEqual(len(questions), self.base_payload['max_questions'])
        
        # Test empty input case
        response = self.client.post(url, {"input_text": "", "max_questions": 4}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['output']), 0)

    def test_get_boolq(self):
        """Test boolean question generation endpoint"""
        url = reverse('get_boolq')
        response = self.client.post(url, self.base_payload, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.data)
        self.assertIsInstance(response.data['output'], list)

    def test_get_shortq(self):
        """Test short question generation endpoint"""
        url = reverse('get_shortq')
        response = self.client.post(url, self.base_payload, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.data)
        self.assertIsInstance(response.data['output'], list)

    def test_get_problems(self):
        """Test combined question generation endpoint"""
        url = reverse('get_problems')
        payload = {
            "input_text": self.sample_text,
            "use_mediawiki": 0,
            "max_questions_mcq": 2,
            "max_questions_boolq": 2,
            "max_questions_shortq": 2
        }
        response = self.client.post(url, payload, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('output_mcq', response.data)
        self.assertIn('output_boolq', response.data)
        self.assertIn('output_shortq', response.data)

    def test_get_mcq_hard(self):
        """Test hard multiple choice question generation endpoint"""
        url = reverse('get_mcq_hard')
        payload = {
            "input_text": self.sample_text,
            "use_mediawiki": 0,
            "input_question": ["What is Python?", "What makes Python attractive?"]
        }
        response = self.client.post(url, payload, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.data)

    def test_get_shortq_hard(self):
        """Test hard short question generation endpoint"""
        url = reverse('get_shortq_hard')
        payload = {
            "input_text": self.sample_text,
            "use_mediawiki": 0,
            "input_question": ["What is Python?", "What makes Python attractive?"]
        }
        response = self.client.post(url, payload, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.data)