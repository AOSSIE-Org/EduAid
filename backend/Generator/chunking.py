"""
Token-aware semantic chunking module for long-document question generation.

This module provides utilities for splitting long documents into token-aware chunks
that respect sentence boundaries, enabling question generation from documents that
exceed transformer model token limits.
"""

import logging
from typing import List, Tuple, Dict, Any
from nltk.tokenize import sent_tokenize
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# Configure logging
logger = logging.getLogger(__name__)


class TextChunker:
    """
    Handles token-aware chunking of text while respecting sentence boundaries.
    """
    
    def __init__(self, tokenizer, max_tokens: int = 400, overlap_tokens: int = 50):
        """
        Initialize the TextChunker.
        
        Args:
            tokenizer: The tokenizer to use for token counting (e.g., T5Tokenizer)
            max_tokens: Maximum number of tokens per chunk (default: 400)
            overlap_tokens: Number of tokens to overlap between chunks (default: 50)
        """
        self.tokenizer = tokenizer
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens
        
    def count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in the given text.
        
        Args:
            text: Input text to tokenize
            
        Returns:
            Number of tokens in the text
        """
        try:
            tokens = self.tokenizer.encode(text, add_special_tokens=False)
            return len(tokens)
        except Exception as e:
            logger.error(f"Error counting tokens: {e}")
            # Fallback to word count estimation
            return len(text.split())
    
    def needs_chunking(self, text: str) -> bool:
        """
        Determine if the text needs to be chunked.
        
        Args:
            text: Input text to check
            
        Returns:
            True if text exceeds max_tokens, False otherwise
        """
        token_count = self.count_tokens(text)
        logger.info(f"Input text has {token_count} tokens (threshold: {self.max_tokens})")
        # Reserve space for prompts and model tokens
        safe_limit = self.max_tokens - 50
        return token_count > safe_limit
    
    def split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using NLTK sentence tokenizer.
        
        Args:
            text: Input text to split
            
        Returns:
            List of sentences
        """
        try:
            sentences = sent_tokenize(text)
            # Filter out very short sentences (likely artifacts)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
            logger.debug(f"Split text into {len(sentences)} sentences")
            return sentences
        except Exception as e:
            logger.error(f"Error splitting sentences: {e}")
            # Fallback to simple period splitting
            return [s.strip() for s in text.split('.') if len(s.strip()) > 10]
    
    def create_chunks(self, text: str) -> List[str]:
        """
        Create token-aware chunks from the input text.
        
        Args:
            text: Input text to chunk
            
        Returns:
            List of text chunks
        """
        sentences = self.split_into_sentences(text)
        
        if not sentences:
            logger.warning("No sentences found in text")
            return [text]
        
        chunks = []
        current_chunk = []
        current_token_count = 0
        
        for sentence in sentences:
            sentence_tokens = self.count_tokens(sentence)
            
            # If a single sentence exceeds max_tokens, include it as a standalone chunk
            if sentence_tokens > self.max_tokens:
                # Save current chunk if it has content
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_token_count = 0
                
                # Add the long sentence as its own chunk
                chunks.append(sentence)
                logger.warning(f"Single sentence exceeds token limit: {sentence_tokens} tokens")
                continue
            
            # Check if adding this sentence would exceed the limit
            if current_token_count + sentence_tokens > self.max_tokens:
                # Save current chunk
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                
                # Start new chunk with overlap
                if self.overlap_tokens > 0 and current_chunk:
                    # Find sentences from the end of current chunk to include as overlap
                    overlap_chunk = []
                    overlap_tokens = 0
                    
                    for prev_sentence in reversed(current_chunk):
                        prev_tokens = self.count_tokens(prev_sentence)
                        if overlap_tokens + prev_tokens <= self.overlap_tokens:
                            overlap_chunk.insert(0, prev_sentence)
                            overlap_tokens += prev_tokens
                        else:
                            break
                    
                    current_chunk = overlap_chunk
                    current_token_count = overlap_tokens
                else:
                    current_chunk = []
                    current_token_count = 0
            
            # Add sentence to current chunk
            current_chunk.append(sentence)
            current_token_count += sentence_tokens
        
        # Add the last chunk if it has content
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        logger.info(f"Created {len(chunks)} chunks from input text")
        return chunks


