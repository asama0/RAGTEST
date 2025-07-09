import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
import types
sys.modules["fitz"] = types.ModuleType("fitz")
sys.modules["docx"] = types.ModuleType("docx")

from rag.app.document_loader import chunk_text


def test_chunk_text_overlap_and_final_chunk_size():
    text = ''.join(chr(65 + (i % 26)) for i in range(1200))
    size = 500
    overlap = 100

    chunks = chunk_text(text, size=size, overlap=overlap)

    assert len(chunks) == 3

    # Check chunk sizes
    assert len(chunks[0]) == size
    assert len(chunks[1]) == size
    assert len(chunks[2]) == len(text) - (size - overlap) * 2
    assert len(chunks[2]) <= size

    # Check overlaps
    for i in range(len(chunks) - 1):
        assert chunks[i][-overlap:] == chunks[i + 1][:overlap]
