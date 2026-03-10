import time
import torch
import random
import gc
import logging
import threading
from transformers import T5ForConditionalGeneration, T5Tokenizer
from transformers import AutoModelForSequenceClassification, AutoTokenizer,AutoModelForSeq2SeqLM, T5ForConditionalGeneration, T5Tokenizer
import numpy as np
import spacy
from sense2vec import Sense2Vec
from collections import OrderedDict
from nltk import FreqDist
from nltk.corpus import brown
from similarity.normalized_levenshtein import NormalizedLevenshtein
from Generator.mcq import tokenize_into_sentences, identify_keywords, find_sentences_with_keywords, generate_multiple_choice_questions, generate_normal_questions
from Generator.encoding import beam_search_decoding
from google.oauth2 import service_account
from googleapiclient.discovery import build
import en_core_web_sm
import json
import re
from typing import Any, List, Mapping, Tuple
import re
import os
import fitz 
import mammoth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelManager:
    """
    Manages lazy loading and caching of ML models to optimize memory usage.
    Models are loaded only when needed and can be unloaded to free memory.
    """
    
    def __init__(self):
        self._models = {}
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._lock = threading.Lock()
        self._model_locks = {}
        logger.info(f"ModelManager initialized. Using device: {self._device}")
    
    def get_device(self):
        """Get the current device (CPU or CUDA)."""
        return self._device
    
    def load_model(self, model_name, model_type, **kwargs):
        """
        Load a model if not already cached.
        Args:
            model_name: str - identifier for the model
            model_type: str - type of model ('tokenizer', 'transformer', 'spacy', 'sense2vec', etc.)
            **kwargs: additional arguments for model loading
        Returns:
            loaded model
        """
        # Check cache first with main lock
        with self._lock:
            if model_name in self._models:
                logger.info(f"Model '{model_name}' already loaded, returning cached version")
                return self._models[model_name]
            
            # Get or create a lock for this specific model
            model_lock = self._model_locks.setdefault(model_name, threading.Lock())
        
        # Load model with model-specific lock
        with model_lock:
            # Double-check after acquiring model lock
            if model_name in self._models:
                logger.info(f"Model '{model_name}' already loaded, returning cached version")
                return self._models[model_name]
            
            try:
                logger.info(f"Loading model '{model_name}' of type '{model_type}'...")
                
                if model_type == 'tokenizer':
                    pretrained = kwargs.get('pretrained', 't5-large')
                    model = T5Tokenizer.from_pretrained(pretrained, **{k: v for k, v in kwargs.items() if k != 'pretrained'})
                
                elif model_type == 'transformer':
                    pretrained = kwargs.get('pretrained', 'Roasters/Question-Generator')
                    model = T5ForConditionalGeneration.from_pretrained(pretrained)
                    model.to(self._device)
                    model.eval()
                
                elif model_type == 'auto_tokenizer':
                    pretrained = kwargs.get('pretrained')
                    model = AutoTokenizer.from_pretrained(pretrained, **{k: v for k, v in kwargs.items() if k != 'pretrained'})
                
                elif model_type == 'auto_model_seq2seq':
                    pretrained = kwargs.get('pretrained')
                    model = AutoModelForSeq2SeqLM.from_pretrained(pretrained)
                    model.to(self._device)
                    model.eval()
                
                elif model_type == 'auto_model_classification':
                    pretrained = kwargs.get('pretrained')
                    model = AutoModelForSequenceClassification.from_pretrained(pretrained)
                    model.to(self._device)
                    model.eval()
                
                elif model_type == 'spacy':
                    model_name_spacy = kwargs.get('model', 'en_core_web_sm')
                    model = spacy.load(model_name_spacy)
                
                elif model_type == 'sense2vec':
                    path = kwargs.get('path', 's2v_old')
                    model = Sense2Vec().from_disk(path)
                
                else:
                    raise ValueError(f"Unknown model type: {model_type}")
                
                self._models[model_name] = model
                logger.info(f"Model '{model_name}' loaded successfully")
                return model
                
            except Exception as e:
                logger.error(f"Failed to load model '{model_name}': {e}")
                raise
    
    def get_model(self, model_name):
        """
        Get a cached model.
        Args:
            model_name: str - identifier for the model
        Returns:
            model if cached, None otherwise
        """
        return self._models.get(model_name)
    
    def unload_model(self, model_name):
        """
        Unload a model to free memory.
        Args:
            model_name: str - identifier for the model
        """
        if model_name in self._models:
            logger.info(f"Unloading model '{model_name}'")
            del self._models[model_name]
            gc.collect()
            if self._device.type == 'cuda':
                torch.cuda.empty_cache()
            logger.info(f"Model '{model_name}' unloaded")
        else:
            logger.warning(f"Model '{model_name}' not found in cache")
    
    def clear_all(self):
        """Unload all models and clear cache."""
        logger.info("Clearing all models from cache")
        self._models.clear()
        gc.collect()
        if self._device.type == 'cuda':
            torch.cuda.empty_cache()
        logger.info("All models cleared")


