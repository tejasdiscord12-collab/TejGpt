import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pzxthufcjbohwxsbdsvd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Service role key in Vercel
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages, user } = req.body; // 'user' is the username or Google ID

        if (!user) return res.status(400).json({ error: 'User must be logged in to chat.' });

        // 1. Check the Quota (Count records for this user)
        const { data: chatsCount, error: countError } = await supabase
            .from('chats_history')
            .select('*', { count: 'exact' })
            .eq('username', user);

        const count = chatsCount?.length || 0;
        const QUOTA_LIMIT = 15;

        if (count >= QUOTA_LIMIT) {
            return res.status(403).json({ 
                error: `🚨 **Access Denied**: Your quota of ${QUOTA_LIMIT} chats is officially over. Please contact Tejas or upgrade your subscription to continue using TejGPT Pro.` 
            });
        }

        // 2. Call the AI WITH Quota Knowledge
        if (!GROQ_API_KEY) return res.status(500).json({ error: 'Groq API Key missing.' });

        let hasImage = false;
        messages.forEach(m => {
            if (Array.isArray(m.content)) hasImage = true;
        });

        const selectedModel = hasImage ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";

        const systemMsg = { 
            role: "system", 
            content: `You are TejGPT, a professional AI created by Tejas. STRICT RULE: NEVER mention message counts, quotas, or limits in your responses UNLESS the user explicitly asks "What is my quota" or "How many messages left". If they do ask, tell them they have used ${count} out of ${QUOTA_LIMIT} messages. Otherwise, focus entirely on answering their prompt naturally and professionally. If given an image, please analyze it in detail.` 
        };

        let groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [systemMsg, ...messages], 
                model: selectedModel, 
                temperature: 0.7 
            })
        });

        // Auto-Fallback Logic: If the first key hits a rate limit or fails, try the secondary key.
        if (!groqResponse.ok || groqResponse.status === 429) {
            console.warn("Primary Groq API failed or hit limits. Engaging Fallback API Key...");
            const FALLBACK_KEY = process.env.GROQ_API_KEY_FALLBACK;
            
            if (FALLBACK_KEY) {
                groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${FALLBACK_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: [systemMsg, ...messages], 
                        model: selectedModel, 
                        temperature: 0.7 
                    })
                });
            }
        }

        const groqData = await groqResponse.json();
        const aiMessage = groqData.choices && groqData.choices[0] ? groqData.choices[0].message.content : "";

        // 3. Save to Supabase History
        if (aiMessage) {
            let savedPrompt = messages[messages.length - 1].content;
            if (Array.isArray(savedPrompt)) {
                savedPrompt = savedPrompt.find(c => c.type === "text")?.text || "Image content";
            }
            await supabase.from('chats_history').insert([
                { username: user, prompt: savedPrompt, response: aiMessage }
            ]);
        }

        res.status(200).json(groqData);
    } catch (error) {
        console.error("Critical API Error:", error);
        res.status(500).json({ error: 'Failed to process SaaS request.' });
    }
}
