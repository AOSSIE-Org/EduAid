import time
import random

import torch
import numpy as np
import spacy
from sense2vec import Sense2Vec
from transformers import T5ForConditionalGeneration, T5Tokenizer
from nltk import FreqDist
from nltk.corpus import brown
from similarity.normalized_levenshtein import NormalizedLevenshtein

from Generator.mcq import (
    tokenize_into_sentences,
    identify_keywords,
    find_sentences_with_keywords,
    generate_multiple_choice_questions,
    generate_normal_questions,
)
from Generator.encoding import beam_search_decoding


class MCQGenerator:

    def __init__(self):
        """Loads the MCQ question-generation model plus the NLP tools used for keyword extraction."""
        self.tokenizer = T5Tokenizer.from_pretrained('t5-large')
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Question-Generator')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.nlp = spacy.load('en_core_web_sm')
        self.s2v = Sense2Vec().from_disk('s2v_old')
        self.fdist = FreqDist(brown.words())
        self.normalized_levenshtein = NormalizedLevenshtein()
        self.set_seed(42)

    def set_seed(self, seed):
        """Seeds NumPy, torch and CUDA RNGs so that generation is reproducible."""
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def generate_mcq(self, payload):
        """Generates multiple-choice questions from the input text.

        Args:
            payload: Dict with ``input_text`` (the source text) and an optional
                ``max_questions`` (number of keywords to base questions on, default 4).

        Returns:
            A dict with ``statement`` (the processed text), ``questions`` (the generated
            MCQs) and ``time_taken``; empty if no keywords could be extracted.
        """
        start_time = time.time()
        inp = {
            "input_text": payload.get("input_text"),
            "max_questions": payload.get("max_questions", 4)
        }

        text = inp['input_text']
        sentences = tokenize_into_sentences(text)
        modified_text = " ".join(sentences)

        keywords = identify_keywords(self.nlp, modified_text, inp['max_questions'], self.s2v, self.fdist, self.normalized_levenshtein, len(sentences))
        keyword_sentence_mapping = find_sentences_with_keywords(keywords, sentences)

        for k in keyword_sentence_mapping.keys():
            text_snippet = " ".join(keyword_sentence_mapping[k][:3])
            keyword_sentence_mapping[k] = text_snippet

        final_output = {}

        if len(keyword_sentence_mapping.keys()) == 0:
            return final_output
        else:
            try:
                generated_questions = generate_multiple_choice_questions(keyword_sentence_mapping, self.device, self.tokenizer, self.model, self.s2v, self.normalized_levenshtein)
            except:
                return final_output

            end_time = time.time()

            final_output["statement"] = modified_text
            final_output["questions"] = generated_questions["questions"]
            final_output["time_taken"] = end_time - start_time

            if self.device.type == 'cuda':
                torch.cuda.empty_cache()

            return final_output


class ShortQGenerator:

    def __init__(self):
        """Loads the short-question generation model plus the NLP tools used for keyword extraction."""
        self.tokenizer = T5Tokenizer.from_pretrained('t5-large')
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Question-Generator')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.nlp = spacy.load('en_core_web_sm')
        self.s2v = Sense2Vec().from_disk('s2v_old')
        self.fdist = FreqDist(brown.words())
        self.normalized_levenshtein = NormalizedLevenshtein()
        self.set_seed(42)

    def set_seed(self, seed):
        """Seeds NumPy, torch and CUDA RNGs so that generation is reproducible."""
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def generate_shortq(self, payload):
        """Generates short-answer questions from the input text.

        Args:
            payload: Dict with ``input_text`` (the source text) and an optional
                ``max_questions`` (number of keywords to base questions on, default 4).

        Returns:
            A dict with ``statement`` (the processed text) and ``questions`` (the generated
            short questions); empty if no keywords could be extracted.
        """
        inp = {
            "input_text": payload.get("input_text"),
            "max_questions": payload.get("max_questions", 4)
        }

        text = inp['input_text']
        sentences = tokenize_into_sentences(text)
        modified_text = " ".join(sentences)

        keywords = identify_keywords(self.nlp, modified_text, inp['max_questions'], self.s2v, self.fdist, self.normalized_levenshtein, len(sentences))
        keyword_sentence_mapping = find_sentences_with_keywords(keywords, sentences)

        for k in keyword_sentence_mapping.keys():
            text_snippet = " ".join(keyword_sentence_mapping[k][:3])
            keyword_sentence_mapping[k] = text_snippet

        final_output = {}

        if len(keyword_sentence_mapping.keys()) == 0:
            return final_output
        else:
            generated_questions = generate_normal_questions(keyword_sentence_mapping, self.device, self.tokenizer, self.model)

        final_output["statement"] = modified_text
        final_output["questions"] = generated_questions["questions"]

        if self.device.type == 'cuda':
            torch.cuda.empty_cache()

        return final_output


