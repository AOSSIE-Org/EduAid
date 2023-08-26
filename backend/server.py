import http.server
import socketserver
import urllib.parse
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer, pipeline
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import json

IP='127.0.0.1'
PORT=8000

def summarize(text):
    summarizer=pipeline('summarization')
    return summarizer(text,max_length=110)[0]['summary_text']


def generate_question(context,answer,model_path, tokenizer_path):
    model = T5ForConditionalGeneration.from_pretrained(model_path)
    tokenizer = T5Tokenizer.from_pretrained(tokenizer_path)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)

    input_text=f'answer: {answer} context: {context}'

    inputs=tokenizer.encode_plus(
        input_text,
        padding='max_length',
        truncation=True,
        max_length=512,
        return_tensors='pt'
    )

    input_ids=inputs['input_ids'].to(device)
    attention_mask=inputs['attention_mask'].to(device)

    with torch.no_grad():
        output=model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_length=32
        )

    generated_question = tokenizer.decode(output[0], skip_special_tokens=True)
    return generated_question

def generate_keyphrases(abstract, model_path,tokenizer_path):
    device= torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = T5ForConditionalGeneration.from_pretrained(model_path)
    tokenizer = T5Tokenizer.from_pretrained(tokenizer_path)
    model.to(device)
    # tokenizer.to(device)
    input_text=f'detect keyword: abstract: {abstract}'
    input_ids=tokenizer.encode(input_text, truncation=True,padding='max_length',max_length=512,return_tensors='pt').to(device)
    output=model.generate(input_ids)
    keyphrases= tokenizer.decode(output[0],skip_special_tokens=True).split(',')
    return [x.strip() for x in keyphrases if x != '']

def generate_qa(text):

    # text_summary=summarize(text)
    text_summary=text
    

    modelA, modelB='./models/modelA','./models/modelB'
    # tokenizerA, tokenizerB= './tokenizers/tokenizerA', './tokenizers/tokenizerB'
    tokenizerA, tokenizerB= 't5-base', 't5-base'

    answers=generate_keyphrases(text_summary, modelA, tokenizerA)

    qa={}
    for answer in answers:
        question= generate_question(text_summary, answer, modelB, tokenizerB)
        qa[question]=answer
    
    return qa
    





class QARequestHandler(http.server.BaseHTTPRequestHandler):

    def do_POST(self):

        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()

        content_length=int(self.headers["Content-Length"])
        post_data=self.rfile.read(content_length).decode('utf-8')

        # parsed_data=urllib.parse.parse_qs(post_data)
        parsed_data = json.loads(post_data)


        input_text=parsed_data.get('input_text')

        qa=generate_qa(input_text)



        self.wfile.write(json.dumps(qa).encode("utf-8"))
        self.wfile.flush()

def main():
    with socketserver.TCPServer((IP, PORT), QARequestHandler) as server:
        print(f'Server started at http://{IP}:{PORT}')
        server.serve_forever()

if __name__=="__main__":
    main()

        