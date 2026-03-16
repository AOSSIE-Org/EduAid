"""
Celery tasks for asynchronous AI model inference.
These tasks wrap the existing generator classes to run in background workers.
"""
import logging
import torch
from celery import Task
from backend.celery_worker import celery_app
from Generator import main
from mediawikiapi import MediaWikiAPI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize generators (these will be loaded once per worker)
MCQGen = None
BoolQGen = None
ShortQGen = None
mediawikiapi = None


class GeneratorTask(Task):
    """Base task class that initializes generators on first use."""
    
    def __init__(self):
        super().__init__()
        self._mcq_gen = None
        self._boolq_gen = None
        self._shortq_gen = None
        self._mediawiki = None
    
    @property
    def mcq_gen(self):
        if self._mcq_gen is None:
            logger.info("Initializing MCQGenerator...")
            self._mcq_gen = main.MCQGenerator()
        return self._mcq_gen
    
    @property
    def boolq_gen(self):
        if self._boolq_gen is None:
            logger.info("Initializing BoolQGenerator...")
            self._boolq_gen = main.BoolQGenerator()
        return self._boolq_gen
    
    @property
    def shortq_gen(self):
        if self._shortq_gen is None:
            logger.info("Initializing ShortQGenerator...")
            self._shortq_gen = main.ShortQGenerator()
        return self._shortq_gen
    
    @property
    def mediawiki(self):
        if self._mediawiki is None:
            self._mediawiki = MediaWikiAPI()
        return self._mediawiki


def process_input_text(input_text, use_mediawiki, mediawiki_instance):
    """Process input text, optionally fetching from MediaWiki."""
    if use_mediawiki == 1:
        logger.info(f"Fetching MediaWiki summary for: {input_text}")
        input_text = mediawiki_instance.summary(input_text, 8)
    return input_text


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.generate_mcq_task')
def generate_mcq_task(self, input_text, max_questions=4, use_mediawiki=0):
    """
    Celery task for generating multiple choice questions.
    
    Args:
        input_text: The text to generate questions from
        max_questions: Maximum number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing generated MCQ questions
    """
    try:
        logger.info(f"Starting MCQ generation task. max_questions={max_questions}")
        
        # Process input text
        processed_text = process_input_text(input_text, use_mediawiki, self.mediawiki)
        
        # Generate MCQ
        output = self.mcq_gen.generate_mcq({
            "input_text": processed_text,
            "max_questions": max_questions
        })
        
        logger.info(f"MCQ generation completed. Generated {len(output.get('questions', []))} questions")
        return output
        
    except Exception as e:
        logger.error(f"Error in MCQ generation: {str(e)}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.generate_boolq_task')
def generate_boolq_task(self, input_text, max_questions=4, use_mediawiki=0):
    """
    Celery task for generating boolean questions.
    
    Args:
        input_text: The text to generate questions from
        max_questions: Maximum number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing generated boolean questions
    """
    try:
        logger.info(f"Starting BoolQ generation task. max_questions={max_questions}")
        
        # Process input text
        processed_text = process_input_text(input_text, use_mediawiki, self.mediawiki)
        
        # Generate BoolQ
        output = self.boolq_gen.generate_boolq({
            "input_text": processed_text,
            "max_questions": max_questions
        })
        
        logger.info(f"BoolQ generation completed. Generated {len(output.get('Boolean_Questions', []))} questions")
        return output
        
    except Exception as e:
        logger.error(f"Error in BoolQ generation: {str(e)}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.generate_shortq_task')
def generate_shortq_task(self, input_text, max_questions=4, use_mediawiki=0):
    """
    Celery task for generating short answer questions.
    
    Args:
        input_text: The text to generate questions from
        max_questions: Maximum number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing generated short answer questions
    """
    try:
        logger.info(f"Starting ShortQ generation task. max_questions={max_questions}")
        
        # Process input text
        processed_text = process_input_text(input_text, use_mediawiki, self.mediawiki)
        
        # Generate ShortQ
        output = self.shortq_gen.generate_shortq({
            "input_text": processed_text,
            "max_questions": max_questions
        })
        
        logger.info(f"ShortQ generation completed. Generated {len(output.get('questions', []))} questions")
        return output
        
    except Exception as e:
        logger.error(f"Error in ShortQ generation: {str(e)}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.generate_all_questions_task')
def generate_all_questions_task(self, input_text, max_questions_mcq=4, max_questions_boolq=4, max_questions_shortq=4, use_mediawiki=0):
    """
    Celery task for generating all question types (MCQ, BoolQ, ShortQ).
    
    Args:
        input_text: The text to generate questions from
        max_questions_mcq: Maximum number of MCQ questions
        max_questions_boolq: Maximum number of boolean questions
        max_questions_shortq: Maximum number of short answer questions
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        Dictionary containing all generated question types
    """
    try:
        logger.info(f"Starting combined question generation task")
        
        # Process input text
        processed_text = process_input_text(input_text, use_mediawiki, self.mediawiki)
        
        # Generate all question types
        output_mcq = self.mcq_gen.generate_mcq({
            "input_text": processed_text,
            "max_questions": max_questions_mcq
        })
        
        output_boolq = self.boolq_gen.generate_boolq({
            "input_text": processed_text,
            "max_questions": max_questions_boolq
        })
        
        output_shortq = self.shortq_gen.generate_shortq({
            "input_text": processed_text,
            "max_questions": max_questions_shortq
        })
        
        result = {
            "output_mcq": output_mcq,
            "output_boolq": output_boolq,
            "output_shortq": output_shortq
        }
        
        logger.info(f"Combined generation completed")
        return result
        
    except Exception as e:
        logger.error(f"Error in combined generation: {str(e)}", exc_info=True)
        raise
