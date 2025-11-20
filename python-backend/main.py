"""
AI Mastering Backend
Flask application for processing audio files with GCS integration and Matchering
"""
import os
import json
import time
import uuid
from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import storage, firestore
import tempfile
import matchering as mg
import uvicorn
import jwt

app = Flask(__name__)

# Configure CORS
ALLOWED_ORIGINS_ENV = os.getenv('ALLOWED_ORIGINS', '*')
if ALLOWED_ORIGINS_ENV == '*':
    ALLOWED_ORIGINS = ['*']
else:
    ALLOWED_ORIGINS = ALLOWED_ORIGINS_ENV.split(',')

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
        "allow_headers": ["Content-Type", "Authorization", "x-goog-resumable"],
        "expose_headers": ["Content-Type", "Content-Length"],
        "supports_credentials": True
    },
    r"/health": {
        "origins": ["*"],
        "methods": ["GET", "OPTIONS"]
    }
})

# GCS Configuration
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
BUCKET_NAME = os.getenv('GOOGLE_CLOUD_BUCKET_NAME')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
ADMIN_EMAILS = ["davidv111111@gmail.com", "santiagov.t068@gmail.com"]

# Initialize Clients Lazily
db = None
storage_client = None

try:
    db = firestore.Client()
    storage_client = storage.Client()
    print("[CONFIG] Google Cloud Clients initialized successfully")
except Exception as e:
    print(f"[WARN] Could not initialize Google Cloud Clients: {e}")
    print("[WARN] Backend will start but cloud features will fail until credentials are fixed.")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "OK", "service": "AI Mastering Backend"}), 200

@app.route('/api/master-audio', methods=['POST', 'OPTIONS'])
def master_audio():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    if not storage_client:
         return jsonify({"error": "Service Unavailable: Cloud credentials missing"}), 503

    start_time = time.time()
    
    try:
        # Parse request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        target_url = data.get('targetUrl') or data.get('inputUrl')
        reference_url = data.get('referenceUrl')
        file_name = data.get('fileName') or "output.wav"
        settings = data.get('settings', {})
        
        if not target_url or not reference_url:
            return jsonify({"error": "Missing required fields"}), 400
            
        job_id = str(uuid.uuid4())
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Download TARGET
        print(f"📥 Downloading TARGET from: {target_url}")
        target_blob_name = extract_blob_name_from_url(target_url)
        target_blob = bucket.blob(target_blob_name)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_target:
            target_blob.download_to_filename(temp_target.name)
            target_path = temp_target.name
            
        # Download REFERENCE
        print(f"📥 Downloading REFERENCE from: {reference_url}")
        reference_blob_name = extract_blob_name_from_url(reference_url)
        reference_blob = bucket.blob(reference_blob_name)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_reference:
            reference_blob.download_to_filename(temp_reference.name)
            reference_path = temp_reference.name
            
        # Output path
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_output:
            output_path = temp_output.name
            
        # Process
        print(f"🎵 Starting Matchering processing...")
        try:
            # Configure output bit depth
            output_bits = settings.get('output_bits', 16)
            if output_bits == 16:
                result_format = mg.pcm16(output_path)
            elif output_bits == 24:
                result_format = mg.pcm24(output_path)
            else:
                result_format = mg.pcm32(output_path)
            
            mg.process(
                target=target_path,
                reference=reference_path,
                results=[result_format],
                threshold=settings.get('threshold', 0.998138),
                max_iterations=settings.get('max_iterations', 50),
                max_piece_size=settings.get('max_piece_length', 30.0),
                internal_sample_rate=48000
            )
            print(f"✅ Matchering processing complete!")
        except Exception as e:
            raise Exception(f"Matchering failed: {e}")
            
        # Upload
        output_file_name = f"mastered/{job_id}/{file_name}"
        output_blob = bucket.blob(output_file_name)
        output_blob.upload_from_filename(output_path)
        
        # Signed URL
        mastered_url = output_blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=1),
            method="GET"
        )
        
        # Cleanup
        try:
            os.unlink(target_path)
            os.unlink(reference_path)
            os.unlink(output_path)
        except:
            pass
            
        processing_time = int((time.time() - start_time) * 1000)
        
        return jsonify({
            "success": True,
            "masteredUrl": mastered_url,
            "jobId": job_id,
            "processingTime": processing_time
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def extract_blob_name_from_url(url):
    if 'test.url' in url or 'example.com' in url:
        return url.split('/')[-1]
    if '?' in url:
        url = url.split('?')[0]
    if 'storage.googleapis.com' in url:
        parts = url.split('storage.googleapis.com/')
        if len(parts) > 1:
            path_parts = parts[1].split('/', 1)
            if len(path_parts) > 1:
                return path_parts[1]
            return path_parts[0]
    if BUCKET_NAME and BUCKET_NAME in url:
        bucket_index = url.find(BUCKET_NAME)
        path = url[bucket_index + len(BUCKET_NAME):].lstrip('/')
        return path.split('?')[0]
    if 'googleapis.com' in url:
        parts = url.split('googleapis.com/')
        if len(parts) > 1:
            path = parts[1].split('?')[0]
            if '/' in path:
                return '/'.join(path.split('/')[1:])
            return path
    return url.split('/')[-1] # Fallback

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
