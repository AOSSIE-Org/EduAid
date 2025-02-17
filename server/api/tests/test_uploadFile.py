from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from unittest.mock import patch
from io import BytesIO
from api.views.uploadFile import upload_file

class UploadFileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.upload_url = reverse('upload_file')

    @patch('api.views.uploadFile.file_processor.process_file')
    def test_upload_valid_file(self, mock_process_file):
        """Test uploading a valid file"""
        mock_process_file.return_value = "Processed file content"

        test_file = BytesIO(b"Test file content")
        test_file.name = 'testfile.txt'

        response = self.client.post(self.upload_url, {'file': test_file}, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['content'], "Processed file content")

    def test_upload_no_file(self):
        """Test uploading with no file in request"""
        response = self.client.post(self.upload_url, {}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'No file part')

    @patch('api.views.uploadFile.file_processor.process_file')
    def test_upload_invalid_file(self, mock_process_file):
        """Test uploading an unsupported file type or processing error"""
        mock_process_file.return_value = None

        invalid_file = BytesIO(b"Invalid content")
        invalid_file.name = 'invalidfile.txt'

        response = self.client.post(self.upload_url, {'file': invalid_file}, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Unsupported file type or error processing file')
