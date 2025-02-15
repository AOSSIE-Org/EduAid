from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from unittest.mock import patch
from api.views.getAnswers import get_mcq_answer, get_shortq_answer, get_boolean_answer

class AnswerGenerationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sample_text = """
        Python is a high-level programming language. It emphasizes code readability 
        with its notable use of significant indentation. Python's dynamic typing 
        and dynamic binding make it attractive for rapid application development.
        """

    def test_get_mcq_answer(self):
        url = reverse('get_mcq_answer')
        # Valid case
        valid_payload = {
            "input_text": self.sample_text,
            "input_question": [
                "What type of programming language is Python?",
                "What makes Python attractive for development?"
            ],
            "input_options": [
                ["High-level", "Low-level", "Mid-level", "Assembly"],
                ["Dynamic typing", "Static typing", "No typing", "Strict typing"]
            ]
        }
        response = self.client.post(url, valid_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['output']), 2)
        
        # Test empty options
        empty_payload = {
            "input_text": self.sample_text,
            "input_question": ["What is Python?"],
            "input_options": []
        }
        response = self.client.post(url, empty_payload, format='json')
        self.assertEqual(response.data['output'], [])

        # Test type validation
        invalid_type_payload = {
            "input_text": self.sample_text,
            "input_question": "not-a-list",  # Should be list
            "input_options": [["A", "B"]]
        }
        response = self.client.post(url, invalid_type_payload, format='json')
        self.assertEqual(response.data['output'], [])
    def test_get_shortq_answer(self):
        """Test short answer generation endpoint"""
        url = reverse('get_shortq_answer')
        payload = {
            "input_text": self.sample_text,
            "input_question": [
                "What type of language is Python?",
                "What does Python emphasize?"
            ]
        }
        
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.data)
        self.assertIsInstance(response.data['output'], list)
        self.assertEqual(len(response.data['output']), 
                        len(payload['input_question']))
        
        # Test with empty questions list
        empty_payload = {
            "input_text": self.sample_text,
            "input_question": []
        }
        response = self.client.post(url, empty_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['output'], [])

    def test_get_boolean_answer(self):
        """Test boolean answer generation endpoint"""
        url = reverse('get_boolean_answer')
        payload = {
            "input_text": self.sample_text,
            "input_question": [
                "Is Python a high-level programming language?",
                "Does Python use significant indentation?"
            ]
        }
        
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.data)
        self.assertIsInstance(response.data['output'], list)
        self.assertTrue(all(answer in ['True', 'False'] 
                          for answer in response.data['output']))
        
        # Test with empty questions
        empty_payload = {
            "input_text": self.sample_text,
            "input_question": []
        }
        response = self.client.post(url, empty_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['output'], [])
        
        # Test with invalid input text
        invalid_payload = {
            "input_text": "",
            "input_question": ["Is this valid?"]
        }
        response = self.client.post(url, invalid_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data['output'], list)

    def test_input_validation(self):
        """Test input validation for all answer endpoints"""
        endpoints = [
            'get_mcq_answer',
            'get_shortq_answer',
            'get_boolean_answer'
        ]
        
        for endpoint in endpoints:
            url = reverse(endpoint)
            
            # Test with invalid JSON
            response = self.client.post(url, "invalid json", 
                                      content_type='application/json')
            self.assertEqual(response.status_code, 400)
            
            # Test with empty payload
            response = self.client.post(url, {}, format='json')
            self.assertEqual(response.status_code, 200)
            
            # Test with missing required fields
            response = self.client.post(url, {"input_text": self.sample_text}, 
                                      format='json')
            self.assertEqual(response.status_code, 200)