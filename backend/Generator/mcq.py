import string
import nltk
import torch
import re
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from rapidfuzz import fuzz
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer

nltk.download('brown')
nltk.download('stopwords')
nltk.download('popular')

def is_word_available(word, embedding_model):
    # Replaced sense2vec with sentence-transformers
    # Check if word can be encoded (basic validation)
    try:
        # Simple check: if word has meaningful content
        if len(word.strip()) > 0 and word.strip().isalnum():
            return True
        return False
    except:
        return False

def generate_word_variations(word):
    letters = 'abcdefghijklmnopqrstuvwxyz ' + string.punctuation
    splits = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    deletes = [L + R[1:] for L, R in splits if R]
    transposes = [L + R[1] + R[0] + R[2:] for L, R in splits if len(R) > 1]
    replaces = [L + c + R[1:] for L, R in splits if R for c in letters]
    inserts = [L + c + R for L, R in splits for c in letters]
    return set(deletes + transposes + replaces + inserts)

def find_similar_words(word, embedding_model, candidate_words=None):
    # Replaced sense2vec with sentence-transformers for word similarity
    output = []
    word_preprocessed = word.translate(word.maketrans("", "", string.punctuation))
    word_preprocessed = word_preprocessed.lower()

    word_variations = generate_word_variations(word_preprocessed)

    try:
        # Use embedding model to find similar words
        # If candidate_words provided, use them; otherwise generate from context
        if candidate_words is None:
            # Fallback: return empty list if no candidates
            return output
        
        # Encode the target word
        word_embedding = embedding_model.encode([word], convert_to_numpy=True)
        
        # Encode candidate words
        candidate_embeddings = embedding_model.encode(candidate_words, convert_to_numpy=True)
        
        # Calculate cosine similarity (using dot product for normalized embeddings)
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(word_embedding, candidate_embeddings)[0]
        
        # Get top 15 most similar
        top_indices = similarities.argsort()[-15:][::-1]
        
        compare_list = [word_preprocessed]
        for idx in top_indices:
            append_word = candidate_words[idx]
            append_word_processed = append_word.lower().translate(str.maketrans("", "", string.punctuation))
            if append_word_processed not in compare_list and word_preprocessed not in append_word_processed and append_word_processed not in word_variations:
                output.append(append_word.title())
                compare_list.append(append_word_processed)
    except Exception as e:
        print(f"Error finding similar words: {e}")
        return output

    out = list(dict.fromkeys(output))
    return out

def get_answer_choices(answer, embedding_model, candidate_words=None):
    # Replaced sense2vec with sentence-transformers
    choices = []

    try:
        choices = find_similar_words(answer, embedding_model, candidate_words)
        if len(choices) > 0:
            print("Generated choices successfully for word:", answer)
            return choices, "sentence-transformers"
    except Exception as e:
        print(f"Failed to generate choices for word: {answer}. Error: {e}")

    return choices, "None"

def tokenize_into_sentences(text):
    sentences = [sent_tokenize(text)]
    sentences = [y for x in sentences for y in x]
    sentences = [sentence.strip() for sentence in sentences if len(sentence) > 20]
    return sentences

def find_sentences_with_keywords(keywords, sentences):
    # Replaced flashtext with regex-based keyword matching
    keyword_sentences = {}
    for word in keywords:
        word = word.strip()
        keyword_sentences[word] = []
        # Create regex pattern for case-insensitive matching
        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
        for sentence in sentences:
            if pattern.search(sentence):
                keyword_sentences[word].append(sentence)

    for key in keyword_sentences.keys():
        values = keyword_sentences[key]
        values = sorted(values, key=len, reverse=True)
        keyword_sentences[key] = values

    delete_keys = [k for k, v in keyword_sentences.items() if len(v) == 0]
    for del_key in delete_keys:
        del keyword_sentences[del_key]

    return keyword_sentences

def are_words_distant(words_list, current_word, threshold):
    # Replaced similarity.normalized_levenshtein with rapidfuzz
    # rapidfuzz returns similarity (0-100), so we convert distance threshold
    # threshold 0.7 means similarity should be <= 30 (100 * (1 - 0.7))
    similarity_threshold = 100 * (1 - threshold)
    score_list = [fuzz.ratio(word.lower(), current_word.lower()) for word in words_list]
    return min(score_list) <= similarity_threshold

def filter_useful_phrases(phrase_keys, max_count):
    # Updated to use rapidfuzz instead of normalized_levenshtein
    filtered_phrases = []
    if phrase_keys:
        filtered_phrases.append(phrase_keys[0])
        for ph in phrase_keys[1:]:
            if are_words_distant(filtered_phrases, ph, 0.7):
                filtered_phrases.append(ph)
            if len(filtered_phrases) >= max_count:
                break
    return filtered_phrases

