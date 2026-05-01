import urllib.request
import json

api_key = "AIzaSyACsuta7KSU2VEgtZnVO9SzfYUlecw_9_s"
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
