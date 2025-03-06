// Chat UI for Local LLM
// Handles communication with the Ollama API

// Configuration
const config = {
    apiUrl: '/proxy/chat',
    defaultModel: 'qwen2.5-coder:7b',
    maxHistoryItems: 10,
    maxTokens: 500,
    temperature: 0.7,
    topP: 0.9,
    streamingEnabled: true  // Always true, no toggle needed
};

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const historyContainer = document.getElementById('historyContainer');
const clearChatButton = document.getElementById('clearChat');
const saveConversationButton = document.getElementById('saveConversation');
const processingStatus = document.getElementById('processingStatus');
const temperatureSlider = document.getElementById('temperature');
const topPSlider = document.getElementById('topP');
const maxTokensSlider = document.getElementById('maxTokens');
const temperatureValue = document.getElementById('temperatureValue');
const topPValue = document.getElementById('topPValue');
const maxTokensValue = document.getElementById('maxTokensValue');
const systemPrompt = document.getElementById('systemPrompt');
const systemPromptPanel = document.getElementById('systemPromptPanel');
const systemPromptBtn = document.getElementById('systemPromptBtn');
const closeSystemPrompt = document.getElementById('closeSystemPrompt');
const saveSystemPrompt = document.getElementById('saveSystemPrompt');
const bootSequence = document.getElementById('bootSequence');
const bootText = document.getElementById('bootText');

// State
let conversationHistory = [];
let conversationId = generateId();
let isProcessing = false;
let hasSystemPrompt = false;
let tokenCount = 0;
let responseStartTime = 0;
let tokenRateInterval = null;
let currentTokenSpeed = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Start boot sequence
    startBootSequence();
    
    // Set initial value displays for sliders
    temperatureValue.textContent = config.temperature.toFixed(1);
    topPValue.textContent = config.topP.toFixed(1);
    maxTokensValue.textContent = config.maxTokens;
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', handleKeyDown);
    userInput.addEventListener('input', autoResizeTextarea);
    clearChatButton.addEventListener('click', clearConversation);
    saveConversationButton.addEventListener('click', saveConversation);
    systemPromptBtn.addEventListener('click', toggleSystemPromptPanel);
    closeSystemPrompt.addEventListener('click', toggleSystemPromptPanel);
    saveSystemPrompt.addEventListener('click', saveSystemPromptConfig);
    temperatureSlider.addEventListener('input', updateTemperature);
    topPSlider.addEventListener('input', updateTopP);
    maxTokensSlider.addEventListener('input', updateMaxTokens);
    
    // Load any saved system prompt
    loadSystemPrompt();
    
    // Load saved conversations
    loadSavedConversations();
    
    // Set streaming toggle state from config
    if (streamingToggle) {
        streamingToggle.checked = config.streamingEnabled;
    }
});

