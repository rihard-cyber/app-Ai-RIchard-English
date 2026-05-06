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

export const speakText = async (text, globalApiKey, options = {}) => {
    const { iflytekAppId, iflytekApiKey, iflytekApiSecret } = globalApiKey || {};

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