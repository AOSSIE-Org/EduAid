"""
Test file for input validation module.
Run this to verify all validators are working correctly.

Example: python test_validators.py
"""

import sys
from validators import InputValidator, ValidationError, create_error_response


def test_input_text_validation():
    """Test input text validation."""
    print("=" * 60)
    print("TEST: Input Text Validation")
    print("=" * 60)
    
    # Valid text
    try:
        result = InputValidator.validate_input_text("This is valid text")
        print("✓ Valid text accepted:", repr(result))
    except ValidationError as e:
        print("✗ Failed:", e)
    
    # Empty text
    try:
        InputValidator.validate_input_text("")
        print("✗ Empty text should have failed")
    except ValidationError as e:
        print("✓ Empty text rejected:", e)
    
    # Text with whitespace only
    try:
        InputValidator.validate_input_text("   ")
        print("✗ Whitespace-only text should have failed")
    except ValidationError as e:
        print("✓ Whitespace-only text rejected:", e)
    
    # Text too long
    try:
        long_text = "a" * 60000
        InputValidator.validate_input_text(long_text)
        print("✗ Too-long text should have failed")
    except ValidationError as e:
        print("✓ Too-long text rejected:", e)
    
    # Non-string input
    try:
        InputValidator.validate_input_text(12345)
        print("✗ Non-string input should have failed")
    except ValidationError as e:
        print("✓ Non-string input rejected:", e)
    
    print()


def test_max_questions_validation():
    """Test max_questions validation."""
    print("=" * 60)
    print("TEST: Max Questions Validation")
    print("=" * 60)
    
    # Valid values
    for val in [1, 5, 25, 50]:
        try:
            result = InputValidator.validate_max_questions(val)
            print(f"✓ Value {val} accepted")
        except ValidationError as e:
            print(f"✗ Failed for {val}: {e}")
    
    # Too small
    try:
        InputValidator.validate_max_questions(0)
        print("✗ Value 0 should have failed")
    except ValidationError as e:
        print("✓ Value 0 rejected:", e)
    
    # Too large
    try:
        InputValidator.validate_max_questions(100)
        print("✗ Value 100 should have failed")
    except ValidationError as e:
        print("✓ Value 100 rejected:", e)
    
    # Non-integer
    try:
        InputValidator.validate_max_questions("abc")
        print("✗ Non-integer should have failed")
    except ValidationError as e:
        print("✓ Non-integer rejected:", e)
    
    # String number (should convert)
    try:
        result = InputValidator.validate_max_questions("10")
        print(f"✓ String number '10' converted to: {result}")
    except ValidationError as e:
        print(f"✗ Failed: {e}")
    
    print()


def test_use_mediawiki_validation():
    """Test use_mediawiki validation."""
    print("=" * 60)
    print("TEST: MediaWiki Flag Validation")
    print("=" * 60)
    
    # Valid values
    for val in [0, 1]:
        try:
            result = InputValidator.validate_use_mediawiki(val)
            print(f"✓ Value {val} accepted")
        except ValidationError as e:
            print(f"✗ Failed for {val}: {e}")
    
    # Invalid values
    for val in [2, -1, 10]:
        try:
            InputValidator.validate_use_mediawiki(val)
            print(f"✗ Value {val} should have failed")
        except ValidationError as e:
            print(f"✓ Value {val} rejected:", e)
    
    print()


def test_document_url_validation():
    """Test document URL validation."""
    print("=" * 60)
    print("TEST: Document URL Validation")
    print("=" * 60)
    
    # Valid URLs
    valid_urls = [
        "https://docs.google.com/document/d/1ABC123/edit",
        "http://example.com/path"
    ]
    for url in valid_urls:
        try:
            result = InputValidator.validate_document_url(url)
            print(f"✓ URL accepted: {url[:50]}...")
        except ValidationError as e:
            print(f"✗ Failed: {e}")
    
    # Invalid URLs
    invalid_urls = [
        ("", "empty string"),
        ("   ", "whitespace only"),
        ("not-a-url", "no protocol"),
        ("ftp://example.com", "wrong protocol"),
    ]
    for url, desc in invalid_urls:
        try:
            InputValidator.validate_document_url(url)
            print(f"✗ {desc} should have failed")
        except ValidationError as e:
            print(f"✓ {desc} rejected")
    
    print()