// Boot Sequence
function startBootSequence() {
    const terminalContainer = document.querySelector('.terminal-container');
    const bootLogoTriangle = document.getElementById('bootLogoTriangle');
    const bootLogoText = document.getElementById('bootLogoText');
    const bootText = document.getElementById('bootText');
    const bootProgressBar = document.getElementById('bootProgressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const headerBar = document.querySelector('.header-bar');
    const sidePanel = document.querySelector('.side-panel');
    const chatContainer = document.querySelector('.chat-container');
    const footerInput = document.querySelector('.footer-input');
    
    // Secret skip boot sequence functionality
    let lastSpaceTime = 0;
    let bootSkipped = false;
    
    // Listen for space bar double press
    document.addEventListener('keydown', function spaceSkip(e) {
        if (bootSkipped) return;
        
        if (e.code === 'Space') {
            const now = new Date().getTime();
            if (now - lastSpaceTime < 500) { // Double space within 500ms
                skipBoot();
                document.removeEventListener('keydown', spaceSkip);
            }
            lastSpaceTime = now;
        }
    });
    
    // Listen for double click on logo
    bootLogoTriangle.addEventListener('dblclick', function(e) {
        if (!bootSkipped) {
            skipBoot();
        }
    });
    
    // Function to skip boot sequence
    function skipBoot() {
        if (bootSkipped) return;
        bootSkipped = true;
        
        // Clear any pending timers
        clearTimeout(bootLogoShowTimeout);
        
        // Clear all typing intervals
        typeIntervals.forEach(interval => clearTimeout(interval));
        typeIntervals = [];
        
        // Skip to fully loaded UI
        bootSequence.style.opacity = "0";
        bootSequence.style.transition = "opacity 0.3s ease-in-out";
        
        setTimeout(() => {
            bootSequence.style.display = "none";
            headerBar.style.opacity = "1";
            sidePanel.style.opacity = "1";
            chatContainer.style.opacity = "1";
            footerInput.style.opacity = "1";
            
            // Start terminal immediately
            simulateTerminalStartup();
        }, 300);
    }
    
    // Retro boot sequence lines
    const bootLines = [
        "NERV CENTRAL DOGMA TERMINAL ACCESS",
        "VERSION 2.0.15-ALPHA",
        "COPYRIGHT 2015-2025 NERV CORPORATION",
        "",
        "INITIALIZING HARDWARE...",
        "CPU: INTEL MAGI-CORE i9 DETECTED",
        "MEMORY: 32GB QUANTUM RAM DETECTED",
        "STORAGE: 2TB NEURAL STORAGE DETECTED",
        "",
        "LOADING CORE MODULES:",
        "MODULE: KERNEL...........OK",
        "MODULE: NETWORK..........OK",
        "MODULE: SECURITY.........OK",
        "",
        "ESTABLISHING CONNECTION TO LOCAL MODEL...",
        "MODEL: QWEN2.5-CODER...........DETECTED",
        "LOADING MODEL PARAMETERS...",
        "",
        "PREPARING USER INTERFACE...",
        "INITIALIZING TERMINAL..."
    ];
    
    // Retro style - display logo in stages with a CRT "blink" effect
    let bootLogoShowTimeout;
    bootLogoShowTimeout = setTimeout(() => {
        // Show logo triangle first
        bootLogoTriangle.style.display = "block";
        
        // Brief "static" flicker
        setTimeout(() => {
            bootLogoTriangle.style.opacity = "0.1";
            setTimeout(() => {
                bootLogoTriangle.style.opacity = "1";
                
                // Then show text after a delay
                setTimeout(() => {
                    bootLogoText.style.display = "block";
                }, 300);
            }, 100);
        }, 100);
    }, 600);
    
    // Start typing boot text with classic terminal effect (character by character)
    let allText = "";
    let lineIndex = 0;
    let charIndex = 0;
    let typeIntervals = []; // Array to store all timeout IDs
    
    function typeNextChar() {
        if (bootSkipped) return;
        
        if (lineIndex < bootLines.length) {
            const currentLine = bootLines[lineIndex];
            
            if (charIndex < currentLine.length) {
                // Add next character
                allText += currentLine[charIndex];
                bootText.innerHTML = allText + '<span class="cursor">_</span>';
                bootText.scrollTop = bootText.scrollHeight;
                
                // Determine typing speed (faster for spaces, slower for dots)
                let typeSpeed = 10; // Base speed
                if (currentLine[charIndex] === '.') {
                    typeSpeed = 80; // Slower for dots
                } else if (currentLine[charIndex] === ' ') {
                    typeSpeed = 5; // Faster for spaces
                }
                
                charIndex++;
                const interval = setTimeout(typeNextChar, typeSpeed);
                typeIntervals.push(interval);
            } else {
                // Line complete
                allText += "<br>";
                bootText.innerHTML = allText + '<span class="cursor">_</span>';
                bootText.scrollTop = bootText.scrollHeight;
                
                // Next line
                lineIndex++;
                charIndex = 0;
                
                // Add delay between lines
                const lineDelay = bootLines[lineIndex - 1] === "" ? 300 : 100;
                const interval = setTimeout(typeNextChar, lineDelay);
                typeIntervals.push(interval);
                
                // Update progress bar based on how far through the boot text we are
                const progress = Math.min(100, Math.round((lineIndex / bootLines.length) * 100));
                bootProgressBar.style.width = progress + "%";
                progressPercentage.textContent = progress + "%";
            }
        } else {
            // Boot text complete - now load the UI elements in sequence
            bootText.innerHTML = allText; // Remove cursor
            loadUIElements();
        }
    }
    
    // Start typing after initial delay
    setTimeout(typeNextChar, 1200);
    
    // Function to load UI elements in sequence
    function loadUIElements() {
        setTimeout(() => {
            // First fade out boot sequence
            bootSequence.style.opacity = "0";
            bootSequence.style.transition = "opacity 0.8s ease-in-out";
            
            setTimeout(() => {
                // Hide boot sequence
                bootSequence.style.display = "none";
                
                // Load UI elements in sequence
                headerBar.style.opacity = "1";
                
                // Wait then load side panel
                setTimeout(() => {
                    sidePanel.style.opacity = "1";
                    
                    // Wait then load chat container
                    setTimeout(() => {
                        chatContainer.style.opacity = "1";
                        
                        // Wait then load footer
                        setTimeout(() => {
                            footerInput.style.opacity = "1";
                            
                            // Finally start terminal messages
                            setTimeout(() => {
                                simulateTerminalStartup();
                            }, 400);
                        }, 300);
                    }, 300);
                }, 300);
            }, 800);
        }, 1000);
    }
}

// Terminal Startup Animation
function simulateTerminalStartup() {
    // Create text content with proper formatting
    const currentTimestamp = getCurrentTimestamp();
    
    const startupLines = [
        "INITIALIZING MAGI SYSTEM...",
        `<span class="content-timestamp">${currentTimestamp}</span>`, // Using span with timestamp class
        "CONNECTING TO LOCAL MODEL...",
        `<span class="content-timestamp">${currentTimestamp}</span>`, // Using span with timestamp class
        "SYSTEM READY. MODEL QWEN2.5-CODER OPERATIONAL."
    ];
        
    // Create system message container
    const messageElement = document.createElement("div");
    messageElement.className = "message system-message";
    
    const timestampElement = document.createElement("div");
    timestampElement.className = "message-timestamp";
    timestampElement.textContent = currentTimestamp;
    
    const contentElement = document.createElement("div");
    contentElement.className = "message-content";
    contentElement.innerHTML = "";
    
    messageElement.appendChild(timestampElement);
    messageElement.appendChild(contentElement);
    
    messagesContainer.appendChild(messageElement);
    
    // Typing effect
    let currentText = "";
    let currentLine = 0;
    let charIndex = 0;
    const typingSpeed = 20; // ms per character
    
    function typeChar() {
        if (currentLine < startupLines.length) {
            const currentLineContent = startupLines[currentLine];
            
            // If current line is HTML (timestamp), add it all at once
            if (currentLineContent.startsWith('<span class="content-timestamp">')) {
                currentText += currentLineContent + "<br>";
                currentLine++;
                contentElement.innerHTML = currentText;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                setTimeout(typeChar, typingSpeed * 3);
                return;
            }
            
            // If we've finished typing the current line
            if (charIndex >= currentLineContent.length) {
                currentText += "<br>";
                currentLine++;
                charIndex = 0;
                contentElement.innerHTML = currentText;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                if (currentLine < startupLines.length) {
                    setTimeout(typeChar, typingSpeed * 3); // Pause between lines
                }
                return;
            }
            
            // Type the next character
            currentText += currentLineContent[charIndex];
            contentElement.innerHTML = currentText;
            charIndex++;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            setTimeout(typeChar, typingSpeed);
        }
    }
    
    // Start typing effect
    typeChar();
}

// Handle message sending
function sendMessage() {
    const message = userInput.value.trim();
    
    if (message && !isProcessing) {
        // Show user message
        addUserMessage(message);
        
        // Clear input
        userInput.value = '';
        autoResizeTextarea();
        
        // Send to API
        sendToAPI(message);
    }
}

// Handle keydown events
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight) + 'px';
}

