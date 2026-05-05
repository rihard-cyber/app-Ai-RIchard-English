import { TextToSpeech } from '@capacitor-community/text-to-speech';

export const speakText = async (text, keysObj, options = {}) => {
    const elevenKeys = (keysObj?.voice || '').split(',').map(k => k.trim()).filter(Boolean);
    const cleanText = text.replace(/❌[\s\S]*?✅/g, '').replace(/[✅❌*#_\\]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').substring(0, 600).trim();

    if (!cleanText) {
        if (options.onEnd) options.onEnd();
        return;
    }

    if (elevenKeys.length > 0) {
        for (const key of elevenKeys) {
            try {
                const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM';
                const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
                    method: 'POST',
                    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: cleanText, model_id: 'eleven_multilingual_v2' })
                });
                if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    if (options.onEnd) { audio.onended = options.onEnd; audio.onerror = options.onEnd; }
                    audio.play();
                    return;
                }
            } catch (e) { console.error("ElevenLabs fallback", e); }
        }
    }

    try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({ text: cleanText, lang: options.lang || 'en-US', rate: options.rate || 0.9, pitch: options.pitch || 1.0 });
        if (options.onEnd) options.onEnd();
    } catch (e) {
        if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = options.lang || 'en-US';
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.0;
            if (options.onEnd) { utterance.onend = options.onEnd; utterance.onerror = options.onEnd; }
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            if (options.onEnd) options.onEnd();
        }
    }
};