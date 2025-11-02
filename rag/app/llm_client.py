import os
import requests

# API Keys from environment variables
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# LLM Configuration
LLM_CONFIGS = {
    "deepseek": {
        "url": "https://api.deepseek.com/v1/chat/completions",
        "api_key": DEEPSEEK_API_KEY,
        "model": "deepseek-chat",
        "headers": lambda key: {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    },
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
        "api_key": OPENAI_API_KEY,
        "model": "gpt-4-turbo-preview",
        "headers": lambda key: {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1/messages",
        "api_key": ANTHROPIC_API_KEY,
        "model": "claude-3-5-sonnet-20241022",
        "headers": lambda key: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "api_key": GROQ_API_KEY,
        "model": "llama-3.1-70b-versatile",
        "headers": lambda key: {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    }
}


def send_to_llm(messages, provider="deepseek"):
    """
    Send messages to the specified LLM provider.

    Args:
        messages: List of message dictionaries with 'role' and 'content'
        provider: LLM provider name (deepseek, openai, anthropic, groq)

    Returns:
        str: The LLM response content
    """
    if provider not in LLM_CONFIGS:
        raise ValueError(f"Unsupported LLM provider: {provider}. Supported: {list(LLM_CONFIGS.keys())}")

    config = LLM_CONFIGS[provider]

    # Check if API key is configured
    if not config["api_key"]:
        raise Exception(f"API key not configured for {provider}. Please set the appropriate environment variable.")

    # Handle Anthropic's different API format
    if provider == "anthropic":
        return _send_to_anthropic(messages, config)
    else:
        return _send_to_openai_compatible(messages, config)


def _send_to_openai_compatible(messages, config):
    """
    Send request to OpenAI-compatible APIs (OpenAI, DeepSeek, Groq)
    """
    headers = config["headers"](config["api_key"])
    payload = {
        "model": config["model"],
        "messages": messages,
        "temperature": 0.7
    }

    try:
        response = requests.post(config["url"], headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            error_msg = response.text
            try:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", error_msg)
            except:
                pass
            raise Exception(f"LLM API error ({response.status_code}): {error_msg}")
    except requests.exceptions.Timeout:
        raise Exception("LLM request timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"LLM request failed: {str(e)}")


def _send_to_anthropic(messages, config):
    """
    Send request to Anthropic Claude API (different format)
    """
    headers = config["headers"](config["api_key"])

    # Convert OpenAI-style messages to Anthropic format
    # Anthropic requires system message separate and doesn't support 'system' role in messages
    system_message = ""
    anthropic_messages = []

    for msg in messages:
        if msg["role"] == "system":
            system_message = msg["content"]
        else:
            anthropic_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

    payload = {
        "model": config["model"],
        "max_tokens": 4096,
        "messages": anthropic_messages
    }

    if system_message:
        payload["system"] = system_message

    try:
        response = requests.post(config["url"], headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            return response.json()["content"][0]["text"]
        else:
            error_msg = response.text
            try:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", error_msg)
            except:
                pass
            raise Exception(f"Anthropic API error ({response.status_code}): {error_msg}")
    except requests.exceptions.Timeout:
        raise Exception("Anthropic request timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Anthropic request failed: {str(e)}")


def get_available_providers():
    """
    Get list of providers that have API keys configured.
    """
    available = []
    for provider, config in LLM_CONFIGS.items():
        if config["api_key"]:
            available.append(provider)
    return available
