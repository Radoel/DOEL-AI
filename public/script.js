let currentChatId = null;
let chatHistory = {};
let isTyping = false;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('initialTime').textContent = formatTime(new Date());
    loadChatHistory();
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', autoResize);
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    startNewChat();
    document.getElementById('messageInput').focus();
});

function autoResize() {
    const textarea = document.getElementById('messageInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function generateChatId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function startNewChat() {
    currentChatId = generateChatId();
    chatHistory[currentChatId] = {
        title: 'New Chat',
        messages: [],
        createdAt: new Date()
    };
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="message assistant">
            <div class="message-avatar">AI</div>
            <div class="message-content">
                <div class="message-bubble">
                    <p>Hello! Bro gw adalah jenis AI Yang di rancang oleh MUHAMAD RAAFI NAUFAL dengan di buatnya gw ini menggunakan AI juga heheheh 🤣🤣🤣</p>
                </div>
                <div class="message-time">${formatTime(new Date())}</div>
            </div>
        </div>
    `;
    updateChatHistoryUI();
    saveChatHistory();
    scrollToBottom();
}

function updateChatHistoryUI() {
    const chatHistoryDiv = document.getElementById('chatHistory');
    chatHistoryDiv.innerHTML = '';
    const sortedChats = Object.entries(chatHistory).sort((a, b) => 
        new Date(b[1].createdAt) - new Date(a[1].createdAt)
    );
    sortedChats.forEach(([chatId, chat]) => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chatId === currentChatId ? 'active' : ''}`;
        chatItem.textContent = chat.title;
        chatItem.onclick = () => switchToChat(chatId);
        chatHistoryDiv.appendChild(chatItem);
    });
}

function switchToChat(chatId) {
    currentChatId = chatId;
    const chat = chatHistory[chatId];
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="message assistant">
            <div class="message-avatar">AI</div>
            <div class="message-content">
                <div class="message-bubble">
                    <p>Hello! Bro gw adalah jenis AI Yang di rancang oleh MUHAMAD RAAFI NAUFAL dengan di buatnya gw ini menggunakan AI juga heheheh 🤣🤣🤣</p>
                </div>
                <div class="message-time">${formatTime(chat.createdAt)}</div>
            </div>
        </div>
    `;
    chat.messages.forEach(message => {
        addMessageToUI(message.content, message.role, new Date(message.timestamp));
    });
    updateChatHistoryUI();
    scrollToBottom();
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    addMessageToUI(message, 'user');
    messageInput.value = '';
    autoResize();
    chatHistory[currentChatId].messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });
    if (chatHistory[currentChatId].messages.length === 1) {
        chatHistory[currentChatId].title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        updateChatHistoryUI();
    }
    showTypingIndicator();
    try {
        const aiResponse = await getAIResponse(message);
        hideTypingIndicator();
        await addMessageWithTypingEffect(aiResponse, 'assistant');
        chatHistory[currentChatId].messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        });
        saveChatHistory();
    } catch (error) {
        hideTypingIndicator();
        addMessageToUI('Sorry, I encountered an error. Please try again later.', 'assistant');
        console.error('API Error:', error);
    }
}

async function getAIResponse(message) {
    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (!data.content) {
            throw new Error('Invalid response format from API');
        }
        return data.content;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function addMessageToUI(content, role, timestamp = new Date()) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    const processedContent = role === 'assistant' ? processCodeBlocks(content) : escapeHtml(content);
    messageDiv.innerHTML = `
        <div class="message-avatar">${role === 'user' ? 'U' : 'AI'}</div>
        <div class="message-content">
            <div class="message-bubble">
                ${processedContent}
            </div>
            <div class="message-time">${formatTime(timestamp)}</div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

async function addMessageWithTypingEffect(content, role) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `
        <div class="message-avatar">${role === 'user' ? 'U' : 'AI'}</div>
        <div class="message-content">
            <div class="message-bubble">
                <span class="typing-text"></span>
            </div>
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    const typingText = messageDiv.querySelector('.typing-text');
    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
        typingText.textContent += (i > 0 ? ' ' : '') + words[i];
        scrollToBottom();
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    const messageBubble = messageDiv.querySelector('.message-bubble');
    messageBubble.innerHTML = processCodeBlocks(content);
}

function processCodeBlocks(content) {
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language || 'text';
        const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
        return `
            <div class="code-block">
                <div class="code-header">
                    <span>${lang}</span>
                    <button class="copy-btn" onclick="copyCode('${codeId}')">Copy</button>
                </div>
                <div class="code-content" id="${codeId}">${escapeHtml(code.trim())}</div>
            </div>
        `;
    });
    content = content.replace(/`([^`]+)`/g, '<code style="background: rgba(51, 65, 85, 0.5); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
    content = content.replace(/\n/g, '<br>');
    return content;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    const textArea = document.createElement('textarea');
    textArea.value = codeElement.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    const copyBtn = codeElement.parentElement.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

function showTypingIndicator() {
    isTyping = true;
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">AI</div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-indicator" style="display: flex;">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    document.getElementById('sendBtn').disabled = true;
}

function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    document.getElementById('sendBtn').disabled = false;
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function exportChat() {
    if (!currentChatId || !chatHistory[currentChatId]) {
        alert('No chat to export');
        return;
    }
    const chat = chatHistory[currentChatId];
    const exportData = {
        title: chat.title,
        createdAt: chat.createdAt,
        messages: chat.messages
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

function showApiConfig() {
    document.getElementById('configOverlay').classList.remove('hidden');
    document.getElementById('apiConfig').classList.remove('hidden');
}

function hideApiConfig() {
    document.getElementById('configOverlay').classList.add('hidden');
    document.getElementById('apiConfig').classList.add('hidden');
}

function saveApiKey() {
    alert('API key is now managed on the server. Contact admin to update it.');
    hideApiConfig();
}

function saveChatHistory() {
    localStorage.setItem('ai_assistant_chat_history', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const savedHistory = localStorage.getItem('ai_assistant_chat_history');
    if (savedHistory) {
        try {
            chatHistory = JSON.parse(savedHistory);
            updateChatHistoryUI();
        } catch (error) {
            console.error('Error loading chat history:', error);
            chatHistory = {};
        }
    }
}

document.getElementById('configOverlay').addEventListener('click', hideApiConfig);

document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('open') && 
        !sidebar.contains(e.target) && 
        !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});

document.getElementById('apiKeyInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveApiKey();
    }
});