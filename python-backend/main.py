"""
AI Mastering Backend
Flask application for processing audio files with Matchering
Supports MP3, WAV, and FLAC input formats
"""
import os
import io
import time
import tempfile
import magic
import hashlib
from flask import Flask, request, jsonify, send_file, redirect
from flask_cors import CORS
# import matchering as mg # Removed for GPL compliance
from mastering_engine import MasteringEngine
import soundfile as sf
import librosa
from supabase import create_client, Client
from dotenv import load_dotenv
# Load environment variables FIRST
load_dotenv()

import requests
import json
import threading
import uuid
from datetime import datetime
from audio_analysis import analyze_lufs, is_reference_suitable
from payment_webhooks import payment_bp
from b2_service import b2_service

app = Flask(__name__)

# Register payment webhook blueprint
app.register_blueprint(payment_bp)

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

import re

# Configure CORS - Restrict to known domains
ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8085",
    "http://127.0.0.1:8080",
    "https://level-audio-app.netlify.app",
    "https://levelaudio.live",
    "https://www.levelaudio.live",
    re.compile(r"https://.*\.netlify\.app"),
    re.compile(r"https://.*\.lovable\.app"),
    re.compile(r"https://.*\.lovableproject\.com"),
    re.compile(r"http://192\.168\..*:808\d"),
    re.compile(r"http://127\.0\.0\.1:.*"),
    re.compile(r"http://localhost:.*")
]

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["POST", "OPTIONS", "GET"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        "expose_headers": ["Content-Type", "Content-Length", "Content-Disposition", "X-Audio-Analysis"],
        "supports_credentials": True,
        "max_age": 3600
    },
    r"/health": {
        "origins": "*",
        "methods": ["GET", "OPTIONS"]
    }
})

@app.after_request
def after_request(response):
    """Ensure CORS headers are present on all responses"""
    origin = request.headers.get('Origin')
    if origin and (origin in ALLOWED_ORIGINS or any(pattern.match(origin) for pattern in ALLOWED_ORIGINS if hasattr(pattern, 'match'))):
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Expose-Headers', 'Content-Type,Content-Length,Content-Disposition,X-Audio-Analysis')
    return response

