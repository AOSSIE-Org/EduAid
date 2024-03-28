import json
import socketserver
from http.server import BaseHTTPRequestHandler

import librosa
import torch
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    Wav2Vec2ForCTC,
    Wav2Vec2Tokenizer,
    pipeline,
)

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


def generate_qa(text):

    # text_summary=summarize(text)
    text_summary = text

    modelA, modelB = "./models/modelA", "./models/modelB"
    # tokenizerA, tokenizerB= './tokenizers/tokenizerA', './tokenizers/tokenizerB'
    tokenizerA, tokenizerB = "t5-base", "t5-base"

    answers = generate_keyphrases(text_summary, modelA, tokenizerA)

    qa = {}
    for answer in answers:
        question = generate_question(text_summary, answer, modelB, tokenizerB)
        qa[question] = answer

    return qa


def process_audio(audio_file):
    audio, _ = librosa.load(audio_file, sr=16000)

    model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
    tokenizer = Wav2Vec2Tokenizer.from_pretrained("facebook/wav2vec2-base-960h")

    input_values = tokenizer(audio, return_tensors="pt").input_values

    logits = model(input_values).logits

    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = tokenizer.batch_decode(predicted_ids)[0]
    print("transcription", transcription)
    return transcription


class QARequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()

        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)

        parsed_data = json.loads(post_data)
        input_type = parsed_data.get("input_type")
        input_data = parsed_data.get("input_data")

        if input_type == "text":
            qa = generate_qa(input_data)
        elif input_type == "audio":
            audio_text = process_audio(input_data)
            qa = generate_qa(audio_text)
        else:
            qa = {}

        self.wfile.write(json.dumps(qa).encode("utf-8"))
        self.wfile.flush()


def main():
    with socketserver.TCPServer((IP, PORT), QARequestHandler) as server:
        print(f"Server started at http://{IP}:{PORT}")
        server.serve_forever()


if __name__ == "__main__":
    main()
