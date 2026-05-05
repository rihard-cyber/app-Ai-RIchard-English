export const generateChatResponse = async (payload, keysObj) => {
    const rawKey = keysObj?.core || localStorage.getItem('gemini_api_key') || '';
    const keys = rawKey.split(',').map(k => k.trim()).filter(Boolean);
    if (!keys.length) throw new Error("Core API Key belum diatur.");

    const formatOpenAI = (p) => {
        const messages = [];
        if (p.systemInstruction?.parts?.[0]?.text) {
            messages.push({ role: "system", content: p.systemInstruction.parts[0].text });
        }
        if (p.contents) {
            p.contents.forEach(c => {
                messages.push({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts[0].text });
            });
        }
        return { messages, temperature: p.generationConfig?.temperature || 0.7, max_tokens: p.generationConfig?.maxOutputTokens || 1024 };
    };

    let lastError = "Unknown Error";
    for (let attempt = 0; attempt < 2; attempt++) {
        for (const key of keys) {
            try {
                if (key.startsWith('gsk_')) {
                    const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ ...formatOpenAI(payload), model: "llama-3.3-70b-versatile" }) });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error?.message || `Groq Error`);
                    return { candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] };
                } else if (key.startsWith('sk-')) {
                    const res = await fetch(`https://api.openai.com/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ ...formatOpenAI(payload), model: "gpt-4o-mini" }) });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error?.message || `OpenAI Error`);
                    return { candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] };
                } else {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error?.message || `Gemini Error`);
                    return data;
                }
            } catch (err) {
                lastError = err.message;
                const lower = lastError.toLowerCase();
                if (lower.includes('429') || lower.includes('quota') || lower.includes('limit')) continue;
                throw err;
            }
        }
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 3500));
    }
    throw new Error(`Sistem AI sedang sibuk. (Error: ${lastError})`);
};