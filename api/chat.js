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

        if (countError && countError.code !== 'PGRST116') { // Ignore "table not found" for first run
             console.error("Quota Check Error:", countError);
        }

        const count = chatsCount?.length || 0;
        const QUOTA_LIMIT = 15;

        if (count >= QUOTA_LIMIT) {
            return res.status(200).json({ 
                choices: [{ 
                    message: { 
                        content: "🚨 **Access Denied**: Your 15-chat quota is officially over. Please contact Tejas or upgrade your subscription to continue using TejGPT Pro." 
                    } 
                }] 
            });
        }

        // 2. Call the AI
        if (!GROQ_API_KEY) return res.status(500).json({ error: 'Groq API Key missing.' });

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, model: "llama-3.3-70b-versatile", temperature: 0.7 })
        });

        const groqData = await groqResponse.json();
        const aiMessage = groqData.choices[0]?.message?.content || "";

        // 3. Save to Supabase History (if AI responded)
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
