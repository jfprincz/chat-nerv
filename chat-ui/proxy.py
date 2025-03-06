from flask import Flask, request, jsonify, Response, stream_with_context
import requests
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

OLLAMA_API_URL = "http://localhost:11434/api/chat"

# Global variable to store the latest streaming request data
streaming_request_data = None

@app.route('/proxy/chat', methods=['POST'])
def proxy_chat():
    """
    Proxy requests to the Ollama API and add CORS headers
    """
    global streaming_request_data
    
    try:
        # Get JSON data from the request
        data = request.json
        
        # Check if streaming is requested
        if data.get('stream', False):
            # Store the request data for the SSE endpoint
            streaming_request_data = data
            # Return success immediately to trigger the EventSource connection
            return jsonify({"status": "streaming_started"})
        else:
            # Non-streaming request
            response = requests.post(OLLAMA_API_URL, json=data)
            return jsonify(response.json())
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/proxy/stream', methods=['GET'])
def stream_response():
    """
    SSE endpoint for streaming responses
    """
    global streaming_request_data
    
    try:
        if not streaming_request_data:
            return jsonify({"error": "No streaming request data available"}), 400
            
        # Use the stored request data
        data = streaming_request_data
        # Reset for next request
        streaming_request_data = None
        
        def generate():
            # Stream the response
            response = requests.post(OLLAMA_API_URL, json=data, stream=True)
            
            for line in response.iter_lines():
                if line:
                    yield f"data: {line.decode('utf-8')}\n\n"
            
            # End of stream
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        return Response(stream_with_context(generate()), 
                        content_type='text/event-stream')
                        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve static files
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    app.static_folder = '.'  # Set the static folder to the current directory
    app.run(host='0.0.0.0', port=8080, debug=True) 