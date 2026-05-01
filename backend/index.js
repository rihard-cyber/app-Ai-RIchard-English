const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("FATAL ERROR: GROQ_API_KEY is not defined in backend/.env");
  process.exit(1);
}

// Proxy endpoint — receives messages from React and forwards to Groq
app.post('/api/gemini', async (req, res) => {
  try {
    // Convert Gemini-format payload to Groq/OpenAI format
    const { contents, systemInstruction, generationConfig } = req.body;

    // Build messages array in OpenAI format
    const messages = [];

    // Add system instruction if present
    if (systemInstruction?.parts?.[0]?.text) {
      messages.push({ role: 'system', content: systemInstruction.parts[0].text });
    }

    // Convert Gemini "contents" to OpenAI "messages"
    if (contents && Array.isArray(contents)) {
      contents.forEach(c => {
        if (c.role === 'user' || c.role === 'assistant') {
          const text = c.parts?.map(p => p.text).join('') || '';
          messages.push({ role: c.role, content: text });
        }
      });
    }

    const groqPayload = {
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: generationConfig?.temperature || 0.7,
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
      console.error("Groq API Error:", data);
      return res.status(response.status).json(data);
    }

    // Convert Groq response back to Gemini-like format so React doesn't need changes
    const groqText = data.choices?.[0]?.message?.content || '';
    const geminiLikeResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: groqText }],
            role: 'model'
          },
          finishReason: 'STOP'
        }
      ]
    };

    res.json(geminiLikeResponse);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`⚡ Powered by GROQ (llama-3.3-70b) — Gratis & Super Cepat!`);
  console.log(`🛡️  API Key tersembunyi aman di server!`);
});
