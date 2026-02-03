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
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
# import matchering as mg # Removed for GPL compliance
from mastering_engine import MasteringEngine
import soundfile as sf
import librosa
from supabase import create_client, Client
from dotenv import load_dotenv
from audio_analysis import analyze_lufs, is_reference_suitable

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Configure CORS - Restrict to known domains
ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8085",
    "http://127.0.0.1:8080",
    "https://*.lovable.app",
    "https://*.lovableproject.com",
    "https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com"
]

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Content-Length", "Content-Disposition", "X-Audio-Analysis"],
        "supports_credentials": True
    },
    r"/health": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Content-Length", "Content-Disposition", "X-Audio-Analysis"],
        "supports_credentials": False  # Changed to False to allow '*' origin
    }
})

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    traceback.print_exc()
    return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "OK", "service": "AI Mastering Backend"}), 200

def validate_file_type(file_path):
    """Validate file type using python-magic"""
    mime = magic.Magic(mime=True)
    file_type = mime.from_file(file_path)
    return file_type.startswith('audio/') or file_type == 'application/octet-stream'

def verify_auth_token(request):
    """Verify Supabase Auth Token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    
    # Allow dev bypass token for local development
    dev_token = os.environ.get("DEV_BYPASS_TOKEN", "dev-bypass-token")
    if token == dev_token:
        print("⚠️ Using DEV BYPASS TOKEN")
        return {"id": "dev-user", "email": "dev@example.com"}

    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        print(f"❌ Auth verification failed: {str(e)}")
        return None

@app.route('/api/payment/payu-signature', methods=['POST', 'OPTIONS'])
def payu_signature():
    """Generate PayU Latam signature"""
    if request.method == 'OPTIONS':
        return '', 204
        
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

@app.route('/api/master-audio', methods=['POST', 'OPTIONS'])
def master_audio():
    """Process audio files with Matchering - supports MP3, WAV, FLAC"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    # 1. Verify Authentication
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    start_time = time.time()
    temp_files = []
    
    try:
        # Check if files are in the request
        if 'target' not in request.files or 'reference' not in request.files:
            return jsonify({"error": "Missing target or reference audio files"}), 400
        
        target_file = request.files['target']
        reference_file = request.files['reference']
        
        # Get settings if provided
        settings = {}
        if 'settings' in request.form:
            import json
            settings = json.loads(request.form['settings'])
        
        print(f"📥 Received files: target={target_file.filename}, reference={reference_file.filename}")
        
        # Determine file extensions
        target_ext = os.path.splitext(target_file.filename)[1].lower()
        reference_ext = os.path.splitext(reference_file.filename)[1].lower()
        
        # Supported formats
        supported_formats = ['.mp3', '.wav', '.flac']
        if target_ext not in supported_formats or reference_ext not in supported_formats:
            return jsonify({
                "error": f"Unsupported file format. Supported: {', '.join(supported_formats)}"
            }), 400
        
        # Save uploaded files to temp locations
        temp_target_upload = tempfile.NamedTemporaryFile(delete=False, suffix=target_ext)
        target_file.save(temp_target_upload.name)
        temp_target_upload.close()
        temp_files.append(temp_target_upload.name)
        
        temp_reference_upload = tempfile.NamedTemporaryFile(delete=False, suffix=reference_ext)
        reference_file.save(temp_reference_upload.name)
        temp_reference_upload.close()
        temp_files.append(temp_reference_upload.name)

        # 2. Validate File Types (Magic Numbers)
        if not validate_file_type(temp_target_upload.name) or not validate_file_type(temp_reference_upload.name):
             # Cleanup
            for path in temp_files:
                if os.path.exists(path): os.unlink(path)
            return jsonify({"error": "Invalid file content detected"}), 400
        
        # Convert to WAV for Matchering (it only works reliably with WAV)
        print(f"🔄 Converting files to WAV format...")
        temp_target_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_target_wav.close()
        target_path = temp_target_wav.name
        temp_files.append(target_path)
        
        temp_reference_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_reference_wav.close()
        reference_path = temp_reference_wav.name
        temp_files.append(reference_path)
        
        # Convert both files to WAV
        if not convert_to_wav(temp_target_upload.name, target_path):
            return jsonify({"error": "Failed to convert target file to WAV"}), 500
        
        if not convert_to_wav(temp_reference_upload.name, reference_path):
            return jsonify({"error": "Failed to convert reference file to WAV"}), 500
        
        print(f"✅ Files converted to WAV successfully")
        
        # Analyze LUFS of both files
        print(f"📊 Analyzing loudness...")
        target_analysis = analyze_lufs(target_path)
        reference_analysis = analyze_lufs(reference_path)
        
        # Check reference suitability
        if reference_analysis['success']:
            ref_lufs = reference_analysis['integrated_lufs']
            suitability = is_reference_suitable(ref_lufs)
            print(f"   Target LUFS: {target_analysis.get('integrated_lufs', 'N/A')} LUFS")
            print(f"   Reference LUFS: {ref_lufs} LUFS - {suitability['message']}")
        
        # Output path - always WAV for Matchering
        temp_output = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_output.close()
        output_path = temp_output.name
        temp_files.append(output_path)
        
        # Process with MasteringEngine (Permissive)
        print(f"🎵 Starting Permissive Mastering...")
        print(f"   Target: {target_path}")
        print(f"   Reference: {reference_path}")
        
        try:
            # Initialize Engine
            engine = MasteringEngine()
            
            # Determine processing settings
            # We can parse 'settings' JSON here if needed for custom EQ/Loudness overrides
            target_lufs_val = settings.get('target_lufs')
            target_lufs = float(target_lufs_val) if target_lufs_val is not None else None
            
            # Param: target_lufs passed from UI
            result = engine.process(target_path, reference_path, output_path, target_lufs=target_lufs)
            
            print(f"✅ Mastering complete! Ref LUFS: {result['ref_lufs']}, Final LUFS: {result['target_lufs']}")
            
        except Exception as e:
            print(f"❌ Mastering error: {str(e)}")
            import traceback
            traceback.print_exc()
            # Cleanup temp files
            for path in temp_files:
                try:
                    if os.path.exists(path):
                        os.unlink(path)
                except:
                    pass
            return jsonify({"error": f"Mastering processing failed: {str(e)}"}), 500
        
        # Read the output file
        try:
            # Analyze mastered output BEFORE cleanup
            output_analysis = analyze_lufs(output_path)
            
            with open(output_path, 'rb') as f:
                output_data = f.read()
        except Exception as e:
            print(f"❌ Error reading/analyzing output file: {str(e)}")
            return jsonify({"error": f"Failed to read output file: {str(e)}"}), 500
        finally:
            # Cleanup temp files
            for path in temp_files:
                try:
                    if os.path.exists(path):
                        os.unlink(path)
                except:
                    pass
        
        elapsed = time.time() - start_time
        
        print(f"⏱️ Total processing time: {elapsed:.2f}s")
        print(f"📊 Results:")
        if output_analysis['success']:
            print(f"   Output LUFS: {output_analysis['integrated_lufs']} LUFS")
            print(f"   True Peak: {output_analysis['true_peak_db']} dBTP")
        
        # Generate output filename
        base_name = os.path.splitext(target_file.filename)[0]
        output_filename = f"mastered_{base_name}.wav"
        
        # Return the audio file with LUFS metadata in headers
        response = send_file(
            io.BytesIO(output_data),
            mimetype='audio/wav',
            as_attachment=True,
            download_name=output_filename
        )
        
        # Add LUFS analysis data as custom headers (JSON string)
        import json
        response.headers['X-Audio-Analysis'] = json.dumps({
            'target': target_analysis if target_analysis['success'] else None,
            'reference': reference_analysis if reference_analysis['success'] else None,
            'output': output_analysis if output_analysis['success'] else None,
            'processing_time': round(elapsed, 2)
        })
        
        return response
        
    except Exception as e:
        print(f"❌ Error in master_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        # Cleanup any temp files
        for path in temp_files:
            try:
                if os.path.exists(path):
                    os.unlink(path)
            except:
                pass
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze-audio', methods=['POST', 'OPTIONS'])
def analyze_audio_endpoint():
    """Analyze a single audio file for LUFS, True Peak, etc."""
    if request.method == 'OPTIONS':
        return '', 204
    
    # Verify Authentication
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    temp_path = None
    
    try:
        # Save to temp file
        ext = os.path.splitext(file.filename)[1].lower()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        file.save(temp_file.name)
        temp_file.close()
        temp_path = temp_file.name
        
        # Analyze
        analysis = analyze_lufs(temp_path)
        
        return jsonify(analysis)
        
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
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

@app.route('/api/estimate-time', methods=['POST', 'OPTIONS'])
def estimate_time_endpoint():
    """Estimate processing time for stems separation"""
    if request.method == 'OPTIONS':
        return '', 204
        
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
    if task_id in TASKS:
        TASKS[task_id]['progress'] = progress

def background_separation(task_id, file_path, output_dir, library, model_name, shifts, two_stems=False):
    try:
        TASKS[task_id]['status'] = 'processing'
        
        def progress_callback(p):
            update_task_progress(task_id, p)
            
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
            TASKS[task_id]['status'] = 'failed'
            TASKS[task_id]['error'] = result.get('error', 'Unknown error')
            return
            
        # Zip the output
        shutil.make_archive(os.path.join(os.path.dirname(output_dir), 'stems'), 'zip', result['output_path'])
        zip_path = os.path.join(os.path.dirname(output_dir), 'stems.zip')
        
        TASKS[task_id]['status'] = 'completed'
        TASKS[task_id]['progress'] = 100
        TASKS[task_id]['result_path'] = zip_path
        
    except Exception as e:
        print(f"❌ Background task error: {str(e)}")
        TASKS[task_id]['status'] = 'failed'
        TASKS[task_id]['error'] = str(e)

@app.route('/api/task-status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get status of a background task"""
    task = TASKS.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify({
        "id": task_id,
        "status": task['status'],
        "progress": task.get('progress', 0),
        "error": task.get('error')
    })

@app.route('/api/task-result/<task_id>', methods=['GET'])
def get_task_result(task_id):
    """Download result of a completed task"""
    task = TASKS.get(task_id)
    if not task or task['status'] != 'completed':
        return jsonify({"error": "Result not ready"}), 404
        
    return send_file(
        task['result_path'],
        mimetype='application/zip',
        as_attachment=True,
        download_name=f"stems_{task_id}.zip"
    )

@app.route('/api/separate-audio', methods=['POST', 'OPTIONS'])
def separate_audio_endpoint():
    """Start audio separation task"""
    if request.method == 'OPTIONS':
        return '', 204
        
    # Verify Authentication
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    library = request.form.get('library', 'demucs')
    model_name = request.form.get('model_name', 'htdemucs')
    shifts = int(request.form.get('shifts', 1))
    
    # Check for 2-stems request
    # We use a specific flag or infer from stem_count if passed
    stem_count = request.form.get('stem_count', '4')
    two_stems = (stem_count == '2')

    # Create task
    task_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, file.filename)
    output_dir = os.path.join(temp_dir, 'output')
    
    try:
        file.save(input_path)
        
        TASKS[task_id] = {
            'id': task_id,
            'status': 'queued',
            'progress': 0,
            'created_at': time.time()
        }
        
        # Submit to background thread
        executor.submit(
            background_separation,
            task_id,
            input_path,
            output_dir,
            library,
            model_name,
            shifts,
            two_stems # Pass the new argument
        )
        
        return jsonify({
            "task_id": task_id,
            "status": "queued",
            "message": "Separation started"
        })
        
    except Exception as e:
        print(f"❌ Separation endpoint error: {str(e)}")
        return jsonify({"error": str(e)}), 500



@app.route('/api/analyze-bpm', methods=['POST', 'OPTIONS'])
def analyze_bpm():
    """Analyze BPM of an audio file using Librosa"""
    if request.method == 'OPTIONS':
        return '', 204
    
    # Verify Authentication
    user = verify_auth_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    temp_path = None
    
    try:
        # Save to temp file
        ext = os.path.splitext(file.filename)[1].lower()
        if not ext: ext = '.wav' # Default
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        file.save(temp_file.name)
        temp_file.close()
        temp_path = temp_file.name
        
        # Load and analyze
        # Use Librosa for beat tracking
        # sr=None preserves native sampling rate, but for BPM, standardizing to 22050 is faster/fine.
        y, sr = librosa.load(temp_path, sr=22050)
        
        # Estimate tempo
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        
        # Tempo is usually a scalar, but can be array in older librosa
        if hasattr(tempo, 'item'):
             bpm = float(tempo.item())
        else:
             bpm = float(tempo)
             
        return jsonify({
            "bpm": round(bpm, 2),
            "confidence": 0.9, 
            "method": "librosa_beat_track"
        })
        
    except Exception as e:
        print(f"❌ BPM Analysis error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    print(f"🚀 Starting AI Mastering Backend on port {port}...")
    print(f"📁 Supported formats: MP3, WAV, FLAC")
    print(f"📤 Output format: WAV")
    app.run(host="0.0.0.0", port=port, debug=True)
