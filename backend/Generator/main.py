import time
import torch
import random
from transformers import T5ForConditionalGeneration, T5Tokenizer
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import numpy as np
import spacy
from sense2vec import Sense2Vec
from collections import OrderedDict
from nltk import FreqDist
from nltk.corpus import brown
from similarity.normalized_levenshtein import NormalizedLevenshtein
from Generator.mcq import tokenize_into_sentences, identify_keywords, find_sentences_with_keywords, generate_multiple_choice_questions, generate_normal_questions
from Generator.encoding import beam_search_decoding

class MCQGenerator:
    
    def __init__(self):
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
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
            
    def generate_mcq(self, payload):
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
            
            if torch.device == 'cuda':
                torch.cuda.empty_cache()
                
            return final_output

class ShortQGenerator:
    
    def __init__(self):
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
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
            
    def generate_shortq(self, payload):
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
        
        if torch.device == 'cuda':
            torch.cuda.empty_cache()

        return final_output
            
class ParaphraseGenerator:
    
    def __init__(self):
        self.tokenizer = T5Tokenizer.from_pretrained('t5-large')
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Question-Generator')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.set_seed(42)
        
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def generate_paraphrase(self, payload):
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

        if torch.device == 'cuda':
            torch.cuda.empty_cache()
        
        return output

class BoolQGenerator:
       
    def __init__(self):
        self.tokenizer = T5Tokenizer.from_pretrained('t5-base')
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Boolean-Questions')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.set_seed(42)
        
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def random_choice(self):
        a = random.choice([0,1])
        return bool(a)
    

    def generate_boolq(self, payload):
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
        if torch.device == 'cuda':
            torch.cuda.empty_cache()
        
        final= {}
        final['Text']= text
        final['Count']= num
        final['Boolean_Questions']= output
            
        return final
            

class AnswerPredictor:
          
    def __init__(self):
        self.tokenizer = T5Tokenizer.from_pretrained('t5-large', model_max_length=512)
        self.model = T5ForConditionalGeneration.from_pretrained('Roasters/Answer-Predictor')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        
        # Load the lightweight NLI model for boolean question answering
        self.nli_model_name = "typeform/distilbert-base-uncased-mnli"
        self.nli_tokenizer = AutoTokenizer.from_pretrained(self.nli_model_name)
        self.nli_model = AutoModelForSequenceClassification.from_pretrained(self.nli_model_name)
        
        self.set_seed(42)
        
    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def greedy_decoding(self, inp_ids, attn_mask):
        greedy_output = self.model.generate(input_ids=inp_ids, attention_mask=attn_mask, max_length=256)
        Question = self.tokenizer.decode(greedy_output[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        return Question.strip().capitalize()

    def predict_answer(self, payload):
        answers = []
        inp = {
                "input_text": payload.get("input_text"),
                "input_question" : payload.get("input_question")
            }
        for ques in payload.get("input_question"):
                
            context = inp["input_text"]
            question = ques
            input_text = "question: %s <s> context: %s </s>" % (question, context)

            encoding = self.tokenizer.encode_plus(input_text, return_tensors="pt")
            input_ids, attention_masks = encoding["input_ids"].to(self.device), encoding["attention_mask"].to(self.device)
            greedy_output = self.model.generate(input_ids=input_ids, attention_mask=attention_masks, max_length=256)
            Question = self.tokenizer.decode(greedy_output[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
            answers.append(Question.strip().capitalize())

        return answers

    def predict_boolean_answer(self, payload):
        input_text = payload.get("input_text", "")
        input_questions = payload.get("input_question", [])

        answers = []

        for question in input_questions:
            hypothesis = question
            inputs = self.nli_tokenizer.encode_plus(input_text, hypothesis, return_tensors="pt")
            outputs = self.nli_model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
            entailment_prob = probabilities[0][0].item()
            contradiction_prob = probabilities[0][2].item()
            
            if entailment_prob > contradiction_prob:
                answers.append(True)
            else:
                answers.append(False)

        return answers