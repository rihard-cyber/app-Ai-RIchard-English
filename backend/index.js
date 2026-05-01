const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GROQ_API_KEY) { console.error("FATAL: GROQ_API_KEY missing"); process.exit(1); }
if (!GEMINI_API_KEY) { console.error("FATAL: GEMINI_API_KEY missing"); process.exit(1); }

// ============================================================
// ENDPOINT 1: CHAT via Groq LLaMA 3.3 (Fast & Free)
// ============================================================
app.post('/api/gemini', async (req, res) => {
  try {
    const { contents, systemInstruction, generationConfig } = req.body;

    const geminiPayload = {
      contents,
      systemInstruction,
      generationConfig: {
        ...generationConfig,
        temperature: generationConfig?.temperature || 0.9,
        topP: 0.9,
        maxOutputTokens: 2048
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Chat Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================================================
// ENDPOINT 2: TTS via Gemini 2.5 Flash (Natural Human Voice)
// ============================================================
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', lang = 'id' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Clean text before sending to TTS
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\|/g, ', ')
      .replace(/[-_]{2,}/g, '')
      .trim();

    const ttsPayload = {
      contents: [{
        parts: [{ text: cleanText }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              // Kore = natural warm female, Charon = natural male, Aoede = calm female
              voiceName: voiceName
            }
          }
        }
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ttsPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini TTS Error:", JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    // Extract base64 audio data from response
    const audioPart = data?.candidates?.[0]?.content?.parts?.[0];
    if (!audioPart?.inlineData?.data) {
      console.error("TTS: No audio in response", JSON.stringify(data).slice(0, 300));
      return res.status(500).json({ error: 'No audio data in TTS response' });
    }

    res.json({
      audioData: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/wav'
    });

  } catch (error) {
    console.error("TTS Server Error:", error);
    res.status(500).json({ error: "TTS Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`⚡ Chat: Gemini 1.5 Flash (Reliable & Smart)`);
  console.log(`🎙️  TTS: Gemini 2.5 Flash (Natural Human Voice)`);
  console.log(`🛡️  API Keys hidden safely in server!`);
});
