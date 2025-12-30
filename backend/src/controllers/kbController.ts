import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { getEmbedding } from '../services/aiService';

export const searchKB = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;
        if (!query) {
            res.status(400).json({ error: 'Query is required' });
            return;
        }

        const embedding = await getEmbedding(query as string);

        const { data, error } = await supabase.rpc('match_kb_articles', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5
        });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("Search KB Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const addArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, content, category } = req.body;
        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        // 1. Insert Article
        const { data: article, error: articleError } = await supabase
            .from('kb_articles')
            .insert([{ title, slug, content, category }])
            .select()
            .single();

        if (articleError) throw articleError;

        // 2. Generate Embedding and Insert
        // Ideally we chunk content, but for this prototype we'll embed the whole/summary
        const embedding = await getEmbedding(`${title}: ${content}`);

        const { error: embedError } = await supabase
            .from('kb_embeddings')
            .insert([{
                article_id: article.id,
                chunk_index: 0,
                chunk_content: content,
                embedding
            }]);

        if (embedError) console.error("Embedding Save Error:", embedError);

        res.status(201).json(article);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllArticles = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('kb_articles')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const updateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, content, category } = req.body;

        const { error } = await supabase
            .from('kb_articles')
            .update({ title, content, category, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // Regenerate embedding if title or content changed
        if (title || content) {
            try {
                // Fetch the updated article to get full context if partial update (though frontend sends full usually)
                // For simplicity assuming we have title and content from body or should fetch. 
                // However generally update sends full payload.
                const validTitle = title;
                const validContent = content;

                if (validTitle && validContent) {
                    const embedding = await getEmbedding(`${validTitle}: ${validContent}`);

                    // Update embedding (assuming 1:1 for this simple implementation)
                    // We delete old embeddings for this article and insert new one
                    await supabase.from('kb_embeddings').delete().eq('article_id', id);

                    await supabase.from('kb_embeddings').insert([{
                        article_id: id,
                        chunk_index: 0,
                        chunk_content: validContent,
                        embedding
                    }]);
                }
            } catch (embedError) {
                console.error("Failed to update embedding:", embedError);
                // Non-blocking error, user still sees text update
            }
        }

        res.json({ message: 'Article updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('kb_articles')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Article deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
