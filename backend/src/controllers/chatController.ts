import { Request, Response } from 'express';
import { generateText, generateFromImage } from '../services/aiService';
import { supabase } from '../services/supabaseClient';

import { getEmbedding } from '../services/aiService';

import { WithAuthProp } from '@clerk/clerk-sdk-node';

export const handleTextChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as WithAuthProp<Request>).auth.userId;
        const { message, conversationId } = req.body;

        // --- 1. Fetch User Context (Parallel) ---
        const [timetableRes, remindersRes, eventsRes] = await Promise.all([
            // A. Timetable (Next 7 days)
            supabase.from('timetables').select('*').eq('user_id', userId),
            // B. Reminders (Pending)
            supabase.from('reminders').select('*').eq('user_id', userId).eq('is_completed', false),
            // C. Campus Events (Recent)
            supabase.from('events_notices').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        const timetables = timetableRes.data || [];
        const reminders = remindersRes.data || [];
        const events = eventsRes.data || [];

        // --- 2. Fetch Knowledge Base Context ---
        const embedding = await getEmbedding(message);
        const { data: kbData } = await supabase.rpc('match_kb_articles', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3
        });

        // --- 3. Construct System Prompt ---
        const systemContext = `
You are the Campus Assistant AI. You have access to the user's personal schedule and campus data.
Answer the user's question based on the following context.

--- USER CONTEXT ---
TIMETABLE (Weekly Schedule):
${timetables.length ? timetables.map((t: any) => `- ${t.day_of_week}: ${t.course_name} (${t.course_code}) at ${t.start_time} in ${t.location}`).join('\n') : "No classes scheduled."}

PENDING REMINDERS:
${reminders.length ? reminders.map((r: any) => `- ${r.title} (Due: ${r.due_at}, Category: ${r.category})`).join('\n') : "No pending reminders."}

--- CAMPUS CONTEXT ---
RECENT EVENTS & NOTICES:
${events.length ? events.map((e: any) => `- [${e.category}] ${e.title}: ${e.description} (Date: ${e.event_date || 'N/A'})`).join('\n') : "No recent notices."}

KNOWLEDGE BASE (Policies & Info):
${kbData && kbData.length > 0 ? kbData.map((d: any) => `- ${d.title}: ${d.content}`).join('\n') : "No specific KB articles found."}
--------------------

If the answer is not in the context, say you don't know but try to be helpful based on general knowledge if appropriate.
Keep answers concise and friendly.
`;

        console.log("Looking up context for:", message);
        // console.log("System Context Preview:", systemContext.substring(0, 500) + "...");

        const responseText = await generateText(message, systemContext);

        // TODO: Save to DB conversation history if needed

        res.json({ response: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
};

export const handleImageChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as WithAuthProp<Request>).auth.userId;
        const { prompt } = req.body;

        if (!req.files || Object.keys(req.files).length === 0) {
            res.status(400).json({ error: 'No files were uploaded.' });
            return;
        }

        const imageFile = req.files.image as any; // express-fileupload type
        const imageBuffer = imageFile.data;
        const mimeType = imageFile.mimetype;

        const responseText = await generateFromImage(prompt, imageBuffer, mimeType);

        // TODO: Save to DB (upload image to storage, save message)

        res.json({ response: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process image' });
    }
};
