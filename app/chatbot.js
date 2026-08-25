// ===================================
// CHATBOT JAVASCRIPT
// ===================================

let currentConversationId = null;
let isProcessing = false;

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const conversationsList = document.getElementById('conversationsList');
const typingIndicator = document.getElementById('typingIndicator');

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadConversations();
    setupEventListeners();
    animateWelcome();
});

function animateWelcome() {
    gsap.from('.ai-icon', {
        scale: 0,
        rotation: 180,
        duration: 0.8,
        ease: 'back.out(1.7)'
    });

    gsap.from('.welcome-content h2', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.3
    });

    gsap.from('.welcome-content p', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.5
    });

    gsap.from('.chip', {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.7
    });
}

// ===================================
// AUTHENTICATION
// ===================================

async function checkAuth() {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();

        if (!data.isLoggedIn) {
            window.location.href = '/chatbot';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // Send button
    sendBtn.addEventListener('click', sendMessage);

    // Enter key to send
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });

    // New chat button
    newChatBtn.addEventListener('click', createNewConversation);

    // Suggestion chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const message = chip.getAttribute('data-message');
            messageInput.value = message;
            sendMessage();
        });
    });
}

// ===================================
// CONVERSATION MANAGEMENT
// ===================================

async function loadConversations() {
    try {
        const response = await fetch('/api/chat/conversations');
        const data = await response.json();

        if (data.success) {
            displayConversations(data.conversations);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function displayConversations(conversations) {
    conversationsList.innerHTML = '';

    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 0.875rem;">
                No conversations yet.<br>Start a new chat!
            </div>
        `;
        return;
    }

    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        if (conv.id === currentConversationId) {
            item.classList.add('active');
        }

        const date = new Date(conv.updatedAt);
        const timeStr = formatTime(date);

        item.innerHTML = `
            <div class="conversation-title">${escapeHtml(conv.title)}</div>
            <div class="conversation-time">${timeStr}</div>
        `;

        item.addEventListener('click', () => loadConversation(conv.id));
        conversationsList.appendChild(item);
    });
}

async function createNewConversation() {
    try {
        const response = await fetch('/api/chat/conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'New Conversation'
            })
        });

        const data = await response.json();

        if (data.success) {
            currentConversationId = data.conversationId;
            messagesContainer.innerHTML = '';
            welcomeScreen.style.display = 'none';
            messagesContainer.classList.add('active');
            loadConversations();
            messageInput.focus();
        }
    } catch (error) {
        console.error('Error creating conversation:', error);
        showError('Failed to create new conversation');
    }
}

async function loadConversation(conversationId) {
    try {
        const response = await fetch(`/api/chat/conversation/${conversationId}/messages`);
        const data = await response.json();

        if (data.success) {
            currentConversationId = conversationId;
            displayMessages(data.messages);
            welcomeScreen.style.display = 'none';
            messagesContainer.classList.add('active');

            // Update active state
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        showError('Failed to load conversation');
    }
}

function displayMessages(messages) {
    messagesContainer.innerHTML = '';

    messages.forEach(msg => {
        addMessageToUI(msg.role, msg.content, false);
    });

    scrollToBottom();
}

// ===================================
// MESSAGE HANDLING
// ===================================

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || isProcessing) {
        return;
    }

    // Create conversation if needed
    if (!currentConversationId) {
        await createNewConversation();
    }

    // Add user message to UI
    addMessageToUI('user', message);
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Show typing indicator
    isProcessing = true;
    sendBtn.disabled = true;
    typingIndicator.style.display = 'flex';
    scrollToBottom();

    try {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: currentConversationId,
                message: message
            })
        });

        const data = await response.json();

        // Hide typing indicator
        typingIndicator.style.display = 'none';

        if (data.success) {
            addMessageToUI('assistant', data.message);
            loadConversations(); // Refresh conversation list
        } else {
            showError(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        typingIndicator.style.display = 'none';
        showError('Network error. Please try again.');
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

function addMessageToUI(role, content, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    if (animate) {
        gsap.from(messageDiv, {
            y: 20,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
    }

    scrollToBottom();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message assistant';
    errorDiv.innerHTML = `
        <div class="message-content" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3);">
            ⚠️ ${escapeHtml(message)}
        </div>
    `;
    messagesContainer.appendChild(errorDiv);
    scrollToBottom();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
}
