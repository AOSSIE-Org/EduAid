from flask import Flask, request, jsonify
from flask_cors import CORS
from pprint import pprint
import nltk
import subprocess
import os
import glob

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
nltk.download("stopwords")
nltk.download('punkt_tab')
from Generator import main
from Generator.question_filters import make_question_harder
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

app = Flask(__name__)
CORS(app)
print("Starting Flask App...")

SERVICE_ACCOUNT_FILE = './service_account_key.json'
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

MCQGen = main.MCQGenerator()
answer = main.AnswerPredictor()
BoolQGen = main.BoolQGenerator()
ShortQGen = main.ShortQGenerator()
qg = main.QuestionGenerator()
docs_service = main.GoogleDocsService(SERVICE_ACCOUNT_FILE, SCOPES)
file_processor = main.FileProcessor()
mediawikiapi = MediaWikiAPI()
qa_model = pipeline("question-answering")


def process_input_text(input_text, use_mediawiki):
    if use_mediawiki == 1:
        input_text = mediawikiapi.summary(input_text,8)
    return input_text


def _extract_json_object(raw_text):
    if not raw_text:
        return {}
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _norm_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _dedupe_preserve_order(items):
    seen = set()
    out = []
    for item in items:
        key = _norm_text(item).lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(_norm_text(item))
    return out


def _sanitize_llm_output(question_type, llm_output, max_questions):
    target_n = max(1, int(max_questions))
    if not isinstance(llm_output, dict):
        if question_type == "get_boolq":
            return {"Boolean_Questions": []}
        return {"questions": []}

    if question_type == "get_mcq":
        cleaned_questions = []
        seen_q = set()
        for item in llm_output.get("questions", []):
            q_text = _norm_text(item.get("question_statement") or item.get("question"))
            ans = _norm_text(item.get("answer"))
            ctx = _norm_text(item.get("context"))
            if not q_text or not ans:
                continue
            q_key = q_text.lower()
            if q_key in seen_q:
                continue
            seen_q.add(q_key)

            # Remove duplicate/empty options and never include answer inside options.
            raw_options = item.get("options", [])
            option_list = raw_options if isinstance(raw_options, list) else []
            deduped_options = _dedupe_preserve_order(option_list)
            deduped_options = [opt for opt in deduped_options if opt.lower() != ans.lower()]
            deduped_options = deduped_options[:3]

            cleaned_questions.append(
                {
                    "question_statement": q_text,
                    "answer": ans,
                    "options": deduped_options,
                    "context": ctx,
                }
            )
            if len(cleaned_questions) >= target_n:
                break

        return {"questions": cleaned_questions}

    if question_type == "get_boolq":
        bool_questions = _dedupe_preserve_order(llm_output.get("Boolean_Questions", []))[:target_n]
        return {"Boolean_Questions": bool_questions}

    # get_shortq
    cleaned_short = []
    seen_q = set()
    for item in llm_output.get("questions", []):
        q_text = _norm_text(item.get("question") or item.get("question_statement"))
        ans = _norm_text(item.get("answer") or item.get("Answer"))
        ctx = _norm_text(item.get("context"))
        if not q_text:
            continue
        q_key = q_text.lower()
        if q_key in seen_q:
            continue
        seen_q.add(q_key)
        cleaned_short.append({"question": q_text, "answer": ans, "context": ctx})
        if len(cleaned_short) >= target_n:
            break
    return {"questions": cleaned_short}


def _mcq_quality_score(sanitized_output):
    questions = sanitized_output.get("questions", []) if isinstance(sanitized_output, dict) else []
    if not isinstance(questions, list):
        return -1
    score = 0
    for q in questions:
        options = q.get("options", []) if isinstance(q, dict) else []
        score += min(len(options), 3)
    score += len(questions) * 2
    return score


def _should_retry_mcq(sanitized_output, max_questions):
    questions = sanitized_output.get("questions", []) if isinstance(sanitized_output, dict) else []
    if not isinstance(questions, list):
        return True
    if len(questions) < max(1, int(max_questions)):
        return True
    return any(len(q.get("options", [])) < 2 for q in questions if isinstance(q, dict))


