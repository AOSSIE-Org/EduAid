"""
Pre-download all required HuggingFace models to local cache.
Run this once before starting the server.
"""
import os

# Use platform-agnostic cache directory (override with HF_HOME env var)
_default_cache = os.path.join(os.path.expanduser('~'), '.cache', 'huggingface')
HF_CACHE_DIR = os.environ.get('HF_HOME', _default_cache)
os.environ['HF_HOME'] = HF_CACHE_DIR
os.environ['TRANSFORMERS_CACHE'] = os.path.join(HF_CACHE_DIR, 'transformers')

print(f"Downloading models to {HF_CACHE_DIR} ...")
print("This may take 10-30 minutes depending on your internet speed.\n")

from transformers import (
    T5ForConditionalGeneration, T5Tokenizer,
    AutoModelForSequenceClassification, AutoTokenizer,
    AutoModelForSeq2SeqLM
)

models = [
    ('T5Tokenizer', 't5-large'),
    ('T5ForConditionalGeneration', 'Roasters/Question-Generator'),
    ('T5Tokenizer', 't5-base'),
    ('T5ForConditionalGeneration', 'Roasters/Boolean-Questions'),
    ('T5ForConditionalGeneration', 'Roasters/Answer-Predictor'),
]

for model_type, model_name in models:
    print(f"  Downloading {model_name} ...")
    try:
        if model_type == 'T5Tokenizer':
            T5Tokenizer.from_pretrained(model_name)
        elif model_type == 'T5ForConditionalGeneration':
            T5ForConditionalGeneration.from_pretrained(model_name)
        print(f"  ✓ {model_name} done\n")
    except Exception as e:
        print(f"  ✗ {model_name} failed: {e}\n")

# Also check for QG and QAE models used in QuestionGenerator / AnswerPredictor
import re
try:
    with open(os.path.join(os.path.dirname(__file__), 'Generator', 'main.py')) as f:
        content = f.read()
    # Find QG_PRETRAINED and QAE_PRETRAINED values
    qg = re.search(r"QG_PRETRAINED\s*=\s*['\"]([^'\"]+)['\"]", content)
    qae = re.search(r"QAE_PRETRAINED\s*=\s*['\"]([^'\"]+)['\"]", content)
    nli = re.search(r"nli_model_name\s*=\s*['\"]([^'\"]+)['\"]", content)
    
    for match, label in [(qg, 'QG'), (qae, 'QAE'), (nli, 'NLI')]:
        if match:
            name = match.group(1)
            print(f"  Downloading {label} model: {name} ...")
            try:
                AutoTokenizer.from_pretrained(name, use_fast=False)
                AutoModelForSeq2SeqLM.from_pretrained(name)
                print(f"  ✓ {label} done\n")
            except Exception as e:
                try:
                    AutoModelForSequenceClassification.from_pretrained(name)
                    print(f"  ✓ {label} done\n")
                except Exception as e2:
                    print(f"  ✗ {label} failed: {e2}\n")
except Exception as e:
    print(f"Could not parse main.py for additional models: {e}")

print("\nAll downloads complete! You can now start server.py")
