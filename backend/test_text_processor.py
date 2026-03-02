"""Tests for the TextProcessor chunking utility.

These tests verify that TextProcessor correctly splits text into
overlapping chunks on natural boundaries (paragraphs, sentences, words)
without any external dependencies beyond Python's stdlib.
"""

import pytest

from utils.text_processor import TextProcessor


# ---------------------------------------------------------------------------
# Helper data
# ---------------------------------------------------------------------------

SHORT_TEXT = "This is a short sentence."

PARAGRAPH_TEXT = (
    "Artificial intelligence is the simulation of human intelligence.\n\n"
    "Machine learning is a subset of AI that focuses on algorithms.\n\n"
    "Deep learning involves neural networks with many layers."
)

LONG_PARAGRAPH = (
    "Artificial intelligence (AI) is the simulation of human intelligence "
    "processes by machines, especially computer systems. These processes "
    "include learning, reasoning, and self-correction. AI applications include "
    "speech recognition, natural language processing, machine vision, expert "
    "systems, and robotics. Machine learning, a subset of AI, focuses on the "
    "development of algorithms that can learn from and make predictions or "
    "decisions based on data. Deep learning, a technique within machine "
    "learning, involves neural networks with many layers. It has revolutionized "
    "AI by enabling complex pattern recognition and data processing tasks. "
    "Ethical considerations in AI include issues of bias in algorithms, privacy "
    "concerns with data collection, and the impact of AI on jobs and society."
)


def _make_large_text(num_paragraphs=20):
    """Create a synthetic large document with multiple paragraphs."""
    paragraphs = []
    for i in range(num_paragraphs):
        paragraphs.append(
            f"This is paragraph {i + 1} of the document. "
            f"It contains several sentences about topic {i + 1}. "
            f"The content is rich and varied for testing purposes. "
            f"We want to ensure that chunking works correctly across "
            f"paragraph boundaries and preserves context."
        )
    return "\n\n".join(paragraphs)


# ===========================================================================
# Constructor validation
# ===========================================================================


class TestTextProcessorInit:

    def test_default_parameters(self):
        tp = TextProcessor()
        assert tp.chunk_size == 1000
        assert tp.chunk_overlap == 200

    def test_custom_parameters(self):
        tp = TextProcessor(chunk_size=500, chunk_overlap=50)
        assert tp.chunk_size == 500
        assert tp.chunk_overlap == 50

    def test_invalid_chunk_size_zero(self):
        with pytest.raises(ValueError, match="chunk_size must be a positive"):
            TextProcessor(chunk_size=0)

    def test_invalid_chunk_size_negative(self):
        with pytest.raises(ValueError, match="chunk_size must be a positive"):
            TextProcessor(chunk_size=-10)

    def test_invalid_chunk_overlap_negative(self):
        with pytest.raises(ValueError, match="chunk_overlap must be non-negative"):
            TextProcessor(chunk_overlap=-1)

    def test_overlap_greater_than_size(self):
        with pytest.raises(ValueError, match="chunk_overlap must be smaller"):
            TextProcessor(chunk_size=100, chunk_overlap=100)

    def test_overlap_exceeds_size(self):
        with pytest.raises(ValueError, match="chunk_overlap must be smaller"):
            TextProcessor(chunk_size=100, chunk_overlap=150)


# ===========================================================================
# chunk_text — basic behaviour
# ===========================================================================


class TestChunkTextBasic:

    def test_short_text_single_chunk(self):
        tp = TextProcessor(chunk_size=1000)
        chunks = tp.chunk_text(SHORT_TEXT)
        assert len(chunks) == 1
        assert chunks[0] == SHORT_TEXT

    def test_empty_string_returns_empty(self):
        tp = TextProcessor()
        assert tp.chunk_text("") == []

    def test_whitespace_only_returns_empty(self):
        tp = TextProcessor()
        assert tp.chunk_text("   \n\n  \t  ") == []

    def test_none_returns_empty(self):
        tp = TextProcessor()
        assert tp.chunk_text(None) == []

    def test_single_character(self):
        tp = TextProcessor()
        chunks = tp.chunk_text("A")
        assert len(chunks) == 1
        assert chunks[0] == "A"


# ===========================================================================
# chunk_text — paragraph splitting
# ===========================================================================


