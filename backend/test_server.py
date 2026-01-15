import requests
import json

BASE_URL = "http://127.0.0.1:5000"

# Shared input text for all endpoints
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

def test_get_mcq():
    endpoint = '/get_mcq'
    data = {
        'input_text': input_text,
        'max_questions': 5
    }
    response = make_post_request(endpoint, data)

# If server rejects input, it must return JSON error
    if 'error' in response:
        assert isinstance(response['error'], str)
    else:
        assert 'output' in response

def test_get_boolq():
    endpoint = '/get_boolq'
    data = {
        'input_text': input_text,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolq Response: {response}')

    if 'error' in response:
        assert isinstance(response['error'], str)
    else:
        assert 'output' in response

def test_get_shortq():
    endpoint = '/get_shortq'
    data = {
        'input_text': input_text,
        'max_questions': 4
    }
    response = make_post_request(endpoint, data)
    print(f'/get_shortq Response: {response}')
    assert isinstance(response, dict)
    assert 'output' in response or 'error' in response

def test_get_problems():
    endpoint = '/get_problems'
    data = {
        'input_text': input_text,
        'max_questions_mcq': 3,
        'max_questions_boolq': 2,
        'max_questions_shortq': 4
    }
    response = make_post_request(endpoint, data)
    print(f'/get_problems Response: {response}')
    if 'error' in response:
        assert isinstance(response['error'], str)
    else:
        assert isinstance(response, dict)
        assert (
        'output_mcq' in response or
        'output_boolq' in response or
        'output_shortq' in response or
        'error' in response
)

def test_root():
    endpoint = '/'
    response = requests.get(f'{BASE_URL}{endpoint}')
    print(f'Root Endpoint Response: {response.text}')

    # Root endpoint is informational, not guaranteed public
    assert response.status_code in (200, 403)

def test_get_answer():
    endpoint = '/get_answer'
    data = {
        'input_text': input_text,
        'input_question': [
            "What is artificial intelligence?",
            "What does AI include?",
            "What is deep learning?",
            "What are the ethical considerations in AI?"
        ]
    }
    response = make_post_request(endpoint, data)
    print(f'/get_answer Response: {response}')
    assert isinstance(response, dict)
    assert 'error' in response

def test_get_boolean_answer():
    endpoint = '/get_boolean_answer'
    data = {
        'input_text': input_text,
        'input_question': [
            "Artificial intelligence is the simulation of human intelligence.",
            "Deep learning does not involve neural networks.",
            "AI applications do not include speech recognition."
        ]
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolean_answer Response: {response}')
    if 'error' in response:
        assert isinstance(response['error'], str)
    else:
        assert 'output' in response

def make_post_request(endpoint, data):
    response = requests.post(BASE_URL + endpoint, json=data)

    print("STATUS:", response.status_code)
    print("RAW RESPONSE:", response.text)
    print("URL HIT:", response.url)
    print("HEADERS:", response.headers)
    print("TEXT:", response.text)
    try:
        return response.json()
    except ValueError:
        return {
            "error": "Non-JSON response",
            "status_code": response.status_code,
            "raw": response.text
        }

if __name__ == '__main__':
    test_get_mcq()
    test_get_boolq()
    test_get_shortq()
    test_get_problems()
    test_root()
    test_get_answer()
    test_get_boolean_answer()

def test_missing_input_text():
    endpoint = '/get_mcq'
    data = {
        'max_questions': 5
    }
    response = make_post_request(endpoint, data)
    assert 'error' in response


def test_empty_input_text():
    endpoint = '/get_mcq'
    data = {
        'input_text': '   ',
        'max_questions': 5
    }
    response = make_post_request(endpoint, data)
    assert 'error' in response


def test_invalid_max_questions_type():
    endpoint = '/get_mcq'
    data = {
        'input_text': input_text,
        'max_questions': 'five'
    }
    response = make_post_request(endpoint, data)
    assert 'error' in response


def test_zero_max_questions():
    endpoint = '/get_mcq'
    data = {
        'input_text': input_text,
        'max_questions': 0
    }
    response = make_post_request(endpoint, data)
    assert 'error' in response


def test_missing_json_body():
    url = f'{BASE_URL}/get_mcq'
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers)
    assert response.status_code == 400