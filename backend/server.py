import http.server
import json
import socketserver
import torch
from models.modelC.distractor_generator import DistractorGenerator
from transformers import T5ForConditionalGeneration, T5Tokenizer, pipeline

import webbrowser

from apiclient import discovery
from httplib2 import Http
from oauth2client import client, file, tools

IP = "127.0.0.1"
PORT = 8000


def summarize(text):
    summarizer = pipeline("summarization")
    return summarizer(text, max_length=110)[0]["summary_text"]

def generate_question(context, answer, model_path, tokenizer_path):
    model = T5ForConditionalGeneration.from_pretrained(model_path)
    tokenizer = T5Tokenizer.from_pretrained(tokenizer_path)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    input_text = f"answer: {answer} context: {context}"

    inputs = tokenizer.encode_plus(
        input_text,
        padding="max_length",
        truncation=True,
        max_length=512,
        return_tensors="pt",
    )

    input_ids = inputs["input_ids"].to(device)
    attention_mask = inputs["attention_mask"].to(device)

    with torch.no_grad():
        output = model.generate(
            input_ids=input_ids, attention_mask=attention_mask, max_length=32
        )

    generated_question = tokenizer.decode(output[0], skip_special_tokens=True)
    return generated_question


def generate_keyphrases(abstract, model_path, tokenizer_path):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = T5ForConditionalGeneration.from_pretrained(model_path)
    tokenizer = T5Tokenizer.from_pretrained(tokenizer_path)
    model.to(device)
    # tokenizer.to(device)
    input_text = f"detect keyword: abstract: {abstract}"
    input_ids = tokenizer.encode(
        input_text,
        truncation=True,
        padding="max_length",
        max_length=512,
        return_tensors="pt",
    ).to(device)
    output = model.generate(input_ids)
    keyphrases = tokenizer.decode(output[0], skip_special_tokens=True).split(",")
    return [x.strip() for x in keyphrases if x != ""]


def generate_qa(self, text, question_type):
    modelA, modelB = "./models/modelA", "./models/modelB"
    tokenizerA, tokenizerB = "t5-base", "t5-base"
    if question_type == "text":
        text_summary = text
        answers = generate_keyphrases(text_summary, modelA, tokenizerA)
        qa = {}
        for answer in answers:
            question = generate_question(text_summary, answer, modelB, tokenizerB)
            qa[question] = answer

        return qa
    if question_type == "form":
        text_summary = text
        answers = generate_keyphrases(text_summary, modelA, tokenizerA)
        qa = {}
        for answer in answers:
            question = generate_question(text_summary, answer, modelB, tokenizerB)
            qa[question] = answer
        SCOPES = "https://www.googleapis.com/auth/forms.body"
        DISCOVERY_DOC = "https://forms.googleapis.com/$discovery/rest?version=v1"

        store = file.Storage("token.json")
        creds = None
        if not creds or creds.invalid:
            flow = client.flow_from_clientsecrets("credentials.json", SCOPES)
            creds = tools.run_flow(flow, store)

        form_service = discovery.build(
            "forms",
            "v1",
            http=creds.authorize(Http()),
            discoveryServiceUrl=DISCOVERY_DOC,
            static_discovery=False,
        )
        NEW_FORM = {
            "info": {
                "title": "EduAid form",
            }
        }
        requests_list = []

        for index, (question, answer) in enumerate(qa.items()):
            request = {
                "createItem": {
                    "item": {
                        "title": question,
                        "questionItem": {
                            "question": {
                                "required": True,
                                "textQuestion": {},
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }
            requests_list.append(request)

        NEW_QUESTION = {"requests": requests_list}

        result = form_service.forms().create(body=NEW_FORM).execute()
        question_setting = (
            form_service.forms()
            .batchUpdate(formId=result["formId"], body=NEW_QUESTION)
            .execute()
        )

        edit_url = result["responderUri"]
        qa["edit_url"] = edit_url
        webbrowser.open_new_tab(
            "https://docs.google.com/forms/d/" + result["formId"] + "/edit"
        )
        return qa


class QARequestHandler(http.server.BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()

        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length).decode("utf-8")
        parsed_data = json.loads(post_data)
        if self.path == "/":
            input_text = parsed_data.get("input_text")
            question_type = self.headers.get("Question-Type", "text")

            qa = generate_qa(self, input_text, question_type)

            self.wfile.write(json.dumps(qa).encode("utf-8"))
            self.wfile.flush()


class CustomRequestHandler(QARequestHandler):
    def __init__(self, *args, **kwargs):
        self.distractor_generator = kwargs.pop("distractor_generator")
        super().__init__(*args, **kwargs)


def main():
    distractor_generator = DistractorGenerator()
    with socketserver.TCPServer(
        (IP, PORT),
        lambda x, y, z: CustomRequestHandler(
            x, y, z, distractor_generator=distractor_generator
        ),
    ) as server:
        print(f"Server started at http://{IP}:{PORT}")
        server.serve_forever()


if __name__ == "__main__":
    main()
