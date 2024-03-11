import http.server
import json
import random
import socketserver
import openai
import pandas as pd
import requests
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

def get_distractors_conceptnet(word, context):
    word = word.lower()
    original_word = word
    if len(word.split()) > 0:
        word = word.replace(" ", "_")
    distractor_list = []
    # context_sentences = context.split(".")
    try:
        relationships = ["/r/PartOf", "/r/IsA", "/r/HasA"]

        for rel in relationships:
            url = f"http://api.conceptnet.io/query?node=/c/en/{word}/n&rel={rel}&start=/c/en/{word}&limit=5"
            if context:
                url += f"&context={context}"

            obj = requests.get(url).json()

            for edge in obj["edges"]:
                word2 = edge["end"]["label"]
                if (
                    word2 not in distractor_list
                    and original_word.lower() not in word2.lower()
                ):
                    distractor_list.append(word2)
        return distractor_list

    except json.decoder.JSONDecodeError as e:
        print(f"Error decoding JSON from ConceptNet API: {e}")
        return distractor_list
    except requests.RequestException as e:
        print(f"Error making request to ConceptNet API: {e}")
        return distractor_list


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

    elif question_type == "mcq":
        text_summary = text

        answers = generate_keyphrases(text_summary, modelA, tokenizerA)

        qa = {}
        for answer in answers:
            question = generate_question(text_summary, answer, modelB, tokenizerB)
            conceptnet_distractors = get_distractors_conceptnet(answer, text_summary)
            t5_distractors = self.distractor_generator.generate(
                5, answer, question, text_summary
            )

            dist_temp = list(set(conceptnet_distractors + t5_distractors))
            dist = [x for x in dist_temp if x.lower() != answer.lower()]
            print(conceptnet_distractors)

            if len(dist) < 1:
                distractors = []
                qa[question] = answer
            else:
                distractors = random.sample(dist, min(3, len(dist)))
                options = distractors + [answer]
                random.shuffle(options)

                formatted_question = f"{question} Options: {', '.join(options)}"

                qa[formatted_question] = answer

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

        if self.path == "/generate_mcqs":
            context = parsed_data.get("context")
            api_key = parsed_data.get("api_key")

            ques_type = parsed_data.get("question_type")
            try:
                openai.api_key = api_key
                prompt = f"Given the following text:\n\n{context}\n\nPlease generate at least 3 {ques_type} type questions related to the provided information. For each question, include options and the correct answer in the format Question:, Option:, Answer:. Ensure the questions are clear, concise, and test the understanding of key concepts in the text."
                response = openai.Completion.create(
                    model="text-davinci-002",
                    prompt=prompt,
                    temperature=0.7,
                    max_tokens=1024,
                )
                choices = response["choices"]
                if choices:
                    choice = choices[0]
                    mcqs = choice["text"]

                    self.wfile.write(json.dumps(mcqs).encode("utf-8"))
                    self.wfile.flush()
            except Exception as e:
                print(f"Error processing data: {e}")
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
