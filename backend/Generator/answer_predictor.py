import torch
import numpy as np
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    AutoModelForSequenceClassification,
    AutoTokenizer,
)


class AnswerPredictor:

    def __init__(self):
        """Loads the answer-prediction and NLI models used for answer and boolean-answer prediction."""
        self.tokenizer = T5Tokenizer.from_pretrained('t5-large', model_max_length=512)
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Answer-Predictor')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

        # Load the lightweight NLI model for boolean question answering
        self.nli_model_name = "typeform/distilbert-base-uncased-mnli"
        self.nli_tokenizer = AutoTokenizer.from_pretrained(self.nli_model_name)
        self.nli_model = AutoModelForSequenceClassification.from_pretrained(self.nli_model_name)

        self.set_seed(42)

    def set_seed(self, seed):
        """Seeds NumPy, torch and CUDA RNGs so that generation is reproducible."""
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def greedy_decoding(self, inp_ids, attn_mask):
        """Greedy-decodes an answer from tokenized model input and returns the cleaned text."""
        greedy_output = self.model.generate(input_ids=inp_ids, attention_mask=attn_mask, max_length=256)
        Question = self.tokenizer.decode(greedy_output[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        return Question.strip().capitalize()

    def predict_answer(self, payload):
        """Predicts an answer for each question in ``payload`` against the given context.

        Args:
            payload: Dict with ``input_text`` (the context) and ``input_question`` (a list of
                questions).

        Returns:
            A list with one predicted answer (stripped and capitalized) per question.
        """
        answers = []
        inp = {
                "input_text": payload.get("input_text"),
                "input_question" : payload.get("input_question")
            }
        for ques in payload.get("input_question"):

            context = inp["input_text"]
            question = ques
            input_text = "question: %s <s> context: %s </s>" % (question, context)

            encoding = self.tokenizer.encode_plus(input_text, return_tensors="pt")
            input_ids, attention_masks = encoding["input_ids"].to(self.device), encoding["attention_mask"].to(self.device)
            greedy_output = self.model.generate(input_ids=input_ids, attention_mask=attention_masks, max_length=256)
            Question = self.tokenizer.decode(greedy_output[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
            answers.append(Question.strip().capitalize())

        if self.device.type == 'cuda':
            torch.cuda.empty_cache()

        return answers

    def predict_boolean_answer(self, payload):
        """Predicts a True/False answer for each yes/no question in ``payload``.

        Uses the NLI model to compare the entailment and contradiction
        probabilities of each question (as the hypothesis) against the
        context (as the premise).

        Args:
            payload: Dict with ``input_text`` (the context) and ``input_question`` (a list of
                yes/no questions).

        Returns:
            A list of booleans, one per question.
        """
        input_text = payload.get("input_text", "")
        input_questions = payload.get("input_question", [])

        answers = []

        for question in input_questions:
            hypothesis = question
            inputs = self.nli_tokenizer.encode_plus(input_text, hypothesis, return_tensors="pt")
            outputs = self.nli_model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
            entailment_prob = probabilities[0][0].item()
            contradiction_prob = probabilities[0][2].item()

            if entailment_prob > contradiction_prob:
                answers.append(True)
            else:
                answers.append(False)

        if self.device.type == 'cuda':
            torch.cuda.empty_cache()

        return answers
