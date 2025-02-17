# from django.test import TestCase
# from rest_framework.test import APIClient
# from django.urls import reverse
# from unittest.mock import patch, MagicMock
# from api.views.googleForm import generate_gform

# class GenerateGFormTests(TestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.generate_gform_url = reverse('generate_gform')
#         self.sample_qa_pairs = [
#             {"question": "What is Django?", "answer": "A Python web framework"},
#             {"question": "Explain REST API", "answer": "An API using HTTP methods"}
#         ]

#     @patch('api.views.googleForm.discovery.build')
#     @patch('api.views.googleForm.client.flow_from_clientsecrets')
#     @patch('api.views.googleForm.tools.run_flow')
#     @patch('api.views.googleForm.file.Storage')
#     def test_generate_gform_success(self, mock_storage, mock_run_flow, mock_flow, mock_discovery):
#         """Test successful Google Form generation"""
#         mock_storage.return_value.get.return_value = None
#         mock_run_flow.return_value.authorize.return_value = MagicMock()
#         mock_flow.return_value = MagicMock()
#         mock_service = MagicMock()
#         mock_discovery.return_value = mock_service

#         mock_service.forms.return_value.create.return_value.execute.return_value = {
#             'formId': '12345',
#             'responderUri': 'http://example.com/form'
#         }

#         mock_service.forms.return_value.batchUpdate.return_value.execute.return_value = {}

#         response = self.client.post(self.generate_gform_url, {
#             'qa_pairs': self.sample_qa_pairs,
#             'question_type': 'get_shortq'
#         }, format='json')

#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.data, 'http://example.com/form')

#     def test_missing_qa_pairs(self):
#         """Test missing QA pairs in request"""
#         response = self.client.post(self.generate_gform_url, {
#             'question_type': 'get_shortq'
#         }, format='json')

#         self.assertEqual(response.status_code, 400)
#         self.assertIn('error', response.data)

#     def test_invalid_question_type(self):
#         """Test invalid question type handling"""
#         response = self.client.post(self.generate_gform_url, {
#             'qa_pairs': self.sample_qa_pairs,
#             'question_type': 'invalid_type'
#         }, format='json')

#         self.assertEqual(response.status_code, 400)
#         self.assertIn('error', response.data)
