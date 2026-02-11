"""
Smoke test for stem separation and mastering endpoints.
Tests against local server at http://127.0.0.1:8001
"""
import requests
import wave
import struct
import os
import time
import json

BASE = "http://127.0.0.1:8001"
TOKEN = "dev-bypass-token"
HEADERS_AUTH = {"Authorization": f"Bearer {TOKEN}"}

def create_test_wav(filename="smoke_test.wav", duration_sec=2, freq=440, sr=44100):
    """Create a simple sine wave WAV file for testing."""
    import math
    with wave.open(filename, 'w') as f:
        f.setnchannels(2)  # stereo
        f.setsampwidth(2)
        f.setframerate(sr)
        for i in range(sr * duration_sec):
            value = int(16000 * math.sin(2.0 * math.pi * freq * i / sr))
            data = struct.pack('<hh', value, value)  # stereo
            f.writeframesraw(data)
    print(f"✅ Created test WAV: {filename} ({duration_sec}s, {freq}Hz, stereo)")
    return filename

def test_health():
    print("\n--- TEST: Health Check ---")
    r = requests.get(f"{BASE}/health")
    print(f"  Status: {r.status_code}")
    print(f"  Body: {r.json()}")
    assert r.status_code == 200
    assert r.json()["status"] == "OK"
    print("  ✅ PASSED")

def test_analyze(filepath):
    print("\n--- TEST: Analyze Audio ---")
    with open(filepath, 'rb') as f:
        r = requests.post(
            f"{BASE}/api/analyze-audio",
            files={"file": ("test.wav", f, "audio/wav")},
            headers=HEADERS_AUTH
        )
    print(f"  Status: {r.status_code}")
    body = r.json()
    print(f"  Body: {json.dumps(body, indent=2)}")
    if r.status_code == 200:
        print("  ✅ PASSED")
    else:
        print(f"  ❌ FAILED: {body}")
    return r.status_code == 200

def test_mastering(filepath):
    print("\n--- TEST: AI Mastering ---")
    with open(filepath, 'rb') as f1, open(filepath, 'rb') as f2:
        r = requests.post(
            f"{BASE}/api/master-audio",
            files={
                "target": ("target.wav", f1, "audio/wav"),
                "reference": ("reference.wav", f2, "audio/wav")
            },
            headers=HEADERS_AUTH,
            timeout=120
        )
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        ct = r.headers.get('Content-Type', '')
        print(f"  Content-Type: {ct}")
        analysis = r.headers.get('X-Audio-Analysis')
        if analysis:
            print(f"  Analysis: {json.dumps(json.loads(analysis), indent=2)}")
        print("  ✅ PASSED - Mastered audio returned")
    else:
        try:
            print(f"  Body: {r.json()}")
        except:
            print(f"  Body: {r.text[:500]}")
        print("  ❌ FAILED")
    return r.status_code == 200

def test_stem_separation(filepath):
    print("\n--- TEST: Stem Separation ---")
    with open(filepath, 'rb') as f:
        r = requests.post(
            f"{BASE}/api/separate-audio",
            files={"file": ("test.wav", f, "audio/wav")},
            headers=HEADERS_AUTH,
            timeout=30
        )
    print(f"  Status: {r.status_code}")
    body = r.json()
    print(f"  Body: {json.dumps(body, indent=2)}")
    
    if r.status_code != 200:
        print(f"  ❌ FAILED to start separation")
        return False
    
    task_id = body.get("task_id")
    if not task_id:
        print("  ❌ FAILED - No task_id returned")
        return False
    
    print(f"  Task ID: {task_id}")
    print("  ⏳ Polling task status...")
    
    # Poll for up to 5 minutes
    for i in range(60):
        time.sleep(5)
        sr = requests.get(f"{BASE}/api/task-status/{task_id}", headers=HEADERS_AUTH)
        status_body = sr.json()
        status = status_body.get("status", "unknown")
        progress = status_body.get("progress", 0)
        print(f"    [{i*5}s] Status: {status}, Progress: {progress}%")
        
        if status == "completed":
            print(f"  ✅ PASSED - Separation completed!")
            print(f"    Output URL: {status_body.get('output_url', 'N/A')}")
            return True
        elif status == "failed":
            print(f"  ❌ FAILED - Separation failed: {status_body.get('error', 'Unknown')}")
            return False
    
    print("  ❌ FAILED - Timeout waiting for separation")
    return False

def test_estimate_time():
    print("\n--- TEST: Estimate Time ---")
    r = requests.post(
        f"{BASE}/api/estimate-time",
        json={"duration": 180, "library": "demucs"},
        headers={"Content-Type": "application/json"}
    )
    print(f"  Status: {r.status_code}")
    print(f"  Body: {r.json()}")
    if r.status_code == 200:
        print("  ✅ PASSED")
    else:
        print("  ❌ FAILED")
    return r.status_code == 200

if __name__ == "__main__":
    print("=" * 60)
    print("🔥 SMOKE TEST - Sonic Refine Suite Backend")
    print("=" * 60)
    
    results = {}
    
    # Create a test file
    test_wav = create_test_wav()
    
    try:
        # 1. Health
        test_health()
        results["health"] = True
        
        # 2. Estimate time
        results["estimate_time"] = test_estimate_time()
        
        # 3. Analyze audio
        results["analyze"] = test_analyze(test_wav)
        
        # 4. Mastering
        results["mastering"] = test_mastering(test_wav)
        
        # 5. Stem Separation (longest test)
        results["stem_separation"] = test_stem_separation(test_wav)
        
    finally:
        if os.path.exists(test_wav):
            os.remove(test_wav)
    
    print("\n" + "=" * 60)
    print("📊 RESULTS SUMMARY")
    print("=" * 60)
    for test_name, passed in results.items():
        icon = "✅" if passed else "❌"
        print(f"  {icon} {test_name}")
    
    all_pass = all(results.values())
    print(f"\n{'🎉 ALL TESTS PASSED!' if all_pass else '⚠️ SOME TESTS FAILED'}")