# Global model manager instance
model_manager = ModelManager()


class MCQGenerator:
    
    def __init__(self):
        """Initialize MCQGenerator with lazy model loading."""
        self.model_manager = model_manager
        self.device = self.model_manager.get_device()
        self._tokenizer = None
        self._model = None
        self._nlp = None
        self._s2v = None
        self._fdist = None
        self._normalized_levenshtein = None
        self.set_seed(42)
        logger.info("MCQGenerator initialized with lazy loading")
    
    @property
    def tokenizer(self):
        """Lazy load tokenizer."""
        if self._tokenizer is None:
            self._tokenizer = self.model_manager.load_model(
                'mcq_tokenizer', 
                'tokenizer', 
                pretrained='t5-large'
            )
        return self._tokenizer
    
    @property
    def model(self):
        """Lazy load transformer model."""
        if self._model is None:
            self._model = self.model_manager.load_model(
                'mcq_model', 
                'transformer', 
                pretrained='Roasters/Question-Generator'
            )
        return self._model
    
    @property
    def nlp(self):
        """Lazy load spacy model."""
        if self._nlp is None:
            self._nlp = self.model_manager.load_model(
                'spacy_model', 
                'spacy', 
                model='en_core_web_sm'
            )
        return self._nlp
    
    @property
    def s2v(self):
        """Lazy load sense2vec model."""
        if self._s2v is None:
            self._s2v = self.model_manager.load_model(
                's2v_model', 
                'sense2vec', 
                path='s2v_old'
            )
        return self._s2v
    
    @property
    def fdist(self):
        """Lazy load frequency distribution."""
        if self._fdist is None:
            self._fdist = FreqDist(brown.words())
        return self._fdist
    
    @property
    def normalized_levenshtein(self):
        """Lazy load normalized levenshtein."""
        if self._normalized_levenshtein is None:
            self._normalized_levenshtein = NormalizedLevenshtein()
        return self._normalized_levenshtein
    
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
            
    def generate_mcq(self, payload):
        start_time = time.time()
        
        try:
            inp = {
                "input_text": payload.get("input_text"),
                "max_questions": payload.get("max_questions", 4)
            }

            text = inp['input_text']
            
            # Validate input
            if not text or len(text.strip()) == 0:
                logger.warning("Empty input text provided")
                return {"questions": [], "time_taken": 0}
            
            sentences = tokenize_into_sentences(text)
            modified_text = " ".join(sentences)

            keywords = identify_keywords(
                self.nlp, 
                modified_text, 
                inp['max_questions'], 
                self.s2v, 
                self.fdist, 
                self.normalized_levenshtein, 
                len(sentences)
            )
            keyword_sentence_mapping = find_sentences_with_keywords(keywords, sentences)

            for k in keyword_sentence_mapping.keys():
                text_snippet = " ".join(keyword_sentence_mapping[k][:3])
                keyword_sentence_mapping[k] = text_snippet

            final_output = {"questions": [], "time_taken": 0}

            if len(keyword_sentence_mapping.keys()) == 0:
                logger.warning("No keywords found in text")
                return final_output
            else:
                try:
                    generated_questions = generate_multiple_choice_questions(
                        keyword_sentence_mapping, 
                        self.device, 
                        self.tokenizer, 
                        self.model, 
                        self.s2v, 
                        self.normalized_levenshtein
                    )
                except Exception as e:
                    logger.error(f"Error generating questions: {e}")
                    return final_output

                end_time = time.time()

                final_output["statement"] = modified_text
                final_output["questions"] = generated_questions["questions"]
                final_output["time_taken"] = end_time - start_time
                
                # Memory cleanup after generation
                if self.device.type == 'cuda':
                    torch.cuda.empty_cache()
                gc.collect()
                    
                return final_output
                
        except Exception as e:
            logger.error(f"Critical error in generate_mcq: {e}")
            # Cleanup on error
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return {"questions": [], "time_taken": 0}

