import urllib.request
import json
import os

api_key = os.environ.get("GEMINI_API_KEY", "")
if not api_key:
    raise SystemExit("Set GEMINI_API_KEY in your environment before running this helper.")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for model in data.get('models', []):
            if 'flash' in model['name']:
                print(f"{model['name']} - supported methods: {model.get('supportedGenerationMethods')}")
except Exception as e:
    print("Error:", e)
