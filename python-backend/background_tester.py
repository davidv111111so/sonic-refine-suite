import os
import time
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

LOG_FILE = "python-backend/background_tests.log"
BACKEND_URL = os.environ.get("VITE_PYTHON_BACKEND_URL", "http://localhost:8001")
CHECK_INTERVAL = 60  # seconds

def log_result(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}\n"
    print(log_entry.strip())
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_entry)

def check_backend_health():
    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if resp.status_code == 200:
            return True, "Backend Healthy"
        else:
            return False, f"Backend Health Error: {resp.status_code}"
    except Exception as e:
        return False, f"Backend Connection Failed: {str(e)}"

def check_b2_config():
    key_id = os.environ.get("B2_APPLICATION_KEY_ID")
    app_key = os.environ.get("B2_APPLICATION_KEY")
    bucket = os.environ.get("B2_BUCKET_NAME")
    
    if not all([key_id, app_key, bucket]):
        return False, "B2 Credentials Missing"
    return True, "B2 Configured"

def run_tests():
    log_result("🚀 Starting Background Health Audit...")
    
    # 1. Backend Health
    ok, msg = check_backend_health()
    log_result(f"{'✅' if ok else '❌'} {msg}")
    
    # 2. B2 Config
    ok, msg = check_b2_config()
    log_result(f"{'✅' if ok else '❌'} {msg}")
    
    # 3. Environment Variables Audit
    required_vars = ["SUPABASE_URL", "SUPABASE_KEY", "JWT_SECRET"]
    missing = [v for v in required_vars if not os.environ.get(v)]
    if missing:
        log_result(f"❌ Missing critical Env Vars: {', '.join(missing)}")
    else:
        log_result("✅ All critical Env Vars present")
        
    log_result("🏁 Audit session complete.")

if __name__ == "__main__":
    if not os.path.exists(os.path.dirname(LOG_FILE)):
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        
    log_result("🤖 Antigravity Background Agent Initialized")
    
    while True:
        try:
            run_tests()
        except KeyboardInterrupt:
            log_result("🛑 Agent shutting down...")
            break
        except Exception as e:
            log_result(f"⚠️ Agent Error: {str(e)}")
            
        time.sleep(CHECK_INTERVAL)