class ParaphraseGenerator:

    def __init__(self):
        """Loads the paraphrasing model and tokenizer."""
        self.tokenizer = T5Tokenizer.from_pretrained('t5-large')
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Question-Generator')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.set_seed(42)

    def set_seed(self, seed):
        """Seeds NumPy, torch and CUDA RNGs so that generation is reproducible."""
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def generate_paraphrase(self, payload):
        """Generates paraphrases of the input sentence.

        Args:
            payload: Dict with ``input_text`` (the sentence to paraphrase) and an optional
                ``max_questions`` (number of paraphrases to produce, default 3).

        Returns:
            A dict with ``Original Sentence``, ``Count`` and ``Paraphrased Questions``
            (the deduplicated, distinct paraphrases).
        """
        start_time = time.time()
        inp = {
            "input_text": payload.get("input_text"),
            "max_questions": payload.get("max_questions", 3)
        }

        text = inp['input_text']
        num = inp['max_questions']

        sentence = text
        text_to_paraphrase = "paraphrase: " + sentence + " </s>"

        encoding = self.tokenizer.encode_plus(text_to_paraphrase, pad_to_max_length=True, return_tensors="pt")
        input_ids, attention_masks = encoding["input_ids"].to(self.device), encoding["attention_mask"].to(self.device)

        beam_outputs = self.model.generate(
            input_ids=input_ids,
            attention_mask=attention_masks,
            max_length=50,
            num_beams=50,
            num_return_sequences=num,
            no_repeat_ngram_size=2,
            early_stopping=True
            )

        final_outputs =[]
        for beam_output in beam_outputs:
            paraphrased_sentence = self.tokenizer.decode(beam_output, skip_special_tokens=True, clean_up_tokenization_spaces=True)
            if paraphrased_sentence.lower() != sentence.lower() and paraphrased_sentence not in final_outputs:
                final_outputs.append(paraphrased_sentence)

        output = {}
        output['Original Sentence'] = sentence
        output['Count'] = num
        output['Paraphrased Questions'] = final_outputs

        if self.device.type == 'cuda':
            torch.cuda.empty_cache()

        return output


class BoolQGenerator:

    def __init__(self):
        """Loads the boolean-question generation model and tokenizer."""
        self.tokenizer = T5Tokenizer.from_pretrained('t5-base')
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Boolean-Questions')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.set_seed(42)

    def set_seed(self, seed):
        """Seeds NumPy, torch and CUDA RNGs so that generation is reproducible."""
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def random_choice(self):
        """Returns a random boolean, used as the answer for generated boolean questions."""
        a = random.choice([0,1])
        return bool(a)


    def generate_boolq(self, payload):
        """Generates boolean (yes/no) questions from the input text.

        Args:
            payload: Dict with ``input_text`` (the source text) and an optional
                ``max_questions`` (number of questions to generate, default 4).

        Returns:
            A dict with ``Text`` (the source text), ``Count`` (number of questions)
            and ``Boolean_Questions`` (the generated questions).
        """
        start_time = time.time()
        inp = {
            "input_text": payload.get("input_text"),
            "max_questions": payload.get("max_questions", 4)
        }

        text = inp['input_text']
        num= inp['max_questions']
        sentences = tokenize_into_sentences(text)
        modified_text = " ".join(sentences)
        answer = self.random_choice()
        form = "truefalse: %s passage: %s </s>" % (modified_text, answer)
        print(form)
        encoding = self.tokenizer.encode_plus(form, return_tensors="pt")
        input_ids, attention_masks = encoding["input_ids"].to(self.device), encoding["attention_mask"].to(self.device)

        output = beam_search_decoding (input_ids, attention_masks, self.model, self.tokenizer,num)
        if self.device.type == 'cuda':
            torch.cuda.empty_cache()

        final= {}
        final['Text']= text
        final['Count']= num
        final['Boolean_Questions']= output

        return final
