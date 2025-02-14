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
    word = word.replace(" ", "_")
    sense = s2v_model.get_best_sense(word)
    if sense is not None:
        return True
    else:
        return False

def generate_word_variations(word):
    letters = 'abcdefghijklmnopqrstuvwxyz ' + string.punctuation
    splits = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    deletes = [L + R[1:] for L, R in splits if R]
    transposes = [L + R[1] + R[0] + R[2:] for L, R in splits if len(R) > 1]
    replaces = [L + c + R[1:] for L, R in splits if R for c in letters]
    inserts = [L + c + R for L, R in splits for c in letters]
    return set(deletes + transposes + replaces + inserts)

def find_similar_words(word, s2v_model):
    output = []
    word_preprocessed = word.translate(word.maketrans("", "", string.punctuation))
    word_preprocessed = word_preprocessed.lower()

    word_variations = generate_word_variations(word_preprocessed)

    word = word.replace(" ", "_")

    sense = s2v_model.get_best_sense(word)
    most_similar = s2v_model.most_similar(sense, n=15)

    compare_list = [word_preprocessed]
    for each_word in most_similar:
        append_word = each_word[0].split("|")[0].replace("_", " ")
        append_word = append_word.strip()
        append_word_processed = append_word.lower()
        append_word_processed = append_word_processed.translate(word.maketrans("", "", string.punctuation))
        if append_word_processed not in compare_list and word_preprocessed not in append_word_processed and append_word_processed not in word_variations:
            output.append(append_word.title())
            compare_list.append(append_word_processed)

    out = list(dict.fromkeys(output))
    return out

def get_answer_choices(answer, s2v_model):
    choices = []

    try:
        choices = find_similar_words(answer, s2v_model)
        if len(choices) > 0:
            print("Generated choices successfully for word:", answer)
            return choices, "sense2vec"
    except Exception as e:
        print(f"Failed to generate choices for word: {answer}. Error: {e}")

    return choices, "None"

def tokenize_into_sentences(text):
    sentences = [sent_tokenize(text)]
    sentences = [y for x in sentences for y in x]
    sentences = [sentence.strip() for sentence in sentences if len(sentence) > 20]
    return sentences

def find_sentences_with_keywords(keywords, sentences):
    keyword_processor = KeywordProcessor()
    keyword_sentences = {}
    for word in keywords:
        word = word.strip()
        keyword_sentences[word] = []
        keyword_processor.add_keyword(word)
    for sentence in sentences:
        keywords_found = keyword_processor.extract_keywords(sentence)
        for key in keywords_found:
            keyword_sentences[key].append(sentence)

    for key in keyword_sentences.keys():
        values = keyword_sentences[key]
        values = sorted(values, key=len, reverse=True)
        keyword_sentences[key] = values

    delete_keys = [k for k, v in keyword_sentences.items() if len(v) == 0]
    for del_key in delete_keys:
        del keyword_sentences[del_key]

    return keyword_sentences

def are_words_distant(words_list, current_word, threshold, normalized_levenshtein):
    score_list = [normalized_levenshtein.distance(word.lower(), current_word.lower()) for word in words_list]
    return min(score_list) >= threshold

def filter_useful_phrases(phrase_keys, max_count, normalized_levenshtein):
    filtered_phrases = []
    if phrase_keys:
        filtered_phrases.append(phrase_keys[0])
        for ph in phrase_keys[1:]:
            if are_words_distant(filtered_phrases, ph, 0.7, normalized_levenshtein):
                filtered_phrases.append(ph)
            if len(filtered_phrases) >= max_count:
                break
    return filtered_phrases

def extract_noun_phrases(text):
    out = []
    extractor = pke.unsupervised.MultipartiteRank()
    extractor.load_document(input=text, language='en')
    pos = {'PROPN', 'NOUN'}
    stoplist = list(string.punctuation)
    stoplist += stopwords.words('english')
    extractor.candidate_selection(pos=pos)
    try:
        extractor.candidate_weighting(alpha=1.1, threshold=0.75, method='average')
    except Exception as e:
        print(f"Error in candidate weighting: {e}")
        return out

    keyphrases = extractor.get_n_best(n=10)
    out = [key[0] for key in keyphrases]
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

def identify_keywords(nlp_model, text, max_keywords, s2v_model, fdist, normalized_levenshtein, num_sentences):
    doc = nlp_model(text)
    max_keywords = int(max_keywords)

    keywords = extract_noun_phrases(text)
    keywords = sorted(keywords, key=lambda x: fdist[x])
    keywords = filter_useful_phrases(keywords, max_keywords, normalized_levenshtein)

    phrase_keys = extract_phrases_from_doc(doc)
    filtered_phrases = filter_useful_phrases(phrase_keys, max_keywords, normalized_levenshtein)

    total_phrases = keywords + filtered_phrases

    total_phrases_filtered = filter_useful_phrases(total_phrases, min(max_keywords, 2 * num_sentences), normalized_levenshtein)

    answers = []
    for answer in total_phrases_filtered:
        if answer not in answers and is_word_available(answer, s2v_model):
            answers.append(answer)

    answers = answers[:max_keywords]
    return answers

def generate_multiple_choice_questions(keyword_sent_mapping, device, tokenizer, model, sense2vec_model, normalized_levenshtein):
    batch_text = []
    answers = keyword_sent_mapping.keys()
    for answer in answers:
        txt = keyword_sent_mapping[answer]
        context = "context: " + txt
        text = context + " " + "answer: " + answer + " </s>"
        batch_text.append(text)

    encoding = tokenizer.batch_encode_plus(batch_text, pad_to_max_length=True, return_tensors="pt")

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
        options, options_algorithm = get_answer_choices(answer, sense2vec_model)
        options = filter_useful_phrases(options, 10, normalized_levenshtein)
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

    encoding = tokenizer.batch_encode_plus(batch_text, pad_to_max_length=True, return_tensors="pt")

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
