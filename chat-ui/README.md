# NERV Chat UI for Local LLMs

A dark-themed chat interface inspired by NERV (from Evangelion) for interacting with locally-hosted language models through Ollama.

## Features

- 🖥️ NERV-themed dark interface with CRT and terminal effects
- 🤖 Connects to Ollama API to interact with local LLMs
- 💬 Full conversation history with save/load functionality
- ⚙️ Adjustable parameters (temperature, top-p, max tokens)
- 📱 Responsive design that works on mobile and desktop
- 🔄 Completely offline - works without internet once model is downloaded

## Setup

1. Make sure you have [Ollama](https://ollama.ai/) installed and running
2. Ensure you've pulled a model (e.g., `ollama pull qwen:7b`)
3. Open `index.html` in your browser

## Configuration

You can adjust the model parameters in the side panel:

- **Temperature**: Controls randomness (0.0 to 1.0)
- **Top-P**: Controls diversity (0.0 to 1.0)
- **Max Tokens**: Controls maximum response length

## Usage

1. Type your query in the input box at the bottom
2. Press Enter or click the Send button
3. View the model's response in the chat area
4. Save interesting conversations using the Save button
5. Load past conversations from the history panel

## Models

This interface is configured to work with the Qwen-7B model by default, but you can modify the JavaScript to use any model available in your Ollama installation.

## Technical Details

- Pure HTML/CSS/JavaScript - no frameworks or dependencies
- Connects to the Ollama API running on localhost:11434
- Saves conversation history to browser localStorage 