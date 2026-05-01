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

    const messages = [];

    if (systemInstruction?.parts?.[0]?.text) {
      messages.push({ role: 'system', content: systemInstruction.parts[0].text });
    }

    if (contents && Array.isArray(contents)) {
      contents.forEach(c => {
        // Map Gemini roles to OpenAI/Groq roles
        let role = c.role;
        if (role === 'model') role = 'assistant';
        
        if (role === 'user' || role === 'assistant') {
          const text = c.parts?.map(p => p.text).join('') || '';
          messages.push({ role: role, content: text });
        }
      });
    }

    const groqPayload = {
      model: 'mixtral-8x7b-32768',
      messages,
      temperature: generationConfig?.temperature || 0.9,
      top_p: 0.9,
      presence_penalty: 0.6,
      max_tokens: 2048,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(groqPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq Error:", data);
      return res.status(response.status).json(data);
    }

    const groqText = data.choices?.[0]?.message?.content || '';
    res.json({
      candidates: [{
        content: { parts: [{ text: groqText }], role: 'model' },
        finishReason: 'STOP'
      }]
    });
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
  console.log(`⚡ Chat: Groq LLaMA 3.3 (Fast & Free)`);
  console.log(`🎙️  TTS: Gemini 2.5 Flash (Natural Human Voice)`);
  console.log(`🛡️  Both API Keys hidden safely in server!`);
});
