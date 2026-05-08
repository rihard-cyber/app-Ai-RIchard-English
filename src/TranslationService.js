import { generateChatResponse } from './ChatService.js';

export const translateText = async (text, globalApiKey) => {
    let keysData = typeof globalApiKey === 'object' && globalApiKey !== null ? globalApiKey : {};
    if (typeof globalApiKey === 'string') {
        try { keysData = JSON.parse(globalApiKey); }
        catch (e) { keysData = {}; }
    }

    const l10nKeysList = (keysData.l10n || globalApiKey?.l10n || '').split(',').map(k => k.trim()).filter(k => k);
    l10nKeysList.sort(() => Math.random() - 0.5); // Acak untuk load balancing

    if (l10nKeysList.length > 0) {
        for (const key of l10nKeysList) {
            try {
                const response = await fetch('https://api.l10n.dev/v1/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': key
                    },
                    body: JSON.stringify({ text: text, target_language: 'id' })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.translated_text) return data.translated_text;
                }
                throw new Error('Limit habis atau key gagal');
            } catch (error) {
                console.warn(`l10n.dev key failed, memutar ke kunci berikutnya...`, error);
                continue; // Coba kunci selanjutnya di dalam array
            }
        }
        console.warn("Semua kunci l10n.dev gagal / limit habis. Jatuh ke fallback Core AI.");
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