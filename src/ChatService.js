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

export const generateChatResponse = async (payload, globalApiKey) => {
    const geminiKey = globalApiKey?.gemini || globalApiKey?.core;
    const openaiKey = globalApiKey?.openai;

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
    } else if (openaiKey) {
        // OpenAI Integration Fallback logic
        throw new Error("OpenAI mapping not fully implemented in current scope. Please prioritize Gemini API.");
        // Bisa ditambahkan mapping full OpenAI API ke depannya menggunakan format array payload messages
    } else {
        throw new Error("Tidak ada Kredensial AI yang valid ditemukan (OpenAI / Gemini).");
    }
};