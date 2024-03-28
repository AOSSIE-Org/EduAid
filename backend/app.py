from flask import Flask, jsonify, request
from flask_cors import CORS
from google.oauth2 import service_account
from googleapiclient.discovery import build
import re

# Replace the path below with the path to your service account key JSON file
SERVICE_ACCOUNT_FILE = './service_account_key.json'

# Scopes required for accessing Google Docs API
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

app = Flask(__name__)
CORS(app)

# Initialize the Google Docs API client
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

docs_service = build('docs', 'v1', credentials=credentials)


def extract_document_id(url):
    """
    Extracts the Google Docs document ID from a given URL.
    """
    match = re.search(r'/document/d/([^/]+)', url)
    if match:
        return match.group(1)
    return None


@app.route('/get_content', methods=['POST'])
def get_content():
    try:
        data = request.get_json()
        document_url = data.get('document_url')
        if not document_url:
            return jsonify({'error': 'Document URL is required'}), 400
        
        document_id = extract_document_id(document_url)
        if not document_id:
            return jsonify({'error': 'Invalid document URL'}), 400

        response = docs_service.documents().get(documentId=document_id).execute()
        doc = response.get('body', {})

        text = ''
        for element in doc.get('content', []):
            if 'paragraph' in element:
                for p in element['paragraph']['elements']:
                    if 'textRun' in p:
                        text += p['textRun']['content']

        return jsonify(text.strip())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)