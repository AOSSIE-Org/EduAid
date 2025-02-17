import pytest
from flask import json
import sys
import os
import io

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from server import app 
input_text = '''
    Artificial intelligence (AI) is the simulation of human intelligence processes 
    by machines, especially computer systems. These processes include learning 
    (the acquisition of information and rules for using the information), reasoning 
    (using rules to reach approximate or definite conclusions), and self-correction.
    
    AI applications include speech recognition, natural language processing, 
    machine vision, expert systems, and robotics. Machine learning, a subset of AI, 
    focuses on the development of algorithms that can learn from and make predictions 
    or decisions based on data.
    
    Deep learning, a technique within machine learning, involves neural networks 
    with many layers (hence the term "deep"). It has revolutionized AI by enabling 
    complex pattern recognition and data processing tasks.
    
    Ethical considerations in AI include issues of bias in algorithms, privacy concerns 
    with data collection, and the impact of AI on jobs and society as a whole.
'''

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_hello(client):
    """Test the root endpoint"""
    rv = client.get('/')
    assert b'The server is working fine' in rv.data

def test_get_mcq(client):
    """Test MCQ generation endpoint"""
    data = {
        "input_text": input_text,
        "use_mediawiki": 0,
        "max_questions": 2
    }
    response = client.post('/get_mcq',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_get_boolq(client):
    """Test Boolean question generation endpoint"""
    data = {
        "input_text": input_text,
        "use_mediawiki": 0,
        "max_questions": 2
    }
    response = client.post('/get_boolq',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_get_shortq(client):
    """Test short question generation endpoint"""
    data = {
        "input_text": input_text,
        "use_mediawiki": 0,
        "max_questions": 2
    }
    response = client.post('/get_shortq',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_get_problems(client):
    """Test combined problems generation endpoint"""
    data = {
        "input_text": input_text,
        "use_mediawiki": 0,
        "max_questions_mcq": 2,
        "max_questions_boolq": 2,
        "max_questions_shortq": 2
    }
    response = client.post('/get_problems',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output_mcq' in json_data
    assert 'output_boolq' in json_data
    assert 'output_shortq' in json_data

def test_get_mcq_answer(client):
    """Test MCQ answer prediction endpoint"""
    data = {
        "input_text": input_text,
        "input_question": ["What is Python?"],
        "input_options": [["A programming language", "A snake", "A game"]]
    }
    response = client.post('/get_mcq_answer',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_get_shortq_answer(client):
    """Test short question answer prediction endpoint"""
    data = {
        "input_text": input_text,
        "input_question": ["What is Python?"]
    }
    response = client.post('/get_shortq_answer',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_get_boolean_answer(client):
    """Test boolean answer prediction endpoint"""
    data = {
        "input_text": input_text,
        "input_question": ["Is Python a programming language?"]
    }
    response = client.post('/get_boolean_answer',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_get_content_missing_url(client):
    """Test document content retrieval with missing URL"""
    data = {}
    response = client.post('/get_content',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 400
    json_data = json.loads(response.data)
    assert 'error' in json_data

def test_get_shortq_hard(client):
    """Test hard short question generation endpoint"""
    data = {
        "input_text": input_text,
        "use_mediawiki": 0,
        "input_question": 2
    }
    response = client.post('/get_shortq_hard',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_get_mcq_hard(client):
    """Test hard MCQ generation endpoint"""
    data = {
        "input_text": input_text,
        "use_mediawiki": 0,
        "input_question": 2
    }
    response = client.post('/get_mcq_hard',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'output' in json_data

def test_upload_file_no_file(client):
    """Test file upload with no file"""
    response = client.post('/upload')
    assert response.status_code == 400
    json_data = json.loads(response.data)
    assert 'error' in json_data
    assert json_data['error'] == 'No file part'

def test_upload_file_empty_filename(client):
    """Test file upload with empty filename"""
    response = client.post('/upload', data={'file': (io.BytesIO(b''), '')})
    assert response.status_code == 400
    json_data = json.loads(response.data)
    assert 'error' in json_data
    assert json_data['error'] == 'No selected file'

def test_upload_file_success(client):
    """Test successful file upload"""
    data = {'file': (io.BytesIO(b'test content'), 'test.txt')}
    response = client.post('/upload',
                          data=data,
                          content_type='multipart/form-data')
    assert response.status_code == 200
    json_data = json.loads(response.data)
    assert 'content' in json_data
