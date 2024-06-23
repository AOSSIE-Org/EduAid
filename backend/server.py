from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
import nltk
nltk.download('stopwords')
from Generator import main
import re
import json
import spacy
from transformers import pipeline
from spacy.lang.en.stop_words import STOP_WORDS
from string import punctuation
from heapq import nlargest

app = Flask(__name__)
CORS(app)
print("Starting Flask App...")

SERVICE_ACCOUNT_FILE = './service_account_key.json'
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

MCQGen = main.MCQGenerator()
answer = main.AnswerPredictor()
BoolQGen= main.BoolQGenerator()
ShortQGen = main.ShortQGenerator()
docs_service = main.GoogleDocsService(SERVICE_ACCOUNT_FILE, SCOPES)
qa_model = pipeline("question-answering")


@app.route('/get_mcq', methods=['POST'])
def get_mcq():
    data = request.get_json()
    input_text = data.get('input_text', '')
    max_questions = data.get('max_questions', 4)
    output = MCQGen.generate_mcq({'input_text': input_text, 'max_questions': max_questions})
    questions = output['questions']
    return jsonify({'output': questions})

@app.route('/get_boolq', methods=['POST'])
def get_boolq():
    data = request.get_json()
    input_text = data.get('input_text', '')
    max_questions = data.get('max_questions', 4)
    output = BoolQGen.generate_boolq({'input_text': input_text, 'max_questions': max_questions})
    boolean_questions = output['Boolean_Questions']
    return jsonify({'output': boolean_questions})

@app.route('/get_shortq', methods=['POST'])
def get_shortq():
    data = request.get_json()
    input_text = data.get('input_text', '')
    max_questions = data.get('max_questions', 4)
    output = ShortQGen.generate_shortq({'input_text': input_text, 'max_questions': max_questions})
    questions = output['questions']
    return jsonify({'output': questions})

@app.route('/get_problems',methods =['POST'])
def get_problems():
    data = request.get_json()
    input_text = data.get('input_text','')
    max_questions_mcq = data.get('max_questions_mcq',4)
    max_questions_boolq = data.get('max_questions_boolq',4)
    max_questions_shortq = data.get('max_questions_shortq',4)
    output1 = MCQGen.generate_mcq({'input_text': input_text, 'max_questions': max_questions_mcq})
    output2 = BoolQGen.generate_boolq({'input_text': input_text, 'max_questions': max_questions_boolq})
    output3 = ShortQGen.generate_shortq({'input_text': input_text, 'max_questions': max_questions_shortq})
    return jsonify({'output_mcq' : output1,
                    'output_boolq' : output2,
                    'output_shortq' : output3})

@app.route('/get_answer', methods=['POST'])
def get_answer():
    data = request.get_json()
    input_text = data.get('input_text', '')
    input_questions = data.get('input_question', [])
    answers = []
    for question in input_questions:
        qa_response = qa_model(question=question, context=input_text)
        answers.append(qa_response['answer'])

    return jsonify({'output': answers})

@app.route('/get_boolean_answer', methods=['POST'])
def get_boolean_answer():
    data = request.get_json()
    input_text = data.get('input_text', '')
    input_questions = data.get('input_question', [])
    output = answer.predict_boolean_answer({'input_text': input_text, 'input_question': input_questions})
    return jsonify({'output': output})

@app.route('/get_content', methods=['POST'])
def get_content():
    try:
        data = request.get_json()
        document_url = data.get('document_url')
        if not document_url:
            return jsonify({'error': 'Document URL is required'}), 400

        text = docs_service.get_document_content(document_url)
        return jsonify(text)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', methods=['GET'])
def hello():
    return 'The server is working fine'

if __name__ == '__main__':
    app.run()