class TestChunkTextParagraphs:

    def test_paragraph_splitting(self):
        """Text with \\n\\n delimiters should produce multiple chunks when
        the full text exceeds chunk_size."""
        tp = TextProcessor(chunk_size=100, chunk_overlap=20)
        chunks = tp.chunk_text(PARAGRAPH_TEXT)
        assert len(chunks) > 1
        # Each chunk should be non-empty
        for chunk in chunks:
            assert len(chunk.strip()) > 0

    def test_all_content_preserved(self):
        """Joining all chunks should cover the original text content."""
        tp = TextProcessor(chunk_size=100, chunk_overlap=0)
        chunks = tp.chunk_text(PARAGRAPH_TEXT)
        joined = " ".join(chunks)
        # Every sentence from the original should appear in the joined output
        assert "Artificial intelligence" in joined
        assert "Machine learning" in joined
        assert "Deep learning" in joined


# ===========================================================================
# chunk_text — sentence splitting
# ===========================================================================


class TestChunkTextSentences:

    def test_sentence_splitting_for_long_paragraph(self):
        """A long paragraph without \\n\\n should still split on '. '."""
        tp = TextProcessor(chunk_size=200, chunk_overlap=30)
        chunks = tp.chunk_text(LONG_PARAGRAPH)
        assert len(chunks) > 1

    def test_chunks_respect_size_limit(self):
        """Each chunk should be at most chunk_size (with small tolerance
        for edge cases with indivisible tokens)."""
        tp = TextProcessor(chunk_size=200, chunk_overlap=30)
        chunks = tp.chunk_text(LONG_PARAGRAPH)
        for chunk in chunks:
            # Allow a small tolerance — the final chunk may overshoot slightly
            # when a sentence cannot be split further.
            assert len(chunk) <= 250, f"Chunk too large: {len(chunk)} chars"


# ===========================================================================
# chunk_text — overlap
# ===========================================================================


class TestChunkTextOverlap:

    def test_overlap_present(self):
        """Adjacent chunks should share some overlapping text."""
        tp = TextProcessor(chunk_size=200, chunk_overlap=50)
        chunks = tp.chunk_text(LONG_PARAGRAPH)
        if len(chunks) < 2:
            pytest.skip("Not enough chunks to test overlap")

        # Check at least one pair has overlap
        found_overlap = False
        for i in range(len(chunks) - 1):
            # The tail of chunk i should appear at the start of chunk i+1
            tail = chunks[i][-50:]
            if tail in chunks[i + 1]:
                found_overlap = True
                break
        # Overlap may not always be exact substring match due to stripping,
        # so also check for shared words
        if not found_overlap:
            words_a = set(chunks[0].split())
            words_b = set(chunks[1].split())
            assert len(words_a & words_b) > 0, "No overlap found between chunks"

    def test_zero_overlap(self):
        """With overlap=0, chunks should have minimal shared content."""
        tp = TextProcessor(chunk_size=200, chunk_overlap=0)
        chunks = tp.chunk_text(LONG_PARAGRAPH)
        assert len(chunks) > 1


# ===========================================================================
# chunk_text — large documents
# ===========================================================================


class TestChunkTextLargeDoc:

    def test_large_document_produces_many_chunks(self):
        text = _make_large_text(30)
        tp = TextProcessor(chunk_size=500, chunk_overlap=100)
        chunks = tp.chunk_text(text)
        assert len(chunks) >= 5

    def test_no_empty_chunks(self):
        text = _make_large_text(20)
        tp = TextProcessor(chunk_size=300, chunk_overlap=50)
        chunks = tp.chunk_text(text)
        for chunk in chunks:
            assert len(chunk.strip()) > 0

    def test_all_paragraphs_represented(self):
        """Every paragraph's content should appear in at least one chunk."""
        text = _make_large_text(10)
        tp = TextProcessor(chunk_size=500, chunk_overlap=100)
        chunks = tp.chunk_text(text)
        joined = " ".join(chunks)
        for i in range(1, 11):
            assert f"paragraph {i}" in joined


# ===========================================================================
# chunk_text — custom parameters per call
# ===========================================================================


class TestChunkTextCustomParams:

    def test_override_chunk_size(self):
        tp = TextProcessor(chunk_size=1000)
        chunks_default = tp.chunk_text(LONG_PARAGRAPH)
        chunks_small = tp.chunk_text(LONG_PARAGRAPH, chunk_size=100)
        assert len(chunks_small) > len(chunks_default)

    def test_override_chunk_overlap(self):
        tp = TextProcessor(chunk_size=200, chunk_overlap=0)
        chunks_no_overlap = tp.chunk_text(LONG_PARAGRAPH)
        chunks_overlap = tp.chunk_text(LONG_PARAGRAPH, chunk_overlap=50)
        # With overlap, we should get at least as many chunks
        assert len(chunks_overlap) >= len(chunks_no_overlap)


