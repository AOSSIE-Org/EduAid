import requests
import json

BASE_URL = 'http://localhost:5000'

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
    print(f'/get_mcq Response: {response.json()}')
    assert response.status_code == 200
    assert 'output' in response.json()

def test_get_boolq():
    endpoint = '/get_boolq'
    data = {
        'input_text': input_text,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolq Response: {response.json()}')
    assert response.status_code == 200
    assert 'output' in response.json()

def test_get_shortq():
    endpoint = '/get_shortq'
    data = {
        'input_text': input_text,
        'max_questions': 4
    }
    response = make_post_request(endpoint, data)
    print(f'/get_shortq Response: {response.json()}')
    assert response.status_code == 200
    assert 'output' in response.json()

def test_get_problems():
    endpoint = '/get_problems'
    data = {
        'input_text': input_text,
        'max_questions_mcq': 3,
        'max_questions_boolq': 2,
        'max_questions_shortq': 4
    }
    response = make_post_request(endpoint, data)
    print(f'/get_problems Response: {response.json()}')
    assert response.status_code == 200
    json_response = response.json()
    assert 'output_mcq' in json_response
    assert 'output_boolq' in json_response
    assert 'output_shortq' in json_response

def test_root():
    endpoint = '/'
    response = requests.get(f'{BASE_URL}{endpoint}')
    print(f'Root Endpoint Response: {response.text}')
    assert response.status_code == 200

def test_get_answer():
    endpoint = '/get_shortq_answer'
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
    print(f'/get_shortq_answer Response: {response.json()}')
    assert response.status_code == 200
    assert 'output' in response.json()

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
    print(f'/get_boolean_answer Response: {response.json()}')
    assert response.status_code == 200
    assert 'output' in response.json()

def make_post_request(endpoint, data):
    url = f'{BASE_URL}{endpoint}'
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, data=json.dumps(data))
    return response


def test_get_boolq_missing_input():
    """Test /get_boolq with missing input_text - should return 400 error."""
    endpoint = '/get_boolq'
    data = {
        'use_mediawiki': 0,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolq (missing input) Status: {response.status_code}')
    print(f'/get_boolq (missing input) Response: {response.json()}')
    assert response.status_code == 400
    assert 'error' in response.json()


def test_get_boolq_short_input():
    """Test /get_boolq with very short input_text - should return 400 error."""
    endpoint = '/get_boolq'
    data = {
        'input_text': 'Photosynthesis',
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolq (short input) Status: {response.status_code}')
    print(f'/get_boolq (short input) Response: {response.json()}')
    assert response.status_code == 400
    assert 'error' in response.json()


def test_get_mcq_missing_input():
    """Test /get_mcq with missing input_text - should return 400 error."""
    endpoint = '/get_mcq'
    data = {
        'use_mediawiki': 0,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_mcq (missing input) Status: {response.status_code}')
    print(f'/get_mcq (missing input) Response: {response.json()}')
    assert response.status_code == 400
    assert 'error' in response.json()


def test_get_shortq_missing_input():
    """Test /get_shortq with missing input_text - should return 400 error."""
    endpoint = '/get_shortq'
    data = {
        'use_mediawiki': 0,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_shortq (missing input) Status: {response.status_code}')
    print(f'/get_shortq (missing input) Response: {response.json()}')
    assert response.status_code == 400
    assert 'error' in response.json()


def test_get_boolq_mediawiki_empty_search():
    """Test /get_boolq with use_mediawiki=1 but empty search term - should return 400 error."""
    endpoint = '/get_boolq'
    data = {
        'input_text': '',
        'use_mediawiki': 1,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolq (mediawiki empty search) Status: {response.status_code}')
    print(f'/get_boolq (mediawiki empty search) Response: {response.json()}')
    assert response.status_code == 400
    assert 'error' in response.json()


def test_get_mcq_mediawiki_skips_validation():
    """Test that MediaWiki mode skips input length validation.
    
    When use_mediawiki=1, the input_text is treated as a search term,
    so normal character/word count validation should be bypassed.
    Only MediaWiki search term validation (min 3 chars) applies.
    """
    endpoint = '/get_mcq'
    data = {
        'input_text': 'Artificial Intelligence',  # Short but valid search term
        'use_mediawiki': 1,
        'max_questions': 2
    }
    response = make_post_request(endpoint, data)
    print(f'/get_mcq (mediawiki mode) Status: {response.status_code}')
    # Should NOT return 400 for short input - MediaWiki fetches content
    # It should either succeed (200) or fail for a different reason (e.g., API error)
    assert response.status_code != 400 or 'Search term' in response.json().get('error', '')


if __name__ == '__main__':
    # Test input validation (Issue #336)
    print("=" * 50)
    print("Testing Input Validation (Issue #336)")
    print("=" * 50)
    test_get_boolq_missing_input()
    test_get_boolq_short_input()
    test_get_mcq_missing_input()
    test_get_shortq_missing_input()
    test_get_boolq_mediawiki_empty_search()
    test_get_mcq_mediawiki_skips_validation()
    print("\nAll validation tests passed!")
    
    # Test valid inputs
    print("\n" + "=" * 50)
    print("Testing Valid Inputs")
    print("=" * 50)
    test_get_mcq()
    test_get_boolq()
    test_get_shortq()
    test_get_problems()
    test_root()
    test_get_answer()
    test_get_boolean_answer()
    print("\nAll tests passed!")