// Send message to Ollama API
async function sendToAPI(message) {
    try {
        setProcessingState(true);
        
        // Add to conversation history
        conversationHistory.push({ role: 'user', content: message });
        
        // Prepare request
        const requestBody = {
            model: config.defaultModel,
            messages: conversationHistory,
            options: {
                temperature: parseFloat(temperatureSlider.value),
                top_p: parseFloat(topPSlider.value),
                max_tokens: parseInt(maxTokensSlider.value)
            },
            stream: config.streamingEnabled
        };

        // Add system prompt if available
        if (systemPrompt.value.trim()) {
            requestBody.system = systemPrompt.value.trim();
        }
        
        if (config.streamingEnabled) {
            // Create placeholder for bot response
            const responseId = addBotMessagePlaceholder();
            
            // Start token tracking
            startTokenTracking();
            
            // First, make the POST request to initiate streaming
            fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Now set up EventSource for streaming data
                const eventSource = new EventSource('/proxy/stream');
                
                let fullContent = '';
                
                // Handle incoming message chunks
                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        if (data.message) {
                            const chunk = data.message.content || '';
                            fullContent += chunk;
                            
                            // Count tokens in the new chunk
                            if (chunk.length > 0) {
                                tokenCount += estimateTokenCount(chunk);
                            }
                            
                            // Update the placeholder with the current content
                            updateBotMessageContent(responseId, fullContent);
                        }
                        
                        // End of the stream
                        if (data.done) {
                            eventSource.close();
                            finalizeBotMessage(responseId);
                            
                            // Stop token tracking
                            stopTokenTracking();
                            
                            // Add to conversation history
                            conversationHistory.push({ role: 'assistant', content: fullContent });
                            
                            // Update history list
                            updateConversationHistoryUI();
                            
                            setProcessingState(false);
                        }
                    } catch (error) {
                        console.error('Error parsing streaming data:', error);
                    }
                };
                
                // Handle errors
                eventSource.onerror = (error) => {
                    console.error('SSE Error:', error);
                    eventSource.close();
                    stopTokenTracking();
                    updateBotMessageContent(responseId, 'Error receiving streaming response. Check console for details.');
                    setProcessingState(false);
                };
            })
            .catch(error => {
                console.error('Error initiating streaming:', error);
                stopTokenTracking();
                finalizeBotMessage(responseId);
                updateBotMessageContent(responseId, `Error: ${error.message}`);
                setProcessingState(false);
            });
        } else {
            // Non-streaming approach
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            const botResponse = data.message.content;
            
            // Calculate tokens for non-streaming
            const tokens = estimateTokenCount(botResponse);
            
            // Add bot response
            addBotMessage(botResponse);
            
            // Add to conversation history
            conversationHistory.push({ role: 'assistant', content: botResponse });
            
            // Update history list
            updateConversationHistoryUI();
            
            setProcessingState(false);
        }
    } catch (error) {
        console.error('Error:', error);
        stopTokenTracking();
        addSystemMessage(`ERROR: ${error.message}. Check console for details.`);
        setProcessingState(false);
    }
}

