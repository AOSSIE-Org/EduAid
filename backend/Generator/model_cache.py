from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer
)
from threading import Lock


class ModelCache:
    """
    Lazy-loading cache for transformer models.

    Models are loaded only once per Python process and reused
    across generator classes to avoid redundant initialization.

    Note:
    This cache is process-local. In multi-worker deployments
    (e.g., Gunicorn with multiple workers), each worker process
    will maintain its own cache and load its own model instances.

    For large-scale deployments, consider using a dedicated
    model-serving service or shared model infrastructure to
    avoid duplicated memory usage across processes.
    """

    # Stores loaded models
    _models = {}

    # Thread lock to prevent concurrent loading
    _lock = Lock()

    @classmethod
    def get_t5_question_generator(cls):

        if "t5_qg" not in cls._models:

            with cls._lock:

                if "t5_qg" not in cls._models:
                    tokenizer = T5Tokenizer.from_pretrained("t5-large")
                    model = T5ForConditionalGeneration.from_pretrained(
                        "Roasters/Question-Generator"
                    )
                    cls._models["t5_qg"] = (tokenizer, model)

        return cls._models["t5_qg"]

    @classmethod
    def get_boolean_model(cls):

        if "bool_qg" not in cls._models:

            with cls._lock:

                if "bool_qg" not in cls._models:
                    tokenizer = T5Tokenizer.from_pretrained("t5-base")
                    model = T5ForConditionalGeneration.from_pretrained(
                        "Roasters/Boolean-Questions"
                    )
                    cls._models["bool_qg"] = (tokenizer, model)

        return cls._models["bool_qg"]

    @classmethod
    def get_answer_predictor(cls):

        if "answer_predictor" not in cls._models:

            with cls._lock:

                if "answer_predictor" not in cls._models:
                    tokenizer = T5Tokenizer.from_pretrained(
                        "t5-large",
                        model_max_length=512
                    )
                    model = T5ForConditionalGeneration.from_pretrained(
                        "Roasters/Answer-Predictor"
                    )
                    cls._models["answer_predictor"] = (tokenizer, model)

        return cls._models["answer_predictor"]