import re
import random
from nltk import pos_tag, word_tokenize
from nltk.corpus import wordnet, stopwords
from nltk.tokenize.treebank import TreebankWordDetokenizer

# Initialize NLTK resources
import nltk
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger_eng', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('stopwords', quiet=True)

class QuestionEnhancer:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.detokenizer = TreebankWordDetokenizer()
        
        self.question_word_map = {
            'what': ['which specific', 'what particular', 'what exact'],
            'how': ['by what means', 'through what process'],
            'where': ['in which location', 'at what place'],
            'when': ['at what time', 'during which period'],
            'why': ['for what reason', 'with what purpose'],
            'who': ['which individual', 'what person']
        }
        
        # Common verb enhancements
        self.verb_enhancements = {
            'is': ['constitutes', 'represents'],
            'are': ['comprise', 'represent'],
            'was': ['had been', 'came to be'],
            'were': ['had been', 'came to be'],
            'did': ['accomplished', 'executed']
        }

    def _generate_question_word_alternatives(self, word):
        """Generate alternatives for question words"""
        word = word.lower()
        if word in self.question_word_map:
            return random.choice(self.question_word_map[word])
        return None

    def _get_complex_synonym(self, word, pos_tag):
        """Find more complex synonym using WordNet with POS awareness"""
        if (word.lower() in self.stop_words or 
            len(word) <= 3 or 
            word.lower() in {'who', 'what', 'when', 'where', 'why', 'how'}):
            return None
            
        pos_mapping = {
            'NN': wordnet.NOUN,
            'VB': wordnet.VERB,
            'JJ': wordnet.ADJ,
            'RB': wordnet.ADV
        }.get(pos_tag[:2])
        
        if not pos_mapping:
            return None
            
        synsets = wordnet.synsets(word, pos=pos_mapping)
        if not synsets:
            return None
            
        # Collect all suitable synonyms
        candidates = []
        for synset in synsets:
            for lemma in synset.lemmas():
                synonym = lemma.name().replace('_', ' ')
                if (len(synonym) > len(word) and 
                    synonym.lower() != word.lower() and
                    ' ' not in synonym):
                    candidates.append(synonym)
        
        return random.choice(candidates) if candidates else None

    def _enhance_question_structure(self, question):
        """Enhance question structure using algorithmic transformations"""
        tokens = word_tokenize(question)
        if len(tokens) < 2:
            return None
            
        # Enhance question words
        first_word = tokens[0].lower()
        alternative = self._generate_question_word_alternatives(first_word)
        if alternative:
            return alternative + ' ' + self.detokenizer.detokenize(tokens[1:])
            
        # Enhance verb phrases
        tagged = pos_tag(tokens)
        for i, (word, tag) in enumerate(tagged):
            if tag.startswith('VB') and word.lower() in self.verb_enhancements:
                replacement = random.choice(self.verb_enhancements[word.lower()])
                new_tokens = tokens[:i] + [replacement] + tokens[i+1:]
                return self.detokenizer.detokenize(new_tokens)
                
        return None

    def _add_precision_terms(self, question):
        """Add precision terms to question"""
        terms = ['precisely', 'specifically', 'exactly', 'particularly']
        if random.random() > 0.7:
            tokens = word_tokenize(question)
            if len(tokens) > 3:
                pos = random.randint(1, min(3, len(tokens)-1))
                tokens.insert(pos, random.choice(terms))
                return self.detokenizer.detokenize(tokens)
        return None

    def _convert_to_passive(self, question):
        """Convert to passive voice where appropriate"""
        if random.random() < 0.4:  # Apply only 40% of the time
            tokens = word_tokenize(question)
            tagged = pos_tag(tokens)
            
            for i, (word, tag) in enumerate(tagged):
                if (tag.startswith('VB') and i > 0 and 
                    tagged[i-1][1].startswith('NN')):
                    subject = self.detokenizer.detokenize(tokens[:i])
                    verb = word
                    obj = self.detokenizer.detokenize(tokens[i+1:])
                    
                    passive_aux = {
                        'VB': 'is',
                        'VBD': 'was',
                        'VBG': 'is being',
                        'VBN': 'has been'
                    }.get(tag[:3], 'is')
                    
                    return f"{obj} {passive_aux} {verb} by {subject}"
        return None

    def enhance(self, question):
        """Enhance question difficulty through multiple strategies"""
        if not question or not isinstance(question, str):
            return question
            
        # Apply transformations in order of sophistication
        transformations = [
            self._enhance_question_structure,
            self._add_precision_terms,
            self._convert_to_passive,
            self._enhance_lexically
        ]
        
        for transform in transformations:
            enhanced = transform(question)
            if enhanced:
                question = enhanced
                break
                
        # Final cleanup
        question = re.sub(r'\s+([?,!])', r'\1', question)
        return question[0].upper() + question[1:]

    def _enhance_lexically(self, question):
        """Enhance question through lexical substitutions"""
        tokens = word_tokenize(question)
        tagged = pos_tag(tokens)
        enhanced_tokens = []
        modified = False
        
        for word, tag in tagged:
            if word.lower() in self.stop_words or len(word) <= 3:
                enhanced_tokens.append(word)
                continue
                
            if tag.startswith(('NN', 'VB', 'JJ', 'RB')):
                synonym = self._get_complex_synonym(word, tag)
                if synonym:
                    enhanced_tokens.append(synonym)
                    modified = True
                    continue
                    
            enhanced_tokens.append(word)
            
        if modified:
            return self.detokenizer.detokenize(enhanced_tokens)
        return None

# Usage example
enhancer = QuestionEnhancer()

def make_question_harder(entry):
    if isinstance(entry, dict):
        question = entry.get("question", "")
    else:
        question = entry
        
    return enhancer.enhance(question)