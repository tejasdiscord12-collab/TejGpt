// TejGPT - Pro Intelligence Engine (Production Ready)

// User Identity and Multi-Session Logic
let userId = localStorage.getItem('tejgpt_user_id');
if (!userId) {
    userId = 'User_' + Math.floor(Math.random() * 90000 + 10000);
    localStorage.setItem('tejgpt_user_id', userId);
}
const sessionKey = `support_session_${userId}`;

// DOM Elements - Using Safety Guards
const get = (id) => document.getElementById(id);
const sidebar = get('sidebar');
const chatInput = get('chat-input');
const sendBtn = get('send-btn');
const messagesContainer = get('messages-container');
const welcomeScreen = get('welcome-screen');
const newChatBtn = get('new-chat');
const historyList = get('history-list');
const settingsBtn = get('settings-btn');
const settingsMenu = get('settings-menu');
const themeOpts = document.querySelectorAll('.theme-opt');
const modelSelector = get('model-selector');
const modelDropdown = get('model-dropdown');
const modelMenuItems = document.querySelectorAll('.model-menu-item');
const uploadBtn = get('upload-btn');
const fileInput = get('file-input');
const previewArea = get('preview-area');
const imagePreview = get('image-preview');
const removePreview = get('remove-preview');
const micBtn = get('mic-btn');
const voiceOverlay = get('voice-overlay');
const cancelVoice = get('cancel-voice');

// Live Support Elements
const liveSupportTrigger = get('live-support-trigger');
const supportWidget = get('support-widget');
const supportClose = get('support-close');
const supportSend = get('support-send');
const supportInput = get('support-input');
const supportMessages = get('support-messages');

// State
let chatHistory = [];
let appTheme = localStorage.getItem('tejgpt_theme') || 'system';
let appModel = 'fast';
let attachedImage = null;

