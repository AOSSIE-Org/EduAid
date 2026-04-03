# Unit Tests Documentation

## Overview
This directory contains comprehensive unit tests for the EduAid backend API endpoints.

## Test Files

### 1. `test_server.py` - Integration Tests
**Purpose:** End-to-end testing of all API endpoints against a running server

**Test Coverage:**
- ✅ All question generation endpoints (MCQ, Boolean, Short Q)
- ✅ LLM-based endpoints (Qwen3 models)
- ✅ Combined endpoint (`/get_problems`)
- ✅ Answer prediction endpoints
- ✅ Error handling and validation
- ✅ Edge cases (empty input, oversized input, invalid types)
- ✅ Response format validation

**Running Tests:**
```bash
# Start the Flask server first
python server.py

# In another terminal, run tests
python test_server.py

# Or with pytest
pytest test_server.py -v
```

**Test Categories in test_server.py:**
- **Basic Tests (7):** Test all major endpoints with valid inputs
- **LLM Tests (4):** Test Qwen3-0.6B model-based endpoints
- **Error Validation Tests (13):** Test input validation and error handling
- **Response Format Tests (2):** Validate response structure

### 2. `test_endpoints.py` - Unit Tests (pytest)
**Purpose:** Isolated unit tests using pytest fixtures and mocking

**Test Coverage:**
- ✅ 40+ test cases organized by endpoint
- ✅ Success scenarios
- ✅ Error scenarios
- ✅ Edge cases (empty lists, mismatched data, etc.)
- ✅ Parametrized tests for multiple invalid inputs

**Test Classes:**
- `TestMCQEndpoint` - 8 tests
- `TestBoolQEndpoint` - 3 tests
- `TestShortQEndpoint` - 2 tests
- `TestMCQAnswerEndpoint` - 5 tests
- `TestShortQAnswerEndpoint` - 3 tests
- `TestBooleanAnswerEndpoint` - 2 tests
- `TestUploadEndpoint` - 3 tests
- `TestGetContentEndpoint` - 2 tests
- `TestErrorResponses` - 1 test
- `TestInputValidation` - 3 parametrized tests

**Running Tests:**
```bash
# Run all tests
pytest test_endpoints.py -v

# Run specific test class
pytest test_endpoints.py::TestMCQEndpoint -v

# Run with coverage
pytest test_endpoints.py --cov=server --cov-report=html

# Run with detailed output
pytest test_endpoints.py -v --tb=short
```

## What's Tested

### Error Handling ✅
- Empty input text rejection
- Oversized input text rejection (>50,000 chars)
- Invalid max_questions values (0, 100, "abc", 3.14)
- Invalid use_mediawiki values (2, -1, etc.)
- Invalid URL formats
- Missing required fields
- Mismatched question/option counts
- Whitespace-only inputs

### Validation ✅
- Type validation (string, integer, list)
- Range validation (questions: 1-50)
- Length validation (text: 1-50,000 chars)
- Enum validation (use_mediawiki: 0 or 1)
- URL format validation (http/https)
- Required field checking

### Response Formats ✅
- Standardized error format: `{"error": "message"}`
- Success format: `{"output": [...]}`
- Proper HTTP status codes (200, 400, 500)
- Datetime formats and content validation

## Test Statistics

| Category | Count | Status |
|----------|-------|--------|
| Total Tests | 50+ | ✅ Ready |
| Error Validation Tests | 13 | ✅ Ready |
| Success Case Tests | 7 | ✅ Ready |
| LLM Integration Tests | 4 | ✅ Ready |
| Format Validation Tests | 2 | ✅ Ready |
| Pytest Unit Tests | 40+ | ✅ Ready |

## Running All Tests

### Option 1: Integration Tests (test_server.py)
```bash
cd backend
python server.py  # Terminal 1

# Terminal 2
python test_server.py
```

### Option 2: Unit Tests (test_endpoints.py)
```bash
cd backend
pytest test_endpoints.py -v
```

### Option 3: Both (requires pytest)
```bash
cd backend

# Run integration tests
python test_server.py

# Run unit tests
pytest test_endpoints.py -v

# Generate coverage report
pytest test_endpoints.py --cov=server --cov-report=html
```

## Expected Output

### Successful Run (test_server.py)
```
============================================================
Running Basic Endpoint Tests
============================================================

SUCCESS TESTS:
✓ Root endpoint working
✓ MCQ generation successful
✓ Boolean Q generation successful
✓ Short Q generation successful
✓ All problem types generation successful

============================================================
Running LLM Integration Tests
============================================================

LLM TESTS:
✓ Short Q LLM generation successful
✓ MCQ LLM generation successful
✓ Boolean Q LLM generation successful
✓ Mixed LLM generation successful

============================================================
Running Error/Edge Case Tests
============================================================

ERROR VALIDATION TESTS:
✓ MCQ with empty input correctly rejected: input_text cannot be empty...
✓ MCQ with max_questions=100 correctly rejected: max_questions cannot exceed 50...
✓ MCQ with invalid max_questions type correctly rejected: max_questions must be an integer...
[... more validation tests ...]

All tests completed!
```

## Test Case Examples

### Valid Request
```python
# Should succeed
response = client.post('/get_mcq', json={
    "input_text": "Valid educational content...",
    "max_questions": 5,
    "use_mediawiki": 0
})
assert response.status_code == 200
assert "output" in response.json()
```

### Invalid Request - Empty Input
```python
# Should return 400 error
response = client.post('/get_mcq', json={
    "input_text": "",
    "max_questions": 5
})
assert response.status_code == 400
assert "error" in response.json()
assert "empty" in response.json()["error"].lower()
```

### Invalid Request - Exceeded Limit
```python
# Should return 400 error
response = client.post('/get_mcq', json={
    "input_text": "Valid content",
    "max_questions": 100  # Exceeds limit of 50
})
assert response.status_code == 400
assert "error" in response.json()
assert "exceed" in response.json()["error"].lower()
```

## Continuous Integration

To integrate with CI/CD (GitHub Actions, etc.):

```yaml
- name: Run API Tests
  run: |
    cd backend
    python -m pytest test_endpoints.py -v --tb=short
    
- name: Run Integration Tests
  run: |
    cd backend
    python server.py &
    sleep 5
    python test_server.py
```

## Troubleshooting

### Issue: Tests fail with "Connection refused"
**Solution:** Make sure Flask server is running: `python server.py`

### Issue: "ModuleNotFoundError" for validators
**Solution:** Ensure you're in the `backend` directory and validators.py exists with InputValidator class

### Issue: Tests timeout
**Solution:** Flask server may be slow to load models. Increase timeout or wait longer before running tests.

### Issue: Some tests skipped
**Solution:** Tests may skip if models aren't downloaded. Run `python server.py` once to download models, then run tests again.

## Future Enhancements

- [ ] Add more edge case tests
- [ ] Add performance benchmarking tests
- [ ] Add concurrency stress tests
- [ ] Add security penetration tests
- [ ] Add response schema validation tests
- [ ] Add database integration tests (when applicable)

## Contributing

When adding new endpoints:
1. Add success case test
2. Add error case tests (empty input, invalid types, missing fields)
3. Add edge case tests
4. Update this documentation
5. Run all tests before submitting PR