class ShortQGenerator:
    
    def __init__(self):
        """Initialize ShortQGenerator with lazy model loading."""
        self.model_manager = model_manager
        self.device = self.model_manager.get_device()
        self._tokenizer = None
        self._model = None
        self._nlp = None
        self._s2v = None
        self._fdist = None
        self._normalized_levenshtein = None
        self.set_seed(42)
        logger.info("ShortQGenerator initialized with lazy loading")
    
    @property
    def tokenizer(self):
        """Lazy load tokenizer."""
        if self._tokenizer is None:
            self._tokenizer = self.model_manager.load_model(
                'shortq_tokenizer', 
                'tokenizer', 
                pretrained='t5-large'
            )
        return self._tokenizer
    
    @property
    def model(self):
        """Lazy load transformer model."""
        if self._model is None:
            self._model = self.model_manager.load_model(
                'shortq_model', 
                'transformer', 
                pretrained='Roasters/Question-Generator'
            )
        return self._model
    
    @property
    def nlp(self):
        """Lazy load spacy model."""
        if self._nlp is None:
            self._nlp = self.model_manager.load_model(
                'spacy_model', 
                'spacy', 
                model='en_core_web_sm'
            )
        return self._nlp
    
    @property
    def s2v(self):
        """Lazy load sense2vec model."""
        if self._s2v is None:
            self._s2v = self.model_manager.load_model(
                's2v_model', 
                'sense2vec', 
                path='s2v_old'
            )
        return self._s2v
    
    @property
    def fdist(self):
        """Lazy load frequency distribution."""
        if self._fdist is None:
            self._fdist = FreqDist(brown.words())
        return self._fdist
    
    @property
    def normalized_levenshtein(self):
        """Lazy load normalized levenshtein."""
        if self._normalized_levenshtein is None:
            self._normalized_levenshtein = NormalizedLevenshtein()
        return self._normalized_levenshtein
        
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
            
    def generate_shortq(self, payload):
        try:
            inp = {
                "input_text": payload.get("input_text"),
                "max_questions": payload.get("max_questions", 4)
            }

            text = inp['input_text']
            
            # Validate input
            if not text or len(text.strip()) == 0:
                logger.warning("Empty input text provided")
                return {"questions": []}
            
            sentences = tokenize_into_sentences(text)
            modified_text = " ".join(sentences)

            keywords = identify_keywords(
                self.nlp, 
                modified_text, 
                inp['max_questions'], 
                self.s2v, 
                self.fdist, 
                self.normalized_levenshtein, 
                len(sentences)
            )
            keyword_sentence_mapping = find_sentences_with_keywords(keywords, sentences)
            
            for k in keyword_sentence_mapping.keys():
                text_snippet = " ".join(keyword_sentence_mapping[k][:3])
                keyword_sentence_mapping[k] = text_snippet

            final_output = {"questions": []}

            if len(keyword_sentence_mapping.keys()) == 0:
                logger.warning("No keywords found in text")
                return final_output
            else:
                generated_questions = generate_normal_questions(
                    keyword_sentence_mapping, 
                    self.device, 
                    self.tokenizer, 
                    self.model
                )

            final_output["statement"] = modified_text
            final_output["questions"] = generated_questions["questions"]
            
            # Memory cleanup after generation
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()

            return final_output
            
        except Exception as e:
            logger.error(f"Critical error in generate_shortq: {e}")
            # Cleanup on error
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return {"questions": []}
            
class ParaphraseGenerator:
    
    def __init__(self):
        """Initialize ParaphraseGenerator with lazy model loading."""
        self.model_manager = model_manager
        self.device = self.model_manager.get_device()
        self._tokenizer = None
        self._model = None
        self.set_seed(42)
        logger.info("ParaphraseGenerator initialized with lazy loading")
    
    @property
    def tokenizer(self):
        """Lazy load tokenizer."""
        if self._tokenizer is None:
            self._tokenizer = self.model_manager.load_model(
                'paraphrase_tokenizer', 
                'tokenizer', 
                pretrained='t5-large'
            )
        return self._tokenizer
    
    @property
    def model(self):
        """Lazy load transformer model."""
        if self._model is None:
            self._model = self.model_manager.load_model(
                'paraphrase_model', 
                'transformer', 
                pretrained='Roasters/Question-Generator'
            )
        return self._model
        
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def generate_paraphrase(self, payload):
        start_time = time.time()
        
        try:
            inp = {
                "input_text": payload.get("input_text"),
                "max_questions": payload.get("max_questions", 3)
            }

            text = inp['input_text']
            num = inp['max_questions']
            
            # Validate input
            if not text or len(text.strip()) == 0:
                logger.warning("Empty input text provided")
                return {"Paraphrased Questions": []}
            
            sentence = text
            text_to_paraphrase = "paraphrase: " + sentence + " </s>"

            encoding = self.tokenizer.encode_plus(
                text_to_paraphrase, 
                pad_to_max_length=True, 
                return_tensors="pt"
            )
            input_ids = encoding["input_ids"].to(self.device)
            attention_masks = encoding["attention_mask"].to(self.device)

            beam_outputs = self.model.generate(
                input_ids=input_ids,
                attention_mask=attention_masks,
                max_length=50,
                num_beams=50,
                num_return_sequences=num,
                no_repeat_ngram_size=2,
                early_stopping=True
            )

            final_outputs = []
            for beam_output in beam_outputs:
                paraphrased_sentence = self.tokenizer.decode(
                    beam_output, 
                    skip_special_tokens=True, 
                    clean_up_tokenization_spaces=True
                )
                if paraphrased_sentence.lower() != sentence.lower() and paraphrased_sentence not in final_outputs:
                    final_outputs.append(paraphrased_sentence)
            
            output = {}
            output['Original Sentence'] = sentence
            output['Count'] = num
            output['Paraphrased Questions'] = final_outputs

            # Memory cleanup
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            
            return output
            
        except Exception as e:
            logger.error(f"Critical error in generate_paraphrase: {e}")
            # Cleanup on error
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return {"Paraphrased Questions": []}