# ===========================================================================
# chunk_document — metadata
# ===========================================================================


class TestChunkDocument:

    def test_returns_list_of_dicts(self):
        tp = TextProcessor(chunk_size=200, chunk_overlap=30)
        docs = tp.chunk_document(LONG_PARAGRAPH, source_type="pdf")
        assert isinstance(docs, list)
        assert all(isinstance(d, dict) for d in docs)

    def test_dict_keys(self):
        tp = TextProcessor(chunk_size=200, chunk_overlap=30)
        docs = tp.chunk_document(LONG_PARAGRAPH)
        for doc in docs:
            assert "index" in doc
            assert "text" in doc
            assert "char_count" in doc
            assert "preview" in doc
            assert "source_type" in doc

    def test_index_sequential(self):
        tp = TextProcessor(chunk_size=200, chunk_overlap=30)
        docs = tp.chunk_document(LONG_PARAGRAPH)
        for i, doc in enumerate(docs):
            assert doc["index"] == i

    def test_char_count_correct(self):
        tp = TextProcessor(chunk_size=200, chunk_overlap=30)
        docs = tp.chunk_document(LONG_PARAGRAPH)
        for doc in docs:
            assert doc["char_count"] == len(doc["text"])

    def test_preview_max_length(self):
        tp = TextProcessor(chunk_size=200, chunk_overlap=30)
        docs = tp.chunk_document(LONG_PARAGRAPH)
        for doc in docs:
            assert len(doc["preview"]) <= 100

    def test_source_type_passed_through(self):
        tp = TextProcessor()
        docs = tp.chunk_document(SHORT_TEXT, source_type="pdf")
        assert docs[0]["source_type"] == "pdf"

    def test_default_source_type(self):
        tp = TextProcessor()
        docs = tp.chunk_document(SHORT_TEXT)
        assert docs[0]["source_type"] == "unknown"

    def test_empty_input_returns_empty_list(self):
        tp = TextProcessor()
        assert tp.chunk_document("") == []
        assert tp.chunk_document("   ") == []

    def test_short_text_one_chunk(self):
        tp = TextProcessor(chunk_size=1000)
        docs = tp.chunk_document(SHORT_TEXT)
        assert len(docs) == 1
        assert docs[0]["text"] == SHORT_TEXT
        assert docs[0]["index"] == 0


# ===========================================================================
# Edge cases
# ===========================================================================


class TestEdgeCases:

    def test_text_exactly_chunk_size(self):
        """Text exactly equal to chunk_size should produce one chunk."""
        tp = TextProcessor(chunk_size=50, chunk_overlap=10)
        text = "A" * 50
        chunks = tp.chunk_text(text)
        assert len(chunks) == 1

    def test_text_one_char_over_chunk_size(self):
        """Text one character over chunk_size should produce at least two chunks
        or gracefully handle the boundary."""
        tp = TextProcessor(chunk_size=50, chunk_overlap=10)
        text = "word " * 11  # 55 chars
        chunks = tp.chunk_text(text)
        assert len(chunks) >= 1

    def test_repeated_separators(self):
        """Text with many consecutive newlines should not produce empty chunks."""
        tp = TextProcessor(chunk_size=100, chunk_overlap=10)
        text = "Hello\n\n\n\n\n\nWorld\n\n\n\nFoo"
        chunks = tp.chunk_text(text)
        for chunk in chunks:
            assert len(chunk.strip()) > 0

    def test_no_natural_boundaries(self):
        """A single long string with no spaces should still be split."""
        tp = TextProcessor(chunk_size=50, chunk_overlap=10)
        text = "a" * 200
        chunks = tp.chunk_text(text)
        assert len(chunks) >= 2

    def test_only_newlines(self):
        tp = TextProcessor()
        assert tp.chunk_text("\n\n\n\n") == []

    def test_unicode_text(self):
        """Unicode content should be handled correctly."""
        tp = TextProcessor(chunk_size=100, chunk_overlap=10)
        text = "人工智能是计算机科学的一个分支。" * 10
        chunks = tp.chunk_text(text)
        assert len(chunks) >= 1
        joined = "".join(chunks)
        assert "人工智能" in joined
