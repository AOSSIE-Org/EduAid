"""Text chunking utilities for RAG preparation.

Splits large documents into manageable "Context Blocks" before they reach
the question-generation pipeline.  This prevents OOM errors and pipeline
hangs when processing large PDFs (50+ pages).

The splitting strategy mirrors LangChain's ``RecursiveCharacterTextSplitter``
but is implemented from scratch with **zero external dependencies** — only
Python's standard library is used.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Default separators ordered from coarsest to finest granularity.
DEFAULT_SEPARATORS: List[str] = ["\n\n", "\n", ". ", " ", ""]


class TextProcessor:
    """Recursively splits text into overlapping chunks on natural boundaries.

    Parameters
    ----------
    chunk_size : int
        Target maximum number of characters per chunk (default 1000,
        roughly 200–250 tokens for English text).
    chunk_overlap : int
        Number of characters that adjacent chunks share so that no
        context is lost at boundaries (default 200).
    separators : list[str] | None
        Ordered list of boundary strings to try when splitting.
        Falls back to character-level splitting when none match.
    """

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None,
    ) -> None:
        if chunk_size <= 0:
            raise ValueError("chunk_size must be a positive integer")
        if chunk_overlap < 0:
            raise ValueError("chunk_overlap must be non-negative")
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or DEFAULT_SEPARATORS

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def chunk_text(
        self,
        text: str,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> List[str]:
        """Split *text* into a list of overlapping string chunks.

        Parameters
        ----------
        text : str
            The input document text.
        chunk_size : int | None
            Override the instance-level chunk size for this call.
        chunk_overlap : int | None
            Override the instance-level chunk overlap for this call.

        Returns
        -------
        list[str]
            Ordered list of text chunks.  Each chunk is at most
            *chunk_size* characters long (except when a single
            indivisible token exceeds that limit).
        """
        if not text or not text.strip():
            return []

        size = chunk_size if chunk_size is not None else self.chunk_size
        overlap = chunk_overlap if chunk_overlap is not None else self.chunk_overlap

        return self._recursive_split(text.strip(), self.separators, size, overlap)

    def chunk_document(
        self,
        text: str,
        source_type: str = "unknown",
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> List[Dict]:
        """Split *text* and return chunk metadata dicts.

        Each dict contains:
        - ``index``      – zero-based chunk position
        - ``text``       – the chunk content
        - ``char_count`` – length of the chunk in characters
        - ``preview``    – first 100 characters (for logging / UI)
        - ``source_type``– provenance hint (``"pdf"``, ``"docx"``, …)

        Returns an empty list for blank / whitespace-only input.
        """
        raw_chunks = self.chunk_text(text, chunk_size, chunk_overlap)

        chunks: List[Dict] = []
        for idx, chunk in enumerate(raw_chunks):
            chunks.append(
                {
                    "index": idx,
                    "text": chunk,
                    "char_count": len(chunk),
                    "preview": chunk[:100].replace("\n", " "),
                    "source_type": source_type,
                }
            )

        if chunks:
            logger.info(
                "Chunked %s document: %d chars → %d chunks (size=%d, overlap=%d)",
                source_type,
                len(text),
                len(chunks),
                chunk_size or self.chunk_size,
                chunk_overlap or self.chunk_overlap,
            )

        return chunks

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _recursive_split(
        self,
        text: str,
        separators: List[str],
        chunk_size: int,
        chunk_overlap: int,
    ) -> List[str]:
        """Core recursive splitting algorithm."""

        # Base case: text already fits in one chunk.
        if len(text) <= chunk_size:
            return [text] if text.strip() else []

        # Pick the best separator — the first one that actually appears.
        separator = ""
        remaining_separators = []
        for i, sep in enumerate(separators):
            if sep == "":
                separator = sep
                remaining_separators = []
                break
            if sep in text:
                separator = sep
                remaining_separators = separators[i + 1 :]
                break

        # Split text on the chosen separator.
        if separator:
            pieces = text.split(separator)
        else:
            # Character-level fallback (separator == "").
            pieces = list(text)

        # Merge small pieces back together up to chunk_size.
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_length = 0

        for piece in pieces:
            piece_len = len(piece) + (len(separator) if current_chunk else 0)

            if current_length + piece_len > chunk_size and current_chunk:
                # Flush current chunk.
                merged = separator.join(current_chunk)
                if merged.strip():
                    chunks.append(merged.strip())

                # Keep overlap: walk backwards through pieces to retain
                # approximately `chunk_overlap` characters.
                overlap_chunks: List[str] = []
                overlap_len = 0
                for prev_piece in reversed(current_chunk):
                    if overlap_len + len(prev_piece) > chunk_overlap:
                        break
                    overlap_chunks.insert(0, prev_piece)
                    overlap_len += len(prev_piece) + len(separator)

                current_chunk = overlap_chunks
                current_length = sum(len(p) for p in current_chunk) + max(
                    0, (len(current_chunk) - 1)
                ) * len(separator)

            current_chunk.append(piece)
            current_length += piece_len

        # Flush remaining.
        if current_chunk:
            merged = separator.join(current_chunk)
            if merged.strip():
                chunks.append(merged.strip())

        # If any chunk is still too large and we have finer separators,
        # recurse with the next separator level.
        if remaining_separators:
            final_chunks: List[str] = []
            for chunk in chunks:
                if len(chunk) > chunk_size:
                    final_chunks.extend(
                        self._recursive_split(
                            chunk, remaining_separators, chunk_size, chunk_overlap
                        )
                    )
                else:
                    final_chunks.append(chunk)
            return final_chunks

        return chunks
