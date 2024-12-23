import string
import nltk
import pke
import torch
from nltk.tokenize import sent_tokenize
from flashtext import KeywordProcessor
from nltk.corpus import stopwords
from sense2vec import Sense2Vec
from similarity.normalized_levenshtein import NormalizedLevenshtein

nltk.download('brown')
nltk.download('stopwords')
nltk.download('popular')

def is_word_available(word, s2v_model):
    """
    Check if the word exists in the Sense2Vec model.
    """
    word = word.replace(" ", "_")
    sense = s2v_model.get_best_sense(word)
    return sense is not None

def generate_word_variations(word):
    """
    Generate variations of a given word by applying common spelling errors.
    """
    letters = 'abcdefghijklmnopqrstuvwxyz ' + string.punctuation
    splits = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    deletes = [L + R[1:] for L, R in splits if R]
    transposes = [L + R[1] + R[0] + R[2:] for L, R in splits if len(R) > 1]
    replaces = [L + c + R[1:] for L, R in splits if R for c in letters]
    inserts = [L + c + R for L, R in splits for c in letters]
    return set(deletes + transposes + replaces + inserts)

def find_similar_words(word, s2v_model):
    """
    Find similar words to the input word using Sense2Vec model.
    """
    output = []
    word_preprocessed = word.translate(word.maketrans("", "", string.punctuation)).lower()
    word_variations = generate_word_variations(word_preprocessed)
    word = word.replace(" ", "_")
    sense = s2v_model.get_best_sense(word)
    most_similar = s2v_model.most_similar(sense, n=15)
    
    compare_list = [word_preprocessed]
    for each_word in most_similar:
        append_word = each_word[0].split("|")[0].replace("_", " ").strip().lower()
        append_word = append_word.translate(word.maketrans("", "", string.punctuation))
        if append_word not in compare_list and word_preprocessed not in append_word and append_word not in word_variations:
            output.append(append_word.title())
            compare_list.append(append_word)
    
    return list(dict.fromkeys(output))

def get_answer_choices(answer, s2v_model):
    """
    Generate answer choices based on the similarity to the given answer.
    """
    try:
        choices = find_similar_words(answer, s2v_model)
        if choices:
            return choices, "sense2vec"
    except Exception as e:
        print(f"Failed to generate choices for word: {answer}. Error: {e}")
    return [], "None"

def tokenize_into_sentences(text):
    """
    Tokenize the input text into sentences and filter out short sentences.
    """
    sentences = sent_tokenize(text)
    return [sentence.strip() for sentence in sentences if len(sentence) > 20]

def find_sentences_with_keywords(keywords, sentences):
    """
    Find and return sentences containing the keywords.
    """
    keyword_processor = KeywordProcessor()
    keyword_sentences = {word: [] for word in keywords}
    for word in keywords:
        keyword_processor.add_keyword(word)
    for sentence in sentences:
        keywords_found = keyword_processor.extract_keywords(sentence)
        for key in keywords_found:
            keyword_sentences[key].append(sentence)
    
    for key in keyword_sentences:
        keyword_sentences[key] = sorted(keyword_sentences[key], key=len, reverse=True)

    return {k: v for k, v in keyword_sentences.items() if v}

def are_words_distant(words_list, current_word, threshold, normalized_levenshtein):
    """
    Check if words in the list are sufficiently distant from the current word.
    """
    score_list = [normalized_levenshtein.distance(word.lower(), current_word.lower()) for word in words_list]
    return min(score_list) >= threshold

def filter_useful_phrases(phrase_keys, max_count, normalized_levenshtein):
    """
    Filter out useful phrases based on distance threshold and max count.
    """
    filtered_phrases = [phrase_keys[0]] if phrase_keys else []
    for ph in phrase_keys[1:]:
        if are_words_distant(filtered_phrases, ph, 0.7, normalized_levenshtein):
            filtered_phrases.append(ph)
        if len(filtered_phrases) >= max_count:
            break
    return filtered_phrases

