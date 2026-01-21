import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';

export const checkHealth = async (req: Request, res: Response) => {
    try {
        // Perform a simple query to keep Supabase active
        const { data, error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            console.error('Supabase health check failed:', error);
            return res.status(500).json({ status: 'error', message: 'Database connection failed' });
        }

        res.status(200).json({ status: 'ok', message: 'Service is healthy', timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