// Add user message to UI
function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = getCurrentTimestamp();
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    messageElement.appendChild(timestamp);
    messageElement.appendChild(content);
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Add bot message to UI
function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot-message';
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = getCurrentTimestamp();
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Apply formatting for code blocks and line breaks
    message = formatMessage(message);
    content.innerHTML = message;
    
    messageElement.appendChild(timestamp);
    messageElement.appendChild(content);
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Add system message to UI
function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = getCurrentTimestamp();
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    messageElement.appendChild(timestamp);
    messageElement.appendChild(content);
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Format message with code blocks and line breaks
function formatMessage(message) {
    // Replace line breaks with <br>
    message = message.replace(/\n/g, '<br>');
    
    // Replace code blocks with styled pre tags
    message = message.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre class="code-block">${code}</pre>`;
    });
    
    return message;
}

// Get current timestamp
function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}

// Scroll messages container to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Set processing state
function setProcessingState(processing) {
    isProcessing = processing;
    
    if (processing) {
        sendButton.disabled = true;
        processingStatus.textContent = 'PROCESSING';
        processingStatus.classList.add('analyzing');
        addThinkingIndicator();
    } else {
        sendButton.disabled = false;
        processingStatus.textContent = 'IDLE';
        processingStatus.classList.remove('analyzing');
        removeThinkingIndicator();
    }
}

// Add thinking indicator
function addThinkingIndicator() {
    if (!document.querySelector('.thinking-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'message bot-message thinking-indicator';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = getCurrentTimestamp();
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = 'THINKING<span class="loading"></span>';
        
        indicator.appendChild(timestamp);
        indicator.appendChild(content);
        
        messagesContainer.appendChild(indicator);
        scrollToBottom();
    }
}

// Remove thinking indicator
function removeThinkingIndicator() {
    const indicator = document.querySelector('.thinking-indicator');
    if (indicator) {
        messagesContainer.removeChild(indicator);
    }
}

// Update Temperature Configuration
function updateTemperature() {
    config.temperature = parseFloat(temperatureSlider.value);
    temperatureValue.textContent = config.temperature.toFixed(1);
}

// Update Top-P Configuration
function updateTopP() {
    config.topP = parseFloat(topPSlider.value);
    topPValue.textContent = config.topP.toFixed(1);
}

// Update Max Tokens Configuration
function updateMaxTokens() {
    config.maxTokens = parseInt(maxTokensSlider.value);
    maxTokensValue.textContent = config.maxTokens;
}

// Clear conversation
function clearConversation() {
    // Show confirmation message
    addSystemMessage("CLEARING CONVERSATION...");
    
    // Clear messages container with animation
    setTimeout(() => {
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        
        // Reset conversation
        conversationHistory = [];
        conversationId = generateId();
        
        // Show reset message
        addSystemMessage("CONVERSATION CLEARED. NEURAL CONNECTION RESET.");
    }, 500);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Save conversation
function saveConversation() {
    if (conversationHistory.length === 0) {
        addSystemMessage("NO CONVERSATION TO SAVE.");
        return;
    }
    
    // Get conversation data
    const conversation = {
        id: conversationId,
        timestamp: getCurrentTimestamp(),
        title: conversationHistory[0].content.substring(0, 30) + '...',
        messages: conversationHistory
    };
    
    // Get saved conversations
    let savedConversations = localStorage.getItem('nervChatHistory');
    savedConversations = savedConversations ? JSON.parse(savedConversations) : [];
    
    // Add new conversation
    savedConversations.push(conversation);
    
    // Keep only recent conversations
    if (savedConversations.length > config.maxHistoryItems) {
        savedConversations = savedConversations.slice(-config.maxHistoryItems);
    }
    
    // Save to localStorage
    localStorage.setItem('nervChatHistory', JSON.stringify(savedConversations));
    
    // Update UI
    addSystemMessage("CONVERSATION SAVED TO LOCAL STORAGE.");
    loadSavedConversations();
}

// Load saved conversations
function loadSavedConversations() {
    // Clear history container
    historyContainer.innerHTML = '';
    
    // Get saved conversations
    let savedConversations = localStorage.getItem('nervChatHistory');
    savedConversations = savedConversations ? JSON.parse(savedConversations) : [];
    
    if (savedConversations.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'history-empty';
        emptyMessage.textContent = 'NO SAVED CONVERSATIONS';
        historyContainer.appendChild(emptyMessage);
        return;
    }
    
    // Add to history container
    savedConversations.forEach(conversation => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = `${conversation.timestamp} - ${conversation.title}`;
        historyItem.dataset.id = conversation.id;
        
        historyItem.addEventListener('click', () => loadConversation(conversation));
        
        historyContainer.appendChild(historyItem);
    });
}

// Load conversation
function loadConversation(conversation) {
    // Confirm before loading
    addSystemMessage("LOADING SAVED CONVERSATION...");
    
    // Clear current conversation
    while (messagesContainer.firstChild) {
        messagesContainer.removeChild(messagesContainer.firstChild);
    }
    
    // Set conversation data
    conversationId = conversation.id;
    conversationHistory = conversation.messages;
    
    // Load messages
    conversation.messages.forEach(message => {
        if (message.role === 'user') {
            addUserMessage(message.content);
        } else if (message.role === 'assistant') {
            addBotMessage(message.content);
        }
    });
    
    // Show loaded message
    addSystemMessage("CONVERSATION LOADED FROM ARCHIVE.");
}

// Update conversation history UI
function updateConversationHistoryUI() {
    // Only update if there are messages
    if (conversationHistory.length > 0) {
        // Get first user message for title
        const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
        
        if (firstUserMessage) {
            const title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
            
            // Check if history item exists
            let historyItem = document.querySelector(`.history-item[data-id="${conversationId}"]`);
            
            if (!historyItem) {
                // Create new history item
                historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.dataset.id = conversationId;
                
                historyItem.addEventListener('click', () => {
                    loadConversation({
                        id: conversationId,
                        timestamp: getCurrentTimestamp(),
                        title: title,
                        messages: conversationHistory
                    });
                });
                
                // Add to container
                historyContainer.appendChild(historyItem);
            }
            
            // Update content
            historyItem.textContent = `${getCurrentTimestamp()} - ${title}`;
        }
    }
}

// Add placeholder for streaming response
function addBotMessagePlaceholder() {
    const id = 'msg-' + Date.now();
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot-message typing-message';
    messageElement.id = id;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = getCurrentTimestamp();
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = '<span class="typing-indicator">■</span>';
    
    messageElement.appendChild(timestamp);
    messageElement.appendChild(content);
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
    
    return id;
}

// Update streaming message content
function updateBotMessageContent(id, content) {
    const messageElement = document.getElementById(id);
    if (messageElement) {
        const contentElement = messageElement.querySelector('.message-content');
        
        // Format the message
        const formattedContent = formatMessage(content);
        
        // Update content
        contentElement.innerHTML = formattedContent + '<span class="typing-indicator">■</span>';
        
        // Auto-scroll
        scrollToBottom();
    }
}

// Finalize a streamed message
function finalizeBotMessage(id) {
    const messageElement = document.getElementById(id);
    if (messageElement) {
        // Remove typing indicator
        messageElement.classList.remove('typing-message');
        
        const contentElement = messageElement.querySelector('.message-content');
        const currentContent = contentElement.innerHTML;
        
        // Remove the typing indicator
        contentElement.innerHTML = currentContent.replace('<span class="typing-indicator">■</span>', '');
    }
}

// Toggle system prompt panel
function toggleSystemPromptPanel() {
    if (systemPromptPanel.style.display === 'block') {
        systemPromptPanel.style.display = 'none';
    } else {
        systemPromptPanel.style.display = 'block';
        // Focus the textarea
        systemPrompt.focus();
    }
}

// Save system prompt
function saveSystemPromptConfig() {
    const promptValue = systemPrompt.value.trim();
    localStorage.setItem('nervSystemPrompt', promptValue);
    
    // Update UI
    hasSystemPrompt = !!promptValue;
    updateSystemPromptBadge();
    
    // Show confirmation
    addSystemMessage("SYSTEM PROMPT CONFIGURATION SAVED.");
    
    // Hide panel
    systemPromptPanel.style.display = 'none';
}

// Load system prompt
function loadSystemPrompt() {
    const savedPrompt = localStorage.getItem('nervSystemPrompt');
    if (savedPrompt) {
        systemPrompt.value = savedPrompt;
        hasSystemPrompt = true;
    } else {
        // Set default system prompt - short and sweet
        systemPrompt.value = "You are a helpful AI assistant.";
        hasSystemPrompt = true;
        // Save the default prompt
        localStorage.setItem('nervSystemPrompt', systemPrompt.value);
    }
    updateSystemPromptBadge();
}

// Update system prompt badge
function updateSystemPromptBadge() {
    // Remove existing badge if any
    const existingBadge = document.querySelector('.system-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Add badge if system prompt is set
    if (hasSystemPrompt) {
        const badge = document.createElement('span');
        badge.className = 'system-badge';
        badge.textContent = 'SYS';
        systemPromptBtn.appendChild(badge);
    }
}

// Update token speed display
function updateTokenSpeed() {
    const tokenSpeedElement = document.getElementById('tokenSpeed');
    if (tokenSpeedElement) {
        tokenSpeedElement.textContent = currentTokenSpeed + " T/S";
        // Add highlight effect for active generation
        if (currentTokenSpeed > 0) {
            tokenSpeedElement.classList.add('active-metric');
        } else {
            tokenSpeedElement.classList.remove('active-metric');
        }
    }
}

// Calculate tokens per second
function calculateTokenSpeed() {
    if (responseStartTime === 0 || tokenCount === 0) {
        currentTokenSpeed = 0;
    } else {
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - responseStartTime) / 1000;
        if (elapsedSeconds > 0) {
            currentTokenSpeed = Math.round(tokenCount / elapsedSeconds);
        }
    }
    updateTokenSpeed();
}

// Start token speed tracking
function startTokenTracking() {
    // Reset counters
    tokenCount = 0;
    responseStartTime = Date.now();
    
    // Set up interval to update the display
    if (tokenRateInterval) {
        clearInterval(tokenRateInterval);
    }
    tokenRateInterval = setInterval(calculateTokenSpeed, 500);
}

// Stop token speed tracking
function stopTokenTracking() {
    if (tokenRateInterval) {
        clearInterval(tokenRateInterval);
        tokenRateInterval = null;
    }
    
    // Calculate final rate
    calculateTokenSpeed();
    
    // Reset after a delay
    setTimeout(() => {
        currentTokenSpeed = 0;
        updateTokenSpeed();
    }, 3000);
}

// Count tokens in a string (approximate method)
function estimateTokenCount(text) {
    // Simple approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
} 