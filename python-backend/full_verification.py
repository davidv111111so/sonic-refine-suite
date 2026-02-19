import requests, json, warnings, struct, io, math
warnings.filterwarnings("ignore")

BACKEND = "https://mastering-backend-857351913435.us-central1.run.app"
FRONTEND = "https://levelaudio.live"
ORIGIN = "https://levelaudio.live"
SUPABASE = "https://nhulnikqfphofqpnmdba.supabase.co"
APIKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odWxuaWtxZnBob2ZxcG5tZGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzY0NjYsImV4cCI6MjA4NTc1MjQ2Nn0.hrWWBw6tdw_7X6ExnNipFjjxi5b211kRppFLtxvoKjw"

results = []

def test(name, fn):
    try:
        ok, detail = fn()
        status = "PASS" if ok else "FAIL"
        results.append((name, status, detail))
    except Exception as e:
        results.append((name, "ERROR", str(e)))

# 1
def t1():
    r = requests.get(FRONTEND, timeout=15)
    has_title = "level" in r.text.lower()
    has_no_bypass = "Dev Bypass" not in r.text
    return r.status_code == 200 and has_title and has_no_bypass, f"Status={r.status_code} Title={has_title} NoBypass={has_no_bypass}"
test("Frontend HTTPS", t1)

# 2
def t2():
    r = requests.get("http://levelaudio.live", timeout=10, allow_redirects=False)
    return r.status_code == 301, f"{r.status_code} -> {r.headers.get('location','N/A')}"
test("HTTP Redirect", t2)

# 3
def t3():
    r = requests.get(FRONTEND, timeout=10)
    h = {k.lower() for k in r.headers}
    checks = ["strict-transport-security", "content-security-policy", "x-xss-protection", "x-frame-options", "x-content-type-options"]
    present = [c for c in checks if c in h]
    return len(present) == len(checks), f"{len(present)}/{len(checks)} headers"
test("Security Headers", t3)

# 4
def t4():
    r = requests.get(f"{BACKEND}/health", timeout=30)
    return r.status_code == 200, f"{r.status_code} {r.json().get('status','?')}"
test("Backend Health", t4)

# 5
def t5():
    eps = ["/api/master-audio", "/api/analyze-audio", "/api/separate-audio"]
    ok_all = True
    for ep in eps:
        h = {"Origin": ORIGIN, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Authorization"}
        r = requests.options(f"{BACKEND}{ep}", headers=h, timeout=10)
        if r.headers.get("access-control-allow-origin") != ORIGIN:
            ok_all = False
    return ok_all, "All CORS OK" if ok_all else "CORS FAIL"
test("CORS Preflight", t5)

# 6
def t6():
    r = requests.get(f"{SUPABASE}/auth/v1/settings", headers={"apikey": APIKEY}, timeout=10)
    d = r.json()
    g = d.get("external", {}).get("google", False)
    e = d.get("external", {}).get("email", False)
    return e, f"Email={e} Google={g}"
test("Supabase Auth", t6)

# 7
def t7():
    r = requests.get("https://www.levelaudio.live", timeout=10, allow_redirects=True)
    return r.status_code == 200, f"Status={r.status_code}"
test("WWW Domain", t7)

# 8
def t8():
    sr, dur, freq = 44100, 0.5, 440
    n = int(sr * dur)
    samples = [int(32767 * 0.5 * math.sin(2 * math.pi * freq * i / sr)) for i in range(n)]
    buf = io.BytesIO()
    data = struct.pack(f"<{n}h", *samples)
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + len(data)))
    buf.write(b"WAVEfmt ")
    buf.write(struct.pack("<IHHIIHH", 16, 1, 1, sr, sr * 2, 2, 16))
    buf.write(b"data")
    buf.write(struct.pack("<I", len(data)))
    buf.write(data)
    buf.seek(0)
    files = {"file": ("test.wav", buf, "audio/wav")}
    r = requests.post(f"{BACKEND}/api/analyze-audio", files=files, headers={"Origin": ORIGIN}, timeout=60)
    if r.status_code == 200:
        return True, f"Keys: {list(r.json().keys())[:5]}"
    return False, f"Status={r.status_code}"
test("Audio Analysis", t8)

# Print results
with open("verification_results.txt", "w", encoding="utf-8") as f:
    f.write("LEVEL AUDIO - PRODUCTION VERIFICATION\n")
    f.write("=" * 50 + "\n\n")
    passed = 0
    for name, status, detail in results:
        line = f"{'PASS' if status == 'PASS' else 'FAIL'} | {name} | {detail}\n"
        f.write(line)
        if status == "PASS":
            passed += 1
    f.write(f"\nTotal: {passed}/{len(results)} passed\n")
    if passed < len(results):
        f.write("\nACTION ITEMS:\n")
        for name, status, detail in results:
            if status != "PASS":
                f.write(f"  -> {name}: {detail}\n")

print("Done. Results written to verification_results.txt")
