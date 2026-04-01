// TejGPT - Pro Intelligence Engine (Production Ready)

// User Identity and Multi-Session Logic
let userId = localStorage.getItem('tejgpt_user_id');
if (!userId) {
    userId = 'User_' + Math.floor(Math.random() * 90000 + 10000);
    localStorage.setItem('tejgpt_user_id', userId);
}
const sessionKey = `support_session_${userId}`;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const welcomeScreen = document.getElementById('welcome-screen');
const newChatBtn = document.getElementById('new-chat');
const historyList = document.getElementById('history-list');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const themeOpts = document.querySelectorAll('.theme-opt');
const modelSelector = document.getElementById('model-selector');
const modelDropdown = document.getElementById('model-dropdown');
const modelMenuItems = document.querySelectorAll('.model-menu-item');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const imagePreview = document.getElementById('image-preview');
const removePreview = document.getElementById('remove-preview');
const micBtn = document.getElementById('mic-btn');
const voiceOverlay = document.getElementById('voice-overlay');
const cancelVoice = document.getElementById('cancel-voice');

// Live Support Elements
const liveSupportTrigger = document.getElementById('live-support-trigger');
const supportWidget = document.getElementById('support-widget');
const supportClose = document.getElementById('support-close');
const supportSend = document.getElementById('support-send');
const supportInput = document.getElementById('support-input');
const supportMessages = document.getElementById('support-messages');

// Show User ID in Header for Staff Identification
const supportHeaderLabel = document.querySelector('.support-header div div div:first-child');
if (supportHeaderLabel) supportHeaderLabel.textContent = `TejGPT Support (${userId})`;

// State
let chatHistory = [];
let appTheme = localStorage.getItem('tejgpt_theme') || 'system';
let appModel = 'fast';
let attachedImage = null;

// Initialization
function init() {
    chatInput.addEventListener('input', updateInputArea);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitMessage();
        }
    });

    sendBtn.addEventListener('click', submitMessage);
    newChatBtn.addEventListener('click', startNewChat);

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        if (window.innerWidth < 768) sidebar.classList.toggle('open');
    });

    setupTheme();
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('active');
    });

    themeOpts.forEach(opt => {
        opt.addEventListener('click', () => applyTheme(opt.dataset.themeVal));
    });

    modelSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdown.classList.toggle('active');
    });

    modelMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            appModel = item.dataset.model;
            document.querySelector('#model-selector span').textContent = `TejGPT ${item.querySelector('strong').textContent}`;
            modelMenuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            modelDropdown.classList.remove('active');
        });
    });

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (re) => {
                imagePreview.src = re.target.result;
                attachedImage = re.target.result;
                previewArea.style.display = 'block';
                updateInputArea();
            };
            reader.readAsDataURL(file);
        }
    });

    removePreview.addEventListener('click', () => {
        attachedImage = null;
        previewArea.style.display = 'none';
        fileInput.value = '';
        updateInputArea();
    });

    micBtn.addEventListener('click', () => {
        voiceOverlay.classList.add('active');
        setTimeout(() => {
            voiceOverlay.classList.remove('active');
            chatInput.value = "What can you help me with today?";
            updateInputArea();
        }, 2500);
    });

    cancelVoice.addEventListener('click', () => voiceOverlay.classList.remove('active'));

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm('Clear all chat conversations?')) {
            startNewChat();
            const items = historyList.querySelectorAll('.history-item');
            items.forEach(i => i.remove());
            settingsMenu.classList.remove('active');
        }
    });

    // Auth Logic
    const profileBtn = document.getElementById('profile-btn');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.getElementById('auth-close');
    const authSubmit = document.getElementById('auth-submit');
    const authToggle = document.getElementById('auth-toggle');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authUserText = document.getElementById('auth-username');
    const authPassText = document.getElementById('auth-password');
    let isSignupMode = false;

    // Personal Greeting
    const userName = localStorage.getItem('tejgpt_user');
    if (userName) {
        const welcomeTitle = document.querySelector('.welcome-screen h1');
        if (welcomeTitle) welcomeTitle.textContent = `Hello, ${userName}`;
    }

    profileBtn.addEventListener('click', () => {
        const currentUser = localStorage.getItem('tejgpt_user');
        if (currentUser) {
            if (confirm(`Logged in as ${currentUser}. Log out?`)) {
                localStorage.removeItem('tejgpt_user');
                location.reload();
            }
        } else {
            authModal.classList.add('active');
        }
    });

    authClose.addEventListener('click', () => authModal.classList.remove('active'));

    authToggle.addEventListener('click', () => {
        isSignupMode = !isSignupMode;
        authTitle.textContent = isSignupMode ? "Create account" : "Welcome back";
        authSubtitle.textContent = isSignupMode ? "Join the future of intelligence." : "Login to save your personal preferences.";
        authSubmit.textContent = isSignupMode ? "Sign Up" : "Sign In";
        authToggle.innerHTML = isSignupMode ? "Already have an account? <span>Sign in</span>" : "Don't have an account? <span>Sign up</span>";
    });

    authSubmit.addEventListener('click', () => {
        const name = authUserText.value.trim();
        const pass = authPassText.value.trim();
        if (name && pass) {
            localStorage.setItem('tejgpt_user', name);
            authModal.classList.remove('active');
            location.reload();
        }
    });

    // Support Trigger
    liveSupportTrigger.addEventListener('click', () => {
        supportWidget.classList.add('active');
        if (window.innerWidth < 768) sidebar.classList.remove('open');
        
        if (!localStorage.getItem(sessionKey)) {
            localStorage.setItem(sessionKey, JSON.stringify([]));
        }
        
        // Initial bot greeting if brand new
        if (supportMessages.querySelectorAll('.support-msg:not(.bot-welcome)').length === 0) {
            setTimeout(() => {
                addSupportMessage("Connecting to a live agent...", "bot", true);
            }, 500);
        }
    });

    supportClose.addEventListener('click', () => supportWidget.classList.remove('active'));

    supportSend.addEventListener('click', handleSupportSend);
    supportInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSupportSend();
    });

    // Start sync interval
    setInterval(syncSupportMessages, 1000);
    
    // Cross-tab storage listener for instant updates
    window.addEventListener('storage', (e) => {
        if (e.key === sessionKey) syncSupportMessages();
    });

    document.addEventListener('click', (e) => {
        if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) settingsMenu.classList.remove('active');
        if (modelSelector && !modelSelector.contains(e.target)) modelDropdown.classList.remove('active');
    });

    chatInput.focus();
}

