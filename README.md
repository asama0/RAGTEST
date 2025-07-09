# RAGTEST

This project is a simple Retrieval-Augmented Generation (RAG) demo built with FastAPI. It indexes documents using ChromaDB and Sentence Transformers so that an LLM can answer questions with relevant context from uploaded files.

## Installation

Create a virtual environment (optional) and install the required packages:

```bash
pip install -r rag/requirements.txt
```

## Running the application

Change into the `rag` directory and start the server with Uvicorn:

```bash
cd rag
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000/`. Open this address in a browser to use the simple chat interface.
