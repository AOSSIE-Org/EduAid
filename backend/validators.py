"""
Input validation utilities for EduAid API endpoints.

This module provides functions to validate user inputs before processing,
ensuring data integrity and preventing common errors.
"""

from typing import Any, Dict, List, Tuple


class ValidationError(ValueError):
    """Custom exception for validation errors."""
    pass


class InputValidator:
    """Validates API request inputs."""
    
    # Configuration constants
    MIN_TEXT_LENGTH = 1
    MAX_TEXT_LENGTH = 50000
    MIN_QUESTIONS = 1
    MAX_QUESTIONS = 50
    VALID_QUESTION_TYPES = {"get_shortq", "get_mcq", "get_boolq"}
    VALID_MEDIAWIKI_VALUES = {0, 1}
    MAX_URL_LENGTH = 500
    
    @staticmethod
    def validate_input_text(
        input_text: Any,
        field_name: str = "input_text",
        min_length: int = None,
        max_length: int = None
    ) -> str:
        """
        Validate and sanitize input text.
        
        Args:
            input_text: The text to validate
            field_name: Name of the field for error messages
            min_length: Minimum allowed length (default: MIN_TEXT_LENGTH)
            max_length: Maximum allowed length (default: MAX_TEXT_LENGTH)
            
        Returns:
            Validated and stripped text
            
        Raises:
            ValidationError: If validation fails
        """
        if min_length is None:
            min_length = InputValidator.MIN_TEXT_LENGTH
        if max_length is None:
            max_length = InputValidator.MAX_TEXT_LENGTH
            
        # Type check
        if not isinstance(input_text, str):
            raise ValidationError(f"{field_name} must be a string, got {type(input_text).__name__}")
        
        # Strip whitespace
        input_text = input_text.strip()
        
        # Length validation
        if len(input_text) < min_length:
            raise ValidationError(
                f"{field_name} cannot be empty. Minimum length: {min_length} characters"
            )
        
        if len(input_text) > max_length:
            raise ValidationError(
                f"{field_name} exceeds maximum length of {max_length} characters. "
                f"Current length: {len(input_text)}"
            )
        
        return input_text
    
    @staticmethod
    def validate_max_questions(
        max_questions: Any,
        min_val: int = None,
        max_val: int = None
    ) -> int:
        """
        Validate max_questions parameter.
        
        Args:
            max_questions: The max questions value to validate
            min_val: Minimum allowed value (default: MIN_QUESTIONS)
            max_val: Maximum allowed value (default: MAX_QUESTIONS)
            
        Returns:
            Validated max_questions as integer
            
        Raises:
            ValidationError: If validation fails
        """
        if min_val is None:
            min_val = InputValidator.MIN_QUESTIONS
        if max_val is None:
            max_val = InputValidator.MAX_QUESTIONS
        
        # Type check and conversion
        try:
            max_questions = int(max_questions)
        except (ValueError, TypeError):
            raise ValidationError(
                f"max_questions must be an integer, got {type(max_questions).__name__}"
            )
        
        # Range validation
        if max_questions < min_val:
            raise ValidationError(
                f"max_questions must be at least {min_val}, got {max_questions}"
            )
        
        if max_questions > max_val:
            raise ValidationError(
                f"max_questions cannot exceed {max_val}, got {max_questions}"
            )
        
        return max_questions
    
    @staticmethod
    def validate_use_mediawiki(use_mediawiki: Any) -> int:
        """
        Validate use_mediawiki parameter.
        
        Args:
            use_mediawiki: The mediawiki flag to validate
            
        Returns:
            Validated use_mediawiki as integer (0 or 1)
            
        Raises:
            ValidationError: If validation fails
        """
        try:
            use_mediawiki = int(use_mediawiki)
        except (ValueError, TypeError):
            raise ValidationError(
                f"use_mediawiki must be an integer, got {type(use_mediawiki).__name__}"
            )
        
        if use_mediawiki not in InputValidator.VALID_MEDIAWIKI_VALUES:
            raise ValidationError(
                f"use_mediawiki must be 0 or 1, got {use_mediawiki}"
            )
        
        return use_mediawiki
    
    @staticmethod
    def validate_document_url(url: Any) -> str:
        """
        Validate Google Docs URL.
        
        Args:
            url: The URL to validate
            
        Returns:
            Validated URL
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(url, str):
            raise ValidationError(
                f"document_url must be a string, got {type(url).__name__}"
            )
        
        url = url.strip()
        
        if not url:
            raise ValidationError("document_url cannot be empty")
        
        if len(url) > InputValidator.MAX_URL_LENGTH:
            raise ValidationError(
                f"document_url exceeds maximum length of {InputValidator.MAX_URL_LENGTH} characters"
            )
        
        if not url.startswith("http://") and not url.startswith("https://"):
            raise ValidationError("document_url must be a valid HTTP(S) URL")
        
        return url
    
    @staticmethod
    def validate_question_list(
        questions: Any,
        field_name: str = "input_question",
        allow_empty: bool = False
    ) -> List[str]:
        """
        Validate list of questions.
        
        Args:
            questions: The questions list to validate
            field_name: Name of the field for error messages
            allow_empty: Whether to allow empty list
            
        Returns:
            Validated questions as list
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(questions, list):
            raise ValidationError(
                f"{field_name} must be a list, got {type(questions).__name__}"
            )
        
        if not allow_empty and len(questions) == 0:
            raise ValidationError(f"{field_name} cannot be empty")
        
        validated_questions = []
        for i, question in enumerate(questions):
            if not isinstance(question, str):
                raise ValidationError(
                    f"{field_name}[{i}] must be a string, got {type(question).__name__}"
                )
            
            question_str = question.strip()
            
            if not question_str:
                raise ValidationError(
                    f"{field_name}[{i}] cannot be empty"
                )
            
            if len(question_str) > InputValidator.MAX_TEXT_LENGTH:
                raise ValidationError(
                    f"{field_name}[{i}] exceeds maximum length of {InputValidator.MAX_TEXT_LENGTH} characters"
                )
            
            validated_questions.append(question_str)
        
        return validated_questions
    
    @staticmethod
    def validate_options_list(
        options: Any,
        field_name: str = "input_options"
    ) -> List[List[str]]:
        """
        Validate list of options for MCQ questions.
        
        Args:
            options: The options list to validate (list of lists)
            field_name: Name of the field for error messages
            
        Returns:
            Validated options as list of lists
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(options, list):
            raise ValidationError(
                f"{field_name} must be a list, got {type(options).__name__}"
            )
        
        if len(options) == 0:
            raise ValidationError(f"{field_name} cannot be empty")
        
        validated_options = []
        for i, option_group in enumerate(options):
            if not isinstance(option_group, list):
                raise ValidationError(
                    f"{field_name}[{i}] must be a list, got {type(option_group).__name__}"
                )
            
            if len(option_group) == 0:
                raise ValidationError(f"{field_name}[{i}] cannot be empty")
            
            validated_group = []
            for j, option in enumerate(option_group):
                if not isinstance(option, str):
                    raise ValidationError(
                        f"{field_name}[{i}][{j}] must be a string, got {type(option).__name__}"
                    )
                
                option_str = option.strip()
                if option_str:  # Only add non-empty options
                    validated_group.append(option_str)
            
            if not validated_group:
                raise ValidationError(
                    f"{field_name}[{i}] has no valid options after filtering"
                )
            
            validated_options.append(validated_group)
        
        return validated_options
    
    @staticmethod
    def validate_qa_pairs(qa_pairs: Any) -> List[Dict[str, Any]]:
        """
        Validate list of QA pairs.
        
        Args:
            qa_pairs: The QA pairs list to validate
            
        Returns:
            Validated QA pairs
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(qa_pairs, list):
            raise ValidationError(
                f"qa_pairs must be a list, got {type(qa_pairs).__name__}"
            )
        
        if len(qa_pairs) == 0:
            raise ValidationError("qa_pairs cannot be empty")
        
        for i, pair in enumerate(qa_pairs):
            if not isinstance(pair, dict):
                raise ValidationError(
                    f"qa_pairs[{i}] must be a dictionary, got {type(pair).__name__}"
                )
            
            if "question" not in pair:
                raise ValidationError(f"qa_pairs[{i}] missing 'question' field")
            
            if "answer" not in pair:
                raise ValidationError(f"qa_pairs[{i}] missing 'answer' field")
            
            if not isinstance(pair["question"], str):
                raise ValidationError(
                    f"qa_pairs[{i}]['question'] must be a string"
                )
            
            if not isinstance(pair["answer"], str):
                raise ValidationError(
                    f"qa_pairs[{i}]['answer'] must be a string"
                )
            
            if not pair["question"].strip():
                raise ValidationError(
                    f"qa_pairs[{i}]['question'] cannot be empty"
                )
            
            if not pair["answer"].strip():
                raise ValidationError(
                    f"qa_pairs[{i}]['answer'] cannot be empty"
                )
        
        return qa_pairs
    
    @staticmethod
    def validate_question_type(question_type: Any) -> str:
        """
        Validate question_type parameter.
        
        Args:
            question_type: The question type to validate
            
        Returns:
            Validated question type
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(question_type, str):
            raise ValidationError(
                f"question_type must be a string, got {type(question_type).__name__}"
            )
        
        question_type = question_type.strip()
        
        if question_type not in InputValidator.VALID_QUESTION_TYPES:
            valid_types = ", ".join(InputValidator.VALID_QUESTION_TYPES)
            raise ValidationError(
                f"question_type must be one of: {valid_types}, got '{question_type}'"
            )
        
        return question_type
    
    @staticmethod
    def validate_request_data(
        data: Any,
        required_fields: List[str] = None
    ) -> Dict[str, Any]:
        """
        Validate that request data is a valid dictionary with required fields.
        
        Args:
            data: The request data to validate
            required_fields: List of field names that must be present
            
        Returns:
            Validated data dictionary
            
        Raises:
            ValidationError: If validation fails
        """
        if data is None:
            raise ValidationError("Request body cannot be empty. Expected JSON data.")
        
        if not isinstance(data, dict):
            raise ValidationError(
                f"Request body must be valid JSON, got {type(data).__name__}"
            )
        
        if required_fields:
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                raise ValidationError(
                    f"Missing required fields: {', '.join(missing_fields)}"
                )
        
        return data


def create_error_response(error_msg: str, status_code: int = 400) -> Tuple[Dict[str, str], int]:
    """
    Create a standardized error response.
    
    Args:
        error_msg: The error message
        status_code: HTTP status code
        
    Returns:
        Tuple of (response dict, status code)
    """
    return {"error": error_msg}, status_code
