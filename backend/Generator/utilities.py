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
