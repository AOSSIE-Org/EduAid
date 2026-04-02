"""
Output validation for LLM-generated questions.
Ensures that only well-formed, complete questions are returned to API consumers.
"""


def validate_mcq(questions):
    """
    Validate multiple-choice questions.
    
    Args:
        questions: List of MCQ question dictionaries
        
    Returns:
        List of valid MCQ questions (filtered)
        
    Validation Rules:
        - question field must exist and be non-empty string
        - options field must exist and be non-empty list
        - correct_answer field must exist and be non-empty string
    """
    if not questions:
        return []
    
    valid_questions = []
    
    for q in questions:
        if not isinstance(q, dict):
            continue
            
        # Check question field
        question = q.get("question")
        if not question or not isinstance(question, str) or not question.strip():
            continue
            
        # Check options field
        options = q.get("options")
        if not options or not isinstance(options, list) or len(options) < 2:
            continue
            
        # Check correct_answer field
        correct_answer = q.get("correct_answer")
        if not correct_answer or not isinstance(correct_answer, str) or not correct_answer.strip():
            continue
            
        # All checks passed - this is a valid question
        valid_questions.append(q)
    
    return valid_questions


def validate_shortq(questions):
    """
    Validate short answer questions.
    
    Args:
        questions: List of short answer question dictionaries
        
    Returns:
        List of valid short answer questions (filtered)
        
    Validation Rules:
        - question field must exist and be non-empty string
        - answer field must exist and be non-empty string
    """
    if not questions:
        return []
    
    valid_questions = []
    
    for q in questions:
        if not isinstance(q, dict):
            continue
            
        # Check question field
        question = q.get("question")
        if not question or not isinstance(question, str) or not question.strip():
            continue
            
        # Check answer field
        answer = q.get("answer")
        if not answer or not isinstance(answer, str) or not answer.strip():
            continue
            
        # All checks passed - this is a valid question
        valid_questions.append(q)
    
    return valid_questions


def validate_boolq(questions):
    """
    Validate boolean (true/false) questions.
    
    Args:
        questions: List of boolean question dictionaries
        
    Returns:
        List of valid boolean questions (filtered)
        
    Validation Rules:
        - question field must exist and be non-empty string
        - answer field must exist and be boolean type (True or False)
    """
    if not questions:
        return []
    
    valid_questions = []
    
    for q in questions:
        if not isinstance(q, dict):
            continue
            
        # Check question field
        question = q.get("question")
        if not question or not isinstance(question, str) or not question.strip():
            continue
            
        # Check answer field - must be boolean type, not string or int
        answer = q.get("answer")
        if not isinstance(answer, bool):
            continue
            
        # All checks passed - this is a valid question
        valid_questions.append(q)
    
    return valid_questions