def _call_llm_for_questions(
    input_text,
    max_questions,
    question_type,
    llm_provider,
    llm_model,
    llm_api_key
):
    if len(input_text) > 12000:
        app.logger.warning("Input text truncated from %s to 12000 chars for external LLM.", len(input_text))
    trimmed_input = input_text[:12000]
    if question_type == "get_mcq":
        schema_hint = (
            '{"questions":[{"question_statement":"string","options":["string","string","string"],'
            '"answer":"string","context":"string"}]}'
        )
    elif question_type == "get_boolq":
        schema_hint = '{"Boolean_Questions":["string"]}'
    else:
        schema_hint = '{"questions":[{"question":"string","answer":"string","context":"string"}]}'

    prompt = (
        f"Generate exactly {int(max_questions)} {question_type} items from the text below.\n"
        "Return ONLY valid JSON (no markdown, no explanation).\n"
        "Questions must be non-redundant, phrased differently, and test different angles.\n"
        "For MCQ: provide exactly one correct answer; options must be distinct, plausible, and must not repeat the answer text.\n"
        f"Required JSON schema: {schema_hint}\n\n"
        f"Text:\n{trimmed_input}"
    )
    strict_mcq_prompt = (
        f"Generate exactly {int(max_questions)} get_mcq items from the text below.\n"
        "Return ONLY valid JSON.\n"
        "For each MCQ: one correct answer and exactly 3 incorrect options.\n"
        "Incorrect options must be unique, plausible, and not paraphrases of the answer.\n"
        "Each question must test a different concept from the text and avoid repeated wording.\n"
        f"Required JSON schema: {schema_hint}\n\n"
        f"Text:\n{trimmed_input}"
    )

    if llm_provider == "openai":
        from openai import (
            OpenAI,
            APIError,
            OpenAIError,
            APIConnectionError,
            APITimeoutError,
            RateLimitError,
            AuthenticationError,
            BadRequestError,
        )

        client = OpenAI(api_key=llm_api_key)

        def run_openai_json(prompt_text):
            response = client.chat.completions.create(
                model=llm_model,
                messages=[
                    {"role": "system", "content": "You generate quiz data as strict JSON only."},
                    {"role": "user", "content": prompt_text},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content if response.choices else "{}"
            parsed = _extract_json_object(content)
            return _sanitize_llm_output(question_type, parsed, max_questions)

        try:
            sanitized = run_openai_json(prompt)
            if question_type == "get_mcq" and _should_retry_mcq(sanitized, max_questions):
                retry_sanitized = run_openai_json(strict_mcq_prompt)
                if _mcq_quality_score(retry_sanitized) > _mcq_quality_score(sanitized):
                    return retry_sanitized
            return sanitized
        except (APIError, OpenAIError, APIConnectionError, APITimeoutError, RateLimitError, AuthenticationError, BadRequestError) as chat_exc:
            # Some OpenAI models are completion-only; fallback to completions endpoint.
            try:
                response = client.completions.create(
                    model=llm_model,
                    prompt=(
                        "You generate quiz data as strict JSON only.\n"
                        + prompt
                    ),
                    max_tokens=2048,
                    temperature=0.2,
                )
                content = response.choices[0].text if response.choices else "{}"
                parsed = _extract_json_object(content)
                sanitized = _sanitize_llm_output(question_type, parsed, max_questions)
                if question_type == "get_mcq" and _should_retry_mcq(sanitized, max_questions):
                    response_retry = client.completions.create(
                        model=llm_model,
                        prompt=("You generate quiz data as strict JSON only.\n" + strict_mcq_prompt),
                        max_tokens=2048,
                        temperature=0.2,
                    )
                    retry_content = response_retry.choices[0].text if response_retry.choices else "{}"
                    retry_parsed = _extract_json_object(retry_content)
                    retry_sanitized = _sanitize_llm_output(question_type, retry_parsed, max_questions)
                    if _mcq_quality_score(retry_sanitized) > _mcq_quality_score(sanitized):
                        return retry_sanitized
                return sanitized
            except (ValueError, json.JSONDecodeError, KeyError, TypeError):
                raise chat_exc from None
            except (APIError, OpenAIError, APIConnectionError, APITimeoutError, RateLimitError, AuthenticationError, BadRequestError) as completion_exc:
                raise ValueError(f"OpenAI request failed: {completion_exc}") from None

    if llm_provider == "anthropic":
        from anthropic import Anthropic
        try:
            from anthropic import (
                APIError as AnthropicAPIError,
                APIConnectionError as AnthropicAPIConnectionError,
                APITimeoutError as AnthropicAPITimeoutError,
                AuthenticationError as AnthropicAuthenticationError,
                RateLimitError as AnthropicRateLimitError,
            )
            anthropic_errors = (
                AnthropicAPIError,
                AnthropicAPIConnectionError,
                AnthropicAPITimeoutError,
                AnthropicAuthenticationError,
                AnthropicRateLimitError,
            )
        except Exception:
            anthropic_errors = (Exception,)

        try:
            client = Anthropic(api_key=llm_api_key)

            def run_anthropic_json(prompt_text):
                response = client.messages.create(
                    model=llm_model,
                    max_tokens=2048,
                    temperature=0.2,
                    system="You generate quiz data as strict JSON only.",
                    messages=[{"role": "user", "content": prompt_text}],
                )
                text_chunks = [
                    chunk.text for chunk in response.content if hasattr(chunk, "text") and chunk.text
                ]
                parsed = _extract_json_object("".join(text_chunks))
                return _sanitize_llm_output(question_type, parsed, max_questions)

            sanitized = run_anthropic_json(prompt)
            if question_type == "get_mcq" and _should_retry_mcq(sanitized, max_questions):
                retry_sanitized = run_anthropic_json(strict_mcq_prompt)
                if _mcq_quality_score(retry_sanitized) > _mcq_quality_score(sanitized):
                    return retry_sanitized
            return sanitized
        except anthropic_errors as anth_exc:
            raise ValueError(f"Anthropic request failed: {anth_exc}") from None

    raise ValueError("Unsupported llm_provider. Use 'openai' or 'anthropic'.")


@app.route("/get_mcq", methods=["POST"])
def get_mcq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    llm_provider = data.get("llm_provider", "")
    llm_model = data.get("llm_model", "")
    llm_api_key = data.get("llm_api_key", "")
    input_text = process_input_text(input_text, use_mediawiki)
    if llm_provider and llm_model and llm_api_key:
        try:
            llm_output = _call_llm_for_questions(
                input_text, max_questions, "get_mcq", llm_provider, llm_model, llm_api_key
            )
            questions = llm_output.get("questions", [])
            return jsonify({"output": questions, "llm_used": True})
        except (ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
            return jsonify({"error": str(exc), "llm_used": True}), 400
    output = MCQGen.generate_mcq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    questions = output["questions"]
    return jsonify({"output": questions, "llm_used": False})


@app.route("/get_boolq", methods=["POST"])
def get_boolq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    llm_provider = data.get("llm_provider", "")
    llm_model = data.get("llm_model", "")
    llm_api_key = data.get("llm_api_key", "")
    input_text = process_input_text(input_text, use_mediawiki)
    if llm_provider and llm_model and llm_api_key:
        try:
            llm_output = _call_llm_for_questions(
                input_text, max_questions, "get_boolq", llm_provider, llm_model, llm_api_key
            )
            boolean_questions = llm_output.get("Boolean_Questions", [])
            return jsonify({"output": boolean_questions, "llm_used": True})
        except (ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
            return jsonify({"error": str(exc), "llm_used": True}), 400
    output = BoolQGen.generate_boolq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    boolean_questions = output["Boolean_Questions"]
    return jsonify({"output": boolean_questions, "llm_used": False})


@app.route("/get_shortq", methods=["POST"])
def get_shortq():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    llm_provider = data.get("llm_provider", "")
    llm_model = data.get("llm_model", "")
    llm_api_key = data.get("llm_api_key", "")
    input_text = process_input_text(input_text, use_mediawiki)
    if llm_provider and llm_model and llm_api_key:
        try:
            llm_output = _call_llm_for_questions(
                input_text, max_questions, "get_shortq", llm_provider, llm_model, llm_api_key
            )
            questions = llm_output.get("questions", [])
            return jsonify({"output": questions, "llm_used": True})
        except (ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
            return jsonify({"error": str(exc), "llm_used": True}), 400
    output = ShortQGen.generate_shortq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    questions = output["questions"]
    return jsonify({"output": questions, "llm_used": False})


@app.route("/get_problems", methods=["POST"])
def get_problems():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions_mcq = data.get("max_questions_mcq", 4)
    max_questions_boolq = data.get("max_questions_boolq", 4)
    max_questions_shortq = data.get("max_questions_shortq", 4)
    llm_provider = data.get("llm_provider", "")
    llm_model = data.get("llm_model", "")
    llm_api_key = data.get("llm_api_key", "")
    input_text = process_input_text(input_text, use_mediawiki)
    if llm_provider and llm_model and llm_api_key:
        try:
            output_mcq = _call_llm_for_questions(
                input_text,
                max_questions_mcq,
                "get_mcq",
                llm_provider,
                llm_model,
                llm_api_key,
            )
            output_boolq = _call_llm_for_questions(
                input_text,
                max_questions_boolq,
                "get_boolq",
                llm_provider,
                llm_model,
                llm_api_key,
            )
            output_shortq = _call_llm_for_questions(
                input_text,
                max_questions_shortq,
                "get_shortq",
                llm_provider,
                llm_model,
                llm_api_key,
            )
            return jsonify(
                {
                    "output_mcq": output_mcq,
                    "output_boolq": output_boolq,
                    "output_shortq": output_shortq,
                    "llm_used": True,
                }
            )
        except (ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
            return jsonify({"error": str(exc), "llm_used": True}), 400

    output1 = MCQGen.generate_mcq(
        {"input_text": input_text, "max_questions": max_questions_mcq}
    )
    output2 = BoolQGen.generate_boolq(
        {"input_text": input_text, "max_questions": max_questions_boolq}
    )
    output3 = ShortQGen.generate_shortq(
        {"input_text": input_text, "max_questions": max_questions_shortq}
    )
    return jsonify(
        {"output_mcq": output1, "output_boolq": output2, "output_shortq": output3, "llm_used": False}
    )

@app.route("/get_mcq_answer", methods=["POST"])
def get_mcq_answer():
    data = request.get_json()
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    input_options = data.get("input_options", [])
    outputs = []

    if not input_questions or not input_options or len(input_questions) != len(input_options):
        return jsonify({"outputs": outputs})

    for question, options in zip(input_questions, input_options):
        # Generate answer using the QA model
        qa_response = qa_model(question=question, context=input_text)
        generated_answer = qa_response["answer"]

        # Calculate similarity between generated answer and each option
        options_with_answer = options + [generated_answer]
        vectorizer = TfidfVectorizer().fit_transform(options_with_answer)
        vectors = vectorizer.toarray()
        generated_answer_vector = vectors[-1].reshape(1, -1)

        similarities = cosine_similarity(vectors[:-1], generated_answer_vector).flatten()
        max_similarity_index = similarities.argmax()

        # Return the option with the highest similarity
        best_option = options[max_similarity_index]
        
        outputs.append(best_option)

    return jsonify({"output": outputs})


@app.route("/get_shortq_answer", methods=["POST"])
def get_answer():
    data = request.get_json()
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    answers = []
    for question in input_questions:
        qa_response = qa_model(question=question, context=input_text)
        answers.append(qa_response["answer"])

    return jsonify({"output": answers})


@app.route("/get_boolean_answer", methods=["POST"])
def get_boolean_answer():
    data = request.get_json()
    input_text = data.get("input_text", "")
    input_questions = data.get("input_question", [])
    output = []

    for question in input_questions:
        qa_response = answer.predict_boolean_answer(
            {"input_text": input_text, "input_question": question}
        )
        if(qa_response):
            output.append("True")
        else:
            output.append("False")

    return jsonify({"output": output})


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


@app.route("/generate_gform", methods=["POST"])
def generate_gform():
    data = request.get_json()
    qa_pairs = data.get("qa_pairs", "")
    question_type = data.get("question_type", "")
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

    if question_type == "get_shortq":
        for index, qapair in enumerate(qa_pairs):
            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
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
            requests_list.append(requests)
    elif question_type == "get_mcq":
        for index, qapair in enumerate(qa_pairs):
            # Extract and filter the options
            options = qapair.get("options", [])
            valid_options = [
                opt for opt in options if opt
            ]  # Filter out empty or None options

            # Ensure the answer is included in the choices
            choices = [qapair["answer"]] + valid_options[
                :3
            ]  # Include up to the first 3 options

            # Randomize the order of the choices
            random.shuffle(choices)

            # Prepare the request structure
            choices_list = [{"value": choice} for choice in choices]

            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
                        "questionItem": {
                            "question": {
                                "required": True,
                                "choiceQuestion": {
                                    "type": "RADIO",
                                    "options": choices_list,
                                },
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }

            requests_list.append(requests)
    elif question_type == "get_boolq":
        for index, qapair in enumerate(qa_pairs):
            choices_list = [
                {"value": "True"},
                {"value": "False"},
            ]
            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
                        "questionItem": {
                            "question": {
                                "required": True,
                                "choiceQuestion": {
                                    "type": "RADIO",
                                    "options": choices_list,
                                },
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }

            requests_list.append(requests)
    else:
        for index, qapair in enumerate(qa_pairs):
            if "options" in qapair and qapair["options"]:
                options = qapair["options"]
                valid_options = [
                    opt for opt in options if opt
                ]  # Filter out empty or None options
                choices = [qapair["answer"]] + valid_options[
                    :3
                ]  # Include up to the first 3 options
                random.shuffle(choices)
                choices_list = [{"value": choice} for choice in choices]
                question_structure = {
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": choices_list,
                    }
                }
            elif "answer" in qapair:
                question_structure = {"textQuestion": {}}
            else:
                question_structure = {
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": [
                            {"value": "True"},
                            {"value": "False"},
                        ],
                    }
                }

            requests = {
                "createItem": {
                    "item": {
                        "title": qapair["question"],
                        "questionItem": {
                            "question": {
                                "required": True,
                                **question_structure,
                            }
                        },
                    },
                    "location": {"index": index},
                }
            }
            requests_list.append(requests)

    NEW_QUESTION = {"requests": requests_list}

    result = form_service.forms().create(body=NEW_FORM).execute()
    form_service.forms().batchUpdate(
        formId=result["formId"], body=NEW_QUESTION
    ).execute()

    edit_url = jsonify(result["responderUri"])
    webbrowser.open_new_tab(
        "https://docs.google.com/forms/d/" + result["formId"] + "/edit"
    )
    return edit_url


@app.route("/get_shortq_hard", methods=["POST"])
def get_shortq_hard():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])

    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="sentences"
    )

    for item in output:
        item["question"] = make_question_harder(item["question"])

    return jsonify({"output": output})


@app.route("/get_mcq_hard", methods=["POST"])
def get_mcq_hard():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])
    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="multiple_choice"
    )
    
    for q in output:
        q["question"] = make_question_harder(q["question"])
        
    return jsonify({"output": output})

