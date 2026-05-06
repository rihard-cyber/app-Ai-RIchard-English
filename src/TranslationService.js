import { generateChatResponse } from './ChatService.js';

const getRandomKey = (keyString) => {
    if (!keyString) return null;
    const keys = keyString.split(',').map(k => k.trim()).filter(k => k);
    if (keys.length === 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
};

export const translateText = async (text, globalApiKey) => {
    const l10nKey = getRandomKey(globalApiKey?.l10n);

    if (l10nKey) {
        try {
            const response = await fetch('https://api.l10n.dev/v1/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': l10nKey
                },
                body: JSON.stringify({ text: text, target_language: 'id' })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.translated_text) return data.translated_text;
            }
            console.warn("l10n.dev translation failed or limits reached, falling back...");
        } catch (error) {
            console.warn("l10n.dev network error, falling back to Core AI...", error);
        }
    }

    // Core AI Fallback
    const payload = {
        contents: [{ role: 'user', parts: [{ text: text }] }],
        systemInstruction: { parts: [{ text: "Translate this English sentence to natural, casual, friendly Indonesian. ONLY return the translation without any other text." }] }
    };

    try {
        const data = await generateChatResponse(payload, globalApiKey);
        return data.candidates[0].content.parts[0].text.trim();
    } catch (err) {
        console.error("Fallback translation also failed", err);
        return "[Terjemahan Gagal. Periksa Koneksi/API Key]";
    }
};