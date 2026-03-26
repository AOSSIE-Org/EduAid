"""
Celery tasks for asynchronous AI model inference.
These tasks wrap the existing generator classes to run in background workers.
"""
import logging
from celery import Task
from celery_worker import celery_app
from Generator import main
from Generator.question_filters import make_question_harder
from mediawikiapi import MediaWikiAPI
from transformers import pipeline
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeneratorTask(Task):
    """Base task class that initializes generators on first use."""
    
    def __init__(self):
        super().__init__()
        self._mcq_gen = None
        self._boolq_gen = None
        self._shortq_gen = None
        self._answer_predictor = None
        self._question_gen = None
        self._qa_model = None
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
    def answer_predictor(self):
        if self._answer_predictor is None:
            logger.info("Initializing AnswerPredictor...")
            self._answer_predictor = main.AnswerPredictor()
        return self._answer_predictor
    
    @property
    def question_gen(self):
        if self._question_gen is None:
            logger.info("Initializing QuestionGenerator...")
            self._question_gen = main.QuestionGenerator()
        return self._question_gen
    
    @property
    def qa_model(self):
        if self._qa_model is None:
            logger.info("Initializing QA model...")
            self._qa_model = pipeline("question-answering")
        return self._qa_model
    
    @property
    def mediawiki(self):
        if self._mediawiki is None:
            self._mediawiki = MediaWikiAPI()
        return self._mediawiki


def process_input_text(input_text, use_mediawiki, mediawiki_instance):
    """Process input text, optionally fetching from MediaWiki."""
    if use_mediawiki == 1:
        logger.info(f"Fetching MediaWiki summary for: {input_text}")
        try:
            input_text = mediawiki_instance.summary(input_text, 8)
        except Exception as e:
            logger.warning("MediaWiki fetch failed, using original input: %s", e)
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
        logger.error(f"Error in MCQ generation: {e!s}", exc_info=True)
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
        logger.error(f"Error in BoolQ generation: {e!s}", exc_info=True)
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
        logger.error(f"Error in ShortQ generation: {e!s}", exc_info=True)
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
        logger.info("Starting combined question generation task")
        
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
        
        logger.info("Combined generation completed")
        return result
        
    except Exception as e:
        logger.error(f"Error in combined generation: {e!s}", exc_info=True)
        raise



