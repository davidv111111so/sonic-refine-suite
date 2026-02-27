import requests, json, warnings, struct, io, math, time
warnings.filterwarnings("ignore")

BACKEND = "https://mastering-backend-857351913435.us-central1.run.app"
FRONTEND = "https://levelaudio.live"
ORIGIN = "https://levelaudio.live"
AUTH_HEADERS = {"Authorization": "Bearer dev-bypass-token", "Origin": ORIGIN}

results = []

def test(name, fn):
    print(f"Running test: {name}...", end="", flush=True)
    try:
        ok, detail = fn()
        status = "PASS" if ok else "FAIL"
        results.append((name, status, detail))
        print(f" {status}")
    except Exception as e:
        results.append((name, "ERROR", str(e)))
        print(f" ERROR: {e}")

# 1: Frontend HTTPS
def t1():
    r = requests.get(FRONTEND, timeout=15)
    has_title = "level" in r.text.lower()
    return r.status_code == 200 and has_title, f"Status={r.status_code}"
test("Frontend HTTPS", t1)

# 2: HTTP Redirect
def t2():
    r = requests.get("http://levelaudio.live", timeout=10, allow_redirects=False)
    is_redir = r.status_code in [301, 302, 307, 308]
    return is_redir, f"{r.status_code} -> {r.headers.get('location','N/A')}"
test("HTTP Redirect", t2)

# 3: Security Headers
def t3():
    r = requests.get(FRONTEND, timeout=10)
    h = {k.lower() for k in r.headers}
    checks = ["strict-transport-security", "x-content-type-options"]
    present = [c for c in checks if c in h]
    return len(present) >= 1, f"Found {len(present)} headers"
test("Security Headers", t3)

# 4: Backend Health
def t4():
    r = requests.get(f"{BACKEND}/health", timeout=30)
    return r.status_code == 200, f"{r.status_code} {r.json().get('status','?')}"
test("Backend Health", t4)

# 5: CORS Preflight
def t5():
    eps = ["/api/separate-audio", "/api/analyze-audio"]
    ok_all = True
    for ep in eps:
        h = {"Origin": ORIGIN, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Authorization"}
        r = requests.options(f"{BACKEND}{ep}", headers=h, timeout=10)
        if r.headers.get("access-control-allow-origin") != ORIGIN:
            ok_all = False
    return ok_all, "All CORS OK" if ok_all else "CORS FAIL"
test("CORS Preflight", t5)

# 6: Audio Analysis
def t6():
    sr, n = 44100, 44100
    samples = [int(32767 * 0.5 * math.sin(2 * math.pi * 440 * i / sr)) for i in range(n)]
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
    r = requests.post(f"{BACKEND}/api/analyze-audio", files=files, headers=AUTH_HEADERS, timeout=60)
    return r.status_code == 200, f"Status={r.status_code}"
test("Audio Analysis API", t6)

# 7: Stems Separation (FASTEST MODE)
def t7():
    sr, n = 22050, 22050 # 1 second
    samples = [int(32767 * 0.5 * math.sin(2 * math.pi * 440 * i / sr)) for i in range(n)]
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
    
    files = {"file": ("test_stems.wav", buf, "audio/wav")}
    payload = {"library": "demucs", "speed_mode": "fastest", "stem_count": "2"}
    r = requests.post(f"{BACKEND}/api/separate-audio", files=files, data=payload, headers=AUTH_HEADERS, timeout=60)
    
    if r.status_code != 200 and r.status_code != 202:
        return False, f"Start failed: {r.status_code} - {r.text}"
    
    task_id = r.json().get("task_id")
    print(f" (ID: {task_id})...", end="", flush=True)
    # Poll for result
    for _ in range(60): 
        time.sleep(2)
        pr = requests.get(f"{BACKEND}/api/task-status/{task_id}", headers=AUTH_HEADERS, timeout=15)
        status = pr.json().get("status")
        if status == "completed":
            return True, "Separation Success"
        if status == "failed":
            return False, f"Task Failed: {pr.json().get('error')}"
    
    return False, "Timeout"
test("Stems Separation (Draft Mode)", t7)

# Print results
with open("verification_results.txt", "w", encoding="utf-8") as f:
    f.write("LEVEL AUDIO - FEATURE VERIFICATION\n")
    f.write("=" * 50 + "\n\n")
    passed = 0
    for name, status, detail in results:
        line = f"{status} | {name} | {detail}\n"
        f.write(line)
        if status == "PASS":
            passed += 1
    f.write(f"\nTotal: {passed}/{len(results)} passed\n")

print("\nDone. Results written to verification_results.txt")
