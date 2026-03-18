import os
import re
import fitz
import mammoth
import uuid
from google.oauth2 import service_account
from googleapiclient.discovery import build


class GoogleDocsService:
    def __init__(self, service_account_file, scopes):
        self.credentials = service_account.Credentials.from_service_account_file(
            service_account_file, scopes=scopes)
        self.docs_service = build('docs', 'v1', credentials=self.credentials)

    @staticmethod
    def extract_document_id(url):
        """
        Extracts the Google Docs document ID from a given URL.
        """
        match = re.search(r'/document/d/([^/]+)', url)
        if match:
            return match.group(1)
        return None

    def get_document_content(self, document_url):
        """
        Retrieves the content of a Google Docs document given its URL.
        """
        document_id = self.extract_document_id(document_url)
        if not document_id:
            raise ValueError('Invalid document URL')

        response = self.docs_service.documents().get(documentId=document_id).execute()
        doc = response.get('body', {})

        text = ''
        for element in doc.get('content', []):
            if 'paragraph' in element:
                for p in element['paragraph']['elements']:
                    if 'textRun' in p:
                        text += p['textRun']['content']

        return text.strip()


class FileProcessor:
    def __init__(self, upload_folder='uploads/'):
        self.upload_folder = upload_folder
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)

    def _sanitize_filename(self, filename):
        """Sanitize filename to prevent path traversal attacks."""
        if not filename:
            return str(uuid.uuid4())

        # Remove path separators and dangerous characters
        safe_filename = os.path.basename(filename)
        safe_filename = re.sub(r'[<>:"/\\|?*]', '_', safe_filename)
        safe_filename = re.sub(r'\.\.', '_', safe_filename)
        
        # Ensure filename is not empty after sanitization
        if not safe_filename or safe_filename in ('.', '..'):
            safe_filename = str(uuid.uuid4())
        return safe_filename

    def extract_text_from_pdf(self, file_path):
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def extract_text_from_docx(self, file_path):
        # Validate file path is within upload folder
        upload_abs = os.path.abspath(self.upload_folder)
        file_abs = os.path.abspath(file_path)
        if not file_abs.startswith(upload_abs):
            raise ValueError("Invalid file path")

        with open(file_path, "rb") as docx_file:
            result = mammoth.extract_raw_text(docx_file)
            return result.value

    def process_file(self, file):
        # Sanitize filename to prevent path traversal
        safe_filename = self._sanitize_filename(file.filename)
        file_path = os.path.join(self.upload_folder, safe_filename)

        # Ensure the file path is within the upload folder
        upload_abs = os.path.abspath(self.upload_folder)
        file_abs = os.path.abspath(file_path)
        if not file_abs.startswith(upload_abs):
            raise ValueError("Invalid file path")

        file.save(file_path)
        content = ""

        if safe_filename.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        elif safe_filename.endswith('.pdf'):
            content = self.extract_text_from_pdf(file_path)
        elif safe_filename.endswith('.docx'):
            content = self.extract_text_from_docx(file_path)

        # Clean up the temporary file
        if os.path.exists(file_path):
            os.remove(file_path)

        return content
