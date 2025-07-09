from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .memory import add_user_message, add_ai_message, get_recent_history
from .llm_client import send_to_llm
from .rag import query_documents, load_all_files_from_folder, add_file_to_vector_store

app = FastAPI()
load_all_files_from_folder("./documents")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/chat.html")

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_message = data.get("message")
    if not user_message:
        return {"error": "No message provided."}

    context = query_documents(user_message, top_k=3)
    full_prompt = "Use the following context to answer the question:\n\n" + "\n\n".join(context) + f"\n\nQuestion: {user_message}"

    add_user_message(full_prompt)
    history = get_recent_history()
    ai_response = send_to_llm(history)
    add_ai_message(ai_response)

    return {"reply": ai_response}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = f"./documents/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    add_file_to_vector_store(file_path)    return {"message": "File uploaded and indexed."}
