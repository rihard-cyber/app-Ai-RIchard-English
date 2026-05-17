import { apiFetch } from './apiClient.js';

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

export const generateChatResponse = async (payload) => {
    const data = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        data.candidates[0].content.parts[0].text = deepSanitizeJSON(data.candidates[0].content.parts[0].text);
    }

    return data;
};
