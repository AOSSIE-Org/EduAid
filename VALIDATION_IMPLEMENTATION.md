# Input Validation & Error Handling - Implementation Guide

## Overview
This document describes the input validation and error handling system added to the EduAid backend API.

## What Was Added

### 1. New Validation Module (`validators.py`)
A comprehensive validation utility module with:
- **`InputValidator` class**: Static methods for validating different data types
- **`ValidationError` exception**: Custom exception for validation failures
- **`create_error_response()` function**: Standardized error response formatting

### 2. Enhanced Endpoints
All major endpoints now include:
- Input validation before processing
- Standardized error responses
- Comprehensive exception handling

## Validation Features

### Text Validation (`validate_input_text`)
- **Minimum length**: 1 character
- **Maximum length**: 50,000 characters
- **Checks**: 
  - Type validation (must be string)
  - Empty string detection
  - Length restrictions with detailed error messages

**Example Error Response:**
```json
{
  "error": "input_text cannot be empty. Minimum length: 1 characters"
}
```

### Question Count Validation (`validate_max_questions`)
- **Minimum**: 1 question
- **Maximum**: 50 questions
- **Checks**:
  - Type validation (must be integer)
  - Range validation with clear error messages

**Example Error Response:**
```json
{
  "error": "max_questions cannot exceed 50, got 100"
}
```

### MediaWiki Flag Validation (`validate_use_mediawiki`)
- **Valid values**: 0 or 1
- **Checks**: 
  - Type validation
  - Exact value matching

**Example Error Response:**
```json
{
  "error": "use_mediawiki must be 0 or 1, got 2"
}
```

### URL Validation (`validate_document_url`)
- **Checks**:
  - Type validation
  - Non-empty validation
  - URL format validation (must start with http:// or https://)
  - Maximum length (500 characters)

**Example Error Response:**
```json
{
  "error": "document_url must be a valid HTTP(S) URL"
}
```

### Question List Validation (`validate_question_list`)
- **Checks**:
  - Type validation (must be list)
  - Non-empty items
  - Valid string items
  - Maximum length per question (50,000 characters)
  - Optional empty list support

**Example Error Response:**
```json
{
  "error": "input_question[2] cannot be empty"
}
```

### Options List Validation (`validate_options_list`)
- **Checks**:
  - Type validation (must be list of lists)
  - Non-empty validation
  - Per-option validation
  - Automatically filters out empty options

**Example Error Response:**
```json
{
  "error": "input_options[1][3] must be a string, got int"
}
```

### QA Pairs Validation (`validate_qa_pairs`)
- **Checks**:
  - List type validation
  - Dictionary items validation
  - Required fields ('question' and 'answer')
  - Non-empty content validation

**Example Error Response:**
```json
{
  "error": "qa_pairs[0] missing 'question' field"
}
```

### Question Type Validation (`validate_question_type`)
- **Valid types**: "get_shortq", "get_mcq", "get_boolq"
- **Checks**:
  - Type validation
  - Enum validation

**Example Error Response:**
```json
{
  "error": "question_type must be one of: get_shortq, get_mcq, get_boolq, got 'invalid_type'"
}
```

### Request Data Validation (`validate_request_data`)
- **Checks**:
  - Valid JSON format
  - Required fields presence

**Example Error Response:**
```json
{
  "error": "Missing required fields: input_text, max_questions"
}
```

## Updated Endpoints

### Query Generation Endpoints
- ✅ `/get_mcq` - MCQ generation
- ✅ `/get_boolq` - Boolean questions
- ✅ `/get_shortq` - Short-answer questions
- ✅ `/get_shortq_llm` - LLM-based short questions
- ✅ `/get_mcq_llm` - LLM-based MCQ
- ✅ `/get_boolq_llm` - LLM-based boolean
- ✅ `/get_problems_llm` - All question types (LLM)
- ✅ `/get_problems` - All question types

### Answer Prediction Endpoints
- ✅ `/get_mcq_answer` - MCQ answer prediction
- ✅ `/get_shortq_answer` - Short-answer prediction
- ✅ `/get_boolean_answer` - Boolean answer prediction

### Utility Endpoints
- ✅ `/get_content` - Google Docs content extraction
- ✅ `/generate_gform` - Google Form generation
- ✅ `/get_shortq_hard` - Difficult short questions
- ✅ `/get_mcq_hard` - Difficult MCQ
- ✅ `/get_boolq_hard` - Difficult boolean questions
- ✅ `/upload` - File upload with type checking

## Error Response Format

All errors now return a consistent format:

```json
{
  "error": "Detailed error message explaining what went wrong"
}
```

With appropriate HTTP status codes:
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Server-side error during processing

## Usage Examples

### Valid Request (MCQ Generation)
```bash
curl -X POST http://localhost:5000/get_mcq \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Artificial intelligence is transforming industries...",
    "max_questions": 5,
    "use_mediawiki": 0
  }'
```

### Invalid Request (Empty Text)
```bash
curl -X POST http://localhost:5000/get_mcq \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "",
    "max_questions": 5
  }'
```

**Response:**
```json
{
  "error": "input_text cannot be empty. Minimum length: 1 characters"
}
```

### Invalid Request (Too Many Questions)
```bash
curl -X POST http://localhost:5000/get_mcq \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Some educational content...",
    "max_questions": 100
  }'
```

**Response:**
```json
{
  "error": "max_questions cannot exceed 50, got 100"
}
```

### Invalid Request (Missing Required Field)
```bash
curl -X POST http://localhost:5000/get_mcq \
  -H "Content-Type: application/json" \
  -d '{
    "max_questions": 5
  }'
```

**Response:**
```json
{
  "error": "Missing required fields: input_text"
}
```

## Configuration

The validator includes configurable constants in `InputValidator` class:

```python
MIN_TEXT_LENGTH = 1
MAX_TEXT_LENGTH = 50000
MIN_QUESTIONS = 1
MAX_QUESTIONS = 50
MAX_URL_LENGTH = 500
```

To adjust these limits, modify the values in `backend/validators.py`.

## Benefits

1. **Security**: Prevents injection attacks and DoS through size limits
2. **Data Integrity**: Ensures only valid data reaches processing functions
3. **Better UX**: Clear, actionable error messages help developers debug
4. **Consistency**: All endpoints follow the same validation pattern
5. **Maintainability**: Centralized validation logic easy to update
6. **Robustness**: Handles edge cases and malformed requests gracefully

## Future Enhancements

Potential improvements:
- Rate limiting per endpoint
- Request throttling
- Authentication/authorization
- Audit logging
- Metrics collection
