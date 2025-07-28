import random
import re

class FillInTheBlankGenerator:
    def generate(self, text, num_questions=4):
        sentences = re.split(r'(?<=[.!?]) +', text)
        questions = []

        for sentence in sentences:
            words = sentence.split()
            if len(words) > 5:
                word_to_blank = random.choice(words[1:-1])
                blanked_sentence = sentence.replace(word_to_blank, "_____")
                questions.append({
                    "question": blanked_sentence.strip(),
                    "answer": word_to_blank
                })
                if len(questions) >= num_questions:
                    break
        return questions
