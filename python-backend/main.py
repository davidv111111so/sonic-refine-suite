"""
AI Mastering Backend
Flask application for processing audio files with GCS integration
"""
import os
import json
import time
import uuid
from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import storage
import tempfile

app = Flask(__name__)

# Configure CORS - Allow all origins in development, specific origins in production
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

# Initialize GCS client
def get_storage_client():
    """Initialize Google Cloud Storage client with credentials from environment"""
    credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    if not credentials_json:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS_JSON not set")
    
    # Parse JSON credentials
    credentials_dict = json.loads(credentials_json)
    
    # Create credentials from dict
    from google.oauth2 import service_account
    credentials = service_account.Credentials.from_service_account_info(credentials_dict)
    
    return storage.Client(credentials=credentials, project=PROJECT_ID)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "OK", "service": "AI Mastering Backend"}), 200

@app.route('/api/master-audio', methods=['POST', 'OPTIONS'])
def master_audio():
    """
    Process audio file with AI mastering
    
    Request body:
    {
        "inputUrl": "https://storage.googleapis.com/.../input.wav",
        "fileName": "input.wav",
        "settings": {
            "target": "streaming",
            "intensity": 0.5
        }
    }
    
    Response:
    {
        "success": true,
        "masteredUrl": "https://storage.googleapis.com/.../output.wav",
        "jobId": "uuid",
        "processingTime": 1234
    }
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    start_time = time.time()
    
    try:
        # Parse request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        input_url = data.get('inputUrl')
        file_name = data.get('fileName')
        settings = data.get('settings', {})
        
        if not input_url or not file_name:
            return jsonify({"error": "Missing required fields: inputUrl, fileName"}), 400
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Initialize GCS client
        storage_client = get_storage_client()
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Download input file from GCS
        print(f"📥 Downloading file from: {input_url}")
        input_blob_name = extract_blob_name_from_url(input_url)
        input_blob = bucket.blob(input_blob_name)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_input:
            input_blob.download_to_filename(temp_input.name)
            temp_input_path = temp_input.name
        
        print(f"✅ Downloaded to: {temp_input_path}")
        
        # Process audio (SIMULATED - replace with actual Spectrum AI processing)
        print(f"🎵 Processing audio with settings: {settings}")
        time.sleep(2)  # Simulate processing time
        
        # For now, just copy the input as output
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_output:
            with open(temp_input_path, 'rb') as f_in:
                temp_output.write(f_in.read())
            temp_output_path = temp_output.name
        
        print(f"✅ Processing complete: {temp_output_path}")
        
        # Upload result to GCS
        output_file_name = f"mastered/{job_id}/{file_name}"
        output_blob = bucket.blob(output_file_name)
        
        print(f"📤 Uploading to GCS: {output_file_name}")
        try:
            output_blob.upload_from_filename(temp_output_path)
            print(f"✅ File uploaded to GCS successfully")
        except Exception as upload_error:
            print(f"❌ Error uploading to GCS: {str(upload_error)}")
            raise Exception(f"Failed to upload mastered file to GCS: {str(upload_error)}")
        
        # Generate signed URL for download
        try:
            mastered_url = output_blob.generate_signed_url(
                version="v4",
                expiration=timedelta(hours=1),  # 1 hour
                method="GET"
            )
            print(f"✅ Signed URL generated: {mastered_url[:80]}...")
        except Exception as url_error:
            print(f"❌ Error generating signed URL: {str(url_error)}")
            # Fallback: use public URL if bucket is public, or return error
            raise Exception(f"Failed to generate download URL: {str(url_error)}")
        
        # Cleanup temp files
        try:
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            if os.path.exists(temp_output_path):
                os.unlink(temp_output_path)
        except Exception as cleanup_error:
            print(f"⚠️ Warning: Error cleaning up temp files: {str(cleanup_error)}")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return jsonify({
            "success": True,
            "masteredUrl": mastered_url,
            "jobId": job_id,
            "processingTime": processing_time
        }), 200
        
    except Exception as e:
        print(f"❌ Error processing audio: {str(e)}")
        processing_time = int((time.time() - start_time) * 1000)
        return jsonify({
            "success": False,
            "error": str(e),
            "processingTime": processing_time
        }), 500

def extract_blob_name_from_url(url):
    """Extract blob name from GCS URL"""
    # Expected format: https://storage.googleapis.com/bucket-name/blob/path
    # Or signed URL format
    
    if '?' in url:
        # Signed URL - extract path before query params
        url = url.split('?')[0]
    
    # Remove protocol and domain
    if 'storage.googleapis.com' in url:
        parts = url.split('storage.googleapis.com/')
        if len(parts) > 1:
            path = parts[1]
            # Remove bucket name (first part after domain)
            path_parts = path.split('/', 1)
            if len(path_parts) > 1:
                return path_parts[1]
    
    # If URL format is different, try to extract from alternative formats
    if BUCKET_NAME and BUCKET_NAME in url:
        bucket_index = url.find(BUCKET_NAME)
        path = url[bucket_index + len(BUCKET_NAME):].lstrip('/')
        if '?' in path:
            path = path.split('?')[0]
        return path
    
    raise ValueError(f"Could not extract blob name from URL: {url}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