// Initialization
function init() {
    if (chatInput) {
        chatInput.addEventListener('input', updateInputArea);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitMessage();
            }
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', submitMessage);
    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);

    // Sidebar Toggles
    const sidebarToggle = get('sidebar-toggle-btn');
    const headerMenuToggle = get('header-menu-toggle');
    
    const toggleSidebarFunc = () => {
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            if (window.innerWidth < 768) sidebar.classList.toggle('open');
        }
    };

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebarFunc);
    if (headerMenuToggle) headerMenuToggle.addEventListener('click', toggleSidebarFunc);

    setupTheme();
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (settingsMenu) settingsMenu.classList.toggle('active');
        });
    }

    themeOpts.forEach(opt => {
        opt.addEventListener('click', () => applyTheme(opt.dataset.themeVal));
    });

    if (modelSelector) {
        modelSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            if (modelDropdown) modelDropdown.classList.toggle('active');
        });
    }

    modelMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            appModel = item.dataset.model;
            const label = document.querySelector('#model-selector span');
            if (label) label.textContent = `TejGPT ${item.querySelector('strong').textContent}`;
            modelMenuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            if (modelDropdown) modelDropdown.classList.remove('active');
        });
    });

    if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    if (imagePreview) imagePreview.src = re.target.result;
                    attachedImage = re.target.result;
                    if (previewArea) previewArea.style.display = 'block';
                    updateInputArea();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePreview) {
        removePreview.addEventListener('click', () => {
            attachedImage = null;
            if (previewArea) previewArea.style.display = 'none';
            if (fileInput) fileInput.value = '';
            updateInputArea();
        });
    }

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (voiceOverlay) voiceOverlay.classList.add('active');
            setTimeout(() => {
                if (voiceOverlay) voiceOverlay.classList.remove('active');
                if (chatInput) chatInput.value = "What can you help me with today?";
                updateInputArea();
            }, 2500);
        });
    }

    if (cancelVoice) cancelVoice.addEventListener('click', () => voiceOverlay.classList.remove('active'));

    const clearBtn = get('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all chat conversations?')) {
                startNewChat();
                const items = historyList.querySelectorAll('.history-item');
                items.forEach(i => i.remove());
                if (settingsMenu) settingsMenu.classList.remove('active');
            }
        });
    }

    // --- SUPABASE & AUTH SYSTEM ---
    const SUPABASE_PROJECT_URL = 'https://pzxthufcjbohwxsbdsvd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6eHRodWZjamJvaHd4c2Jkc3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjcxNDgsImV4cCI6MjA5MDYwMzE0OH0.zKAaO2SUTddSXoJmuZnYw8apj9gWJXaap9RYt0D0RIw';
    
    let supabaseClient = null;
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
        } else {
            console.warn("Supabase SDK not loaded yet. Retrying in 2 seconds...");
        }
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }

    const profileBtn = get('profile-btn');
    const googleLoginBtn = get('google-login');
    const googleLoginWelcomeBtn = get('google-login-welcome');
    const authModal = get('auth-modal');
    const authClose = get('auth-close');
    const authSubmit = get('auth-submit');
    const authToggle = get('auth-toggle');
    const authTitle = get('auth-title');
    const authSubtitle = get('auth-subtitle');
    const authUserText = get('auth-username');
    const authPassText = get('auth-password');
    const loginHeaderBtn = get('login-btn-header');
    const authHeaderContainer = get('auth-header-container');
    const welcomeAuthContainer = get('welcome-auth-container');
    let isSignupMode = false;

    async function loadUserHistory(user) {
        try {
            // Prevent ALL caching mechanisms (Vercel Cache + Browser Cache)
            const res = await fetch(`/api/history?user=${encodeURIComponent(user)}&t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            let data = [];
            if (res.ok) {
                data = await res.json();
            }

            // HYBRID FALLBACK: If Supabase fails or is empty, check Local Storage!
            if ((!data || data.length === 0) && localStorage.getItem(`tejgpt_local_${user}`)) {
                try {
                    const localFallback = JSON.parse(localStorage.getItem(`tejgpt_local_${user}`));
                    if (localFallback && localFallback.length > 0) {
                        data = localFallback; // Local cache rescues the data
                    }
                } catch(err) { /* silent fail */ }
            }
            
            // Clear current screen
            if (messagesContainer) messagesContainer.innerHTML = '';
            chatHistory = [];
            const historyLabels = historyList?.querySelectorAll('.history-item');
            if (historyLabels) historyLabels.forEach(i => i.remove());

            if (data && data.length > 0) {
                if (welcomeScreen) welcomeScreen.style.display = 'none';
                
                // Track already added prompt tabs to avoid duplicates in sidebar
                const seenTabs = new Set();

                data.forEach(chat => {
                    if (chat.prompt && chat.response) {
                        renderMessage(chat.prompt, 'user');
                        chatHistory.push({ role: 'user', content: chat.prompt });
                        
                        if (!seenTabs.has(chat.prompt)) {
                             addHistoryTab(chat.prompt);
                             seenTabs.add(chat.prompt);
                        }
                        
                        renderMessage(chat.response, 'ai');
                        chatHistory.push({ role: 'assistant', content: chat.response });
                    }
                });
                
                // Immediately backup the loaded data locally just in case
                localStorage.setItem(`tejgpt_local_${user}`, JSON.stringify(data));
                
            } else {
                if (welcomeScreen) welcomeScreen.style.display = 'block';
            }
        } catch (e) {
            console.error("Failed to load chat history:", e);
        }
    }

    function updateAuthState() {
        const currentUser = localStorage.getItem('tejgpt_user');
        if (currentUser) {
            if (authHeaderContainer) authHeaderContainer.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'flex';
            if (welcomeAuthContainer) welcomeAuthContainer.style.display = 'none';
            const welcomeTitle = document.querySelector('.welcome-view h1');
            if (welcomeTitle) welcomeTitle.textContent = `Hello, ${currentUser}`;
            
            loadUserHistory(currentUser);
        } else {
            if (authHeaderContainer) authHeaderContainer.style.display = 'block';
            if (profileBtn) profileBtn.style.display = 'none';
            if (welcomeAuthContainer) welcomeAuthContainer.style.display = 'block';
            const welcomeTitle = document.querySelector('.welcome-view h1');
            if (welcomeTitle) welcomeTitle.textContent = `Hello, I am TejGPT`;
            
            startNewChat();
        }
    }

    const handleGoogleAuth = async (btn) => {
        if (!supabaseClient) {
            alert("Error: Supabase is still loading. Please refresh and try again in 3 seconds.");
            return;
        }
        try {
            btn.disabled = true;
            const orgContent = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Connecting...`;
            if (window.lucide) lucide.createIcons();
            
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            
            if (error) {
                alert("Auth Error: " + error.message);
                btn.disabled = false;
                btn.innerHTML = orgContent;
            }
        } catch (ex) {
            alert("Critical Error: " + ex.message);
            btn.disabled = false;
        }
    };

    if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => handleGoogleAuth(googleLoginBtn));
    if (googleLoginWelcomeBtn) googleLoginWelcomeBtn.addEventListener('click', () => handleGoogleAuth(googleLoginWelcomeBtn));

    if (authToggle) {
        authToggle.addEventListener('click', () => {
            isSignupMode = !isSignupMode;
            authTitle.textContent = isSignupMode ? "Create account" : "Welcome back";
            authSubtitle.textContent = isSignupMode ? "Join the future of intelligence." : "Login to save your personal preferences.";
            authSubmit.textContent = isSignupMode ? "Sign Up" : "Sign In";
            authToggle.innerHTML = isSignupMode ? "Already have an account? <span>Sign in</span>" : "Don't have an account? <span>Sign up</span>";
        });
    }

    if (authSubmit) {
        authSubmit.addEventListener('click', async () => {
            const username = authUserText.value.trim();
            const password = authPassText.value.trim();
            if (username && password) {
                authSubmit.disabled = true;
                authSubmit.textContent = isSignupMode ? "Signing Up..." : "Logging In...";
                try {
                    const res = await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: isSignupMode ? 'signup' : 'login', username, password })
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    localStorage.setItem('tejgpt_user', username);
                    authModal.classList.remove('active');
                    updateAuthState();
                } catch (err) {
                    alert(`Auth Error: ${err.message}`);
                } finally {
                    authSubmit.disabled = false;
                    authSubmit.textContent = isSignupMode ? "Sign Up" : "Sign In";
                }
            }
        });
    }

    if (loginHeaderBtn) loginHeaderBtn.addEventListener('click', () => authModal.classList.add('active'));
    if (profileBtn) {
        profileBtn.addEventListener('click', async () => {
            const currentUser = localStorage.getItem('tejgpt_user');
            if (confirm(`Logged in as ${currentUser}. Sign out?`)) {
                if (supabaseClient) {
                    await supabaseClient.auth.signOut();
                }
                localStorage.removeItem('tejgpt_user');
                location.reload();
            }
        });
    }
    if (authClose) authClose.addEventListener('click', () => authModal.classList.remove('active'));

    if (supabaseClient) {
        // Handle Session Change
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email;
                localStorage.setItem('tejgpt_user', name);
                if (authModal) authModal.classList.remove('active');
                updateAuthState();
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem('tejgpt_user');
                updateAuthState();
            }
        });

        // Ensure session resolves safely on load
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user) {
                const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email;
                localStorage.setItem('tejgpt_user', name);
                if (authModal) authModal.classList.remove('active');
                updateAuthState();
            }
        });
    }

    updateAuthState();

    // Support Trigger
    if (liveSupportTrigger) {
        liveSupportTrigger.addEventListener('click', () => {
            if (supportWidget) supportWidget.classList.add('active');
            if (window.innerWidth < 768 && sidebar) sidebar.classList.remove('open');
        });
    }
    if (supportClose) supportClose.addEventListener('click', () => supportWidget.classList.remove('active'));
    if (supportSend) supportSend.addEventListener('click', handleSupportSend);
    if (supportInput) {
        supportInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSupportSend();
        });
    }

    setInterval(syncSupportMessages, 1000);
    window.addEventListener('storage', (e) => {
        if (e.key === sessionKey) syncSupportMessages();
    });

    document.addEventListener('click', (e) => {
        if (settingsMenu && settingsBtn && !settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) settingsMenu.classList.remove('active');
        if (modelSelector && modelDropdown && !modelSelector.contains(e.target)) modelDropdown.classList.remove('active');
    });

    if (chatInput) chatInput.focus();
}

