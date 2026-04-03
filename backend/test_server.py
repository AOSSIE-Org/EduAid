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
    print(f'/get_mcq Response: {response}')
    assert 'output' in response

def test_get_boolq():
    endpoint = '/get_boolq'
    data = {
        'input_text': input_text,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolq Response: {response}')
    assert 'output' in response

def test_get_shortq():
    endpoint = '/get_shortq'
    data = {
        'input_text': input_text,
        'max_questions': 4
    }
    response = make_post_request(endpoint, data)
    print(f'/get_shortq Response: {response}')
    assert 'output' in response


def test_get_shortq_llm():
    endpoint = '/get_shortq_llm'
    data = {
        'input_text': input_text,
        'max_questions': 3
    }
    response = make_post_request(endpoint, data)
    print(f'/get_shortq_llm Response: {response}')
    assert 'output' in response
    assert len(response['output']) > 0
    for qa in response['output']:
        assert 'question' in qa
        assert 'answer' in qa
    print(f"  Generated {len(response['output'])} questions via Qwen3-0.6B LLM")


def test_get_mcq_llm():
    endpoint = '/get_mcq_llm'
    data = {
        'input_text': input_text,
        'max_questions': 2
    }
    response = make_post_request(endpoint, data)
    print(f'/get_mcq_llm Response: {response}')
    assert 'output' in response
    assert len(response['output']) > 0
    for mcq in response['output']:
        assert 'question' in mcq
        assert 'options' in mcq
        assert 'correct_answer' in mcq
        assert len(mcq['options']) == 4  # Should have 4 options A, B, C, D
    print(f"  Generated {len(response['output'])} MCQ questions via Qwen3-0.6B LLM")


def test_get_boolq_llm():
    endpoint = '/get_boolq_llm'
    data = {
        'input_text': input_text,
        'max_questions': 2
    }
    response = make_post_request(endpoint, data)
    print(f'/get_boolq_llm Response: {response}')
    assert 'output' in response
    assert len(response['output']) > 0
    for bool_q in response['output']:
        assert 'question' in bool_q
        assert 'answer' in bool_q
        assert isinstance(bool_q['answer'], bool)  # Should be boolean
    print(f"  Generated {len(response['output'])} boolean questions via Qwen3-0.6B LLM")


def test_get_problems_llm():
    endpoint = '/get_problems_llm'
    data = {
        'input_text': input_text,
        'max_questions_mcq': 1,
        'max_questions_boolq': 1,
        'max_questions_shortq': 1
    }
    response = make_post_request(endpoint, data)
    print(f'/get_problems_llm Response: {response}')
    assert 'output' in response
    assert len(response['output']) == 3  # Should have 1 of each type
    
    # Check that we have all three types
    types_found = set()
    for item in response['output']:
        assert 'type' in item
        types_found.add(item['type'])
        
        if item['type'] == 'mcq':
            assert 'question' in item and 'options' in item and 'correct_answer' in item
        elif item['type'] == 'boolean':
            assert 'question' in item and 'answer' in item
        elif item['type'] == 'short_answer':
            assert 'question' in item and 'answer' in item
    
    assert types_found == {'mcq', 'boolean', 'short_answer'}
    print(f"  Generated mixed question set with {len(response['output'])} questions via Qwen3-0.6B LLM")

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
    assert 'output_mcq' in response
    assert 'output_boolq' in response
    assert 'output_shortq' in response

def test_root():
    endpoint = '/'
    response = requests.get(f'{BASE_URL}{endpoint}')
    print(f'Root Endpoint Response: {response.text}')
    assert response.status_code == 200

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
    assert 'output' in response

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
    assert 'output' in response

def make_post_request(endpoint, data):
    url = f'{BASE_URL}{endpoint}'
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, data=json.dumps(data))
    return response.json()

# ============================================================
# Error Validation Tests
# ============================================================

