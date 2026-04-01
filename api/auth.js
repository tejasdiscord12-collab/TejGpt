import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://pzxthufcjbohwxsbdsvd.supabase.co',
    process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { type, username, password } = req.body;
    const email = `${username}@tejgpt.com`; // Using username as email for simplicity

    try {
        if (type === 'signup') {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            return res.status(200).json({ message: 'Signup successful', user: data.user });
        } else if (type === 'login') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return res.status(200).json({ message: 'Login successful', user: data.user, session: data.session });
        }
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}