class BoolQGenerator:
       
    def __init__(self):
        """Initialize BoolQGenerator with lazy model loading."""
        self.model_manager = model_manager
        self.device = self.model_manager.get_device()
        self._tokenizer = None
        self._model = None
        self.set_seed(42)
        logger.info("BoolQGenerator initialized with lazy loading")
    
    @property
    def tokenizer(self):
        """Lazy load tokenizer."""
        if self._tokenizer is None:
            self._tokenizer = self.model_manager.load_model(
                'boolq_tokenizer', 
                'tokenizer', 
                pretrained='t5-base'
            )
        return self._tokenizer
    
    @property
    def model(self):
        """Lazy load transformer model."""
        if self._model is None:
            self._model = self.model_manager.load_model(
                'boolq_model', 
                'transformer', 
                pretrained='Roasters/Boolean-Questions'
            )
        return self._model
        
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def random_choice(self):
        a = random.choice([0,1])
        return bool(a)
    
    def generate_boolq(self, payload):
        start_time = time.time()
        
        try:
            inp = {
                "input_text": payload.get("input_text"),
                "max_questions": payload.get("max_questions", 4)
            }

            text = inp['input_text']
            num = inp['max_questions']
            
            # Validate input
            if not text or len(text.strip()) == 0:
                logger.warning("Empty input text provided")
                return {"Boolean_Questions": []}
            
            sentences = tokenize_into_sentences(text)
            modified_text = " ".join(sentences)
            answer = self.random_choice()
            form = "truefalse: %s passage: %s </s>" % (modified_text, answer)
            
            encoding = self.tokenizer.encode_plus(form, return_tensors="pt")
            input_ids = encoding["input_ids"].to(self.device)
            attention_masks = encoding["attention_mask"].to(self.device)

            output = beam_search_decoding(input_ids, attention_masks, self.model, self.tokenizer, num)
            
            # Memory cleanup
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            
            final = {}
            final['Text'] = text
            final['Count'] = num
            final['Boolean_Questions'] = output
                
            return final
            
        except Exception as e:
            logger.error(f"Critical error in generate_boolq: {e}")
            # Cleanup on error
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return {"Boolean_Questions": []}
            

