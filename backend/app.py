# Importing necessary libraries and modules
from flask import Flask, request, jsonify
from flask_cors import CORS

from pprint import pprint  # For pretty printing
import nltk  # Natural Language Toolkit
nltk.download('stopwords')  # Downloading stopwords dataset from NLTK

from Generator import main 
# Assuming Generator module contains QGen, BoolQGen, and AnswerPredictor classes

import re  # Regular Expression operations
import json  # JSON encoder and decoder
import spacy  # NLP library
from spacy.lang.en.stop_words import STOP_WORDS  # Stop words from spaCy

from string import punctuation  # Punctuation marks
from heapq import nlargest  # For selecting top n elements from an iterable

# Initializing Flask app
app = Flask(__name__)
CORS(app) 
 # Allowing Cross-Origin Resource Sharing (CORS)
print("Starting Flask App...")

# Initializing instances of QGen, BoolQGen, and AnswerPredictor classes from Generator module
qg = main.QGen()
qe = main.BoolQGen()
answer = main.AnswerPredictor()

# Endpoint for generating multiple choice questions
@app.route('/get_mcq', methods=['POST'])
def get_mcq():
    data = request.get_json()
    input_text = data.get('input_text', '') 
     # Extracting input text from JSON data
    max_questions = data.get('max_questions', 4)  
    # Extracting maximum number of questions
    output = qg.predict_mcq({'input_text': input_text, 'max_questions': max_questions})
      # Generating MCQs
    return jsonify({'output': output}) 
 # Returning output as JSON

# Endpoint for generating boolean questions
@app.route('/get_boolq', methods=['POST'])
def get_boolq():
    data = request.get_json()
    input_text = data.get('input_text', '')  
    # Extracting input text from JSON data
    max_questions = data.get('max_questions', 4) 
     # Extracting maximum number of questions
    output = qe.predict_boolq({'input_text': input_text, 'max_questions': max_questions})  
    # Generating Boolean questions
    return jsonify({'output': output})  # Returning output as JSON

# Endpoint for generating short answer questions
@app.route('/get_shortq', methods=['POST'])
def get_shortq():
    data = request.get_json()
    input_text = data.get('input_text', '') 
     # Extracting input text from JSON data
    max_questions = data.get('max_questions', 4)  # Extracting maximum number of questions
    output = qg.predict_shortq({'input_text': input_text, 'max_questions': max_questions})  # Generating short answer questions
    return jsonify({'output': output})  # Returning output as JSON

# Endpoint for paraphrasing text
@app.route('/paraphrase', methods=['POST'])
def paraphrase():
    data = request.get_json()
    input_text = data.get('input_text', '')  # Extracting input text from JSON data
    max_questions = data.get('max_questions', 3)  # Extracting maximum number of paraphrased sentences
    output = qg.paraphrase({'input_text': input_text, 'max_questions': max_questions})  # Paraphrasing input text
    return jsonify({'output': output})  # Returning output as JSON

# Endpoint for generating problems (MCQs, Boolean questions, Short answer questions)
@app.route('/get_problems', methods=['POST'])
def get_problems():
    data = request.get_json()
    input_text = data.get('input_text', '') 
     # Extracting input text from JSON data
    max_questions_mcq = data.get('max_questions_mcq', 4)
      # Extracting maximum number of MCQs
    max_questions_boolq = data.get('max_questions_boolq', 4)  
    # Extracting maximum number of Boolean questions
    max_questions_shortq = data.get('max_questions_shortq', 4) 
     # Extracting maximum number of short answer questions
    output1 = qg.predict_mcq({'input_text': input_text, 'max_questions': max_questions_mcq}) 
     # Generating MCQs
    output2 = qe.predict_boolq({'input_text': input_text, 'max_questions': max_questions_boolq})  
    # Generating Boolean questions
    output3 = qg.predict_shortq({'input_text': input_text, 'max_questions': max_questions_shortq}) 
     # Generating short answer questions
    return jsonify({'output_mcq': output1,
                    'output_boolq': output2,
                    'output_shortq': output3}) 
 # Returning outputs as JSON

# Endpoint for generating answer key for generated questions
@app.route('/get_answerkey', methods=['POST'])
def get_answerkey():
    data = request.get_json()
    questions = (data.get('questions', '')) 
     # Extracting questions from JSON data
    boolean_questions = questions["output_boolq"]["Boolean_Questions"] 
     # Extracting Boolean questions
    mcq_questions = questions["output_mcq"]["questions"] 
     # Extracting MCQs
    short_questions = questions["output_shortq"]["questions"] 
     # Extracting short answer questions
    context_boolq = []
    context_mcq = []
    context_shortq = []
    # Generating answers for Boolean questions
    for question in boolean_questions:
        payload = {
            "input_text": questions["output_boolq"]["Text"],
            "input_question": question
        }
        response = answer.predict_answer(payload)
        context_boolq.append(response[0])
    # Gathering answers and contexts for short answer questions
    for question in short_questions:
        solution = {
            "answer": question["Answer"],
            "context": question["context"]
        }
        context_shortq.append(solution)
    # Gathering answers and contexts for MCQs
    for question in mcq_questions:
        solution = {
            "answer": question["answer"],
            "context": question["context"],
        }
        context_mcq.append(solution)
    answer_key = {
        "context_boolq": context_boolq,
        "context_mcq": context_mcq,
        "context_shortq": context_shortq
    }
    return jsonify({'answer_key': answer_key})  # Returning answer key as JSON

# Endpoint for summarizing text
@app.route("/summarize", methods=['POST'])
def summarize():
    data = request.get_json()
    input_text = data.get('input_text', '') 
     # Extracting input text from JSON data
    ratio = data.get('ratio', 0.2) 
     # Extracting ratio for summarization
    nlp = spacy.load('en_core_web_sm')
      # Loading English model for spaCy
    doc = nlp(input_text) 
     # Processing input text with spaCy
    tokens = [token.text for token in doc] 
     # Extracting tokens
    word_frequencies = {}
    # Calculating word frequencies
    for word in doc:
        if word.text.lower() not in list(STOP_WORDS):
            if word.text.lower() not in punctuation:
                if word.text not in word_frequencies.keys():
                    word_frequencies[word.text] = 1
                else:
                    word_frequencies[word.text] +=1
        # Maximum frequency of words
    max_frequency = max(word_frequencies.values())
    
    # Normalizing word frequencies
    for word in word_frequencies.keys():
        word_frequencies[word] = word_frequencies[word] / max_frequency
    
    # Tokenizing into sentences
    sentence_tokens = [sent for sent in doc.sents]
    
    # Calculating sentence scores based on word frequencies
    sentence_scores = {}
    for sent in sentence_tokens:
        for word in sent:
            if word.text.lower() in word_frequencies.keys():
                if sent not in sentence_scores.keys():
                    sentence_scores[sent] = word_frequencies[word.text.lower()]
                else:
                    sentence_scores[sent] += word_frequencies[word.text.lower()]
    
    # Selecting top sentences based on scores
    select_length = int(len(sentence_tokens) * ratio)
    summary = nlargest(select_length, sentence_scores, key=sentence_scores.get)
    
    # Generating final summary text
    final_summary = [word.text for word in summary]
    summary = ''.join(final_summary)
    
    # Returning the summary
    return jsonify({
        'summary': final_summary
    })

# Default route to check if the server is running
@app.route('/', methods=['GET'])
def hello():
    return 'The server is working fine'

# Running the Flask app if this script is executed
if __name__ == '__main__':
    app.run()
