import random
import re

class FillInTheBlankGenerator:
    def generate(self, text, num_questions=4):
        if not text or not text.strip():
            return []
    
        if num_questions <= 0:
            raise ValueError("num_questions must be positive")
            
        sentences = re.split(r'(?<=[.!?]) +', text)
        questions = []

        for sentence in sentences:
            words = sentence.split()
            if len(words) > 5:
                blank_index = random.randint(1, len(words) - 2)
                word_to_blank = words[blank_index]
                words[blank_index] = "______"
                blanked_sentence = " ".join(words)
                questions.append({
                    "question": blanked_sentence.strip(),
                    "answer": word_to_blank
                })
                if len(questions) >= num_questions:
                    break
        return questions
