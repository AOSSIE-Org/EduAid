import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
from transformers import pipeline
import argparse
from transformers import BartForConditionalGeneration, BartTokenizer
import PyPDF2
import os
import speech_recognition as sr

model_A = '../Model_training/KeyPhrase Detection/fine_tuned_t5_model_kp/'
model_A_tokenizer = '../Model_training/KeyPhrase Detection/fine_tuned_t5_tokenizer_kp/'
model_B = '../Model_training/AnswerAwareQG/fine_tuned_t5_model_aaqg/'
model_B_tokenizer = '../Model_training/AnswerAwareQG/fine_tuned_t5_tokenizer_aaqg/'
summarizer_model = 'facebook/bart-large-cnn'
DATA_DIR = './data'

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file_name', '-f', help='Name of the PDF file which contains the data')
    parser.add_argument('--num_pages', '-n', help='Number of pages of the PDF to use', type=int, default=5)
    parser.add_argument('--start_page', type=int, help='Where to start reading the PDF from', default=1)
    parser.add_argument('--save_dir', '-s', help='Directory where the generated QnA is to be saved', default='./qna')
    parser.add_argument('--save_as', help='Name of the file to save as (without extension)')
    parser.add_argument('--audio', '-a', help='Use audio input instead of a PDF', action='store_true')
    return parser.parse_args()

def generate_question(context, answer, model_path, tokenizer_path):
    model = T5ForConditionalGeneration.from_pretrained(model_path)
    tokenizer = T5Tokenizer.from_pretrained(tokenizer_path)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    
    input_text = f'answer: {answer} context: {cogivntext}'
    inputs = tokenizer.encode_plus(input_text, padding='max_length', truncation=True, max_length=512, return_tensors='pt')
    input_ids = inputs['input_ids'].to(device)
    attention_mask = inputs['attention_mask'].to(device)
    
    with torch.no_grad():
        output = model.generate(input_ids=input_ids, attention_mask=attention_mask, max_length=32)
    
    return tokenizer.decode(output[0], skip_special_tokens=True)

def generate_keyphrases(text, model_path, tokenizer_path):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = T5ForConditionalGeneration.from_pretrained(model_path)
    tokenizer = T5Tokenizer.from_pretrained(tokenizer_path)
    model.to(device)
    
    input_text = f'detect keyword: abstract: {text}'
    input_ids = tokenizer.encode(input_text, truncation=True, padding='max_length', max_length=512, return_tensors='pt').to(device)
    output = model.generate(input_ids)
    keyphrases = tokenizer.decode(output[0], skip_special_tokens=True).split(',')
    
    return [x.strip() for x in keyphrases if x]

def summarize_text(input_text, model_name):
    model = BartForConditionalGeneration.from_pretrained(model_name)
    tokenizer = BartTokenizer.from_pretrained(model_name)
    input_ids = tokenizer.encode(input_text, truncation=True, max_length=1024, return_tensors='pt')
    summary_ids = model.generate(input_ids, max_length=100)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

def summarize_pdf(pdf_path, model_name, pages, start_page):
    with open(pdf_path, 'rb') as f:
        pdf = PyPDF2.PdfReader(f)
        text = ''
        for page_num in range(start_page, start_page + pages):
            text += pdf.pages[page_num].extract_text()
        return summarize_text(text, model_name)

def transcribe_audio():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Please speak...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)
    
    try:
        text = recognizer.recognize_google(audio)
        print("Transcribed Text: ", text)
        return text
    except sr.UnknownValueError:
        print("Could not understand the audio")
        return ""
    except sr.RequestError:
        print("Could not request results, check internet connection")
        return ""

def main():
    global model_A, model_A_tokenizer, model_B, model_B_tokenizer, summarizer_model, DATA_DIR
    args = parse_arguments()
    
    if args.audio:
        text_input = transcribe_audio()
    else:
        pdf_path = os.path.join(DATA_DIR, f'{args.file_name}.pdf') if not args.file_name.endswith('.pdf') else os.path.join(DATA_DIR, args.file_name)
        text_input = summarize_pdf(pdf_path, summarizer_model, args.num_pages, args.start_page)
    
    if text_input.strip():
        answers = generate_keyphrases(text_input, model_A, model_A_tokenizer)
        questions = [generate_question(text_input, answer, model_B, model_B_tokenizer) for answer in answers]
    
        for i, (question, answer) in enumerate(zip(questions, answers)):
            print(f'Question {i+1}: {question}')
            print(f'Answer {i+1}: {answer}')
            print('-------------------------------------------------------------------------------')
    
        save_file = os.path.join(args.save_dir, f'{args.save_as}.txt')
        with open(save_file, 'w') as f:
            for i, (question, answer) in enumerate(zip(questions, answers)):
                f.write(f'Question {i+1}: {question}\n')
                f.write(f'Answer {i+1}: {answer}\n\n')
    
if __name__ == '__main__':
    main()


    
