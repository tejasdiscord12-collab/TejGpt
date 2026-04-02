import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pzxthufcjbohwxsbdsvd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { user } = req.query;

        if (!user) {
            return res.status(400).json({ error: 'User must be defined.' });
        }

        const { data, error } = await supabase
            .from('chats_history')
            .select('*')
            .eq('username', user);

        if (error) {
            throw error;
        }

        res.status(200).json(data || []);
    } catch (error) {
        console.error("History Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch user history.' });
    }
}