def extract_noun_phrases(text):
    """
    Extract noun phrases from the input text using MultipartiteRank.
    """
    extractor = pke.unsupervised.MultipartiteRank()
    extractor.load_document(input=text, language='en')
    pos = {'PROPN', 'NOUN'}
    stoplist = list(string.punctuation) + stopwords.words('english')
    extractor.candidate_selection(pos=pos)
    try:
        extractor.candidate_weighting(alpha=1.1, threshold=0.75, method='average')
    except Exception as e:
        print(f"Error in candidate weighting: {e}")
        return []
    keyphrases = extractor.get_n_best(n=10)
    return [key[0] for key in keyphrases]

def extract_phrases_from_doc(doc):
    """
    Extract phrases from a document object using noun chunks.
    """
    phrases = {}
    for np in doc.noun_chunks:
        phrase = np.text
        if len(phrase.split()) > 1:
            phrases[phrase] = phrases.get(phrase, 0) + 1
    phrase_keys = sorted(phrases.keys(), key=lambda x: len(x), reverse=True)
    return phrase_keys[:50]

def identify_keywords(nlp_model, text, max_keywords, s2v_model, fdist, normalized_levenshtein, num_sentences):
    """
    Identify keywords and phrases from the input text and filter them.
    """
    doc = nlp_model(text)
    keywords = extract_noun_phrases(text)
    keywords = sorted(keywords, key=lambda x: fdist[x])
    keywords = filter_useful_phrases(keywords, max_keywords, normalized_levenshtein)
    
    phrase_keys = extract_phrases_from_doc(doc)
    filtered_phrases = filter_useful_phrases(phrase_keys, max_keywords, normalized_levenshtein)

    total_phrases = filter_useful_phrases(keywords + filtered_phrases, min(max_keywords, 2 * num_sentences), normalized_levenshtein)

    answers = []
    for answer in total_phrases:
        if answer not in answers and is_word_available(answer, s2v_model):
            answers.append(answer)

    return answers[:max_keywords]

def generate_multiple_choice_questions(keyword_sent_mapping, device, tokenizer, model, sense2vec_model, normalized_levenshtein):
    """
    Generate multiple-choice questions based on keyword-sentence mappings.
    """
    batch_text = []
    for answer, txt in keyword_sent_mapping.items():
        text = f"context: {txt} answer: {answer} </s>"
        batch_text.append(text)

    encoding = tokenizer.batch_encode_plus(batch_text, pad_to_max_length=True, return_tensors="pt")
    input_ids, attention_masks = encoding["input_ids"].to(device), encoding["attention_mask"].to(device)

    with torch.no_grad():
        outputs = model.generate(input_ids=input_ids, attention_mask=attention_masks, max_length=150)

    generated_questions = []
    for index, answer in enumerate(keyword_sent_mapping.keys()):
        decoded_question = tokenizer.decode(outputs[index, :], skip_special_tokens=True).replace("question:", "").strip()
        options, options_algorithm = get_answer_choices(answer, sense2vec_model)
        options = filter_useful_phrases(options, 10, normalized_levenshtein)
        extra_options = options[3:]
        options = options[:3]

        question_data = {
            "question_statement": decoded_question,
            "question_type": "MCQ",
            "answer": answer,
            "id": index + 1,
            "options": options,
            "options_algorithm": options_algorithm,
            "extra_options": extra_options,
            "context": keyword_sent_mapping[answer]
        }

        generated_questions.append(question_data)

    return {"questions": generated_questions}

def generate_normal_questions(keyword_sent_mapping, device, tokenizer, model):
    """
    Generate normal questions based on keyword-sentence mappings.
    """
    batch_text = []
    for answer, txt in keyword_sent_mapping.items():
        text = f"context: {txt} answer: {answer} </s>"
        batch_text.append(text)

    encoding = tokenizer.batch_encode_plus(batch_text, pad_to_max_length=True, return_tensors="pt")
    input_ids, attention_masks = encoding["input_ids"].to(device), encoding["attention_mask"].to(device)

    with torch.no_grad():
        outs = model.generate(input_ids=input_ids, attention_mask=attention_masks, max_length=150)

    output_array = {"questions": []}
    for index, answer in enumerate(keyword_sent_mapping.keys()):
        decoded_question = tokenizer.decode(outs[index, :], skip_special_tokens=True).replace("question:", "").strip()
        
        individual_quest = {
            'Question': decoded_question,
            'Answer': answer,
            'id': index + 1,
            'context': keyword_sent_mapping[answer]
        }
        
        output_array["questions"].append(individual_quest)

    return output_array
