"""
Async API routes for distributed inference pipeline.
Provides non-blocking endpoints for AI question generation.
"""
from flask import Blueprint, request, jsonify
from celery.result import AsyncResult
import logging

# Import Celery tasks
from tasks.inference_tasks import (
    generate_mcq_task,
    generate_boolq_task,
    generate_shortq_task,
    generate_all_questions_task
)

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint
async_routes = Blueprint('async_routes', __name__)


@async_routes.route("/generate_mcq_async", methods=["POST"])
def generate_mcq_async():
    """
    Async endpoint for MCQ generation.
    Accepts payload and returns task_id immediately.
    """
    try:
        data = request.get_json(silent=True) or {}
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        
        if not input_text.strip():
            return jsonify({"error": "input_text is required"}), 400
        
        # Send task to Celery
        task = generate_mcq_task.delay(input_text, max_questions, use_mediawiki)
        
        logger.info(f"MCQ task created: {task.id}")
        
        return jsonify({
            "task_id": task.id,
            "status": "queued"
        }), 202

    except Exception as e:
        logger.error(f"Error creating MCQ task: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@async_routes.route("/generate_boolq_async", methods=["POST"])
def generate_boolq_async():
    """
    Async endpoint for Boolean question generation.
    Accepts payload and returns task_id immediately.
    """
    try:
        data = request.get_json(silent=True) or {}
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        
        if not input_text.strip():
            return jsonify({"error": "input_text is required"}), 400
        
        # Send task to Celery
        task = generate_boolq_task.delay(input_text, max_questions, use_mediawiki)
        
        logger.info(f"BoolQ task created: {task.id}")
        
        return jsonify({
            "task_id": task.id,
            "status": "queued"
        }), 202
        
    except Exception as e:
        logger.error(f"Error creating BoolQ task: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@async_routes.route("/generate_shortq_async", methods=["POST"])
def generate_shortq_async():
    """
    Async endpoint for short answer question generation.
    Accepts payload and returns task_id immediately.
    """
    try:
        data = request.get_json(silent=True) or {}
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        
        if not input_text.strip():
            return jsonify({"error": "input_text is required"}), 400
        
        # Send task to Celery
        task = generate_shortq_task.delay(input_text, max_questions, use_mediawiki)
        
        logger.info(f"ShortQ task created: {task.id}")
        
        return jsonify({
            "task_id": task.id,
            "status": "queued"
        }), 202

    except Exception as e:
        logger.error(f"Error creating ShortQ task: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@async_routes.route("/generate_all_async", methods=["POST"])
def generate_all_async():
    """
    Async endpoint for generating all question types.
    Accepts payload and returns task_id immediately.
    """
    try:
        data = request.get_json(silent=True) or {}
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions_mcq = data.get("max_questions_mcq", 4)
        max_questions_boolq = data.get("max_questions_boolq", 4)
        max_questions_shortq = data.get("max_questions_shortq", 4)
        
        if not input_text.strip():
            return jsonify({"error": "input_text is required"}), 400
        
        # Send task to Celery
        task = generate_all_questions_task.delay(
            input_text,
            max_questions_mcq,
            max_questions_boolq,
            max_questions_shortq,
            use_mediawiki
        )
        
        logger.info(f"Combined generation task created: {task.id}")
        
        return jsonify({
            "task_id": task.id,
            "status": "queued"
        }), 202
        
    except Exception as e:
        logger.error(f"Error creating combined task: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@async_routes.route("/task_status/<task_id>", methods=["GET"])
def get_task_status(task_id):
    """
    Get the status of a task by its ID.
    
    Returns:
        - pending: Task is waiting to be executed
        - started: Task has started execution
        - success: Task completed successfully
        - failure: Task failed with an error
        - revoked: Task was cancelled
    """
    try:
        from celery_worker import celery_app
        task_result = AsyncResult(task_id, app=celery_app)    
        response = {
            "task_id": task_id,
            "status": task_result.state,
        }

        
        # Add additional info based on state
        if task_result.state == 'PENDING':
            response['message'] = 'Task is waiting to be executed'
        elif task_result.state == 'STARTED':
            response['message'] = 'Task is currently being processed'
        elif task_result.state == 'SUCCESS':
            response['message'] = 'Task completed successfully'
        elif task_result.state == 'FAILURE':
            response['message'] = 'Task failed'
            response['error'] = str(task_result.info)
        elif task_result.state == 'REVOKED':
            response['message'] = 'Task was cancelled'
        
        logger.info(f"Task status check: {task_id} - {task_result.state}")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error checking task status: {str(e)}", exc_info=True)
        return jsonify({"error": "Invalid task ID or error retrieving status"}), 400


@async_routes.route("/task_result/<task_id>", methods=["GET"])
def get_task_result(task_id):
    """
    Get the result of a completed task.
    
    Returns:
        - If completed: the generated questions
        - If pending/processing: status message
        - If failed: error message
    """
    try:
        from celery_worker import celery_app
        task_result = AsyncResult(task_id, app=celery_app)
        
        if task_result.state == 'PENDING':
            return jsonify({
                "task_id": task_id,
                "status": "pending",
                "message": "Task is waiting to be executed"
            }), 202
            
        elif task_result.state == 'STARTED':
            return jsonify({
                "task_id": task_id,
                "status": "processing",
                "message": "Task is currently being processed"
            }), 202
            
        elif task_result.state == 'SUCCESS':
            logger.info(f"Returning result for task: {task_id}")
            return jsonify({
                "task_id": task_id,
                "status": "completed",
                "result": task_result.result
            }), 200
            
        elif task_result.state == 'FAILURE':
            logger.error(f"Task failed: {task_id}")
            return jsonify({
                "task_id": task_id,
                "status": "failed",
                "error": str(task_result.info)
            }), 500
            
        else:
            return jsonify({
                "task_id": task_id,
                "status": task_result.state
            }), 200
            
    except Exception as e:
        logger.error(f"Error retrieving task result: {str(e)}", exc_info=True)
        return jsonify({"error": "Invalid task ID or error retrieving result"}), 400
