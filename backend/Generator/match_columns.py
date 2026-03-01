import spacy
import random
from nltk.tokenize import sent_tokenize

nlp = spacy.load("en_core_web_sm")

def extract_pairs_from_text(text, max_pairs=6):
    doc = nlp(text)
    pairs = []
    seen_terms = set()
    seen_definitions = set()

    for sent in doc.sents:
        sent_doc = nlp(sent.text)
        
        for ent in sent_doc.ents:
            term = ent.text.strip()
            definition = sent.text.strip()
            if (
                term and
                len(term.split()) <= 4 and
                term.lower() not in seen_terms and
                definition not in seen_definitions and
                len(definition) > len(term) + 10
            ):
                pairs.append({"term": term, "definition": definition})
                seen_terms.add(term.lower())
                seen_definitions.add(definition)
                break

        if len(pairs) >= max_pairs:
            break

    if len(pairs) < 3:
        for sent in doc.sents:
            sent_doc = nlp(sent.text)
            for chunk in sent_doc.noun_chunks:
                term = chunk.text.strip()
                definition = sent.text.strip()
                if (
                    term and
                    len(term.split()) <= 4 and
                    term.lower() not in seen_terms and
                    definition not in seen_definitions and
                    len(definition) > len(term) + 10
                ):
                    pairs.append({"term": term, "definition": definition})
                    seen_terms.add(term.lower())
                    seen_definitions.add(definition)
                    break
            if len(pairs) >= max_pairs:
                break

    return pairs[:max_pairs]


def generate_match_columns(payload):
    text = payload.get("input_text", "")
    max_pairs = payload.get("max_questions", 6)

    pairs = extract_pairs_from_text(text, max_pairs)

    if not pairs:
        return {"pairs": [], "left_column": [], "right_column": []}

    left_column = [p["term"] for p in pairs]
    right_column = [p["definition"] for p in pairs]

    shuffled_right = right_column.copy()
    random.shuffle(shuffled_right)

    return {
        "pairs": pairs,
        "left_column": left_column,
        "right_column": shuffled_right
    }