@app.route("/get_boolq_hard", methods=["POST"])
def get_boolq_hard():
    data = request.get_json()
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_questions = data.get("input_question", [])

    input_text = process_input_text(input_text, use_mediawiki)

    # Generate questions using the same QG model
    generated = qg.generate(
        article=input_text,
        num_questions=input_questions,
        answer_style="true_false"
    )

    # Apply transformation to make each question harder
    harder_questions = [make_question_harder(q) for q in generated]

    return jsonify({"output": harder_questions})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    content = file_processor.process_file(file)
    
    if content:
        return jsonify({"content": content})
    else:
        return jsonify({"error": "Unsupported file type or error processing file"}), 400

@app.route("/", methods=["GET"])
def hello():
    return "The server is working fine"

def clean_transcript(file_path):
    """Extracts and cleans transcript from a VTT file."""
    with open(file_path, "r", encoding="utf-8") as file:
        lines = file.readlines()

    transcript_lines = []
    skip_metadata = True  # Skip lines until we reach actual captions

    for line in lines:
        line = line.strip()

        # Skip metadata lines like "Kind: captions" or "Language: en"
        if line.lower().startswith(("kind:", "language:", "webvtt")):
            continue
        
        # Detect timestamps like "00:01:23.456 --> 00:01:25.789"
        if "-->" in line:
            skip_metadata = False  # Now real captions start
            continue
        
        if not skip_metadata:
            # Remove formatting tags like <c>...</c> and <00:00:00.000>
            line = re.sub(r"<[^>]+>", "", line)
            transcript_lines.append(line)

    return " ".join(transcript_lines).strip()

@app.route('/getTranscript', methods=['GET'])
def get_transcript():
    video_id = request.args.get('videoId')
    if not video_id:
        return jsonify({"error": "No video ID provided"}), 400

    subprocess.run(["yt-dlp", "--write-auto-sub", "--sub-lang", "en", "--skip-download",
                "--sub-format", "vtt", "-o", f"subtitles/{video_id}.vtt", f"https://www.youtube.com/watch?v={video_id}"],
               check=True, capture_output=True, text=True)

    # Find the latest .vtt file in the "subtitles" folder
    subtitle_files = glob.glob("subtitles/*.vtt")
    if not subtitle_files:
        return jsonify({"error": "No subtitles found"}), 404

    latest_subtitle = max(subtitle_files, key=os.path.getctime)
    transcript_text = clean_transcript(latest_subtitle)

    # Optional: Clean up the file after reading
    os.remove(latest_subtitle)

    return jsonify({"transcript": transcript_text})

if __name__ == "__main__":
    os.makedirs("subtitles", exist_ok=True)
    app.run()
