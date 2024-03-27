# from nltk.corpus import wordnet as wn

# def get_co_hyponyms(word):
#     co_hyponyms = set()
#     synsets = wn.synsets(word)
#     for synset in synsets:
#         hypernyms = synset.hypernyms()
#         for hypernym in hypernyms:
#             hyponyms = hypernym.hyponyms()
#             for hyponym in hyponyms:
#                 co_hyponyms.update(hyponym.lemma_names())
#     return list(co_hyponyms)

# def generate_distractors(word, num_distractors):
#     co_hyponyms = get_co_hyponyms(word)
#     if len(co_hyponyms) < num_distractors:
#         print("Warning: Insufficient co-hyponyms to generate distractors.")
#         return co_hyponyms
#     else:
#         return co_hyponyms[:num_distractors]

# if __name__ == "__main__":
#     target_word = input("Enter the target word: ")
#     num_distractors = int(input("Enter the number of distractors to generate: "))
#     distractors = generate_distractors(target_word, num_distractors)
#     print("Distractors:")
#     for distractor in distractors:
#         print(distractor)
import requests
import random

def get_distractors(word, num_distractors):
    # Base URL for ConceptNet API
    base_url = 'http://api.conceptnet.io/query?node=/c/en/'

    # Construct the URL for querying ConceptNet
    url = base_url + word

    # Initialize list to store distractors
    distractors = []

    try:
        # Query ConceptNet API
        response = requests.get(url).json()

        # Extract relevant information from the response
        edges = response['edges']

        # Extract concepts related to the given word
        for edge in edges:
            if edge['start']['label'] == word:
                related_word = edge['end']['label']
                # Add related word to distractors list
                distractors.append(related_word)

        # Shuffle the distractors to randomize the order
        random.shuffle(distractors)

        # Return the required number of distractors
        return distractors[:num_distractors]

    except Exception as e:
        print("Error:", e)
        return []

if __name__ == "__main__":
    target_word = input("Enter the target word: ")
    num_distractors = int(input("Enter the number of distractors to generate: "))
    distractors = get_distractors(target_word, num_distractors)
    print("Distractors:")
    for distractor in distractors:
        print(distractor)