class AnswerPredictor:
          
    def __init__(self):
        """Initialize AnswerPredictor with lazy model loading."""
        self.model_manager = model_manager
        self.device = self.model_manager.get_device()
        self._tokenizer = None
        self._model = None
        self._nli_tokenizer = None
        self._nli_model = None
        self.nli_model_name = "typeform/distilbert-base-uncased-mnli"
        self.set_seed(42)
        logger.info("AnswerPredictor initialized with lazy loading")
    
    @property
    def tokenizer(self):
        """Lazy load tokenizer."""
        if self._tokenizer is None:
            self._tokenizer = self.model_manager.load_model(
                'answer_tokenizer', 
                'tokenizer', 
                pretrained='t5-large',
                model_max_length=512
            )
        return self._tokenizer
    
    @property
    def model(self):
        """Lazy load transformer model."""
        if self._model is None:
            self._model = self.model_manager.load_model(
                'answer_model', 
                'transformer', 
                pretrained='Roasters/Answer-Predictor'
            )
        return self._model
    
    @property
    def nli_tokenizer(self):
        """Lazy load NLI tokenizer."""
        if self._nli_tokenizer is None:
            self._nli_tokenizer = self.model_manager.load_model(
                'nli_tokenizer', 
                'auto_tokenizer', 
                pretrained=self.nli_model_name
            )
        return self._nli_tokenizer
    
    @property
    def nli_model(self):
        """Lazy load NLI model."""
        if self._nli_model is None:
            self._nli_model = self.model_manager.load_model(
                'nli_model', 
                'auto_model_classification', 
                pretrained=self.nli_model_name
            )
        return self._nli_model
        
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def greedy_decoding(self, inp_ids, attn_mask):
        greedy_output = self.model.generate(input_ids=inp_ids, attention_mask=attn_mask, max_length=256)
        Question = self.tokenizer.decode(greedy_output[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        return Question.strip().capitalize()

    def predict_answer(self, payload):
        try:
            answers = []
            inp = {
                "input_text": payload.get("input_text"),
                "input_question": payload.get("input_question")
            }
            
            for ques in payload.get("input_question"):
                try:
                    context = inp["input_text"]
                    question = ques
                    input_text = "question: %s <s> context: %s </s>" % (question, context)

                    encoding = self.tokenizer.encode_plus(input_text, return_tensors="pt")
                    input_ids = encoding["input_ids"].to(self.device)
                    attention_masks = encoding["attention_mask"].to(self.device)
                    
                    greedy_output = self.model.generate(
                        input_ids=input_ids, 
                        attention_mask=attention_masks, 
                        max_length=256
                    )
                    Question = self.tokenizer.decode(
                        greedy_output[0], 
                        skip_special_tokens=True, 
                        clean_up_tokenization_spaces=True
                    )
                    answers.append(Question.strip().capitalize())
                except Exception as e:
                    logger.error(f"Error predicting answer for question '{ques}': {e}")
                    answers.append("")

            # Memory cleanup
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()

            return answers
            
        except Exception as e:
            logger.error(f"Critical error in predict_answer: {e}")
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return []

    def predict_boolean_answer(self, payload):
        try:
            input_text = payload.get("input_text", "")
            input_questions = payload.get("input_question", [])

            answers = []

            for question in input_questions:
                try:
                    hypothesis = question
                    inputs = self.nli_tokenizer.encode_plus(input_text, hypothesis, return_tensors="pt")
                    # Move inputs to device
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}
                    outputs = self.nli_model(**inputs)
                    logits = outputs.logits
                    probabilities = torch.softmax(logits, dim=1)
                    entailment_prob = probabilities[0][0].item()
                    contradiction_prob = probabilities[0][2].item()
                    
                    if entailment_prob > contradiction_prob:
                        answers.append(True)
                    else:
                        answers.append(False)
                except Exception as e:
                    logger.error(f"Error predicting boolean answer for question '{question}': {e}")
                    answers.append(False)

            # Memory cleanup
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()

            return answers
            
        except Exception as e:
            logger.error(f"Critical error in predict_boolean_answer: {e}")
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return []

class GoogleDocsService:
    def __init__(self, service_account_file, scopes):
        self.credentials = service_account.Credentials.from_service_account_file(
            service_account_file, scopes=scopes)
        self.docs_service = build('docs', 'v1', credentials=self.credentials)

    @staticmethod
    def extract_document_id(url):
        """
        Extracts the Google Docs document ID from a given URL.
        """
        match = re.search(r'/document/d/([^/]+)', url)
        if match:
            return match.group(1)
        return None

    def get_document_content(self, document_url):
        """
        Retrieves the content of a Google Docs document given its URL.
        """
        document_id = self.extract_document_id(document_url)
        if not document_id:
            raise ValueError('Invalid document URL')

        response = self.docs_service.documents().get(documentId=document_id).execute()
        doc = response.get('body', {})

        text = ''
        for element in doc.get('content', []):
            if 'paragraph' in element:
                for p in element['paragraph']['elements']:
                    if 'textRun' in p:
                        text += p['textRun']['content']

        return text.strip()
    

class FileProcessor:
    def __init__(self, upload_folder='uploads/'):
        self.upload_folder = upload_folder
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)

    def extract_text_from_pdf(self, file_path):
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def extract_text_from_docx(self, file_path):
        with open(file_path, "rb") as docx_file:
            result = mammoth.extract_raw_text(docx_file)
            return result.value

    def process_file(self, file):
        file_path = os.path.join(self.upload_folder, file.filename)
        file.save(file_path)
        content = ""

        if file.filename.endswith('.txt'):
            with open(file_path, 'r') as f:
                content = f.read()
        elif file.filename.endswith('.pdf'):
            content = self.extract_text_from_pdf(file_path)
        elif file.filename.endswith('.docx'):
            content = self.extract_text_from_docx(file_path)

        os.remove(file_path)
        return content

