from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from unittest.mock import patch, MagicMock
from api.views.getContent import get_content

class GetContentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sample_url = "https://docs.google.com/document/d/1KsRdDzGRHOK13AyfMXFc7vA6niMMNJ2-wx-0JSaIbh4/edit?usp=sharing"
        self.valid_payload = {'document_url': self.sample_url}
        self.sample_content = "Sample document text content"

    @patch('api.views.getContent.docs_service')
    def test_valid_document_url(self, mock_docs_service):
        """Test successful content retrieval"""
        # Mock the document service response
        mock_docs_service.get_document_content.return_value = self.sample_content

        response = self.client.post(
            reverse('get_content'),
            self.valid_payload,
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['content'], self.sample_content)
        mock_docs_service.get_document_content.assert_called_once_with(self.sample_url)

    def test_missing_document_url(self):
        """Test request without document_url"""
        response = self.client.post(
            reverse('get_content'),
            {},
            format='json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Document URL is required')

    @patch('api.views.getContent.docs_service')
    def test_invalid_document_url(self, mock_docs_service):
        """Test invalid document URL handling"""
        # Mock service to raise validation error
        mock_docs_service.get_document_content.side_effect = ValueError("Invalid document URL")

        response = self.client.post(
            reverse('get_content'),
            self.valid_payload,
            format='json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Invalid document URL')

    @patch('api.views.getContent.docs_service')
    def test_service_error_handling(self, mock_docs_service):
        """Test unexpected service errors"""

        mock_docs_service.get_document_content.side_effect = Exception("Service unavailable")

        response = self.client.post(
            reverse('get_content'),
            self.valid_payload,
            format='json'
        )

        self.assertEqual(response.status_code, 500)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Service unavailable')

    def test_empty_document_url(self):
        """Test empty document_url parameter"""
        response = self.client.post(
            reverse('get_content'),
            {'document_url': ''},
            format='json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Document URL is required')