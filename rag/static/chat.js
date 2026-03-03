// ─── State ───────────────────────────────────────────────────────────────────
let isProcessing   = false;
let uploadOpen     = false;

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setDateLabel();
    initInput();
    initLLMSelect();
    initUploadToggle();
    initDropZone();
    initClearChat();

    // Focus input on load
    document.getElementById('user-input').focus();
});

// ─── Date label ──────────────────────────────────────────────────────────────
function setDateLabel() {
    const el = document.getElementById('date-label');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });
}

// ─── Input ───────────────────────────────────────────────────────────────────
function initInput() {
    const input   = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    input.addEventListener('input', () => {
        // Auto-expand
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 130) + 'px';
        // Enable send button only when there is text
        sendBtn.disabled = !input.value.trim() || isProcessing;
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
}

// ─── LLM selector ────────────────────────────────────────────────────────────
function initLLMSelect() {
    document.getElementById('llm-select').addEventListener('change', e => {
        const label = e.target.options[e.target.selectedIndex].text;
        showToast(`Switched to ${label}`, 'info');
    });
}

// ─── Upload toggle ───────────────────────────────────────────────────────────
function initUploadToggle() {
    document.getElementById('upload-row').addEventListener('click', () => {
        uploadOpen = !uploadOpen;
        document.getElementById('drop-zone').classList.toggle('open', uploadOpen);
        document.getElementById('chevron').classList.toggle('open', uploadOpen);
    });
}

// ─── Drop zone ───────────────────────────────────────────────────────────────
function initDropZone() {
    const zone  = document.getElementById('drop-zone');
    const input = document.getElementById('file-input');

    zone.addEventListener('click', e => {
        if (e.target !== input) input.click();
    });

    input.addEventListener('change', e => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
}

function handleFile(file) {
    const allowed = ['.pdf', '.docx', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
        showToast(`Unsupported type "${ext}". Use PDF, DOCX, TXT, or MD.`, 'error');
        return;
    }
    uploadFile(file);
}

async function uploadFile(file) {
    // Close drop zone
    document.getElementById('drop-zone').classList.remove('open');
    document.getElementById('chevron').classList.remove('open');
    uploadOpen = false;

    // Show progress
    const progressEl = document.getElementById('upload-progress');
    const fillEl     = document.getElementById('progress-fill');
    const pctEl      = document.getElementById('progress-pct');
    const nameEl     = document.getElementById('progress-name');

    progressEl.classList.add('active');
    nameEl.textContent = file.name;
    fillEl.style.width = '0%';
    pctEl.textContent  = '0%';

    // Animate progress (simulated while awaiting response)
    let progress = 0;
    const ticker = setInterval(() => {
        progress = Math.min(progress + Math.random() * 12, 82);
        fillEl.style.width = progress + '%';
        pctEl.textContent  = Math.round(progress) + '%';
    }, 200);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        clearInterval(ticker);

        fillEl.style.width = '100%';
        pctEl.textContent  = '100%';
        await delay(450);
        progressEl.classList.remove('active');
        document.getElementById('file-input').value = '';

        if (res.ok) {
            document.getElementById('upload-row').classList.add('success-state');
            document.getElementById('upload-row-text').textContent = 'Upload another document';
            showToast(`"${truncate(file.name, 40)}" indexed successfully.`, 'success');
        } else {
            const data = await res.json().catch(() => ({}));
            showToast('Upload failed: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch {
        clearInterval(ticker);
        progressEl.classList.remove('active');
        showToast('Upload failed — check your connection.', 'error');
    }
}

// ─── Send message ─────────────────────────────────────────────────────────────
async function sendMessage() {
    const input   = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const text    = input.value.trim();
    if (!text || isProcessing) return;

    const llm = document.getElementById('llm-select').value;

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    isProcessing = true;

    addUserBubble(text);
    showTyping();

    try {
        const res  = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, llm_provider: llm })
        });
        const data = await res.json();
        hideTyping();

        if (res.ok) {
            addBotBubble(data.reply);
        } else {
            addBotBubble('Error: ' + (data.error || 'Something went wrong.'));
        }
    } catch {
        hideTyping();
        addBotBubble('Could not reach the server. Please check your connection and try again.');
    } finally {
        isProcessing = false;
        sendBtn.disabled = !input.value.trim();
    }
}

