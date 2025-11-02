// Global state
let selectedFile = null;
let isProcessing = false;

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeFileUpload();
});

function initializeEventListeners() {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Enter key to send (Shift+Enter for new line)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-expand textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // LLM selection change
    document.getElementById('llm-select').addEventListener('change', function(e) {
        showSystemMessage(`Switched to ${e.target.options[e.target.selectedIndex].text}`);
    });
}

function initializeFileUpload() {
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('file-input');
    const removeFileBtn = document.getElementById('remove-file');

    // Click to upload
    fileUploadArea.addEventListener('click', () => fileInput.click());

    // File selected
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');

        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    // Remove file
    removeFileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearFileSelection();
    });
}

function handleFileSelection(file) {
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        showSystemMessage('❌ Unsupported file type. Please upload PDF, DOCX, TXT, or MD files.', 'error');
        return;
    }

    selectedFile = file;
    document.getElementById('file-name').textContent = `📎 ${file.name}`;
    document.getElementById('selected-file').classList.add('active');

    // Upload file immediately
    uploadFile(file);
}

function clearFileSelection() {
    selectedFile = null;
    document.getElementById('selected-file').classList.remove('active');
    document.getElementById('file-input').value = '';
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        showSystemMessage(`📤 Uploading ${file.name}...`);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showSystemMessage(`✅ ${file.name} uploaded and indexed successfully!`, 'success');
            clearFileSelection();
        } else {
            showSystemMessage(`❌ Upload failed: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showSystemMessage('❌ Upload failed. Please try again.', 'error');
    }
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();

    if (!message || isProcessing) return;

    // Get selected LLM
    const selectedLLM = document.getElementById('llm-select').value;

    // Clear input and reset height
    input.value = '';
    input.style.height = 'auto';

    // Add user message
    appendMessage('user', message);

    // Show typing indicator
    showTypingIndicator();
    isProcessing = true;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                llm_provider: selectedLLM
            })
        });

        const data = await response.json();

        // Hide typing indicator
        hideTypingIndicator();

        if (response.ok) {
            appendMessage('bot', data.reply);
        } else {
            appendMessage('bot', `❌ Error: ${data.error || 'Something went wrong'}`, 'error');
        }
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        appendMessage('bot', '❌ Failed to get response. Please check your connection and try again.', 'error');
    } finally {
        isProcessing = false;
    }
}

function appendMessage(sender, text, type = 'normal') {
    const history = document.getElementById('chat-history');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const senderDiv = document.createElement('div');
    senderDiv.className = 'message-sender';
    senderDiv.textContent = sender === 'user' ? 'You' : 'Assistant';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;

    contentDiv.appendChild(senderDiv);
    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(contentDiv);

    // Remove typing indicator if exists
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }

    history.appendChild(messageDiv);
    history.scrollTop = history.scrollHeight;
}

function showSystemMessage(text, type = 'info') {
    const history = document.getElementById('chat-history');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.style.opacity = '0.8';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.style.fontSize = '14px';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;

    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(contentDiv);

    history.appendChild(messageDiv);
    history.scrollTop = history.scrollHeight;
}

function showTypingIndicator() {
    const history = document.getElementById('chat-history');

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator active';

    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    dotsDiv.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(dotsDiv);
    history.appendChild(typingDiv);
    history.scrollTop = history.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}
