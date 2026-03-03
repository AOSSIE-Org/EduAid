import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch


class RAGService:

    def __init__(self):
        self.current_text = None

        # Embedding model
        self.embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

        # Generator model
        self.tokenizer = T5Tokenizer.from_pretrained("t5-base")
        self.generator = T5ForConditionalGeneration.from_pretrained("t5-base")

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.generator.to(self.device)

        # FAISS index
        self.index = None
        self.text_chunks = []
        self.dimension = None

    # -----------------------------
    # TEXT CHUNKING
    # -----------------------------
    def chunk_text(self, text, chunk_size=400, overlap=50):
        words = text.split()
        chunks = []

        for i in range(0, len(words), chunk_size - overlap):
            chunk = words[i:i + chunk_size]
            chunks.append(" ".join(chunk))

        return chunks

    # -----------------------------
    # INDEXING
    # -----------------------------
    def index_text(self, text):

        # Avoid re-indexing same document
        if self.current_text == text:
            return

        self.current_text = text
        self.text_chunks = []

        # Create chunks
        self.text_chunks = self.chunk_text(text)

        if not self.text_chunks:
            return

        # Create embeddings
        embeddings = self.embedder.encode(
            self.text_chunks,
            convert_to_numpy=True
        )

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        embeddings = embeddings.astype("float32")

        # Create FAISS index (cosine similarity)
        self.dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)

    # -----------------------------
    # QUERY (WITH MEMORY)
    # -----------------------------
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

        # Safe top_k
        top_k = min(top_k, len(self.text_chunks))

        # Search
        distances, indices = self.index.search(question_embedding, top_k)

        # Retrieve relevant chunks
        retrieved_chunks = [
            self.text_chunks[i]
            for i in indices[0]
            if i < len(self.text_chunks)
        ]

        context = " ".join(retrieved_chunks)

        # -----------------------------
        # BUILD CHAT HISTORY TEXT
        # -----------------------------
        history_text = ""

        if chat_history:
            for turn in chat_history:
                role = turn.get("role")
                message = turn.get("message")

                if role == "user":
                    history_text += f"User: {message}\n"
                elif role == "assistant":
                    history_text += f"Assistant: {message}\n"

        # -----------------------------
        # FINAL PROMPT
        # -----------------------------
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