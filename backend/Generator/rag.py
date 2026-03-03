import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch


class RAGService:

    def __init__(self):
        self.current_text = None

        # Embedding model
        self.embedder = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )

        # Generator model
        self.tokenizer = T5Tokenizer.from_pretrained("t5-base")
        self.generator = T5ForConditionalGeneration.from_pretrained("t5-base")

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.generator.to(self.device)

        # FAISS state
        self.index = None
        self.text_chunks = []
        self.dimension = None

    # ---------------------------------------------------
    # TEXT CHUNKING
    # ---------------------------------------------------
    def chunk_text(self, text, chunk_size=400, overlap=50):

        if chunk_size <= 0:
            raise ValueError("chunk_size must be > 0")

        if overlap < 0 or overlap >= chunk_size:
            raise ValueError(
                "overlap must be >= 0 and < chunk_size"
            )

        words = text.split()
        chunks = []

        step = chunk_size - overlap

        for i in range(0, len(words), step):
            chunk = words[i:i + chunk_size]
            chunks.append(" ".join(chunk))

        return chunks

    # ---------------------------------------------------
    # SAFE ATOMIC INDEXING
    # ---------------------------------------------------
    def index_text(self, text):

        # Skip only if state is already valid
        if (
            self.current_text == text
            and self.index is not None
            and self.text_chunks
        ):
            return

        try:
            # Build temporary chunks
            temp_chunks = self.chunk_text(text)

            if not temp_chunks:
                self.current_text = text
                self.text_chunks = []
                self.index = None
                self.dimension = None
                return

            # Generate embeddings
            temp_embeddings = self.embedder.encode(
                temp_chunks,
                convert_to_numpy=True
            )

            # Normalize for cosine similarity
            faiss.normalize_L2(temp_embeddings)
            temp_embeddings = temp_embeddings.astype("float32")

            temp_dimension = temp_embeddings.shape[1]
            temp_index = faiss.IndexFlatIP(temp_dimension)
            temp_index.add(temp_embeddings)

            # 🔐 Commit state only after success
            self.current_text = text
            self.text_chunks = temp_chunks
            self.dimension = temp_dimension
            self.index = temp_index

        except Exception:
            # Prevent corrupted state
            self.index = None
            self.text_chunks = []
            self.dimension = None
            raise

    # ---------------------------------------------------
    # QUERY WITH MEMORY
    # ---------------------------------------------------
    def query(self, question, chat_history=None, top_k=3):

        if self.index is None:
            return "No document indexed."

        # Embed question
        question_embedding = self.embedder.encode(
            [question],
            convert_to_numpy=True
        )

        faiss.normalize_L2(question_embedding)
        question_embedding = question_embedding.astype("float32")

        top_k = min(top_k, len(self.text_chunks))

        distances, indices = self.index.search(
            question_embedding,
            top_k
        )

        retrieved_chunks = [
            self.text_chunks[i]
            for i in indices[0]
            if i < len(self.text_chunks)
        ]

        context = " ".join(retrieved_chunks)

        # Build conversation history
        history_text = ""

        if chat_history:
            for turn in chat_history:
                role = turn.get("role")
                message = turn.get("message")

                if role == "user":
                    history_text += f"User: {message}\n"
                elif role == "assistant":
                    history_text += f"Assistant: {message}\n"

        # Final prompt
        input_text = f"""
You are a helpful educational assistant.

Use the provided context to answer the question.
If the answer is not found in the context, say you don't know.

Context:
{context}

Conversation History:
{history_text}

Current Question:
{question}
"""

        encoding = self.tokenizer(
            input_text,
            return_tensors="pt",
            truncation=True,
            max_length=512
        ).to(self.device)

        output = self.generator.generate(
            **encoding,
            max_length=150
        )

        answer = self.tokenizer.decode(
            output[0],
            skip_special_tokens=True
        )

        return answer