class QuestionGenerator:
    """A transformer-based NLP system for generating reading comprehension-style questions from
    texts. It can generate full sentence questions, multiple choice questions, or a mix of the
    two styles.

    To filter out low quality questions, questions are assigned a score and ranked once they have
    been generated. Only the top k questions will be returned. This behaviour can be turned off
    by setting use_evaluator=False.
    """

    def __init__(self) -> None:
        """Initialize QuestionGenerator with lazy model loading."""
        QG_PRETRAINED = "iarfmoose/t5-base-question-generator"
        self.QG_PRETRAINED = QG_PRETRAINED
        self.ANSWER_TOKEN = "<answer>"
        self.CONTEXT_TOKEN = "<context>"
        self.SEQ_LENGTH = 512

        self.model_manager = model_manager
        self.device = self.model_manager.get_device()
        
        self._qg_tokenizer = None
        self._qg_model = None
        self._qa_evaluator = None
        logger.info("QuestionGenerator initialized with lazy loading")
    
    @property
    def qg_tokenizer(self):
        """Lazy load QG tokenizer."""
        if self._qg_tokenizer is None:
            self._qg_tokenizer = self.model_manager.load_model(
                'qg_tokenizer', 
                'auto_tokenizer', 
                pretrained=self.QG_PRETRAINED,
                use_fast=False
            )
        return self._qg_tokenizer
    
    @property
    def qg_model(self):
        """Lazy load QG model."""
        if self._qg_model is None:
            self._qg_model = self.model_manager.load_model(
                'qg_model', 
                'auto_model_seq2seq', 
                pretrained=self.QG_PRETRAINED
            )
        return self._qg_model
    
    @property
    def qa_evaluator(self):
        """Lazy load QA evaluator."""
        if self._qa_evaluator is None:
            self._qa_evaluator = QAEvaluator()
        return self._qa_evaluator

    def generate(
        self,
        article: str,
        use_evaluator: bool = False,
        num_questions: bool = None,
        answer_style: str = "all",
    ) -> List:
        """Takes an article and generates a set of question and answer pairs. If use_evaluator
        is True then QA pairs will be ranked and filtered based on their quality. answer_style
        should selected from ["all", "sentences", "multiple_choice"].
        """
        try:
            logger.info("Generating questions...")

            qg_inputs, qg_answers = self.generate_qg_inputs(article, answer_style)
            generated_questions = self.generate_questions_from_inputs(qg_inputs)

            message = "{} questions doesn't match {} answers".format(
                len(generated_questions), len(qg_answers)
            )
            assert len(generated_questions) == len(qg_answers), message

            if use_evaluator:
                logger.info("Evaluating QA pairs...")
                encoded_qa_pairs = self.qa_evaluator.encode_qa_pairs(
                    generated_questions, qg_answers
                )
                scores = self.qa_evaluator.get_scores(encoded_qa_pairs)

                if num_questions:
                    qa_list = self._get_ranked_qa_pairs(
                        generated_questions, qg_answers, scores, num_questions
                    )
                else:
                    qa_list = self._get_ranked_qa_pairs(
                        generated_questions, qg_answers, scores
                    )

            else:
                logger.info("Skipping evaluation step")
                qa_list = self._get_all_qa_pairs(generated_questions, qg_answers)

            # Memory cleanup
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()

            return qa_list
            
        except Exception as e:
            logger.error(f"Error in generate: {e}")
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return []

    def generate_qg_inputs(
        self, text: str, answer_style: str
    ) -> Tuple[List[str], List[str]]:
        """Given a text, returns a list of model inputs and a list of corresponding answers.
        Model inputs take the form "answer_token <answer text> context_token <context text>" where
        the answer is a string extracted from the text, and the context is the wider text surrounding
        the context.
        """

        VALID_ANSWER_STYLES = ["all", "sentences", "multiple_choice"]

        if answer_style not in VALID_ANSWER_STYLES:
            raise ValueError(
                "Invalid answer style {}. Please choose from {}".format(
                    answer_style, VALID_ANSWER_STYLES
                )
            )

        inputs = []
        answers = []

        if answer_style == "sentences" or answer_style == "all":
            segments = self._split_into_segments(text)

            for segment in segments:
                sentences = self._split_text(segment)
                prepped_inputs, prepped_answers = self._prepare_qg_inputs(
                    sentences, segment
                )
                inputs.extend(prepped_inputs)
                answers.extend(prepped_answers)

        if answer_style == "multiple_choice" or answer_style == "all":
            sentences = self._split_text(text)
            prepped_inputs, prepped_answers = self._prepare_qg_inputs_MC(sentences)
            inputs.extend(prepped_inputs)
            answers.extend(prepped_answers)

        return inputs, answers

    def generate_questions_from_inputs(self, qg_inputs: List) -> List[str]:
        """Given a list of concatenated answers and contexts, with the form:
        "answer_token <answer text> context_token <context text>", generates a list of
        questions.
        """
        generated_questions = []

        for qg_input in qg_inputs:
            question = self._generate_question(qg_input)
            generated_questions.append(question)

        return generated_questions

    def _split_text(self, text: str) -> List[str]:
        """Splits the text into sentences, and attempts to split or truncate long sentences."""
        MAX_SENTENCE_LEN = 128
        sentences = re.findall(".*?[.!\?]", text)
        cut_sentences = []

        for sentence in sentences:
            if len(sentence) > MAX_SENTENCE_LEN:
                cut_sentences.extend(re.split("[,;:)]", sentence))

        # remove useless post-quote sentence fragments
        cut_sentences = [s for s in sentences if len(s.split(" ")) > 5]
        sentences = sentences + cut_sentences

        return list(set([s.strip(" ") for s in sentences]))

    def _split_into_segments(self, text: str) -> List[str]:
        """Splits a long text into segments short enough to be input into the transformer network.
        Segments are used as context for question generation.
        """
        MAX_TOKENS = 490
        paragraphs = text.split("\n")
        tokenized_paragraphs = [
            self.qg_tokenizer(p)["input_ids"] for p in paragraphs if len(p) > 0
        ]
        segments = []

        while len(tokenized_paragraphs) > 0:
            segment = []

            while len(segment) < MAX_TOKENS and len(tokenized_paragraphs) > 0:
                paragraph = tokenized_paragraphs.pop(0)
                segment.extend(paragraph)
            segments.append(segment)

        return [self.qg_tokenizer.decode(s, skip_special_tokens=True) for s in segments]

    def _prepare_qg_inputs(
        self, sentences: List[str], text: str
    ) -> Tuple[List[str], List[str]]:
        """Uses sentences as answers and the text as context. Returns a tuple of (model inputs, answers).
        Model inputs are "answer_token <answer text> context_token <context text>"
        """
        inputs = []
        answers = []

        for sentence in sentences:
            qg_input = f"{self.ANSWER_TOKEN} {sentence} {self.CONTEXT_TOKEN} {text}"
            inputs.append(qg_input)
            answers.append(sentence)

        return inputs, answers

    def _prepare_qg_inputs_MC(
        self, sentences: List[str]
    ) -> Tuple[List[str], List[str]]:
        """Performs NER on the text, and uses extracted entities are candidate answers for multiple-choice
        questions. Sentences are used as context, and entities as answers. Returns a tuple of (model inputs, answers).
        Model inputs are "answer_token <answer text> context_token <context text>"
        """
        spacy_nlp = en_core_web_sm.load()
        docs = list(spacy_nlp.pipe(sentences, disable=["parser"]))
        inputs_from_text = []
        answers_from_text = []

        for doc, sentence in zip(docs, sentences):
            entities = doc.ents
            if entities:

                for entity in entities:
                    qg_input = (
                        f"{self.ANSWER_TOKEN} {entity} {self.CONTEXT_TOKEN} {sentence}"
                    )
                    answers = self._get_MC_answers(entity, docs)
                    inputs_from_text.append(qg_input)
                    answers_from_text.append(answers)

        return inputs_from_text, answers_from_text

    def _get_MC_answers(
        self, correct_answer: Any, docs: Any
    ) -> List[Mapping[str, Any]]:
        """Finds a set of alternative answers for a multiple-choice question. Will attempt to find
        alternatives of the same entity type as correct_answer if possible.
        """
        entities = []

        for doc in docs:
            entities.extend([{"text": e.text, "label_": e.label_} for e in doc.ents])

        # remove duplicate elements
        entities_json = [json.dumps(kv) for kv in entities]
        pool = set(entities_json)
        num_choices = (
            min(4, len(pool)) - 1
        )  # -1 because we already have the correct answer

        # add the correct answer
        final_choices = []
        correct_label = correct_answer.label_
        final_choices.append({"answer": correct_answer.text, "correct": True})
        pool.remove(
            json.dumps({"text": correct_answer.text, "label_": correct_answer.label_})
        )

        # find answers with the same NER label
        matches = [e for e in pool if correct_label in e]

        # if we don't have enough then add some other random answers
        if len(matches) < num_choices:
            choices = matches
            pool = pool.difference(set(choices))
            choices.extend(random.sample(list(pool), num_choices - len(choices)))
        else:
            choices = random.sample(matches, num_choices)

        choices = [json.loads(s) for s in choices]

        for choice in choices:
            final_choices.append({"answer": choice["text"], "correct": False})

        random.shuffle(final_choices)
        return final_choices

    @torch.no_grad()
    def _generate_question(self, qg_input: str) -> str:
        """Takes qg_input which is the concatenated answer and context, and uses it to generate
        a question sentence. The generated question is decoded and then returned.
        """
        encoded_input = self._encode_qg_input(qg_input)
        output = self.qg_model.generate(input_ids=encoded_input["input_ids"])
        question = self.qg_tokenizer.decode(output[0], skip_special_tokens=True)
        return question

    def _encode_qg_input(self, qg_input: str) -> torch.tensor:
        """Tokenizes a string and returns a tensor of input ids corresponding to indices of tokens in
        the vocab.
        """
        return self.qg_tokenizer(
            qg_input,
            padding="max_length",
            max_length=self.SEQ_LENGTH,
            truncation=True,
            return_tensors="pt",
        ).to(self.device)

    def _get_ranked_qa_pairs(
        self,
        generated_questions: List[str],
        qg_answers: List[str],
        scores,
        num_questions: int = 10,
    ) -> List[Mapping[str, str]]:
        """Ranks generated questions according to scores, and returns the top num_questions examples."""
        if num_questions > len(scores):
            num_questions = len(scores)
            print(
                (
                    f"\nWas only able to generate {num_questions} questions.",
                    "For more questions, please input a longer text.",
                )
            )

        qa_list = []

        for i in range(num_questions):
            index = scores[i]
            qa = {
                "question": generated_questions[index].split("?")[0] + "?",
                "answer": qg_answers[index],
            }
            qa_list.append(qa)

        return qa_list

    def _get_all_qa_pairs(self, generated_questions: List[str], qg_answers: List[str]):
        """Formats question and answer pairs without ranking or filtering."""
        qa_list = []

        for question, answer in zip(generated_questions, qg_answers):
            qa = {"question": question.split("?")[0] + "?", "answer": answer}
            qa_list.append(qa)

        return qa_list


