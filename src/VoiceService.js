import { apiFetch } from './apiClient.js';

const fallbackTTS = (text, options = {}) => {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || 'en-US';
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
    });
};

export const testIFlytekConnection = async () => ({
    success: false,
    message: "Tes iFLYTEK langsung dari browser dinonaktifkan. Simpan kredensial di server lalu gunakan endpoint backend untuk validasi.",
});

export const speakText = async (text, _globalApiKey, options = {}) => {
    try {
        const data = await apiFetch('/api/tts', {
            method: 'POST',
            body: JSON.stringify({
                text,
                lang: options.lang || 'en-US',
                rate: options.rate || 1.0,
                pitch: options.pitch || 1.0,
                voiceName: options.voiceName || 'Kore',
                voiceId: options.voiceId,
            }),
        });

        if (!data.audioData) throw new Error('No audio data from server');

        const byteCharacters = atob(data.audioData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const blob = new Blob([new Uint8Array(byteNumbers)], { type: data.mimeType || 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);

        return new Promise((resolve) => {
            const audio = new Audio(audioUrl);
            const cleanup = () => {
                URL.revokeObjectURL(audioUrl);
                options.onEnd?.();
                resolve();
            };
            audio.onended = cleanup;
            audio.onerror = () => fallbackTTS(text, options).then(cleanup);
            audio.play().catch(() => fallbackTTS(text, options).then(cleanup));
        });
    } catch (error) {
        console.warn("Server TTS failed. Falling back to browser TTS.", error);
        await fallbackTTS(text, options);
        options.onEnd?.();
    }
};
