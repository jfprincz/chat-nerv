import requests
import json
import sys

def chat_with_model(prompt, model="qwen:7b"):
    """Send a chat message to the Ollama API and get a response."""
    url = "http://localhost:11434/api/chat"
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "stream": False
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        return response.json()["message"]["content"]
    else:
        return f"Error: {response.status_code} - {response.text}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    else:
        prompt = input("Enter your question: ")
    
    response = chat_with_model(prompt)
    print("\nResponse:")
    print(response) 