function setupTheme() {
    applyTheme(appTheme, false);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (appTheme === 'system') applyTheme('system', false);
    });
}

function applyTheme(theme, save = true) {
    appTheme = theme;
    if (save) localStorage.setItem('tejgpt_theme', theme);
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
    themeOpts.forEach(opt => opt.classList.toggle('active', opt.dataset.themeVal === theme));
}

function updateInputArea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
    sendBtn.disabled = chatInput.value.trim() === '' && !attachedImage;
}

async function submitMessage() {
    const text = chatInput.value.trim();
    if (!text && !attachedImage) return;

    // Detection for image generation
    const textLower = text.toLowerCase();
    const imageNouns = ['image', 'picture', 'photo', 'sketch', 'painting', 'drawing', 'illustration', 'wallpaper'];
    const generationVerbs = ['generate', 'create', 'draw', 'make', 'show', 'paint'];
    const isRequestingImage = textLower.startsWith('image:') || 
                              (generationVerbs.some(v => textLower.includes(v)) && imageNouns.some(n => textLower.includes(n)));

    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;
    previewArea.style.display = 'none';
    attachedImage = null;

    if (welcomeScreen) welcomeScreen.style.display = 'none';
    renderMessage(text, 'user');
    const aiBox = renderMessage('', 'ai', true);
    
    try {
        if (isRequestingImage) {
            let prompt = text.replace(/^(generate|create|draw|make|sketch|show|paint|image|picture)(\s*(image|picture|of|a|an|me|give|the))*\b\s*[:]?\s*/gi, "").trim();
            if (prompt.length < 3) prompt = text.trim();
            if (prompt.length < 2) prompt = "a beautiful landscape";
            
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}&model=flux`;
            const steps = ["Interpreting prompt...", "Connecting engine...", "Synthesizing...", "Lighting...", "Finalizing..."];
            let stepIndex = 0;
            const pt = setInterval(() => {
                if (stepIndex < steps.length) {
                    aiBox.innerHTML = `<div>${steps[stepIndex]}</div>`;
                    stepIndex++;
                } else clearInterval(pt);
            }, 800);
            
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                clearInterval(pt);
                aiBox.innerHTML = `<img src="${imageUrl}" style="width:100%; border-radius:12px; border:1px solid var(--border);">`;
            };
        } else {
            const response = await callGroqAPI(text);
            streamResponse(aiBox, response);
        }
        addHistoryTab(text);
    } catch (err) {
        aiBox.innerHTML = `<span>Error: ${err.message}</span>`;
    }
}

async function callGroqAPI(prompt) {
    const messages = [
        { 
            role: "system", 
            content: "You are TejGPT, a professional and highly advanced AI assistant. You were created and developed by Tejas. If anyone asks who created you or who made you, you must always state clearly that Tejas is your creator." 
        },
        ...chatHistory.slice(-10),
        { role: "user", content: prompt }
    ];

    const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messages }) 
    });

    if (!res.ok) throw new Error('API Bridge Error: Check Vercel Logs');
    
    const data = await res.json();
    const content = data.choices[0]?.message?.content || "";
    
    chatHistory.push({ role: "user", content: prompt }, { role: "assistant", content: content });
    return content;
}

function renderMessage(text, role, isTyping = false) {
    const row = document.createElement('div');
    row.className = 'message-row ' + role;
    const box = document.createElement('div');
    box.className = 'content-box';
    if (isTyping) box.innerHTML = `Thinking...`;
    else box.innerHTML = md(text);
    row.appendChild(box);
    messagesContainer.appendChild(row);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return box;
}

function streamResponse(element, fullText) {
    let current = "";
    const words = fullText.split(" ");
    let i = 0;
    const timer = setInterval(() => {
        if (i < words.length) {
            current += (i === 0 ? "" : " ") + words[i];
            element.innerHTML = md(current);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            i++;
        } else clearInterval(timer);
    }, 15);
}

    function addSupportMessage(text, role, save = false) {
        if (!text) return;
        const msg = document.createElement('div');
        
        if (role === 'staff') {
            msg.className = `support-msg staff-msg-container`;
            msg.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <div class="staff-avatar-circle">T</div>
                    <div class="staff-header-info">Tejas (Staff)</div>
                </div>
                <div class="staff-bubble-content">${text}</div>
            `;
        } else {
            msg.className = `support-msg ${role}`;
            msg.textContent = text;
        }
        
        supportMessages.appendChild(msg);
        supportMessages.scrollTop = supportMessages.scrollHeight;

        if (save) {
            const msgs = JSON.parse(localStorage.getItem(sessionKey) || '[]');
            msgs.push({ role: role, text: text, timestamp: Date.now() });
            localStorage.setItem(sessionKey, JSON.stringify(msgs));
        }
    }

    function syncSupportMessages() {
        const stored = JSON.parse(localStorage.getItem(sessionKey) || '[]');
        const currentCount = supportMessages.querySelectorAll('.support-msg:not(.bot-welcome)').length;
        if (stored.length > currentCount) {
            for (let i = currentCount; i < stored.length; i++) {
                addSupportMessage(stored[i].text, stored[i].role);
                
                // End session check
                if (stored[i].isEnd) {
                    setTimeout(() => {
                        supportWidget.classList.remove('active');
                        supportMessages.innerHTML = `
                            <div class="support-msg bot bot-welcome">Hi Tejas! How can I help you today? I'm the official TejGPT Support Bot.</div>
                        `;
                        sessionStorage.removeItem('support_notified');
                    }, 3000);
                }
            }
        }
    }