// ─── Message rendering ───────────────────────────────────────────────────────
function addUserBubble(text) {
    const history = document.getElementById('chat-history');

    const group = el('div', 'msg-group user');

    const meta = el('div', 'msg-meta');
    meta.textContent = 'You \u00b7 ' + formatTime();

    const row = el('div', 'msg-row');

    const avatar = el('div', 'avatar user-av');
    avatar.textContent = 'U';

    const bubble = el('div', 'bubble');
    bubble.textContent = text;               // plain text — safe from XSS

    row.appendChild(avatar);
    row.appendChild(bubble);
    group.appendChild(meta);
    group.appendChild(row);
    history.appendChild(group);
    scrollBottom(history);
}

function addBotBubble(text) {
    const history = document.getElementById('chat-history');
    const llmName = getLLMName();

    const group = el('div', 'msg-group bot');

    const meta = el('div', 'msg-meta');
    meta.textContent = `RAG Assistant (${llmName}) \u00b7 ${formatTime()}`;

    const row = el('div', 'msg-row');

    const avatar = el('div', 'avatar bot-av');
    avatar.textContent = 'AI';

    const bubble = el('div', 'bubble');
    bubble.innerHTML = renderMarkdown(text);  // rendered — markdown only

    row.appendChild(avatar);
    row.appendChild(bubble);
    group.appendChild(meta);
    group.appendChild(row);
    history.appendChild(group);
    scrollBottom(history);
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function showTyping() {
    const history = document.getElementById('chat-history');

    const group = el('div', 'msg-group bot');
    group.id = 'typing-group';

    const row = el('div', 'msg-row');

    const avatar = el('div', 'avatar bot-av');
    avatar.textContent = 'AI';

    const bubble = el('div', 'typing-bubble');
    bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

    row.appendChild(avatar);
    row.appendChild(bubble);
    group.appendChild(row);
    history.appendChild(group);
    scrollBottom(history);
}

function hideTyping() {
    const g = document.getElementById('typing-group');
    if (g) g.remove();
}

// ─── Clear chat ───────────────────────────────────────────────────────────────
function initClearChat() {
    document.getElementById('clear-btn').addEventListener('click', () => {
        const history = document.getElementById('chat-history');
        history.innerHTML = `
            <div class="date-divider"><span>Chat cleared</span></div>
            <div class="msg-group bot">
                <div class="msg-meta">RAG Assistant</div>
                <div class="msg-row">
                    <div class="avatar bot-av">AI</div>
                    <div class="bubble">Chat cleared. Ask me anything about your documents!</div>
                </div>
            </div>`;
        showToast('Chat history cleared.', 'info');
    });
}

// ─── Toasts ───────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const svgCheck = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    const svgX     = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    const svgInfo  = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

    const icon = type === 'success' ? svgCheck : type === 'error' ? svgX : svgInfo;

    const toast = el('div', `toast ${type}`);
    toast.innerHTML = icon + `<span class="toast-text">${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut .3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4200);
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderMarkdown(text) {
    // Escape HTML first to prevent XSS
    let out = escapeHTML(text);

    // Fenced code blocks
    out = out.replace(/```([^`]*?)```/gs, (_, code) =>
        `<pre><code>${code.trim()}</code></pre>`
    );

    // Inline code
    out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Bold
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic (single *, not preceded/followed by *)
    out = out.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

    // Unordered lists
    out = out.replace(/^[*\-] (.+)$/gm, '<li>$1</li>');
    out = out.replace(/(<li>.*<\/li>(\n|$))+/g, match => `<ul>${match}</ul>`);

    // Ordered lists
    out = out.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Line breaks (outside block elements)
    out = out.replace(/\n/g, '<br>');

    return out;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getLLMName() {
    const sel = document.getElementById('llm-select');
    return sel.options[sel.selectedIndex].text;
}

function scrollBottom(el) {
    el.scrollTop = el.scrollHeight;
}

function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '...' : str;
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}
