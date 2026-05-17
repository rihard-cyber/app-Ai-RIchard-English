const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://rihard-cyber.github.io',
  'capacitor://localhost',
  'ionic://localhost',
].join(',')).split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '2mb' }));

const rateLimit = new Map();
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = Number(process.env.RATE_LIMIT_PER_MINUTE || 40);
  const timestamps = (rateLimit.get(ip) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ error: 'Terlalu banyak request. Tunggu sebentar lalu coba lagi.' });
  }

  timestamps.push(now);
  rateLimit.set(ip, timestamps);
  next();
});

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  : null;

const pickKey = (value) => {
  const keys = String(value || '').split(',').map((key) => key.trim()).filter(Boolean);
  return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
};

const toOpenAIMessages = (payload) => {
  const messages = [];
  if (payload.systemInstruction?.parts?.[0]?.text) {
    messages.push({ role: 'system', content: payload.systemInstruction.parts[0].text });
  }
  for (const item of payload.contents || []) {
    messages.push({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: item.parts?.[0]?.text || '',
    });
  }
  return messages;
};

const validateContent = (body) => {
  if (!body || !Array.isArray(body.contents)) return false;
  return body.contents.every((content) => (
    content
    && Array.isArray(content.parts)
    && content.parts.every((part) => typeof part.text === 'string' && part.text.length <= 8000)
  ));
};

const normalizeProviderResponse = (text) => ({
  candidates: [{ content: { parts: [{ text }] } }],
});

const generateChat = async (payload) => {
  if (!validateContent(payload)) {
    const error = new Error('Format request AI tidak valid.');
    error.status = 400;
    throw error;
  }

  const geminiKey = pickKey(process.env.GEMINI_API_KEY);
  const groqKey = pickKey(process.env.GROQ_API_KEY);
  const openaiKey = pickKey(process.env.OPENAI_API_KEY);

  if (geminiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        generationConfig: {
          ...(payload.generationConfig || {}),
          temperature: payload.generationConfig?.temperature ?? 0.8,
          topP: payload.generationConfig?.topP ?? 0.95,
          maxOutputTokens: payload.generationConfig?.maxOutputTokens ?? 1024,
        },
      }),
    });
    const data = await response.json();
    if (response.ok && data.candidates) return data;
    if (!groqKey && !openaiKey) throw new Error(data.error?.message || 'Gemini request failed');
  }

  if (groqKey) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: toOpenAIMessages(payload),
        temperature: payload.generationConfig?.temperature ?? 0.7,
        max_tokens: payload.generationConfig?.maxOutputTokens ?? 1024,
      }),
    });
    const data = await response.json();
    if (response.ok && data.choices?.[0]?.message?.content) {
      return normalizeProviderResponse(data.choices[0].message.content);
    }
    if (!openaiKey) throw new Error(data.error?.message || 'Groq request failed');
  }

  if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: toOpenAIMessages(payload),
        temperature: payload.generationConfig?.temperature ?? 0.7,
        max_tokens: payload.generationConfig?.maxOutputTokens ?? 1024,
      }),
    });
    const data = await response.json();
    if (response.ok && data.choices?.[0]?.message?.content) {
      return normalizeProviderResponse(data.choices[0].message.content);
    }
    throw new Error(data.error?.message || 'OpenAI request failed');
  }

  const error = new Error('Server belum memiliki kredensial AI. Atur GEMINI_API_KEY, GROQ_API_KEY, atau OPENAI_API_KEY.');
  error.status = 503;
  throw error;
};