function setupTheme() {
    applyTheme(appTheme, false);
}

function applyTheme(theme, save = true) {
    appTheme = theme;
    if (save) localStorage.setItem('tejgpt_theme', theme);
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
    themeOpts.forEach(opt => opt.classList.toggle('active', opt.dataset.themeVal === theme));
}

function updateInputArea() {
    if (chatInput) {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
        if (sendBtn) sendBtn.disabled = chatInput.value.trim() === '' && !attachedImage;
    }
}

async function submitMessage() {
    const text = chatInput.value.trim();
    if (!text && !attachedImage) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;
    if (previewArea) previewArea.style.display = 'none';
    
    const imgData = attachedImage;
    attachedImage = null;

    if (welcomeScreen) welcomeScreen.style.display = 'none';
    renderMessage(text || "Uploaded an image", 'user');
    const aiBox = renderMessage('', 'ai', true);
    
    try {
        const response = await callGroqAPI(text, imgData);
        streamResponse(aiBox, response);
        addHistoryTab(text || "Image uploaded");
        
        // HYBRID BACKUP: Every time an exchange succeeds, backup to local storage silently!
        const currentUser = localStorage.getItem('tejgpt_user') || "guest";
        try {
            const currentSave = JSON.parse(localStorage.getItem(`tejgpt_local_${currentUser}`) || '[]');
            currentSave.push({ prompt: text || "Image uploaded", response: response });
            localStorage.setItem(`tejgpt_local_${currentUser}`, JSON.stringify(currentSave));
        } catch (e) {}
        
    } catch (err) {
        aiBox.innerHTML = `<span>Error: ${err.message}</span>`;
    }
}

