from rag import RAGService

sample_text = """
Machine learning is a subset of artificial intelligence.
It enables systems to learn from data and improve over time.
Supervised learning uses labeled data.
Unsupervised learning works without labeled data.
"""

rag = RAGService()

rag.index_text(sample_text)

question = "What is supervised learning?"

answer = rag.query(question)

print("Answer:")
print(answer)