"""
Inference service layer that routes requests to Celery workers.
This module provides a unified interface for sync inference via Celery.
"""
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Task timeout for Celery operations (in seconds)
TASK_TIMEOUT_SECONDS = 600  # 10 minutes

# Import Celery tasks
try:
    from backend.tasks.inference_tasks import (
        generate_mcq_task,
        generate_boolq_task,
        generate_shortq_task,
        generate_all_questions_task,
        predict_mcq_answer_task,
        predict_shortq_answer_task,
        predict_boolean_answer_task,
        generate_hard_shortq_task,
        generate_hard_mcq_task,
        generate_hard_boolq_task
    )
    CELERY_AVAILABLE = True
    logger.info("Celery tasks imported successfully")
except ImportError as e:
    CELERY_AVAILABLE = False
    logger.warning(f"Celery tasks not available: {e}. Running in sync-only mode.")


def generate_mcq_sync(input_text: str, max_questions: int = 4, use_mediawiki: int = 0) -> Dict[str, Any]:
    """
    Generate MCQ questions synchronously using Celery worker.
    
    Args:
        input_text: The text to generate questions from
        max_questions: Maximum number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing generated MCQ questions
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    # Call Celery task synchronously with get()
    result = generate_mcq_task.apply_async(
        args=[input_text, max_questions, use_mediawiki]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def generate_boolq_sync(input_text: str, max_questions: int = 4, use_mediawiki: int = 0) -> Dict[str, Any]:
    """
    Generate boolean questions synchronously using Celery worker.
    
    Args:
        input_text: The text to generate questions from
        max_questions: Maximum number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing generated boolean questions
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = generate_boolq_task.apply_async(
        args=[input_text, max_questions, use_mediawiki]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def generate_shortq_sync(input_text: str, max_questions: int = 4, use_mediawiki: int = 0) -> Dict[str, Any]:
    """
    Generate short answer questions synchronously using Celery worker.
    
    Args:
        input_text: The text to generate questions from
        max_questions: Maximum number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing generated short answer questions
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = generate_shortq_task.apply_async(
        args=[input_text, max_questions, use_mediawiki]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def generate_all_questions_sync(
    input_text: str,
    max_questions_mcq: int = 4,
    max_questions_boolq: int = 4,
    max_questions_shortq: int = 4,
    use_mediawiki: int = 0
) -> Dict[str, Any]:
    """
    Generate all question types synchronously using Celery worker.
    
    Args:
        input_text: The text to generate questions from
        max_questions_mcq: Maximum number of MCQ questions
        max_questions_boolq: Maximum number of boolean questions
        max_questions_shortq: Maximum number of short answer questions
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing all generated question types
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = generate_all_questions_task.apply_async(
        args=[input_text, max_questions_mcq, max_questions_boolq, max_questions_shortq, use_mediawiki]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)



def predict_mcq_answer_sync(input_text: str, input_questions: List[str], input_options: List[List[str]]) -> List[str]:
    """
    Predict MCQ answers synchronously using Celery worker.
    
    Args:
        input_text: The context text
        input_questions: List of questions
        input_options: List of option lists (one per question)
    
    Returns:
        List of predicted answers
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = predict_mcq_answer_task.apply_async(
        args=[input_text, input_questions, input_options]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def predict_shortq_answer_sync(input_text: str, input_questions: List[str]) -> List[str]:
    """
    Predict short answer questions synchronously using Celery worker.
    
    Args:
        input_text: The context text
        input_questions: List of questions
    
    Returns:
        List of predicted answers
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = predict_shortq_answer_task.apply_async(
        args=[input_text, input_questions]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def predict_boolean_answer_sync(input_text: str, input_questions: List[str]) -> List[str]:
    """
    Predict boolean answers synchronously using Celery worker.
    
    Args:
        input_text: The context text
        input_questions: List of questions
    
    Returns:
        List of boolean answers as strings ("True" or "False")
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = predict_boolean_answer_task.apply_async(
        args=[input_text, input_questions]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def generate_hard_shortq_sync(input_text: str, num_questions: int, use_mediawiki: int = 0) -> List[Dict[str, Any]]:
    """
    Generate hard short answer questions synchronously using Celery worker.
    
    Args:
        input_text: The text to generate questions from
        num_questions: Number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        List of hard short answer questions
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = generate_hard_shortq_task.apply_async(
        args=[input_text, num_questions, use_mediawiki]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def generate_hard_mcq_sync(input_text: str, num_questions: int, use_mediawiki: int = 0) -> List[Dict[str, Any]]:
    """
    Generate hard MCQ questions synchronously using Celery worker.
    
    Args:
        input_text: The text to generate questions from
        num_questions: Number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        List of hard MCQ questions
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = generate_hard_mcq_task.apply_async(
        args=[input_text, num_questions, use_mediawiki]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)


def generate_hard_boolq_sync(input_text: str, num_questions: int, use_mediawiki: int = 0) -> List[Dict[str, Any]]:
    """
    Generate hard boolean questions synchronously using Celery worker.
    
    Args:
        input_text: The text to generate questions from
        num_questions: Number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        List of hard boolean questions
    """
    if not CELERY_AVAILABLE:
        raise RuntimeError("Celery is not available. Please ensure Redis and Celery worker are running.")
    
    result = generate_hard_boolq_task.apply_async(
        args=[input_text, num_questions, use_mediawiki]
    )
    return result.get(timeout=TASK_TIMEOUT_SECONDS)