def test_question_list_validation():
    """Test question list validation."""
    print("=" * 60)
    print("TEST: Question List Validation")
    print("=" * 60)
    
    # Valid list
    try:
        result = InputValidator.validate_question_list([
            "What is AI?",
            "How does ML work?"
        ])
        print(f"✓ Valid question list accepted: {len(result)} questions")
    except ValidationError as e:
        print(f"✗ Failed: {e}")
    
    # Empty list (not allowed by default)
    try:
        InputValidator.validate_question_list([])
        print("✗ Empty list should have failed")
    except ValidationError as e:
        print("✓ Empty list rejected:", e)
    
    # Empty list (allowed with flag)
    try:
        result = InputValidator.validate_question_list([], allow_empty=True)
        print("✓ Empty list accepted when allowed")
    except ValidationError as e:
        print(f"✗ Failed: {e}")
    
    # Invalid item
    try:
        InputValidator.validate_question_list(["Valid", 123])
        print("✗ Non-string item should have failed")
    except ValidationError as e:
        print("✓ Non-string item rejected:", e)
    
    # Empty string item
    try:
        InputValidator.validate_question_list(["Valid", ""])
        print("✗ Empty string item should have failed")
    except ValidationError as e:
        print("✓ Empty string item rejected:", e)
    
    print()


def test_qa_pairs_validation():
    """Test QA pairs validation."""
    print("=" * 60)
    print("TEST: QA Pairs Validation")
    print("=" * 60)
    
    # Valid QA pairs
    try:
        result = InputValidator.validate_qa_pairs([
            {"question": "Q1?", "answer": "A1"},
            {"question": "Q2?", "answer": "A2"},
        ])
        print(f"✓ Valid QA pairs accepted: {len(result)} pairs")
    except ValidationError as e:
        print(f"✗ Failed: {e}")
    
    # Missing question field
    try:
        InputValidator.validate_qa_pairs([
            {"answer": "A1"}
        ])
        print("✗ Missing 'question' field should have failed")
    except ValidationError as e:
        print("✓ Missing field rejected:", e)
    
    # Empty answer
    try:
        InputValidator.validate_qa_pairs([
            {"question": "Q1?", "answer": ""}
        ])
        print("✗ Empty answer should have failed")
    except ValidationError as e:
        print("✓ Empty answer rejected:", e)
    
    print()


def test_question_type_validation():
    """Test question type validation."""
    print("=" * 60)
    print("TEST: Question Type Validation")
    print("=" * 60)
    
    # Valid types
    for qtype in ["get_shortq", "get_mcq", "get_boolq"]:
        try:
            result = InputValidator.validate_question_type(qtype)
            print(f"✓ Type '{qtype}' accepted")
        except ValidationError as e:
            print(f"✗ Failed: {e}")
    
    # Invalid types
    for qtype in ["invalid", "GET_MCQ", ""]:
        try:
            InputValidator.validate_question_type(qtype)
            print(f"✗ Type '{qtype}' should have failed")
        except ValidationError as e:
            print(f"✓ Type '{qtype}' rejected")
    
    print()


def test_error_response():
    """Test error response formatting."""
    print("=" * 60)
    print("TEST: Error Response Formatting")
    print("=" * 60)
    
    response, status = create_error_response("Test error message")
    print(f"✓ Default error response: {response}")
    print(f"  Status code: {status}")
    
    response, status = create_error_response("Custom error", status_code=400)
    print(f"✓ Custom error response: {response}")
    print(f"  Status code: {status}")
    
    print()


def main():
    """Run all tests."""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 15 + "INPUT VALIDATOR TEST SUITE" + " " * 17 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    test_input_text_validation()
    test_max_questions_validation()
    test_use_mediawiki_validation()
    test_document_url_validation()
    test_question_list_validation()
    test_qa_pairs_validation()
    test_question_type_validation()
    test_error_response()
    
    print("=" * 60)
    print("All tests completed!")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
