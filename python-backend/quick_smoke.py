import requests
import sys

BACKEND_URL = "https://mastering-backend-857351913435.us-central1.run.app"
ORIGIN = "https://levelaudio.live"

# Test 1: Health Check
print("=== TEST 1: Health Check ===")
try:
    r = requests.get(f"{BACKEND_URL}/health", timeout=30)
    print(f"  Status: {r.status_code} -- {r.json()}")
    print("  PASS" if r.status_code == 200 else "  FAIL")
except Exception as e:
    print(f"  FAIL -- {e}")

# Test 2: CORS Preflight
print("\n=== TEST 2: CORS Preflight ===")
endpoints = ['/api/master-audio', '/api/analyze-audio', '/api/separate-audio']
for ep in endpoints:
    try:
        headers = {
            'Origin': ORIGIN,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Authorization'
        }
        r = requests.options(f"{BACKEND_URL}{ep}", headers=headers, timeout=10)
        acao = r.headers.get('access-control-allow-origin', 'MISSING')
        status = "PASS" if acao == ORIGIN else "FAIL"
        print(f"  {ep}: {status} -- ACAO={acao}")
    except Exception as e:
        print(f"  {ep}: FAIL -- {e}")

# Test 3: Frontend (skip SSL due to known cert issue)
print("\n=== TEST 3: Frontend (via netlify.app) ===")
try:
    r = requests.get("https://level-audio-app.netlify.app/", timeout=15)
    has_title = 'Level Audio' in r.text
    print(f"  Status: {r.status_code}, Title present: {has_title}")
    print("  PASS" if r.status_code == 200 and has_title else "  FAIL")
except Exception as e:
    print(f"  FAIL -- {e}")

print("\n=== QUICK SMOKE TEST COMPLETE ===")
