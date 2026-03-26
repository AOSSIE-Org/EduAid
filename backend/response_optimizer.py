"""
Response optimization utilities for EduAid API endpoints.
Removes unnecessary fields and provides minimal response options.
"""


def optimize_mcq_response(output, include_context=False):
    """
    Optimize MCQ response by removing unused fields.
    
    Args:
        output: Original MCQ generator output
        include_context: If True, includes context field (default: False)
    
    Returns:
        Optimized response dictionary
    """
    if not output or "questions" not in output:
        return {"output": []}
    
    optimized_questions = []
    for question in output["questions"]:
        optimized_q = {
            "question": question.get("question_statement", ""),  # Standardized to "question"
            "answer": question.get("answer", ""),
            "options": question.get("options", [])[:4],  # First 4 options (fixed from 3)
            "question_type": question.get("question_type", "MCQ"),
        }
        
        # Only include context if explicitly requested
        if include_context:
            optimized_q["context"] = question.get("context", "")
        
        optimized_questions.append(optimized_q)
    
    return {"output": optimized_questions}


def optimize_shortq_response(output, include_context=False):
    """
    Optimize Short Question response by removing unused fields.
    
    Args:
        output: Original ShortQ generator output
        include_context: If True, includes context field (default: False)
    
    Returns:
        Optimized response dictionary
    """
    if not output or "questions" not in output:
        return {"output": []}
    
    optimized_questions = []
    for question in output["questions"]:
        optimized_q = {
            "question": question.get("Question", ""),  # Standardized to "question"
            "answer": question.get("Answer", ""),
            "question_type": "Short",
        }
        
        # Only include context if explicitly requested
        if include_context:
            optimized_q["context"] = question.get("context", "")
        
        optimized_questions.append(optimized_q)
    
    return {"output": optimized_questions}


def optimize_boolq_response(output, include_context=False):
    """
    Optimize Boolean Question response by removing unused fields.
    
    Args:
        output: Original BoolQ generator output
        include_context: Not used for boolean questions
    
    Returns:
        Optimized response dictionary
    """
    if not output or "Boolean_Questions" not in output:
        return {"output": []}
    
    # Standardize boolean questions to consistent structure
    optimized_questions = []
    for question_text in output["Boolean_Questions"]:
        optimized_questions.append({
            "question": question_text,
            "question_type": "Boolean",
        })
    
    return {"output": optimized_questions}


def optimize_llm_shortq_response(questions, include_context=False):
    """
    Optimize LLM-generated short questions response.
    
    Args:
        questions: List of LLM-generated short questions
        include_context: If True, includes context field (default: False)
    
    Returns:
        Optimized response list
    """
    if not questions:
        return []
    
    optimized = []
    for q in questions:
        optimized_q = {
            "question": q.get("question", ""),
            "answer": q.get("answer", ""),
            "question_type": "Short",
        }
        
        if include_context and "context" in q:
            optimized_q["context"] = q["context"]
        
        optimized.append(optimized_q)
    
    return optimized


def optimize_llm_mcq_response(questions, include_context=False):
    """
    Optimize LLM-generated MCQ response.
    
    Args:
        questions: List of LLM-generated MCQ questions
        include_context: If True, includes context field (default: False)
    
    Returns:
        Optimized response list
    """
    if not questions:
        return []
    
    optimized = []
    for q in questions:
        optimized_q = {
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "answer": q.get("correct_answer", ""),
            "question_type": "MCQ",
        }
        
        if include_context and "context" in q:
            optimized_q["context"] = q["context"]
        
        optimized.append(optimized_q)
    
    return optimized


def optimize_llm_boolq_response(questions, include_context=False):
    """
    Optimize LLM-generated boolean questions response.
    
    Args:
        questions: List of LLM-generated boolean questions
        include_context: Not used for boolean questions
    
    Returns:
        Optimized response list
    """
    if not questions:
        return []
    
    optimized = []
    for q in questions:
        optimized.append({
            "question": q.get("question", ""),
            "answer": q.get("answer", ""),
            "question_type": "Boolean",
        })
    
    return optimized


def optimize_combined_response(output_mcq, output_boolq, output_shortq, include_context=False):
    """
    Optimize combined response from /get_problems endpoint.
    Removes redundant fields from all question types.
    
    Args:
        output_mcq: MCQ generator output
        output_boolq: BoolQ generator output
        output_shortq: ShortQ generator output
        include_context: If True, includes context fields (default: False)
    
    Returns:
        Optimized combined response dictionary
    """
    return {
        "output_mcq": optimize_mcq_response(output_mcq, include_context),
        "output_boolq": optimize_boolq_response(output_boolq, include_context),
        "output_shortq": optimize_shortq_response(output_shortq, include_context),
    }


def optimize_llm_combined_response(questions, include_context=False):
    """
    Optimize LLM-generated combined questions response.
    
    Args:
        questions: List of mixed question types from LLM
        include_context: If True, includes context field (default: False)
    
    Returns:
        Optimized response list
    """
    if not questions:
        return []
    
    optimized = []
    for q in questions:
        q_type = q.get("type", "")
        
        if q_type == "mcq":
            optimized.append({
                "type": "mcq",
                "question": q.get("question", ""),
                "options": q.get("options", []),
                "answer": q.get("answer", ""),
                "question_type": "MCQ",
            })
        elif q_type == "boolean":
            optimized.append({
                "type": "boolean",
                "question": q.get("question", ""),
                "answer": q.get("answer", ""),
                "question_type": "Boolean",
            })
        elif q_type == "short_answer":
            optimized.append({
                "type": "short_answer",
                "question": q.get("question", ""),
                "answer": q.get("answer", ""),
                "question_type": "Short",
            })
        else:
            # Unknown type, pass through with minimal fields
            optimized.append({
                "type": q_type,
                "question": q.get("question", ""),
                "answer": q.get("answer", ""),
            })
    
    return optimized