async function callGroqAPI(prompt, imgData) {
    const currentUser = localStorage.getItem('tejgpt_user') || "guest";
    
    let userContent = prompt || "Analyze this image.";
    if (imgData) {
        userContent = [
            { type: "text", text: userContent },
            { type: "image_url", image_url: { url: imgData } }
        ];
    }
    
    const messages = [
        ...chatHistory.slice(-10),
        { role: "user", content: userContent }
    ];

    let res;
    try {
        res = await fetch('/api/chat', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ messages, user: currentUser }) 
        });
    } catch (fetchError) {
        throw new Error("Cannot reach the AI network. Are you testing on Vercel?");
    }

    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch (parseError) {
            throw new Error(`Local Server Detected. The AI Brain only works on Vercel. Please test on your Live site!`);
        }
        
        // If Quota Over (403), return the custom message to be displayed as AI text.
        if (res.status === 403) return errorData.error;
        throw new Error(errorData.error || 'Backend API limit reached.');
    }
    
    let data;
    try {
        data = await res.json();
    } catch (parseError) {
        throw new Error(`Data format error. Please test on your Live Vercel site!`);
    }

    const content = data.choices && data.choices[0] ? data.choices[0].message.content : "";
    
    let histPrompt = prompt || "Image";
    if (imgData) {
        histPrompt = [
            { type: "text", text: prompt || "Analyze this image." },
            { type: "image_url", image_url: { url: imgData } }
        ];
    }
    
    chatHistory.push({ role: "user", content: histPrompt }, { role: "assistant", content: content });
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
    msg.className = `support-msg ${role}`;
    msg.textContent = text;
    if (supportMessages) {
        supportMessages.appendChild(msg);
        supportMessages.scrollTop = supportMessages.scrollHeight;
    }
    if (save) {
        const msgs = JSON.parse(localStorage.getItem(sessionKey) || '[]');
        msgs.push({ role, text, timestamp: Date.now() });
        localStorage.setItem(sessionKey, JSON.stringify(msgs));
    }
}

function syncSupportMessages() {
    const stored = JSON.parse(localStorage.getItem(sessionKey) || '[]');
    const currentCount = supportMessages ? supportMessages.querySelectorAll('.support-msg').length : 0;
    if (stored.length > currentCount) {
        for (let i = currentCount; i < stored.length; i++) {
            addSupportMessage(stored[i].text, stored[i].role);
        }
    }
}

function handleSupportSend() {
    const text = supportInput.value.trim();
    if (!text) return;
    const messages = JSON.parse(localStorage.getItem(sessionKey) || '[]');
    messages.push({ role: 'user', text, timestamp: Date.now() });
    localStorage.setItem(sessionKey, JSON.stringify(messages));
    supportInput.value = '';
    syncSupportMessages();
}

function startNewChat() {
    if (messagesContainer) messagesContainer.innerHTML = '';
    if (welcomeScreen) welcomeScreen.style.display = 'block';
    chatHistory = [];
}

function addHistoryTab(text) {
    if (!text) return;
    const tab = document.createElement('div');
    tab.className = 'history-item nav-item glass-hover';
    tab.innerHTML = `<i data-lucide="message-square" size="16"></i> <span class="nav-text" style="font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; display: inline-block; vertical-align: middle;">${text}</span>`;
    tab.onclick = () => setInput(text);
    if (historyList) {
        const label = historyList.querySelector('.history-section-label');
        if (label && label.nextSibling) historyList.insertBefore(tab, label.nextSibling);
        else historyList.appendChild(tab);
    }
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
    if (chatInput) {
        chatInput.value = text;
        updateInputArea();
        submitMessage();
    }
};

init();
