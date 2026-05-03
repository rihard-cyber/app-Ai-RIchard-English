import { supabase } from './supabaseClient';

export const fetchGeminiWithRotation = async (payload) => {
    let rawKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    try {
        const { data } = await supabase.from('app_settings').select('value').eq('id', 'api_keys').single();
        if (data && data.value) {
            rawKey = data.value;
            localStorage.setItem('gemini_api_key', rawKey);
        }
    } catch (err) { console.error("DB Key Error:", err); }

    const apiKeys = rawKey.split(',').map(k => k.trim()).filter(k => k);
    if (apiKeys.length === 0) throw new Error("API Key AI belum diatur.");

    const translateToOpenAIFormat = (geminiPayload) => {
        const messages = [];
        if (geminiPayload.systemInstruction?.parts?.[0]?.text) {
            messages.push({ role: "system", content: geminiPayload.systemInstruction.parts[0].text });
        }
        if (geminiPayload.contents) {
            geminiPayload.contents.forEach(c => {
                messages.push({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts[0].text });
            });
        }
        return { messages, temperature: geminiPayload.generationConfig?.temperature || 0.7, max_tokens: geminiPayload.generationConfig?.maxOutputTokens || 1024 };
    };

    let lastError = "Unknown Error";

    // Coba 2 putaran (Loop) jika semua key limit, istirahat 3.5 detik lalu mencoba lagi otomatis
    for (let attempt = 0; attempt < 2; attempt++) {
        for (const key of apiKeys) {
            try {
                if (key.startsWith('gsk_')) {
                    const groqPayload = { ...translateToOpenAIFormat(payload), model: "llama-3.3-70b-versatile" };
                    const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(groqPayload) });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error?.message || `Groq Error: ${res.status}`);
                    return { candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] };
                } else if (key.startsWith('sk-')) {
                    const oaPayload = { ...translateToOpenAIFormat(payload), model: "gpt-4o-mini" };
                    const res = await fetch(`https://api.openai.com/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(oaPayload) });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error?.message || `OpenAI Error: ${res.status}`);
                    return { candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] };
                } else {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error?.message || `Gemini Error: ${res.status}`);
                    return data;
                }
            } catch (err) {
                lastError = err.message;
                const lowerErr = lastError.toLowerCase();
                if (lowerErr.includes('quota') || lowerErr.includes('limit') || lowerErr.includes('failed to fetch') || lowerErr.includes('429') || lowerErr.includes('insufficient') || lowerErr.includes('too many') || lowerErr.includes('leaked') || lowerErr.includes('api key')) continue;
                throw err;
            }
        }
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 3500)); // Tunggu 3.5 detik sebelum retry
    }
    throw new Error(`Sistem AI sedang sibuk/limit. Mohon tunggu dan coba lagi. (Pesan terakhir: ${lastError})`);
};