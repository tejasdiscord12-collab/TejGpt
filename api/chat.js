export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages } = req.body;
        const API_KEY = process.env.GROQ_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'API Key not configured in Vercel environment.' });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                stream: false
            })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process AI request' });
    }
}