class QAEvaluator:
    """Wrapper for a transformer model which evaluates the quality of question-answer pairs.
    Given a QA pair, the model will generate a score. Scores can be used to rank and filter
    QA pairs.
    """

    def __init__(self) -> None:
        """Initialize QAEvaluator with lazy model loading."""
        QAE_PRETRAINED = "iarfmoose/bert-base-cased-qa-evaluator"
        self.QAE_PRETRAINED = QAE_PRETRAINED
        self.SEQ_LENGTH = 512

        self.model_manager = model_manager
        self.device = self.model_manager.get_device()

        self._qae_tokenizer = None
        self._qae_model = None
        logger.info("QAEvaluator initialized with lazy loading")
    
    @property
    def qae_tokenizer(self):
        """Lazy load QAE tokenizer."""
        if self._qae_tokenizer is None:
            self._qae_tokenizer = self.model_manager.load_model(
                'qae_tokenizer', 
                'auto_tokenizer', 
                pretrained=self.QAE_PRETRAINED
            )
        return self._qae_tokenizer
    
    @property
    def qae_model(self):
        """Lazy load QAE model."""
        if self._qae_model is None:
            self._qae_model = self.model_manager.load_model(
                'qae_model', 
                'auto_model_classification', 
                pretrained=self.QAE_PRETRAINED
            )
        return self._qae_model

    def encode_qa_pairs(
        self, questions: List[str], answers: List[str]
    ) -> List[torch.tensor]:
        """Takes a list of questions and a list of answers and encodes them as a list of tensors."""
        encoded_pairs = []

        for question, answer in zip(questions, answers):
            encoded_qa = self._encode_qa(question, answer)
            encoded_pairs.append(encoded_qa.to(self.device))

        return encoded_pairs

    def get_scores(self, encoded_qa_pairs: List[torch.tensor]) -> List[float]:
        """Generates scores for a list of encoded QA pairs."""
        try:
            scores = {}

            for i in range(len(encoded_qa_pairs)):
                scores[i] = self._evaluate_qa(encoded_qa_pairs[i])

            # Memory cleanup
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()

            return [
                k for k, v in sorted(scores.items(), key=lambda item: item[1], reverse=True)
            ]
            
        except Exception as e:
            logger.error(f"Error in get_scores: {e}")
            if self.device.type == 'cuda':
                torch.cuda.empty_cache()
            gc.collect()
            return []

    def _encode_qa(self, question: str, answer: str) -> torch.tensor:
        """Concatenates a question and answer, and then tokenizes them. Returns a tensor of
        input ids corresponding to indices in the vocab.
        """
        if type(answer) is list:
            for a in answer:
                if a["correct"]:
                    correct_answer = a["answer"]
        else:
            correct_answer = answer

        return self.qae_tokenizer(
            text=question,
            text_pair=correct_answer,
            padding="max_length",
            max_length=self.SEQ_LENGTH,
            truncation=True,
            return_tensors="pt",
        )

    @torch.no_grad()
    def _evaluate_qa(self, encoded_qa_pair: torch.tensor) -> float:
        """Takes an encoded QA pair and returns a score."""
        output = self.qae_model(**encoded_qa_pair)
        return output[0][0][1]


def print_qa(qa_list: List[Mapping[str, str]], show_answers: bool = True) -> None:
    """Formats and prints a list of generated questions and answers."""

    for i in range(len(qa_list)):
        # wider space for 2 digit q nums
        space = " " * int(np.where(i < 9, 3, 4))

        print(f"{i + 1}) Q: {qa_list[i]['question']}")

        answer = qa_list[i]["answer"]

        # print a list of multiple choice answers
        if type(answer) is list:

            if show_answers:
                print(
                    f"{space}A: 1. {answer[0]['answer']} "
                    f"{np.where(answer[0]['correct'], '(correct)', '')}"
                )
                for j in range(1, len(answer)):
                    print(
                        f"{space + '   '}{j + 1}. {answer[j]['answer']} "
                        f"{np.where(answer[j]['correct']==True,'(correct)', '')}"
                    )

            else:
                print(f"{space}A: 1. {answer[0]['answer']}")
                for j in range(1, len(answer)):
                    print(f"{space + '   '}{j + 1}. {answer[j]['answer']}")

            print("")

        # print full sentence answers
        else:
            if show_answers:
                print(f"{space}A: {answer}\n")
