import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const generateText = async (prompt: string, context?: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const fullPrompt = context ? `Context: ${context}\n\nQuestion: ${prompt}` : prompt;
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Text Error:", error);
        throw error;
    }
};

export const generateFromImage = async (prompt: string, imageBuffer: Buffer, mimeType: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert buffer to base64
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw error;
    }
};

export const getEmbedding = async (text: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Gemini Embedding Error:", error);
        throw error;
    }
}
