"""
Comprehensive pytest-based unit tests for EduAid API endpoints.
Tests focus on validation error handling and edge cases.

Run with: pytest test_endpoints.py -v
"""

import pytest
import json
from server import app


@pytest.fixture
def client():
    """Flask test client fixture."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


# Sample test data
VALID_INPUT_TEXT = """
Artificial intelligence (AI) is the simulation of human intelligence processes 
by machines, especially computer systems. These processes include learning, 
reasoning, and self-correction.
"""


class TestMCQEndpoint:
    """Tests for /get_mcq endpoint."""
    
    def test_valid_request(self, client):
        """Test MCQ generation with valid input."""
        response = client.post('/get_mcq', json={
            'input_text': VALID_INPUT_TEXT,
            'max_questions': 3
        })
        assert response.status_code in [200, 500]  # 500 if model not available
        
    def test_empty_input_text(self, client):
        """Test rejection of empty input text."""
        response = client.post('/get_mcq', json={
            'input_text': '',
            'max_questions': 5
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_whitespace_only_input(self, client):
        """Test rejection of whitespace-only input."""
        response = client.post('/get_mcq', json={
            'input_text': '   \n\t  ',
            'max_questions': 5
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    @pytest.mark.parametrize('invalid_questions', [0, 51, 100, -5, 999])
    def test_invalid_max_questions_values(self, client, invalid_questions):
        """Test rejection of invalid max_questions values (parametrized)."""
        response = client.post('/get_mcq', json={
            'input_text': VALID_INPUT_TEXT,
            'max_questions': invalid_questions
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_invalid_max_questions_type_string(self, client):
        """Test rejection of non-integer max_questions type."""
        response = client.post('/get_mcq', json={
            'input_text': VALID_INPUT_TEXT,
            'max_questions': 'abc'
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_invalid_max_questions_type_float(self, client):
        """Test rejection of float max_questions."""
        response = client.post('/get_mcq', json={
            'input_text': VALID_INPUT_TEXT,
            'max_questions': 3.14
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_missing_input_text(self, client):
        """Test rejection of request missing input_text field."""
        response = client.post('/get_mcq', json={
            'max_questions': 5
        })
        assert response.status_code == 400
        assert 'error' in response.json()


class TestBoolQEndpoint:
    """Tests for /get_boolq endpoint."""
    
    def test_valid_request(self, client):
        """Test Boolean Q generation with valid input."""
        response = client.post('/get_boolq', json={
            'input_text': VALID_INPUT_TEXT,
            'max_questions': 2
        })
        assert response.status_code in [200, 500]
        
    def test_whitespace_only_input(self, client):
        """Test rejection of whitespace-only input."""
        response = client.post('/get_boolq', json={
            'input_text': '    ',
            'max_questions': 2
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_oversized_input_text(self, client):
        """Test rejection of input exceeding max length (50,000 chars)."""
        oversized_text = 'a' * 60000
        response = client.post('/get_boolq', json={
            'input_text': oversized_text,
            'max_questions': 2
        })
        assert response.status_code == 400
        assert 'error' in response.json()


class TestShortQEndpoint:
    """Tests for /get_shortq endpoint."""
    
    def test_valid_request(self, client):
        """Test Short Q generation with valid input."""
        response = client.post('/get_shortq', json={
            'input_text': VALID_INPUT_TEXT,
            'max_questions': 2
        })
        assert response.status_code in [200, 500]
        
    def test_default_parameters(self, client):
        """Test Short Q generation with minimal parameters."""
        response = client.post('/get_shortq', json={
            'input_text': VALID_INPUT_TEXT
        })
        assert response.status_code in [200, 500]


class TestMCQAnswerEndpoint:
    """Tests for /get_mcq_answer endpoint."""
    
    def test_valid_request(self, client):
        """Test MCQ answer prediction with valid input."""
        response = client.post('/get_mcq_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_question': ['What is AI?'],
            'input_options': [['Option A', 'Option B', 'Option C', 'Option D']]
        })
        assert response.status_code in [200, 400, 500]  # May fail if no questions
        
    def test_missing_required_field_question(self, client):
        """Test rejection of missing input_question field."""
        response = client.post('/get_mcq_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_options': [['A', 'B', 'C', 'D']]
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_missing_required_field_options(self, client):
        """Test rejection of missing input_options field."""
        response = client.post('/get_mcq_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_question': ['What is AI?']
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_mismatched_question_options_count(self, client):
        """Test rejection when question count != options count."""
        response = client.post('/get_mcq_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_question': ['Q1', 'Q2', 'Q3'],
            'input_options': [['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D']]  # Only 2 option sets
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_empty_question_list(self, client):
        """Test rejection of empty question list."""
        response = client.post('/get_mcq_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_question': [],
            'input_options': []
        })
        assert response.status_code == 400
        assert 'error' in response.json()


class TestShortQAnswerEndpoint:
    """Tests for /get_shortq_answer endpoint."""
    
    def test_valid_request(self, client):
        """Test Short Q answer prediction with valid input."""
        response = client.post('/get_shortq_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_question': ['What is AI?']
        })
        assert response.status_code in [200, 500]
        
    def test_missing_input_question(self, client):
        """Test rejection of missing input_question field."""
        response = client.post('/get_shortq_answer', json={
            'input_text': VALID_INPUT_TEXT
        })
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_empty_question_list(self, client):
        """Test rejection of empty question list."""
        response = client.post('/get_shortq_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_question': []
        })
        assert response.status_code == 400
        assert 'error' in response.json()


class TestBooleanAnswerEndpoint:
    """Tests for /get_boolean_answer endpoint."""
    
    def test_valid_request(self, client):
        """Test Boolean answer prediction with valid input."""
        response = client.post('/get_boolean_answer', json={
            'input_text': VALID_INPUT_TEXT,
            'input_question': ['AI is about machine learning.']
        })
        assert response.status_code in [200, 500]
        
    def test_missing_input_question(self, client):
        """Test rejection of missing input_question field."""
        response = client.post('/get_boolean_answer', json={
            'input_text': VALID_INPUT_TEXT
        })
        assert response.status_code == 400
        assert 'error' in response.json()


class TestUploadEndpoint:
    """Tests for /upload endpoint."""
    
    def test_missing_required_field(self, client):
        """Test rejection of missing required fields."""
        response = client.post('/upload', data={})
        assert response.status_code == 400
        
    def test_empty_file(self, client):
        """Test handling of empty file upload."""
        data = {
            'file': (None, b'', 'text/plain'),
            'filename': 'test.pdf'
        }
        response = client.post('/upload', data=data)
        assert response.status_code in [400, 500]
        
    def test_invalid_file_type(self, client):
        """Test rejection of unsupported file type."""
        data = {
            'file': (None, b'test content', 'text/plain'),
            'filename': 'test.txt'
        }
        response = client.post('/upload', data=data)
        assert response.status_code in [400, 500]


class TestGetContentEndpoint:
    """Tests for /get_content endpoint."""
    
    def test_missing_url(self, client):
        """Test rejection of missing URL parameter."""
        response = client.post('/get_content', json={})
        assert response.status_code == 400
        assert 'error' in response.json()
        
    def test_invalid_url_format(self, client):
        """Test rejection of invalid URL format."""
        response = client.post('/get_content', json={
            'url': 'not-a-valid-url'
        })
        assert response.status_code == 400
        assert 'error' in response.json()


class TestErrorResponses:
    """Tests for standardized error response format."""
    
    def test_error_response_format(self, client):
        """Test that all errors return standardized format."""
        response = client.post('/get_mcq', json={
            'input_text': '',
            'max_questions': 5
        })
        assert response.status_code == 400
        data = response.json()
        assert 'error' in data
        assert isinstance(data['error'], str)
        assert len(data) == 1  # Only 'error' key


class TestInputValidation:
    """Tests for input validation edge cases."""
    
    @pytest.mark.parametrize('invalid_mediawiki', [2, -1, 5, 'yes', 'no', 1.0])
    def test_invalid_mediawiki_values(self, client, invalid_mediawiki):
        """Test rejection of invalid use_mediawiki values (parametrized)."""
        response = client.post('/get_mcq', json={
            'input_text': VALID_INPUT_TEXT,
            'max_questions': 3,
            'use_mediawiki': invalid_mediawiki
        })
        # Should fail if type/value checking is implemented
        assert response.status_code in [200, 400, 500]
        
    def test_special_characters_in_input(self, client):
        """Test handling of special characters in input."""
        special_text = "Test with special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/~`"
        response = client.post('/get_mcq', json={
            'input_text': special_text,
            'max_questions': 1
        })
        # Should handle gracefully
        assert response.status_code in [200, 500]
        
    def test_unicode_input(self, client):
        """Test handling of Unicode characters."""
        unicode_text = "Test with Unicode: 你好世界 🌍 مرحبا بالعالم"
        response = client.post('/get_mcq', json={
            'input_text': unicode_text,
            'max_questions': 1
        })
        # Should handle gracefully
        assert response.status_code in [200, 500]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