@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.predict_mcq_answer_task')
def predict_mcq_answer_task(self, input_text, input_questions, input_options):
    """
    Celery task for predicting MCQ answers.
    
    Args:
        input_text: The context text
        input_questions: List of questions
        input_options: List of option lists (one per question)
    
    Returns:
        List of predicted answers
    """
    try:
        logger.info(f"Starting MCQ answer prediction. Questions: {len(input_questions)}")
        
        outputs = []
        for question, options in zip(input_questions, input_options, strict=True):
            # Generate answer using the QA model
            qa_response = self.qa_model(question=question, context=input_text)
            generated_answer = qa_response["answer"]

            # Calculate similarity between generated answer and each option
            options_with_answer = options + [generated_answer]
            vectorizer = TfidfVectorizer().fit_transform(options_with_answer)
            vectors = vectorizer.toarray()
            generated_answer_vector = vectors[-1].reshape(1, -1)

            similarities = cosine_similarity(vectors[:-1], generated_answer_vector).flatten()
            max_similarity_index = similarities.argmax()
            
            # Return the option with the highest similarity
            best_option = options[max_similarity_index]
            outputs.append(best_option)
        
        logger.info(f"MCQ answer prediction completed. Predicted {len(outputs)} answers")
        return outputs
        
    except Exception as e:
        logger.error(f"Error in MCQ answer prediction: {e!s}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.predict_shortq_answer_task')
def predict_shortq_answer_task(self, input_text, input_questions):
    """
    Celery task for predicting short answer questions.
    
    Args:
        input_text: The context text
        input_questions: List of questions
    
    Returns:
        List of predicted answers
    """
    try:
        logger.info(f"Starting short answer prediction. Questions: {len(input_questions)}")
        
        answers = []
        for question in input_questions:
            qa_response = self.qa_model(question=question, context=input_text)
            answers.append(qa_response["answer"])
        
        logger.info(f"Short answer prediction completed. Predicted {len(answers)} answers")
        return answers
        
    except Exception as e:
        logger.error(f"Error in short answer prediction: {e!s}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.predict_boolean_answer_task')
def predict_boolean_answer_task(self, input_text, input_questions):
    """
    Celery task for predicting boolean answers.
    
    Args:
        input_text: The context text
        input_questions: List of questions
    
    Returns:
        List of boolean answers as strings ("True" or "False")
    """
    try:
        logger.info(f"Starting boolean answer prediction. Questions: {len(input_questions)}")
        
        output = []
        for question in input_questions:
            qa_response = self.answer_predictor.predict_boolean_answer(
                {"input_text": input_text, "input_question": question}
            )
            if qa_response:
                output.append("True")
            else:
                output.append("False")
        
        logger.info(f"Boolean answer prediction completed. Predicted {len(output)} answers")
        return output
        
    except Exception as e:
        logger.error(f"Error in boolean answer prediction: {e!s}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.generate_hard_shortq_task')
def generate_hard_shortq_task(self, input_text, num_questions, use_mediawiki=0):
    """
    Celery task for generating hard short answer questions.
    
    Args:
        input_text: The text to generate questions from
        num_questions: Number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        List of hard short answer questions
    """
    try:
        logger.info(f"Starting hard short answer generation. num_questions={num_questions}")
        
        # Process input text
        processed_text = process_input_text(input_text, use_mediawiki, self.mediawiki)
        
        # Generate questions
        output = self.question_gen.generate(
            article=processed_text, 
            num_questions=num_questions, 
            answer_style="sentences"
        )
        
        # Make questions harder
        for item in output:
            item["question"] = make_question_harder(item["question"])
        
        logger.info(f"Hard short answer generation completed. Generated {len(output)} questions")
        return output
        
    except Exception as e:
        logger.error(f"Error in hard short answer generation: {e!s}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.generate_hard_mcq_task')
def generate_hard_mcq_task(self, input_text, num_questions, use_mediawiki=0):
    """
    Celery task for generating hard MCQ questions.
    
    Args:
        input_text: The text to generate questions from
        num_questions: Number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        List of hard MCQ questions
    """
    try:
        logger.info(f"Starting hard MCQ generation. num_questions={num_questions}")
        
        # Process input text
        processed_text = process_input_text(input_text, use_mediawiki, self.mediawiki)
        
        # Generate questions
        output = self.question_gen.generate(
            article=processed_text, 
            num_questions=num_questions, 
            answer_style="multiple_choice"
        )
        
        # Make questions harder
        for q in output:
            q["question"] = make_question_harder(q["question"])
        
        logger.info(f"Hard MCQ generation completed. Generated {len(output)} questions")
        return output
        
    except Exception as e:
        logger.error(f"Error in hard MCQ generation: {e!s}", exc_info=True)
        raise


@celery_app.task(bind=True, base=GeneratorTask, name='tasks.inference_tasks.generate_hard_boolq_task')
def generate_hard_boolq_task(self, input_text, num_questions, use_mediawiki=0):
    """
    Celery task for generating hard boolean questions.
    
    Args:
        input_text: The text to generate questions from
        num_questions: Number of questions to generate
        use_mediawiki: Whether to fetch content from MediaWiki (1) or not (0)
    
    Returns:
        List of hard boolean questions
    """
    try:
        logger.info(f"Starting hard boolean generation. num_questions={num_questions}")
        
        # Process input text
        processed_text = process_input_text(input_text, use_mediawiki, self.mediawiki)
        
        # Generate questions
        output = self.question_gen.generate(
            article=processed_text,
            num_questions=num_questions,
            answer_style="true_false"
        )
        
        # Make questions harder
        for item in output:
            item["question"] = make_question_harder(item["question"])
        
        logger.info(f"Hard boolean generation completed. Generated {len(output)} questions")
        return output
        
    except Exception as e:
        logger.error(f"Error in hard boolean generation: {e!s}", exc_info=True)
        raise