class QuestionDeduplicator:
    """
    Handles deduplication of semantically similar questions.
    """
    
    def __init__(self, similarity_threshold: float = 0.85):
        """
        Initialize the QuestionDeduplicator.
        
        Args:
            similarity_threshold: Threshold for considering questions as duplicates (default: 0.85)
        """
        self.similarity_threshold = similarity_threshold
    
    def extract_question_text(self, question: Any) -> str:
        """
        Extract question text from various question formats.
        
        Args:
            question: Question object (dict or string)
            
        Returns:
            Question text as string
        """
        if isinstance(question, dict):
            # Try different possible keys for question text
            for key in ['question', 'Question', 'question_statement']:
                if key in question:
                    return str(question[key])
            # If no known key, return string representation
            return str(question)
        return str(question)
    
    def deduplicate(self, questions: List[Any]) -> List[Any]:
        """
        Remove semantically similar questions from the list.
        
        Args:
            questions: List of questions to deduplicate
            
        Returns:
            Deduplicated list of questions
        """
        if not questions:
            return questions
        
        if len(questions) == 1:
            return questions
        
        try:
            # Extract question texts
            question_texts = [self.extract_question_text(q) for q in questions]
            
            # Use TF-IDF vectorization for similarity comparison
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform(question_texts)
            
            # Calculate pairwise similarities
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # Track which questions to keep
            keep_indices = []
            removed_count = 0
            
            for i in range(len(questions)):
                is_duplicate = False
                
                # Check if this question is similar to any already kept question
                for kept_idx in keep_indices:
                    if similarity_matrix[i][kept_idx] > self.similarity_threshold:
                        is_duplicate = True
                        removed_count += 1
                        logger.debug(f"Removing duplicate question: {question_texts[i][:50]}...")
                        break
                
                if not is_duplicate:
                    keep_indices.append(i)
            
            deduplicated = [questions[i] for i in keep_indices]
            logger.info(f"Deduplication: {len(questions)} -> {len(deduplicated)} questions (removed {removed_count})")
            
            return deduplicated
            
        except Exception as e:
            logger.error(f"Error during deduplication: {e}")
            # Return original list if deduplication fails
            return questions


def distribute_question_count(total_questions: int, num_chunks: int, chunk_sizes: List[int] = None) -> List[int]:
    """
    Distribute the total number of questions across chunks proportionally.
    
    Args:
        total_questions: Total number of questions to generate
        num_chunks: Number of chunks
        chunk_sizes: Optional list of chunk sizes (in tokens) for proportional distribution
        
    Returns:
        List of question counts per chunk
    """
    if num_chunks == 0:
        return []
    
    if num_chunks == 1:
        return [total_questions]
    
    # If chunk sizes provided, distribute proportionally
    if chunk_sizes and len(chunk_sizes) == num_chunks:
        total_size = sum(chunk_sizes)
        if total_size == 0:
            # Fallback to equal distribution
            base_count = total_questions // num_chunks
            remainder = total_questions % num_chunks
            return [base_count + (1 if i < remainder else 0) for i in range(num_chunks)]
        
        # Proportional distribution
        distribution = []
        allocated = 0
        
        for i, size in enumerate(chunk_sizes):
            if i == num_chunks - 1:
                # Last chunk gets remaining questions
                distribution.append(total_questions - allocated)
            else:
                count = int(total_questions * size / total_size)
                remaining = total_questions - allocated
                count = min(max(1, count), remaining)
                distribution.append(count)
                allocated += count
        
        return distribution
    
    # Equal distribution with remainder handling
    base_count = total_questions // num_chunks
    remainder = total_questions % num_chunks
    
    distribution = [base_count + (1 if i < remainder else 0) for i in range(num_chunks)]
    
    logger.debug(f"Question distribution across {num_chunks} chunks: {distribution}")
    return distribution
