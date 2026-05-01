const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable CORS so the React app can talk to this server
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not defined in backend/.env");
  process.exit(1);
}

// Reverse Proxy Endpoint for Gemini API
// Frontend will send requests here instead of directly to Google
app.post('/api/gemini', async (req, res) => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    // Forward the payload from React directly to Google
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    // Parse Google's response
    const data = await response.json();
    
    // If Google returns an error (e.g. 400 Bad Request, 429 Too Many Requests)
    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(response.status).json(data);
    }

    // Send successful response back to React
    res.json(data);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Backend server running safely on http://localhost:${PORT}`);
  console.log(`🛡️ API Key is hidden and secure!`);
});
