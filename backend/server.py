import http.server
import json
import socketserver
import openai
import torch
from models.modelC.distractor_generator import DistractorGenerator
from transformers import T5ForConditionalGeneration, T5Tokenizer, pipeline

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
                    model="gpt-3.5-turbo",
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