def extract_noun_phrases(text, kw_model=None):
    # Replaced pke with keybert for keyphrase extraction
    out = []
    try:
        if kw_model is None:
            # Initialize KeyBERT model if not provided
            kw_model = KeyBERT()
        keyphrases = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=10)
        out = [key[0] for key in keyphrases]
    except Exception as e:
        print(f"Error in keyphrase extraction: {e}")
        return out
    return out

def extract_phrases_from_doc(doc):
    phrases = {}
    for np in doc.noun_chunks:
        phrase = np.text
        len_phrase = len(phrase.split())
        if len_phrase > 1:
            if phrase not in phrases:
                phrases[phrase] = 1
            else:
                phrases[phrase] += 1

    phrase_keys = list(phrases.keys())
    phrase_keys = sorted(phrase_keys, key=lambda x: len(x), reverse=True)
    phrase_keys = phrase_keys[:50]
    return phrase_keys

def identify_keywords(nlp_model, text, max_keywords, embedding_model, fdist, num_sentences, kw_model=None):
    # Updated to use new dependencies: embedding_model instead of s2v_model, removed normalized_levenshtein
    doc = nlp_model(text)
    max_keywords = int(max_keywords)

    keywords = extract_noun_phrases(text, kw_model)
    keywords = sorted(keywords, key=lambda x: fdist.get(x, 0))
    keywords = filter_useful_phrases(keywords, max_keywords)

    phrase_keys = extract_phrases_from_doc(doc)
    filtered_phrases = filter_useful_phrases(phrase_keys, max_keywords)

    total_phrases = keywords + filtered_phrases

    total_phrases_filtered = filter_useful_phrases(total_phrases, min(max_keywords, 2 * num_sentences))

    answers = []
    for answer in total_phrases_filtered:
        if answer not in answers and is_word_available(answer, embedding_model):
            answers.append(answer)

    answers = answers[:max_keywords]
    return answers

def generate_multiple_choice_questions(keyword_sent_mapping, device, tokenizer, model, embedding_model):
    # Updated to use embedding_model instead of sense2vec_model, removed normalized_levenshtein
    batch_text = []
    answers = keyword_sent_mapping.keys()
    for answer in answers:
        txt = keyword_sent_mapping[answer]
        context = "context: " + txt
        text = context + " " + "answer: " + answer + " </s>"
        batch_text.append(text)

    encoding = tokenizer.batch_encode_plus(batch_text, padding=True, return_tensors="pt")

    print("Generating questions using the model...")
    input_ids, attention_masks = encoding["input_ids"].to(device), encoding["attention_mask"].to(device)

    with torch.no_grad():
        outputs = model.generate(input_ids=input_ids,
                                 attention_mask=attention_masks,
                                 max_length=150)

    generated_questions = []
    for index, answer in enumerate(answers):
        out = outputs[index, :]
        decoded_question = tokenizer.decode(out, skip_special_tokens=True, clean_up_tokenization_spaces=True)

        question_statement = decoded_question.replace("question:", "").strip()
        # Generate candidate words from context for similarity search
        candidate_words = list(keyword_sent_mapping.keys())
        options, options_algorithm = get_answer_choices(answer, embedding_model, candidate_words)
        options = filter_useful_phrases(options, 10)
        extra_options = options[3:]
        options = options[:3]

        question_data = {
            "question_statement": question_statement,
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
    batch_text = []
    answers = keyword_sent_mapping.keys()
    
    for answer in answers:
        txt = keyword_sent_mapping[answer]
        context = "context: " + txt
        text = context + " " + "answer: " + answer + " </s>"
        batch_text.append(text)

    encoding = tokenizer.batch_encode_plus(batch_text, padding=True, return_tensors="pt")

    print("Running model for generation...")
    input_ids, attention_masks = encoding["input_ids"].to(device), encoding["attention_mask"].to(device)

    with torch.no_grad():
        outs = model.generate(input_ids=input_ids,
                              attention_mask=attention_masks,
                              max_length=150)

    output_array = {"questions": []}

    for index, val in enumerate(answers):
        individual_quest = {}
        out = outs[index, :]
        dec = tokenizer.decode(out, skip_special_tokens=True, clean_up_tokenization_spaces=True)
        
        Question = dec.replace('question:', '')
        Question = Question.strip()

        individual_quest['Question'] = Question
        individual_quest['Answer'] = val
        individual_quest["id"] = index + 1
        individual_quest["context"] = keyword_sent_mapping[val]
        
        output_array["questions"].append(individual_quest)
    
    return output_array
