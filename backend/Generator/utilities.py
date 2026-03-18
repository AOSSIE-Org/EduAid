import os
import re
import fitz
import mammoth
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

    def extract_text_from_pdf(self, file_path):
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def extract_text_from_docx(self, file_path):
        with open(file_path, "rb") as docx_file:
            result = mammoth.extract_raw_text(docx_file)
            return result.value

    def process_file(self, file):
        file_path = os.path.join(self.upload_folder, file.filename)
        file.save(file_path)
        content = ""

        if file.filename.endswith('.txt'):
            with open(file_path, 'r') as f:
                content = f.read()
        elif file.filename.endswith('.pdf'):
            content = self.extract_text_from_pdf(file_path)
        elif file.filename.endswith('.docx'):
            content = self.extract_text_from_docx(file_path)

        os.remove(file_path)
        return content