def verify_auth_token(request):
    """Verify Supabase Auth Token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        print("❌ Auth failed: No Bearer token")
        return None
    
    token = auth_header.split(' ')[1]
    
    # Allow dev bypass token for local development
    dev_token = os.environ.get("DEV_BYPASS_TOKEN", "dev-bypass-token")
    if token == dev_token:
        print("⚠️ Using DEV BYPASS TOKEN")
        return {"id": "dev-user", "email": "dev@example.com"}

    try:
        # Log partial token for debugging (security: only last 6 chars)
        print(f"🔐 Verifying token ending in ...{token[-6:] if len(token) > 6 else token}")
        user = supabase.auth.get_user(token)
        print(f"✅ Auth success for user: {user.user.id if hasattr(user, 'user') else 'unknown'}")
        return user
    except Exception as e:
        print(f"❌ Auth verification failed: {str(e)}")
        # Check if Supabase client is healthy
        if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
            print("❌ Start-up Error: SUPABASE_URL or SUPABASE_KEY missing in env")
        return None
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "OK", "timestamp": time.time()}), 200

@app.route('/api/payment/payu-signature', methods=['POST'])
def payu_signature():
    """Generate PayU Latam signature"""
        
    try:
        data = request.get_json()
        reference_code = data.get('referenceCode')
        amount = data.get('amount')
        currency = data.get('currency')
        
        if not all([reference_code, amount, currency]):
            return jsonify({"error": "Missing required fields"}), 400
            
        # PayU Sandbox Credentials (Loaded from Env)
        API_KEY = os.environ.get("PAYU_API_KEY")
        MERCHANT_ID = os.environ.get("PAYU_MERCHANT_ID")
        ACCOUNT_ID = os.environ.get("PAYU_ACCOUNT_ID")
        
        if not all([API_KEY, MERCHANT_ID, ACCOUNT_ID]):
             return jsonify({"error": "Server configuration error: PayU keys missing"}), 500
        
        # Signature format: "ApiKey~merchantId~referenceCode~amount~currency"
        signature_str = f"{API_KEY}~{MERCHANT_ID}~{reference_code}~{amount}~{currency}"
        signature = hashlib.md5(signature_str.encode('utf-8')).hexdigest()
        
        return jsonify({
            "signature": signature,
            "merchantId": MERCHANT_ID,
            "accountId": ACCOUNT_ID,
            "test": 1 # 1 for Sandbox, 0 for Production
        })
        
    except Exception as e:
        print(f"❌ Payment signature error: {str(e)}")
        return jsonify({"error": str(e)}), 500

def validate_file_type(file_path):
    """Validate file type using python-magic"""
    mime = magic.Magic(mime=True)
    file_type = mime.from_file(file_path)
    return file_type.startswith('audio/') or file_type == 'application/octet-stream'

def download_file(url, local_path):
    """Download file from URL (Supports HTTP/HTTPS and B2 protocol)"""
    MAX_SIZE = 1024 * 1024 * 1024 # 1GB
    try:
        # Handle B2 protocol
        if url.startswith('b2://'):
            from b2_service import b2_service
            remote_path = url.replace('b2://', '')
            print(f"📥 Downloading from B2: {remote_path}")
            return b2_service.download_file(remote_path, local_path)

        print(f"📥 Downloading from HTTP/S: {url[:100]}...")
        # Start download with stream=True
        response = requests.get(url, stream=True, timeout=120)
        response.raise_for_status()
        
        cl = response.headers.get('Content-Length')
        if cl and int(cl) > MAX_SIZE:
             print(f"❌ File too large: {cl} bytes")
             return False

        downloaded = 0
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=65536):
                downloaded += len(chunk)
                if downloaded > MAX_SIZE:
                    print(f"❌ File exceeded limit")
                    f.close()
                    if os.path.exists(local_path): os.unlink(local_path)
                    return False
                f.write(chunk)
        print(f"✅ Download complete: {local_path} ({os.path.getsize(local_path)} bytes)")
        return True
    except Exception as e:
        print(f"❌ Download error: {str(e)}")
        if os.path.exists(local_path): os.unlink(local_path)
        return False

def log_job(user_id, job_type, file_size=0, duration=0, status='pending', error=None, cost_estimate=0.0):
    """Log job to Supabase job_history table"""
    try:
        job_data = {
            "user_id": user_id if user_id != 'dev-user' else None,
            "job_type": job_type,
            "file_size_bytes": file_size,
            "duration_seconds": duration,
            "status": status,
            "cost_estimate": cost_estimate,
            "completed_at": time.strftime('%Y-%m-%dT%H:%M:%SZ') if status in ['completed', 'failed'] else None
        }
        if error:
            job_data["error_message"] = str(error)
        
        supabase.table("job_history").insert(job_data).execute()
    except Exception as e:
        print(f"⚠️ Failed to log job metrics: {str(e)}")

def create_task_in_db(task_id, user_id, job_type="stems", file_size=0):
    """Create a tracked task in job_logs and local TASKS dict"""
    # Always update local store first as a reliable fallback
    TASKS[task_id] = {
        "id": task_id,
        "user_id": user_id,
        "job_type": job_type,
        "status": "queued",
        "progress": 0,
        "file_size": file_size,
        "created_at": datetime.now().isoformat()
    }
    
    try:
        data = {
            "task_id": task_id,
            "user_id": str(user_id) if user_id else "dev-user",
            "job_type": job_type,
            "status": "queued",
            "file_size": file_size,
            "progress": 0,
            "created_at": "now()"
        }
        supabase.table("job_logs").insert(data).execute()
        print(f"✅ Created task {task_id} in DB")
    except Exception as e:
        print(f"❌ Failed to create task {task_id} in Supabase: {e}")
        # Local TASKS still has it, so we can continue

def update_task_in_db(task_id, status, progress=None, output_url=None, error=None):
    """Update task status in job_logs and local TASKS dict"""
    # Always update local store first
    if task_id in TASKS:
        TASKS[task_id]["status"] = status
        if progress is not None:
            TASKS[task_id]["progress"] = progress
        if output_url:
            TASKS[task_id]["output_url"] = output_url
        if error:
            TASKS[task_id]["error_message"] = str(error)
            TASKS[task_id]["error"] = str(error) # For frontend compatibility
        TASKS[task_id]["updated_at"] = datetime.now().isoformat()

    try:
        data = {"status": status}
        if progress is not None:
            data["progress"] = progress
        if output_url:
            data["output_url"] = output_url
        if error:
            data["error_message"] = str(error)
            
        supabase.table("job_logs").update(data).eq("task_id", task_id).execute()
    except Exception as e:
        # Silently fail for Supabase updates if they're failing, we have the local store
        if "Could not find the table" not in str(e):
            print(f"⚠️ Failed to update task {task_id} in Supabase: {e}")

def upload_result_to_storage(local_path, task_id, bucket='audio-processing'):
    """Upload result ZIP to Supabase Storage"""
    try:
        file_name = f"results/{task_id}_stems.zip"
        print(f"📤 Uploading result to {file_name}...")
        
        with open(local_path, 'rb') as f:
            supabase.storage.from_(bucket).upload(
                file=f,
                path=file_name,
                file_options={"content-type": "application/zip", "upsert": "true"}
            )
        
        # Get public URL
        url = supabase.storage.from_(bucket).get_public_url(file_name)
        return url
    except Exception as e:
        print(f"❌ Upload result failed: {e}")
        return None

def cleanup_old_files(bucket_name='audio-processing', max_age_hours=1):
    """Delete files older than max_age_hours from Supabase Storage"""
    try:
        print(f"🧹 Starting storage cleanup for bucket: {bucket_name}")
        # list() only returns files in the root or a specific folder. 
        # Since we use user_id/folder/file, we need to list recursively or iterate users.
        # For simplicity, we'll iterate through known paths or just use the list API if it supports recursive (it doesn't easily).
        # We'll list the top level (user folders) and then iterate.
        
        users_dirs = supabase.storage.from_(bucket_name).list()
        files_deleted = 0
        now = time.time()
        
        for user_dir in users_dirs:
            if user_dir.get('name') and not user_dir.get('id'): # It's a directory
                uid = user_dir['name']
                # Iterate subfolders (mastering, analysis, stems)
                for folder in ['mastering/target', 'mastering/reference', 'analysis', 'stems']:
                    try:
                        files = supabase.storage.from_(bucket_name).list(f"{uid}/{folder}")
                        for f in files:
                            created_at_str = f.get('created_at')
                            if created_at_str:
                                # Parse ISO format: 2026-02-06T12:00:00.000Z
                                from datetime import datetime
                                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                                age_seconds = now - created_at.timestamp()
                                
                                if age_seconds > (max_age_hours * 3600):
                                    path = f"{uid}/{folder}/{f['name']}"
                                    print(f"   🗑️ Deleting stale file: {path} (Age: {age_seconds/3600:.1f}h)")
                                    supabase.storage.from_(bucket_name).remove([path])
                                    files_deleted += 1
                    except:
                        continue
        
        print(f"✅ Cleanup complete. Deleted {files_deleted} files.")
        return files_deleted
    except Exception as e:
        print(f"❌ Cleanup error: {str(e)}")
        return 0

def convert_to_wav(input_path, output_path):
    """Convert any audio format to WAV using librosa and soundfile"""
    try:
        # Load audio file (supports MP3, FLAC, WAV, etc.)
        audio, sample_rate = librosa.load(input_path, sr=None, mono=False)
        # Export as WAV
        sf.write(output_path, audio.T if len(audio.shape) > 1 else audio, sample_rate)
        return True
    except Exception as e:
        print(f"❌ Conversion error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/api/get-b2-upload-url', methods=['POST'])
def get_b2_upload_url():
    """Get a presigned B2 upload URL for the frontend"""
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data = request.get_json()
        file_name = data.get('fileName')
        content_type = data.get('contentType', 'audio/wav')
        
        if not file_name:
            return jsonify({"error": "fileName is required"}), 400
            
        upload_data = b2_service.get_upload_url(file_name, content_type)
        if not upload_data:
            return jsonify({"error": "Failed to generate B2 upload URL"}), 500
            
        return jsonify(upload_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/master-audio', methods=['POST'])
def master_audio_endpoint():
    """Start audio mastering task"""
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = user.get('id') if isinstance(user, dict) else (user.user.id if hasattr(user, 'user') else 'dev-user')

    data = request.get_json(silent=True) or {}
    target_url = data.get('target_url')
    reference_url = data.get('reference_url')
    settings = data.get('settings', {})

    if not target_url or not reference_url:
        return jsonify({"error": "Missing target_url or reference_url"}), 400

    task_id = str(uuid.uuid4())
    create_task_in_db(task_id, user_id, "mastering")
    executor.submit(background_mastering, task_id, user_id, target_url, reference_url, settings)

    return jsonify({"task_id": task_id}), 202

def background_mastering(task_id, user_id, target_url, reference_url, settings):
    """Run mastering in background"""
    temp_files = []
    start_time = time.time()
    
    try:
        update_task_in_db(task_id, 'processing', 10)
        
        # 1. Download files
        # EXTRACT EXTENSIONS FROM URLs IF POSSIBLE, FALLBACK TO .wav
        def get_ext(url, default='.wav'):
            if '.mp3' in url.lower(): return '.mp3'
            if '.flac' in url.lower(): return '.flac'
            if '.wav' in url.lower(): return '.wav'
            return default

        target_ext = get_ext(target_url)
        ref_ext = get_ext(reference_url)

        temp_target = tempfile.NamedTemporaryFile(delete=False, suffix=target_ext).name
        temp_reference = tempfile.NamedTemporaryFile(delete=False, suffix=ref_ext).name
        temp_files.extend([temp_target, temp_reference])
        
        print(f"📥 Downloading target (ext: {target_ext})...")
        if not download_file(target_url, temp_target):
            raise Exception(f"Failed to download target file from {target_url[:50]}...")
        update_task_in_db(task_id, 'processing', 20)
        
        print(f"📥 Downloading reference (ext: {ref_ext})...")
        if not download_file(reference_url, temp_reference):
            raise Exception(f"Failed to download reference file from {reference_url[:50]}...")
        update_task_in_db(task_id, 'processing', 30)
        
        # Output path
        output_path = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
        temp_files.append(output_path)
        
        # 2. Process
        target_lufs_val = settings.get('target_lufs')
        target_lufs = float(target_lufs_val) if target_lufs_val is not None else None
        
        # Analysis
        update_task_in_db(task_id, 'processing', 40)
        from mastering_engine import MasteringEngine
        
        # Handle format conversion if needed for analysis
        # (Already handled inside MasteringEngine.load_audio which uses librosa)
        
        engine = MasteringEngine()
        result_info = engine.process(temp_target, temp_reference, output_path, target_lufs=target_lufs)
        update_task_in_db(task_id, 'processing', 80)
        
        # 3. Analyze output and upload
        # (Optional: Re-run analysis for metadata)
        from main import analyze_lufs # Assuming it exists or use engine's stats
        output_analysis = analyze_lufs(output_path) if 'analyze_lufs' in globals() else {"success": False}
        
        import json
        metadata = {
            'output': output_analysis if output_analysis.get('success') else None,
            'engine_stats': result_info
        }
        
        # Upload to Storage (B2 with Supabase fallback)
        remote_url = upload_result_to_storage(output_path, task_id)
        if not remote_url:
             raise Exception("Result upload failed to both B2 and Supabase")
             
        elapsed = time.time() - start_time
        update_task_in_db(task_id, 'completed', 100, output_url=remote_url, error=json.dumps(metadata))
        log_job(user_id, 'mastering', os.path.getsize(temp_target), elapsed, 'completed')

    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"❌ Mastering Task Error: {error_detail}")
        # Store detailed error in DB so frontend knows what happened
        update_task_in_db(task_id, 'failed', error=str(e))
    finally:
        for path in temp_files:
            if os.path.exists(path):
                try: os.unlink(path)
                except: pass

def upload_result_to_storage(local_path, task_id, bucket='audio-processing'):
    """Upload result to B2 (primary) or Supabase Storage (fallback)"""
    try:
        ext = ".zip" if "stems" in local_path or local_path.endswith('.zip') else ".wav"
        file_name = f"results/{task_id}{ext}"
        mime = "application/zip" if ext == ".zip" else "audio/wav"
        
        # 1. Try B2
        if b2_service.bucket:
            try:
                remote_url = b2_service.upload_file(local_path, file_name, content_type=mime)
                if remote_url:
                    print(f"✅ Uploaded to B2: {remote_url}")
                    return remote_url
            except Exception as b2_err:
                print(f"⚠️ B2 Upload failed: {b2_err}")

        # 2. Fallback to Supabase
        print(f"📤 Uploading to Supabase Storage: {file_name}...")
        with open(local_path, 'rb') as f:
            supabase.storage.from_(bucket).upload(
                file=f,
                path=file_name,
                file_options={"content-type": mime, "upsert": "true"}
            )
        return supabase.storage.from_(bucket).get_public_url(file_name)
    except Exception as e:
        print(f"❌ Final upload failure: {e}")
        return None

@app.route('/api/analyze-audio', methods=['POST'])
def analyze_audio_endpoint():
    """Analyze a single audio file for LUFS, True Peak, etc."""
    
    # Verify Authentication
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = user.get('id') if isinstance(user, dict) else (user.user.id if hasattr(user, 'user') else 'dev-user')

    data = request.get_json(silent=True) or {}
    file_url = data.get('file_url')
    
    temp_path = None
    
    try:
        if file_url:
            print(f"🔍 Analyzing via URL: {file_url[:50]}...")
            t_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            t_file.close()
            temp_path = t_file.name
            if not download_file(file_url, temp_path):
                return jsonify({"error": "Failed to download file"}), 500
        elif 'file' in request.files:
            file = request.files['file']
            ext = os.path.splitext(file.filename)[1].lower()
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            file.save(temp_file.name)
            temp_file.close()
            temp_path = temp_file.name
        else:
            return jsonify({"error": "No file or URL provided"}), 400
        
        # Analyze
        analysis = analyze_lufs(temp_path)
        
        # Log job
        file_size = os.path.getsize(temp_path)
        log_job(user_id, 'analysis', file_size, 0, 'completed' if analysis.get('success') else 'failed', error=analysis.get('error'))
        
        if not analysis.get('success'):
            return jsonify(analysis), 400
            
        return jsonify(analysis)
        
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        log_job(user_id, 'analysis', 0, 0, 'failed', str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

from stems_separation import separate_audio, estimate_processing_time
import shutil

@app.route('/api/estimate-time', methods=['POST'])
def estimate_time_endpoint():
    """Estimate processing time for stems separation"""
        
    try:
        data = request.get_json()
        duration = data.get('duration', 0)
        library = data.get('library', 'demucs')
        
        # Simple hardware detection (can be improved)
        import torch
        hardware_type = 'gpu' if torch.cuda.is_available() else 'cpu'
        
        estimated_seconds = estimate_processing_time(duration, library, hardware_type)
        
        return jsonify({
            "estimated_seconds": estimated_seconds,
            "hardware_type": hardware_type
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Task management
import threading
import uuid
import concurrent.futures

# Global task store (in-memory for simplicity)
TASKS = {}
executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

def update_task_progress(task_id, progress):
    """Deprecated: Logic moved to background_separation"""
    pass

def background_separation(task_id, file_path, output_dir, library, model_name, shifts, two_stems=False):
    try:
        update_task_in_db(task_id, 'processing', 0)
        
        def progress_callback(p):
            update_task_in_db(task_id, 'processing', p)
            
        result = separate_audio(
            file_path, 
            output_dir, 
            library=library, 
            model_name=model_name,
            shifts=shifts,
            two_stems=two_stems,
            progress_callback=progress_callback
        )
        
        if not result['success']:
            update_task_in_db(task_id, 'failed', error=result.get('error', 'Unknown error'))
            return
            
        # Zip the output
        zip_base = os.path.join(os.path.dirname(output_dir), 'stems')
        shutil.make_archive(zip_base, 'zip', result['output_path'])
        zip_path = zip_base + '.zip'
        
        print(f"✅ Stems ZIP created at: {zip_path} ({os.path.getsize(zip_path)} bytes)")
        
        # MUST upload to remote storage — local:// doesn't survive on Cloud Run
        result_url = None
        try:
            result_url = upload_result_to_storage(zip_path, task_id)
            if result_url:
                print(f"✅ Stems uploaded to remote storage: {result_url}")
        except Exception as upload_err:
            print(f"⚠️ Remote storage upload failed: {upload_err}")
        
        # Fallback to local:// only if remote upload completely failed (works on localhost)
        if not result_url:
            result_url = f"local://{zip_path}"
            print(f"⚠️ Using local fallback (won't work on Cloud Run): {result_url}")
        
        update_task_in_db(task_id, 'completed', 100, output_url=result_url)

    except Exception as e:
        print(f"❌ Background task error: {str(e)}")
        import traceback
        traceback.print_exc()
        update_task_in_db(task_id, 'failed', error=str(e))

@app.route('/api/task-status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get status of a background task from local store or DB"""
    # Try local store first as it's the most up-to-date and reliable fallback
    if task_id in TASKS:
        task = TASKS[task_id]
        return jsonify({
            "id": task_id,
            "status": task['status'],
            "progress": task.get('progress', 0),
            "error": task.get('error_message') or task.get('error'),
            "output_url": task.get('output_url')
        })

    try:
        res = supabase.table("job_logs").select("*").eq("task_id", task_id).execute()
        if not res.data:
            return jsonify({"error": "Task not found"}), 404
            
        task = res.data[0]
        metadata = None
        error_msg = task.get('error_message')
        if task['status'] == 'completed' and error_msg and error_msg.startswith('{'):
            try:
                metadata = json.loads(error_msg)
                error_msg = None
            except:
                pass

        return jsonify({
            "id": task_id,
            "status": task['status'],
            "progress": task.get('progress', 0),
            "error": error_msg,
            "output_url": task.get('output_url'),
            "metadata": metadata
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/task-result/<task_id>', methods=['GET'])
def get_task_result(task_id):
    """Serve result ZIP — either from local disk or redirect to remote URL"""
    try:
        url = None
        
        # Try local store first
        if task_id in TASKS:
            task = TASKS[task_id]
            if task['status'] == 'completed':
                url = task.get('output_url')
                print(f"📋 Task {task_id[:8]} found in memory, url type: {url[:20] if url else 'None'}...")
        
        if not url:
            try:
                res = supabase.table("job_logs").select("output_url, status").eq("task_id", task_id).execute()
                if res.data and len(res.data) > 0 and res.data[0].get('status') == 'completed':
                    url = res.data[0].get('output_url')
                    print(f"📋 Task {task_id[:8]} found in DB, url type: {url[:20] if url else 'None'}...")
                elif res.data and len(res.data) > 0:
                    status = res.data[0].get('status', 'unknown')
                    print(f"⏳ Task {task_id[:8]} status in DB: {status}")
                    return jsonify({"error": f"Task not completed yet, status: {status}"}), 202
                else:
                    print(f"❓ Task {task_id[:8]} not found in DB")
            except Exception as e:
                print(f"⚠️ DB query failed for task {task_id}: {e}")
                import traceback
                traceback.print_exc()

        if not url:
            return jsonify({"error": "Result not ready or task not found"}), 404
        
        # If it's a local file, serve it directly
        if url.startswith('local://'):
            local_path = url.replace('local://', '')
            if os.path.exists(local_path):
                print(f"📦 Serving local ZIP: {local_path}")
                return send_file(
                    local_path,
                    mimetype='application/zip',
                    as_attachment=True,
                    download_name=f'stems_{task_id[:8]}.zip'
                )
            else:
                # On Cloud Run, local files vanish between requests
                print(f"⚠️ Local file gone (stateless container): {local_path}")
                return jsonify({"error": "Result file expired. On Cloud Run, local results are ephemeral. Please re-run the task."}), 410
        
        # If it's a B2 URL, get authorized download URL
        if url.startswith('b2://'):
            try:
                remote_path = url.replace('b2://', '')
                print(f"🔐 Getting auth URL for B2: {remote_path}")
                
                # Re-authenticate B2 if needed
                if not b2_service.bucket:
                    print("🔄 Re-authenticating B2...")
                    b2_service.authenticate()
                
                auth_url = b2_service.get_download_url(remote_path)
                if auth_url:
                    url = auth_url
                    print(f"✅ B2 auth URL generated successfully")
                else:
                    print(f"❌ B2 returned None for download URL")
                    return jsonify({"error": "Failed to authorize B2 download"}), 500
            except Exception as e:
                print(f"❌ B2 auth error: {e}")
                import traceback
                traceback.print_exc()
                return jsonify({"error": f"B2 authorization failed: {str(e)}"}), 500
                
        # Return the download URL to the client — DON'T proxy through Cloud Run
        # (Cloud Run has a ~32MB response size limit, which audio files easily exceed)
        if url.startswith('http'):
            print(f"✅ Returning download URL to client: {url[:80]}...")
            return jsonify({
                "download_url": url,
                "task_id": task_id
            }), 200
        
        # Otherwise redirect to remote URL
        return redirect(url)

    except Exception as e:
        # Top-level safety net — ensures CORS headers are always returned
        print(f"💥 CRITICAL: Unhandled error in get_task_result: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/api/separate-audio', methods=['POST'])
def separate_audio_endpoint():
    """Start audio separation task"""
        
    # Verify Authentication
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = user.get('id') if isinstance(user, dict) else (user.user.id if hasattr(user, 'user') else 'dev-user')

    # Debug Request
    print(f"✂️ Request Content-Type: {request.content_type}")
    data = request.get_json(silent=True) or {}
    print(f"✂️ Request JSON Keys: {list(data.keys())}")
    
    # Robust file_url extraction (check JSON then FORM)
    file_url = data.get('file_url') or request.form.get('file_url')
    
    library = data.get('library', request.form.get('library', 'demucs'))
    model_name = data.get('model_name', request.form.get('model_name', 'htdemucs'))
    shifts = int(data.get('shifts', request.form.get('shifts', 1)))
    stem_count = data.get('stem_count', request.form.get('stem_count', '4'))
    two_stems = (stem_count == '2')

    # Create task
    task_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.wav") # We'll force wav for consistency
    output_dir = os.path.join(temp_dir, 'output')
    
    try:
        if file_url:
            print(f"✂️ Separating via URL: {file_url[:50]}...")
            if not download_file(file_url, input_path):
                return jsonify({"error": "Failed to download file"}), 500
        elif 'file' in request.files:
            file = request.files['file']
            file.save(input_path)
        else:
            return jsonify({"error": "No file or URL provided"}), 400
        
        file_size = os.path.getsize(input_path)
        
        file_size = os.path.getsize(input_path)
        
        # Create Task in DB
        create_task_in_db(task_id, user_id, 'stems', file_size)
        
        # Submit to background thread
        executor.submit(
            background_separation,
            task_id,
            input_path,
            output_dir,
            library,
            model_name,
            shifts,
            two_stems
        )
        
        return jsonify({
            "task_id": task_id,
            "status": "queued",
            "message": "Separation started"
        })
        
    except Exception as e:
        print(f"❌ Separation endpoint error: {str(e)}")
        log_job(user_id, 'stems', 0, 0, 'failed', str(e))
        return jsonify({"error": str(e)}), 500



# Start background cleanup thread
def run_periodic_cleanup():
    """Run storage cleanup every hour"""
    time.sleep(30) # Wait for app to stabilize
    while True:
        try:
            cleanup_old_files()
        except Exception as e:
            print(f"⚠️ Periodic cleanup error: {str(e)}")
        time.sleep(3600) # 1 hour

cleanup_thread = threading.Thread(target=run_periodic_cleanup, daemon=True)
cleanup_thread.start()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    print(f"🚀 Starting AI Mastering Backend on port {port}...")
    print(f"📁 Supported formats: MP3, WAV, FLAC")
    print(f"📤 Output format: WAV")
    print(f"🧹 Storage cleanup service: ACTIVE (1h cycle)")
    app.run(host="0.0.0.0", port=port, debug=True)
