import os
import fitz  # PyMuPDF
import docx

def extract_text_from_pdf(file_path):
    return "\n".join([page.get_text() for page in fitz.open(file_path)])

def extract_text_from_txt(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def extract_text_from_docx(file_path):
    return "\n".join([p.text for p in docx.Document(file_path).paragraphs])

def extract_text_from_md(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def extract_text_from_file(file_path):
    ext = os.path.splitext(file_path)[-1].lower()
    if ext == ".pdf": return extract_text_from_pdf(file_path)
    if ext == ".txt": return extract_text_from_txt(file_path)
    if ext == ".docx": return extract_text_from_docx(file_path)
    if ext == ".md": return extract_text_from_md(file_path)
    raise ValueError(f"Unsupported file: {file_path}")

def chunk_text(text, size=500, overlap=100):
    chunks, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end])
        start += size - overlap
    return chunks