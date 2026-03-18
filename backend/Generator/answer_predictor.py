import time
import torch
import random
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
class AnswerPredictor:
          
    def __init__(self):
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
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def greedy_decoding(self, inp_ids, attn_mask):
        greedy_output = self.model.generate(input_ids=inp_ids, attention_mask=attn_mask, max_length=256)
        Question = self.tokenizer.decode(greedy_output[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        return Question.strip().capitalize()

    def predict_answer(self, payload):
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

