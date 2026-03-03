from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from .memory import add_user_message, add_ai_message, get_recent_history
from .llm_client import send_to_llm, get_available_providers
from .rag import query_documents, load_all_files_from_folder, add_file_to_vector_store

app = FastAPI()
load_all_files_from_folder("./documents")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/chat.html")

@app.post("/chat")
async def chat_endpoint(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message")
        llm_provider = data.get("llm_provider", "deepseek")

        if not user_message:
            return JSONResponse(
                status_code=400,
                content={"error": "No message provided."}
            )

        # Query documents for relevant context
        context = query_documents(user_message, top_k=3)
        full_prompt = "Use the following context to answer the question:\n\n" + "\n\n".join(context) + f"\n\nQuestion: {user_message}"

        # Add to conversation history
        add_user_message(full_prompt)
        history = get_recent_history()

        # Send to selected LLM provider
        ai_response = send_to_llm(history, provider=llm_provider)
        add_ai_message(ai_response)

        return {"reply": ai_response}

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file extension
        allowed_extensions = ['.pdf', '.docx', '.txt', '.md']
        file_extension = '.' + file.filename.split('.')[-1].lower()

        if file_extension not in allowed_extensions:
            return JSONResponse(
                status_code=400,
                content={"error": f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"}
            )

        # Save file
        file_path = f"./documents/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Add to vector store
        add_file_to_vector_store(file_path)

        return {"message": "File uploaded and indexed successfully."}

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Upload failed: {str(e)}"}
        )

@app.get("/providers")
async def get_providers():
    """
    Get list of available LLM providers (those with API keys configured)
    """
    available = get_available_providers()
    return {
        "available": available,
        "default": "deepseek" if "deepseek" in available else (available[0] if available else None)
    }