app.post(['/api/chat', '/api/gemini'], async (req, res) => {
  try {
    const data = await generateChat(req.body);
    res.json(data);
  } catch (error) {
    console.error('Chat Server Error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'id' } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Text is required' });
    if (text.length > 4000) return res.status(400).json({ error: 'Text terlalu panjang.' });

    const l10nKey = pickKey(process.env.L10N_API_KEY);
    if (l10nKey) {
      const response = await fetch('https://api.l10n.dev/v1/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': l10nKey },
        body: JSON.stringify({ text, target_language: targetLanguage }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.translated_text) {
        return res.json({ translatedText: data.translated_text });
      }
    }

    const fallback = await generateChat({
      contents: [{ role: 'user', parts: [{ text }] }],
      systemInstruction: { parts: [{ text: `Translate this text to natural ${targetLanguage === 'id' ? 'Indonesian' : targetLanguage}. Return only the translation.` }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    });

    return res.json({ translatedText: fallback.candidates?.[0]?.content?.parts?.[0]?.text || '' });
  } catch (error) {
    console.error('Translation Server Error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Translation failed' });
  }
});

const ALLOWED_GEMINI_VOICES = ['Kore', 'Charon', 'Aoede', 'Puck', 'Fenrir'];
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Text is required' });
    if (text.length > 1000) return res.status(400).json({ error: 'Text too long (max 1000 chars)' });

    const geminiKey = pickKey(process.env.GEMINI_API_KEY);
    if (!geminiKey) return res.status(503).json({ error: 'Server TTS belum dikonfigurasi.' });

    const safeVoiceName = ALLOWED_GEMINI_VOICES.includes(voiceName) ? voiceName : 'Kore';
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}/g, '')
      .replace(/\|/g, ', ')
      .trim();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts'}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: cleanText }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: safeVoiceName } } },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'TTS provider failed' });

    const audioPart = data?.candidates?.[0]?.content?.parts?.[0];
    if (!audioPart?.inlineData?.data) return res.status(500).json({ error: 'No audio data in TTS response' });

    res.json({
      audioData: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/wav',
    });
  } catch (error) {
    console.error('TTS Server Error:', error);
    res.status(500).json({ error: error.message || 'TTS Internal Server Error' });
  }
});

const verifyMidtransSignature = ({ order_id, status_code, gross_amount, signature_key }) => {
  if (!process.env.MIDTRANS_SERVER_KEY || !signature_key) return false;
  const source = `${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`;
  return crypto.createHash('sha512').update(source).digest('hex') === signature_key;
};

app.post('/api/payments/notification', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase service role belum dikonfigurasi.' });

    const {
      order_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_key,
      userId,
    } = req.body || {};

    if (process.env.MIDTRANS_SERVER_KEY && !verifyMidtransSignature({ order_id, status_code, gross_amount, signature_key })) {
      return res.status(401).json({ error: 'Invalid payment signature' });
    }

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });

    const approved = transaction_status === 'settlement' || transaction_status === 'capture';
    const rejected = ['deny', 'cancel', 'expire', 'failure'].includes(transaction_status);
    const status = approved ? 'approved' : rejected ? 'rejected' : 'pending';

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .update({ status, provider_order_id: order_id, updated_at: new Date().toISOString() })
      .eq('provider_order_id', order_id)
      .select('user_id')
      .maybeSingle();

    if (txError) throw txError;
    const targetUserId = transaction?.user_id || userId;
    if (approved && targetUserId) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_pro: true, subscription_plan: 'Pro' })
        .eq('id', targetUserId);
      if (error) throw error;
    }

    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Payment Webhook Error:', error);
    res.status(500).json({ error: error.message || 'Webhook Error' });
  }
});

app.get('/api/payments/status/:userId', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase service role belum dikonfigurasi.' });
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_pro, subscription_plan')
      .eq('id', req.params.userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User tidak ditemukan.' });

    res.json({
      is_pro: Boolean(data.is_pro),
      status: data.is_pro ? 'Active' : 'Free',
      subscription_plan: data.subscription_plan || 'Free',
    });
  } catch (error) {
    console.error('Payment Status Error:', error);
    res.status(500).json({ error: error.message || 'Status check failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('AI, translation, TTS, and payment routes are served from the backend.');
});
