import CryptoJS from 'crypto-js';

async function getIFlytekAuthUrl(apiKey, apiSecret) {
    const host = "tts-api.xfyun.cn";
    const path = "/v2/tts";
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
    const signatureBase64 = CryptoJS.enc.Base64.stringify(signatureSha);

    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);

    return `wss://${host}${path}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${host}`;
}

// Tambahan Fungsi Test iFLYTEK khusus untuk Admin Dashboard
export const testIFlytekConnection = async (appId, apiKey, apiSecret) => {
    try {
        if (!appId || !apiKey || !apiSecret) return { success: false, message: "Kredensial kosong." };

        // Menggunakan endpoint Spark API v3.1
        const host = "spark-api.xf-yun.com";
        const path = "/v3.1/chat";
        const date = new Date().toUTCString();
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

        // Hash & Base64
        const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
        const signatureBase64 = CryptoJS.enc.Base64.stringify(signatureSha);

        // Format JSON String standard iFLYTEK untuk Authorization
        const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
        const authBase64 = btoa(authorizationOrigin);

        // URL Gabungan
        const url = `wss://${host}${path}?authorization=${authBase64}&date=${encodeURIComponent(date)}&host=${host}`;

        return new Promise((resolve) => {
            let isResolved = false;
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log("[iFLYTEK] WebSocket Terhubung ke Spark API ✅");
                if (!isResolved) {
                    isResolved = true;
                    ws.close(); // Tutup setelah sukses agar tidak menggantung di memori
                    resolve({ success: true, message: "Terhubung ✅" });
                }
            };

            ws.onerror = (error) => {
                console.error("[iFLYTEK] WebSocket Error Event:", error);
            };

            ws.onclose = (e) => {
                if (!isResolved) {
                    isResolved = true;
                    console.error(`[iFLYTEK] WebSocket Tertutup (Code: ${e.code}, Reason: ${e.reason})`);
                    let errorMsg = `Koneksi tertutup (Code: ${e.code}). Periksa API Key, Secret, atau Waktu Sistem.`;
                    if (e.code === 1006) errorMsg = "Koneksi ditolak (1006). Pastikan kredensial benar dan internet stabil.";
                    resolve({ success: false, message: errorMsg });
                }
            };
        });
    } catch (err) {
        console.error("[iFLYTEK] Setup Error:", err);
        return { success: false, message: err.message };
    }
};

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
                    try {
                        // OPTIMASI: Konversi ke Blob untuk menghindari bottleneck parsing Data URI Base64 di DOM
                        const audioString = atob(audioChunks.join(""));
                        const len = audioString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            bytes[i] = audioString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: 'audio/mp3' });
                        const audioUrl = URL.createObjectURL(blob);
                        const audio = new Audio(audioUrl);
                        audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
                        audio.onerror = () => { URL.revokeObjectURL(audioUrl); fallbackTTS(text, options).then(resolve); };
                        audio.play().catch(() => fallbackTTS(text, options).then(resolve));
                    } catch (err) {
                        console.error("Blob Audio Error:", err);
                        fallbackTTS(text, options).then(resolve);
                    }
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