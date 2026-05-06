async function getIFlytekAuthUrl(apiKey, apiSecret) {
    const host = "tts-api.xfyun.cn";
    const path = "/v2/tts";
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
        "raw", encoder.encode(apiSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signatureOrigin));
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);

    return `wss://${host}${path}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${host}`;
}

const fallbackTTS = (text, options) => {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options?.lang || 'en-US';
        utterance.rate = options?.rate || 1.0;
        utterance.pitch = options?.pitch || 1.0;
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
    });
};

const getRandomKey = (keyString) => {
    if (!keyString) return null;
    const keys = keyString.split(',').map(k => k.trim()).filter(k => k);
    if (keys.length === 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
};

export const speakText = async (text, globalApiKey, options = {}) => {
    // Pengamanan Ekstraksi Kunci
    let keysData = typeof globalApiKey === 'object' && globalApiKey !== null ? globalApiKey : {};
    if (typeof globalApiKey === 'string') {
        try { keysData = JSON.parse(globalApiKey); }
        catch (e) { keysData = {}; }
    }

    const { elevenlabs, elevenlabsVoiceId } = keysData;

    // iFLYTEK membutuhkan rotasi 3 kunci secara tersinkronisasi
    const appIds = (keysData.iflytekAppId || '').split(',').map(k => k.trim()).filter(k => k);
    const apiKeys = (keysData.iflytekApiKey || '').split(',').map(k => k.trim()).filter(k => k);
    const apiSecrets = (keysData.iflytekApiSecret || '').split(',').map(k => k.trim()).filter(k => k);
    const iflytekIndex = appIds.length > 0 ? Math.floor(Math.random() * appIds.length) : 0;
    const iflytekAppId = appIds[iflytekIndex] || appIds[0];
    const iflytekApiKey = apiKeys[iflytekIndex] || apiKeys[0];
    const iflytekApiSecret = apiSecrets[iflytekIndex] || apiSecrets[0];

    const elevenlabsKeysList = (elevenlabs || '').split(',').map(k => k.trim()).filter(k => k);
    elevenlabsKeysList.sort(() => Math.random() - 0.5); // Acak untuk load balancing

    if (elevenlabsKeysList.length > 0) {
        const voiceId = elevenlabsVoiceId || options?.voiceId || '21m00Tcm4TlvDq8ikWAM';

        for (const key of elevenlabsKeysList) {
            try {
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': key
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
                    })
                });

                if (!response.ok) throw new Error('ElevenLabs API Error dengan Key ini');

                const blob = await response.blob();
                const audioUrl = URL.createObjectURL(blob);

                return new Promise((resolve) => {
                    const audio = new Audio(audioUrl);
                    audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
                    audio.onerror = () => { URL.revokeObjectURL(audioUrl); fallbackTTS(text, options).then(resolve); };
                    audio.play().catch(() => fallbackTTS(text, options).then(resolve));
                });
            } catch (error) {
                console.warn(`ElevenLabs key failed, memutar ke kunci berikutnya...`, error);
                continue; // Lanjutkan percobaan pada kunci berikutnya di array
            }
        }
        console.warn("Semua kunci ElevenLabs gagal / limit habis. Jatuh ke browser TTS native.");
    }

    if (!iflytekAppId || !iflytekApiKey || !iflytekApiSecret) {
        console.warn("iFLYTEK credentials missing. Falling back to browser TTS.");
        return fallbackTTS(text, options);
    }

    try {
        const url = await getIFlytekAuthUrl(iflytekApiKey, iflytekApiSecret);

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            let audioChunks = [];

            ws.onopen = () => {
                const params = {
                    common: { app_id: iflytekAppId },
                    business: { aue: "lame", sfl: 1, vcn: "xiaoyan", speed: 50, pitch: 50, volume: 50, bgs: 0 },
                    data: { status: 2, text: btoa(unescape(encodeURIComponent(text))) }
                };
                ws.send(JSON.stringify(params));
            };

            ws.onmessage = (e) => {
                const res = JSON.parse(e.data);
                if (res.code !== 0) return fallbackTTS(text, options).then(resolve);
                if (res.data && res.data.audio) audioChunks.push(res.data.audio);

                if (res.data && res.data.status === 2) {
                    ws.close();
                    const audioSrc = "data:audio/mp3;base64," + audioChunks.join("");
                    const audio = new Audio(audioSrc);
                    audio.onended = resolve;
                    audio.onerror = () => fallbackTTS(text, options).then(resolve);
                    audio.play().catch(() => fallbackTTS(text, options).then(resolve));
                }
            };

            ws.onerror = () => {
                ws.close();
                fallbackTTS(text, options).then(resolve);
            };
        });
    } catch (error) {
        console.error("iFLYTEK implementation failed", error);
        return fallbackTTS(text, options);
    }
};