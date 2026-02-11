"""
Production Smoke Test Suite
Tests the Cloud Run backend from the perspective of the Netlify frontend
"""
import requests
import tempfile
import os
import time
import wave
import struct
import random

BACKEND_URL = "https://mastering-backend-azkp62xtaq-uc.a.run.app"
ORIGIN = "https://level-audio-app.netlify.app"
# Use dev bypass token for auth
DEV_TOKEN = "dev-bypass-token"

def make_test_wav(duration_seconds=3, sample_rate=44100, channels=2):
    """Create a real WAV file with audio data"""
    path = os.path.join(tempfile.gettempdir(), f'smoke_test_{random.randint(1000,9999)}.wav')
    n_frames = int(sample_rate * duration_seconds)
    
    with wave.open(path, 'w') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        for i in range(n_frames):
            for c in range(channels):
                # Generate a sine wave
                import math
                val = int(16000 * math.sin(2 * math.pi * 440 * i / sample_rate))
                wf.writeframes(struct.pack('<h', val))
    
    return path

def test_health():
    """Test 1: Backend Health Check"""
    print("\n" + "="*60)
    print("TEST 1: Backend Health Check")
    print("="*60)
    
    try:
        r = requests.get(f"{BACKEND_URL}/health", timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data['status'] == 'OK', f"Expected OK, got {data['status']}"
        print(f"  ✅ PASS — Status: {data['status']}, Service: {data['service']}")
        return True
    except Exception as e:
        print(f"  ❌ FAIL — {e}")
        return False

def test_cors_preflight():
    """Test 2: CORS Preflight for all API endpoints"""
    print("\n" + "="*60)
    print("TEST 2: CORS Preflight (OPTIONS)")
    print("="*60)
    
    endpoints = ['/api/master-audio', '/api/analyze-audio', '/api/separate-audio', '/api/task-status/test']
    all_pass = True
    
    headers = {
        'Origin': ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization'
    }
    
    for ep in endpoints:
        try:
            r = requests.options(f"{BACKEND_URL}{ep}", headers=headers, timeout=10)
            acao = r.headers.get('access-control-allow-origin', 'MISSING')
            assert acao == ORIGIN, f"CORS origin mismatch: {acao}"
            print(f"  ✅ {ep} → CORS: {acao}")
        except Exception as e:
            print(f"  ❌ {ep} → {e}")
            all_pass = False
    
    return all_pass

def test_analyze_audio():
    """Test 3: Audio Analysis via direct FormData upload"""
    print("\n" + "="*60)
    print("TEST 3: Audio Analysis (Direct Upload)")
    print("="*60)
    
    wav_path = make_test_wav(duration_seconds=2)
    
    try:
        with open(wav_path, 'rb') as f:
            files = {'file': ('test.wav', f, 'audio/wav')}
            headers = {
                'Authorization': f'Bearer {DEV_TOKEN}',
                'Origin': ORIGIN
            }
            
            print(f"  📤 Uploading test WAV ({os.path.getsize(wav_path)} bytes)...")
            r = requests.post(
                f"{BACKEND_URL}/api/analyze-audio",
                files=files,
                headers=headers,
                timeout=120
            )
        
        if r.status_code == 200:
            data = r.json()
            print(f"  ✅ PASS — Analysis returned: LUFS={data.get('lufs', 'N/A')}, BPM={data.get('bpm', 'N/A')}")
            return True
        else:
            print(f"  ❌ FAIL — Status {r.status_code}: {r.text[:200]}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL — {e}")
        return False
    finally:
        os.unlink(wav_path)

def test_mastering():
    """Test 4: AI Mastering via direct FormData upload"""
    print("\n" + "="*60)
    print("TEST 4: AI Mastering (Direct Upload)")
    print("="*60)
    
    target_path = make_test_wav(duration_seconds=2)
    ref_path = make_test_wav(duration_seconds=2)
    
    try:
        with open(target_path, 'rb') as t, open(ref_path, 'rb') as r_file:
            files = {
                'target': ('target.wav', t, 'audio/wav'),
                'reference': ('reference.wav', r_file, 'audio/wav')
            }
            headers = {
                'Authorization': f'Bearer {DEV_TOKEN}',
                'Origin': ORIGIN
            }
            
            print(f"  📤 Uploading target ({os.path.getsize(target_path)} bytes) + reference ({os.path.getsize(ref_path)} bytes)...")
            r = requests.post(
                f"{BACKEND_URL}/api/master-audio",
                files=files,
                headers=headers,
                timeout=300
            )
        
        if r.status_code == 200:
            content_type = r.headers.get('content-type', '')
            analysis_header = r.headers.get('X-Audio-Analysis', 'N/A')
            print(f"  ✅ PASS — Mastered audio returned: {len(r.content)} bytes, type: {content_type}")
            print(f"     Analysis header: {analysis_header[:100]}...")
            return True
        else:
            print(f"  ❌ FAIL — Status {r.status_code}: {r.text[:200]}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL — {e}")
        return False
    finally:
        os.unlink(target_path)
        os.unlink(ref_path)

def test_stem_separation_submit():
    """Test 5: Stem Separation Task Submission via direct FormData upload"""
    print("\n" + "="*60)
    print("TEST 5: Stem Separation Submission (Direct Upload)")
    print("="*60)
    
    wav_path = make_test_wav(duration_seconds=2)
    
    try:
        with open(wav_path, 'rb') as f:
            files = {'file': ('test.wav', f, 'audio/wav')}
            data = {
                'stem_count': '4',
                'library': 'demucs',
                'model_name': 'htdemucs'
            }
            headers = {
                'Authorization': f'Bearer {DEV_TOKEN}',
                'Origin': ORIGIN
            }
            
            print(f"  📤 Submitting separation task...")
            r = requests.post(
                f"{BACKEND_URL}/api/separate-audio",
                files=files,
                data=data,
                headers=headers,
                timeout=60
            )
        
        if r.status_code == 200:
            result = r.json()
            task_id = result.get('task_id')
            print(f"  ✅ PASS — Task submitted: {task_id}")
            return task_id
        else:
            print(f"  ❌ FAIL — Status {r.status_code}: {r.text[:200]}")
            return None
    except Exception as e:
        print(f"  ❌ FAIL — {e}")
        return None
    finally:
        os.unlink(wav_path)

def test_task_polling(task_id):
    """Test 6: Task Status Polling"""
    print("\n" + "="*60)
    print("TEST 6: Task Status Polling")
    print("="*60)
    
    if not task_id:
        print("  ⏭️ SKIPPED — No task ID from previous test")
        return False
    
    headers = {
        'Authorization': f'Bearer {DEV_TOKEN}',
        'Origin': ORIGIN
    }
    
    for attempt in range(30):  # Poll for up to 5 minutes
        try:
            r = requests.get(
                f"{BACKEND_URL}/api/task-status/{task_id}",
                headers=headers,
                timeout=30
            )
            
            if r.status_code == 200:
                data = r.json()
                status = data.get('status')
                progress = data.get('progress', 0)
                
                if status == 'completed':
                    print(f"  ✅ PASS — Task completed! Progress: {progress}%")
                    return True
                elif status == 'failed':
                    error = data.get('error', 'Unknown')
                    print(f"  ❌ FAIL — Task failed: {error}")
                    return False
                else:
                    print(f"  ⏳ Polling... Status: {status}, Progress: {progress}%")
            else:
                print(f"  ⚠️ Status check returned {r.status_code}")
            
            time.sleep(10)
        except Exception as e:
            print(f"  ⚠️ Polling error: {e}")
            time.sleep(10)
    
    print("  ❌ FAIL — Timeout waiting for task completion")
    return False

def test_netlify_frontend():
    """Test 7: Netlify Frontend Accessibility"""
    print("\n" + "="*60)
    print("TEST 7: Netlify Frontend")
    print("="*60)
    
    try:
        r = requests.get("https://level-audio-app.netlify.app/", timeout=15)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert 'Level Audio' in r.text, "Missing page title"
        
        # Check that the new JS bundle is present (contains our FormData code)
        has_new_bundle = 'index-7qito0pm' in r.text or 'formData' in r.text.lower()
        
        print(f"  ✅ PASS — Frontend loads (status {r.status_code}, {len(r.text)} bytes)")
        print(f"     Title present: ✅")
        print(f"     New bundle hash detected: {'✅' if has_new_bundle else '⚠️ Check manually'}")
        return True
    except Exception as e:
        print(f"  ❌ FAIL — {e}")
        return False

def main():
    print("🚀 PRODUCTION SMOKE TEST SUITE")
    print(f"   Backend: {BACKEND_URL}")
    print(f"   Frontend: https://level-audio-app.netlify.app")
    print(f"   Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run tests
    results['Health Check'] = test_health()
    results['CORS Preflight'] = test_cors_preflight()
    results['Netlify Frontend'] = test_netlify_frontend()
    results['Audio Analysis'] = test_analyze_audio()
    results['AI Mastering'] = test_mastering()
    
    task_id = test_stem_separation_submit()
    results['Stem Separation Submit'] = bool(task_id)
    
    # Only poll if submission succeeded (this takes a while on Cloud Run)
    if task_id:
        results['Task Polling'] = test_task_polling(task_id)
    else:
        results['Task Polling'] = False
    
    # Summary
    print("\n" + "="*60)
    print("📊 SMOKE TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {name}")
    
    print(f"\n  Total: {passed}/{total} passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")

if __name__ == '__main__':
    main()
