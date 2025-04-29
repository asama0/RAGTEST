chat_history = []

def add_user_message(text):
    chat_history.append({"role": "user", "content": text})

def add_ai_message(text):
    chat_history.append({"role": "assistant", "content": text})

def get_recent_history(limit=10):
    return chat_history[-limit:]