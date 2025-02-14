from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
import nltk
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
nltk.download("stopwords")
nltk.download('punkt_tab')
from api.Generator.main import MCQGenerator, AnswerPredictor, BoolQGenerator, ShortQGenerator, QuestionGenerator, GoogleDocsService, FileProcessor
import re
import json
import spacy
from transformers import pipeline
from spacy.lang.en.stop_words import STOP_WORDS
from string import punctuation
from heapq import nlargest
import random
import webbrowser
from apiclient import discovery
from httplib2 import Http
from oauth2client import client, file, tools
from mediawikiapi import MediaWikiAPI
from django.conf import settings 
from rest_framework.response import Response
import os

SERVICE_ACCOUNT_FILE = os.path.join(settings.BASE_DIR, 'api/utils/keys/service_account_key.json')
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']
MCQGen = MCQGenerator()
answer = AnswerPredictor()
BoolQGen = BoolQGenerator()
ShortQGen = ShortQGenerator()
qg = QuestionGenerator()
docs_service = GoogleDocsService(SERVICE_ACCOUNT_FILE, SCOPES)
file_processor = FileProcessor()
mediawikiapi = MediaWikiAPI()
qa_model = pipeline("question-answering")

def process_input_text(input_text, use_mediawiki):
    if use_mediawiki == 1:
        input_text = mediawikiapi.summary(input_text,8)
    return input_text