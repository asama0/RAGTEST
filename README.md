# RAGTEST

A modern Retrieval-Augmented Generation (RAG) application with a beautiful chat interface. Built with FastAPI, ChromaDB, and support for multiple LLM providers.

## Features

- **Beautiful Modern Chat UI** - Responsive design with gradient themes and smooth animations
- **Multiple LLM Support** - Switch between DeepSeek, OpenAI GPT-4, Claude 3.5 Sonnet, and Groq Llama
- **File Upload** - Drag & drop or click to upload PDF, DOCX, TXT, and MD files
- **Real-time Document Indexing** - Uploaded files are automatically processed and indexed
- **Smart Context Retrieval** - Uses vector embeddings to find relevant document chunks
- **Conversation Memory** - Maintains chat history for contextual responses

## Installation

1. Create a virtual environment (optional but recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the required packages:

```bash
pip install -r rag/requirements.txt
```

3. Set up your API keys:

Copy the `.env.example` file to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add at least one API key:

```bash
# Choose one or more providers:
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

## Running the Application

1. Change into the `rag` directory:

```bash
cd rag
```

2. Start the server with Uvicorn:

```bash
uvicorn app.main:app --reload
```

3. Open your browser and navigate to:

```
http://127.0.0.1:8000/
```

## Usage

### Chat Interface

- **Type your message** in the input field and press Enter or click Send
- **Switch LLMs** using the dropdown in the top-right corner
- **Upload files** by dragging and dropping into the upload area or clicking to browse
- The assistant will answer questions based on the uploaded documents

### Supported File Types

- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Text files (`.txt`)
- Markdown (`.md`)

### API Endpoints

The application provides the following REST API endpoints:

- `GET /` - Serves the chat interface
- `POST /chat` - Send a message and get a response
  - Body: `{"message": "your question", "llm_provider": "deepseek"}`
- `POST /upload` - Upload a file for indexing
  - Form data with file field
- `GET /providers` - Get list of available LLM providers

## Architecture

### Frontend

- Modern responsive HTML/CSS design
- Vanilla JavaScript for interactions
- Drag-and-drop file upload
- Real-time typing indicators

### Backend

- **FastAPI** - Web framework
- **ChromaDB** - Vector database for embeddings
- **Sentence Transformers** - Text embeddings (all-MiniLM-L6-v2)
- **PyMuPDF** - PDF text extraction
- **python-docx** - DOCX parsing

### LLM Providers

The system supports multiple LLM providers with a unified interface:

- **DeepSeek** - Fast and cost-effective
- **OpenAI GPT-4** - Advanced reasoning
- **Anthropic Claude 3.5 Sonnet** - Long context and nuanced responses
- **Groq Llama** - Ultra-fast inference

## Project Structure

```
RAGTEST/
├── rag/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── llm_client.py        # Multi-LLM provider client
│   │   ├── rag.py               # Vector store & retrieval
│   │   ├── document_loader.py   # File parsing & chunking
│   │   └── memory.py            # Conversation history
│   ├── static/
│   │   ├── chat.html            # Chat interface
│   │   └── chat.js              # Frontend JavaScript
│   ├── documents/               # Uploaded files stored here
│   └── requirements.txt         # Python dependencies
├── tests/
│   └── test_document_loader.py  # Unit tests
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Development

### Running Tests

```bash
pytest tests/
```

### Adding a New LLM Provider

Edit `rag/app/llm_client.py` and add your provider to the `LLM_CONFIGS` dictionary with the appropriate API configuration.

## License

This is a demo project for educational purposes.