function handleSupportSend() {
    const text = supportInput.value.trim();
    if (!text) return;
    const messages = JSON.parse(localStorage.getItem(sessionKey) || '[]');
    messages.push({ role: 'user', text: text, timestamp: Date.now() });
    localStorage.setItem(sessionKey, JSON.stringify(messages));
    supportInput.value = '';
    syncSupportMessages();
}

function startNewChat() {
    messagesContainer.innerHTML = '';
    if (welcomeScreen) welcomeScreen.style.display = 'block';
    chatHistory = [];
}

function addHistoryTab(text) {
    if (!text) return;
    const tab = document.createElement('div');
    tab.className = 'history-item';
    tab.innerHTML = `<i data-lucide="message-square" size="14"></i> <span class="nav-text">${text}</span>`;
    tab.onclick = () => setInput(text);
    const label = historyList.querySelector('.history-section-label');
    if (label && label.nextSibling) historyList.insertBefore(tab, label.nextSibling);
    else historyList.appendChild(tab);
    if (window.lucide) lucide.createIcons();
}

function md(raw) {
    let h = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    h = h.replace(/```([\s\S]*?)```/g, (m, c) => `<pre><code>${c.trim()}</code></pre>`);
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return h.split('\n').map(l => l ? `<p>${l}</p>` : '<br>').join('');
}

window.setInput = (text) => {
    chatInput.value = text;
    updateInputArea();
    submitMessage();
};

init();
