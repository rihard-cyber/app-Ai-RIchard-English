export const deepSanitizeJSON = (text) => {
    if (!text) return text;
    let cleanedText = text;

    // Handle App.jsx expected format (JSON trailing after '---')
    if (cleanedText.includes('---')) {
        let parts = cleanedText.split('---');
        let potentialJson = parts[parts.length - 1];

        potentialJson = potentialJson.replace(/```json/gi, '').replace(/```/g, '').trim();
        potentialJson = potentialJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        parts[parts.length - 1] = potentialJson;
        cleanedText = parts.join('\n---\n');
    } else {
        // Fallback for direct JSON objects
        let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            let potentialJson = jsonMatch[0];
            potentialJson = potentialJson.replace(/```json/gi, '').replace(/```/g, '').trim();
            potentialJson = potentialJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            cleanedText = cleanedText.replace(jsonMatch[0], potentialJson);
        }
    }
    return cleanedText;
};

const getRandomKey = (keyString) => {
    if (!keyString) return null;
    const keys = keyString.split(',').map(k => k.trim()).filter(k => k);
    if (keys.length === 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
};

export const generateChatResponse = async (payload, globalApiKey) => {
    // Pengamanan Struktur: Handle parsing jika payload masih berupa string atau undefined
    let keys = typeof globalApiKey === 'object' && globalApiKey !== null ? globalApiKey : {};
    if (typeof globalApiKey === 'string') {
        try { keys = JSON.parse(globalApiKey); }
        catch (e) { keys = { gemini: globalApiKey }; }
    }

    const geminiKey = getRandomKey(keys.gemini || keys.core);
    const groqKey = getRandomKey(keys.groq);
    const openaiKey = getRandomKey(keys.openai);

    if (geminiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "API Error");

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            let rawText = data.candidates[0].content.parts[0].text;
            data.candidates[0].content.parts[0].text = deepSanitizeJSON(rawText);
        }
        return data;
    } else if (groqKey) {
        const url = `https://api.groq.com/openai/v1/chat/completions`;
        const messages = [];

        if (payload.systemInstruction?.parts?.[0]?.text) {
            messages.push({ role: 'system', content: payload.systemInstruction.parts[0].text });
        }

        payload.contents.forEach(msg => {
            messages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.parts[0].text
            });
        });

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({ model: "llama3-8b-8192", messages: messages, temperature: 0.7 })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Groq API Error");

        const rawText = data.choices?.[0]?.message?.content || "";
        // Return exactly in the schema App.jsx expects (Gemini format)
        return { candidates: [{ content: { parts: [{ text: deepSanitizeJSON(rawText) }] } }] };
    } else if (openaiKey) {
        const url = `https://api.openai.com/v1/chat/completions`;
        const messages = [];

        if (payload.systemInstruction?.parts?.[0]?.text) {
            messages.push({ role: 'system', content: payload.systemInstruction.parts[0].text });
        }

        payload.contents.forEach(msg => {
            messages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.parts[0].text
            });
        });

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: messages, temperature: 0.7 })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "OpenAI API Error");

        const rawText = data.choices?.[0]?.message?.content || "";
        return { candidates: [{ content: { parts: [{ text: deepSanitizeJSON(rawText) }] } }] };
    } else {
        throw new Error("Tidak ada Kredensial AI yang valid ditemukan (OpenAI / Gemini).");
    }
};