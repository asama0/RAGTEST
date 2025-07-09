import os
from .document_loader import extract_text_from_file, chunk_text
from sentence_transformers import SentenceTransformer
import chromadb

chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="knowledge_base")

embedder = SentenceTransformer("all-MiniLM-L6-v2")

def add_document(doc_id: str, content: str):
    embedding = embedder.encode(content)
    collection.add(
        documents=[content],
        embeddings=[embedding.tolist()],
        ids=[doc_id]
    )

def query_documents(query: str, top_k: int = 3):
    query_embedding = embedder.encode(query)
    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=top_k
    )
    return results['documents'][0] if results['documents'] else []

def add_file_to_vector_store(file_path: str):
    try:
        text = extract_text_from_file(file_path)
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            add_document(f"{file_path}_chunk_{i}", chunk)
    except ValueError as e:
        print(e)

def load_all_files_from_folder(folder_path: str):
    for filename in os.listdir(folder_path):
        if filename.lower().endswith((".pdf", ".txt", ".docx", ".md")):
            full_path = os.path.join(folder_path, filename)
            print(f"Loading file: {full_path}")
            add_file_to_vector_store(full_path)