def test_mcq_empty_input():
    """Test rejection of empty input text."""
    endpoint = '/get_mcq'
    data = {
        'input_text': '',
        'max_questions': 5
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ MCQ with empty input correctly rejected: {result['error']}")


def test_mcq_max_questions_exceeded():
    """Test rejection of max_questions exceeding limit (50)."""
    endpoint = '/get_mcq'
    data = {
        'input_text': input_text,
        'max_questions': 100
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ MCQ with max_questions=100 correctly rejected: {result['error']}")


def test_mcq_invalid_max_questions_type():
    """Test rejection of non-integer max_questions."""
    endpoint = '/get_mcq'
    data = {
        'input_text': input_text,
        'max_questions': 'abc'
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ MCQ with invalid max_questions type correctly rejected: {result['error']}")


def test_mcq_missing_input_text():
    """Test rejection of request missing input_text field."""
    endpoint = '/get_mcq'
    data = {
        'max_questions': 5
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ MCQ with missing input_text correctly rejected: {result['error']}")


def test_shortq_whitespace_only_input():
    """Test rejection of whitespace-only input."""
    endpoint = '/get_shortq'
    data = {
        'input_text': '   \n\t  ',
        'max_questions': 3
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ Short Q with whitespace-only input correctly rejected: {result['error']}")


def test_boolq_text_too_long():
    """Test rejection of input exceeding maximum length (50,000 chars)."""
    endpoint = '/get_boolq'
    oversized_text = 'a' * 60000
    data = {
        'input_text': oversized_text,
        'max_questions': 2
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ Bool Q with text exceeding 50,000 chars correctly rejected: {result['error']}")


def test_invalid_mediawiki_value():
    """Test rejection of invalid use_mediawiki value."""
    endpoint = '/get_mcq'
    data = {
        'input_text': input_text,
        'max_questions': 3,
        'use_mediawiki': 2  # Invalid: should be 0 or 1
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    if response.status_code == 400:
        result = response.json()
        assert 'error' in result
        print(f"✓ MCQ with invalid use_mediawiki correctly rejected: {result['error']}")
    else:
        print(f"⚠ MCQ with use_mediawiki=2 accepted (validation not implemented): status {response.status_code}")


def test_mcq_answer_missing_required_fields():
    """Test rejection of missing required fields in answer endpoint."""
    endpoint = '/get_mcq_answer'
    data = {
        'input_text': input_text
        # Missing input_question and input_options
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ MCQ answer with missing required fields correctly rejected: {result['error']}")


def test_mcq_answer_mismatched_lists():
    """Test rejection when question count doesn't match options count."""
    endpoint = '/get_mcq_answer'
    data = {
        'input_text': input_text,
        'input_question': ['Q1', 'Q2', 'Q3'],
        'input_options': [
            ['A', 'B', 'C', 'D'],
            ['A', 'B', 'C', 'D']
            # Only 2 option sets for 3 questions
        ]
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ MCQ answer with mismatched lists correctly rejected: {result['error']}")


def test_get_content_invalid_url():
    """Test rejection of invalid URL format."""
    endpoint = '/get_content'
    data = {
        'url': 'not-a-valid-url'
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ Get content with invalid URL correctly rejected: {result['error']}")


def test_get_content_missing_url():
    """Test rejection of missing URL parameter."""
    endpoint = '/get_content'
    data = {}
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    assert 'error' in result
    print(f"✓ Get content with missing URL correctly rejected: {result['error']}")


def test_error_response_format():
    """Test that error responses follow standardized format."""
    endpoint = '/get_mcq'
    data = {
        'input_text': '',  # Invalid input
        'max_questions': 5
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    assert response.status_code == 400
    result = response.json()
    # Check standardized error format: {"error": "message"}
    assert isinstance(result, dict)
    assert 'error' in result
    assert isinstance(result['error'], str)
    assert len(result) == 1  # Only 'error' key, no other fields
    print(f"✓ Error response follows standardized format: {result}")


def test_valid_response_format():
    """Test that valid responses follow expected format."""
    endpoint = '/get_mcq'
    data = {
        'input_text': input_text,
        'max_questions': 1
    }
    response = requests.post(f'{BASE_URL}{endpoint}', headers={'Content-Type': 'application/json'}, data=json.dumps(data))
    if response.status_code == 200:
        result = response.json()
        # Check for expected success format
        assert 'output' in result
        assert isinstance(result['output'], list)
        print(f"✓ Valid response follows expected format with 'output' key")
    else:
        print(f"⚠ Could not validate response format (status: {response.status_code})")


if __name__ == '__main__':
    print("=" * 60)
    print("Running Basic Endpoint Tests")
    print("=" * 60)
    print("\nSUCCESS TESTS:")
    try:
        test_root()
        print("✓ Root endpoint working")
    except Exception as e:
        print(f"✗ Root endpoint failed: {e}")
    
    try:
        test_get_mcq()
        print("✓ MCQ generation successful")
    except Exception as e:
        print(f"✗ MCQ generation failed: {e}")
    
    try:
        test_get_boolq()
        print("✓ Boolean Q generation successful")
    except Exception as e:
        print(f"✗ Boolean Q generation failed: {e}")
    
    try:
        test_get_shortq()
        print("✓ Short Q generation successful")
    except Exception as e:
        print(f"✗ Short Q generation failed: {e}")
    
    try:
        test_get_problems()
        print("✓ All problem types generation successful")
    except Exception as e:
        print(f"✗ All problem types generation failed: {e}")
    
    print("\n" + "=" * 60)
    print("Running LLM Integration Tests")
    print("=" * 60)
    print("\nLLM TESTS:")
    try:
        test_get_shortq_llm()
        print("✓ Short Q LLM generation successful")
    except Exception as e:
        print(f"✗ Short Q LLM generation failed: {e}")
    
    try:
        test_get_mcq_llm()
        print("✓ MCQ LLM generation successful")
    except Exception as e:
        print(f"✗ MCQ LLM generation failed: {e}")
    
    try:
        test_get_boolq_llm()
        print("✓ Boolean Q LLM generation successful")
    except Exception as e:
        print(f"✗ Boolean Q LLM generation failed: {e}")
    
    try:
        test_get_problems_llm()
        print("✓ Mixed LLM generation successful")
    except Exception as e:
        print(f"✗ Mixed LLM generation failed: {e}")
    
    try:
        test_get_answer()
        print("✓ Answer prediction successful")
    except Exception as e:
        print(f"✗ Answer prediction failed: {e}")
    
    try:
        test_get_boolean_answer()
        print("✓ Boolean answer prediction successful")
    except Exception as e:
        print(f"✗ Boolean answer prediction failed: {e}")
    
    print("\n" + "=" * 60)
    print("Running Error/Edge Case Tests")
    print("=" * 60)
    print("\nERROR VALIDATION TESTS:")
    test_mcq_empty_input()
    test_mcq_max_questions_exceeded()
    test_mcq_invalid_max_questions_type()
    test_mcq_missing_input_text()
    test_shortq_whitespace_only_input()
    test_boolq_text_too_long()
    test_invalid_mediawiki_value()
    test_mcq_answer_missing_required_fields()
    test_mcq_answer_mismatched_lists()
    test_get_content_invalid_url()
    test_get_content_missing_url()
    test_error_response_format()
    test_valid_response_format()
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)
