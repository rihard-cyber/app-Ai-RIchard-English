import { generateChatResponse } from './ChatService.js';
import { apiFetch } from './apiClient.js';

export const translateText = async (text) => {
    try {
        const data = await apiFetch('/api/translate', {
            method: 'POST',
            body: JSON.stringify({ text, targetLanguage: 'id' }),
        });
        if (data.translatedText) return data.translatedText;
    } catch (error) {
        console.warn("Backend translation failed. Falling back to core AI.", error);
    }

    const payload = {
        contents: [{ role: 'user', parts: [{ text: text }] }],
        systemInstruction: { parts: [{ text: "Translate this English sentence to natural, casual, friendly Indonesian. ONLY return the translation without any other text." }] }
    };

    try {
        const data = await generateChatResponse(payload);
        return data.candidates[0].content.parts[0].text.trim();
    } catch (err) {
        console.error("Fallback translation also failed", err);
        return "[Terjemahan Gagal. Periksa Koneksi/API Key]";
    }
};
