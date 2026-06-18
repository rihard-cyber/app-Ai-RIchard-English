const dotenv = require('dotenv');
const fs = require('node:fs');
const https = require('node:https');

// Parse .env file manually or require 'dotenv' if installed
const envConfig = dotenv.parse(fs.readFileSync('.env'))
const apiKey = envConfig.GEMINI_API_KEY;

console.log("Testing API Key:", apiKey.substring(0, 10) + "...");

const payload = JSON.stringify({
  contents: [{ role: 'user', parts: [{ text: "Hello" }] }],
  systemInstruction: { parts: [{ text: "You are a helpful assistant." }] },
  generationConfig: { temperature: 0.7 }
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`RESPONSE BODY: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
