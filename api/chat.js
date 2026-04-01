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

        const systemMsg = { 
            role: "system", 
            content: `You are TejGPT, created by Tejas. You are aware that the user ${user} has used ${count} out of ${QUOTA_LIMIT} messages. If the user asks about their quota or how many messages they have left, tell them clearly using this data.` 
        };

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [systemMsg, ...messages], 
                model: "llama-3.3-70b-versatile", 
                temperature: 0.7 
            })
        });

        const groqData = await groqResponse.json();
        const aiMessage = groqData.choices[0]?.message?.content || "";

        // 3. Save to Supabase History
        if (aiMessage) {
            await supabase.from('chats_history').insert([
                { username: user, prompt: messages[messages.length - 1].content, response: aiMessage }
            ]);
        }

        res.status(200).json(groqData);
    } catch (error) {
        console.error("Critical API Error:", error);
        res.status(500).json({ error: 'Failed to process SaaS request.' });
    }
}
 village
