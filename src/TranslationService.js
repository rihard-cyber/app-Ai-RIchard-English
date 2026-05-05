import { generateChatResponse } from './ChatService';

export const translateText = async (text, keysObj) => {
    const deepLKeys = (keysObj?.translation || '').split(',').map(k => k.trim()).filter(Boolean);
    if (deepLKeys.length > 0) {
        for (const key of deepLKeys) {
            try {
                const url = key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Authorization': `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: [text], target_lang: 'ID' })
                });
                const data = await res.json();
                if (res.ok && data.translations?.[0]) return data.translations[0].text;
            } catch (e) { console.error("DeepL fallback", e); }
        }
    }
    const payload = {
        contents: [{ role: 'user', parts: [{ text }] }],
        systemInstruction: { parts: [{ text: "Translate this English sentence to natural, casual, friendly Indonesian (Kampung Inggris style). ONLY return the translation." }] }
    };
    const data = await generateChatResponse(payload, keysObj);
    return data.candidates[0].content.parts[0].text;
};