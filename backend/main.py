import os
import uuid
import json
import base64
import datetime
import tempfile
from functools import wraps
from fastapi import FastAPI, Request, Depends, HTTPException, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import storage, firestore
import jwt
import matchering as mg

# --- CONFIGURACIÓN ---
app = FastAPI(title="Spectrum Backend API (Real Mastering v2)")

# 1. SOLUCIÓN AL ERROR DE CONEXIÓN DE TU COLABORADOR
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite que Lovable se conecte
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CLIENTES DE GOOGLE CLOUD ---
PROJECT_ID = "total-acumen-473702-j1"

# ⚠️ ¡ASEGÚRATE DE QUE ESTE SEA EL NOMBRE DE TU BUCKET!
BUCKET_NAME = os.environ.get("GOOGLE_CLOUD_BUCKET_NAME") or os.environ.get("BUCKET_NAME") or "spectrum-mastering-files-857351913435"
print(f"[CONFIG] Using GCS bucket: {BUCKET_NAME}")

# ⚠️ ¡ASEGÚRATE DE HABER CREADO UNA BASE DE DATOS FIRESTORE!
db = None
storage_client = None

try:
    db = firestore.Client()
    storage_client = storage.Client()
    print("[CONFIG] Google Cloud Clients initialized successfully")
except Exception as e:
    print(f"[WARN] Could not initialize Google Cloud Clients: {e}")
    print("[WARN] Backend will start but cloud features will fail until credentials are fixed.")

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
BACKEND_API_TOKEN = os.environ.get("BACKEND_API_TOKEN") or os.environ.get("API_TOKEN")

# --- LISTA BLANCA DE ADMINS ---
# 2. SOLUCIÓN A TU REQUISITO DE SEGURIDAD
ADMIN_EMAILS = [
    "davidv111111@gmail.com",
    "santiagov.t068@gmail.com"
]

# --- SISTEMA DE SEGURIDAD (TOKEN Y LISTA BLANCA) ---
auth_scheme = HTTPBearer()

def verify_admin(token: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Token is missing!")
    
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="Server misconfiguration: JWT Secret missing.")

    try:
        data = jwt.decode(token.credentials, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_email = data.get('email')
        if user_email not in ADMIN_EMAILS:
             raise HTTPException(status_code=403, detail="Access denied: Not authorized admin.")
        return data
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token is invalid! {e}")

def verify_api_token(token: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    """Verify API token for Edge Function calls (simpler auth for /api/master-audio)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token is missing!")
    
    # Allow either JWT token (for admin users) or API token (for Edge Function)
    if BACKEND_API_TOKEN and token.credentials == BACKEND_API_TOKEN:
        return {"authenticated": True, "method": "api_token"}
    
    # Fallback to JWT verification
    if SUPABASE_JWT_SECRET:
        try:
            data = jwt.decode(token.credentials, SUPABASE_JWT_SECRET, algorithms=["HS256"])
            user_email = data.get('email')
            if user_email in ADMIN_EMAILS:
                return data
        except:
            pass
    
    raise HTTPException(status_code=401, detail="Invalid API token or JWT")

# ---
# === SETTINGS MAPPER FOR MATCHERING ===
# ---

def map_settings_to_matchering_config(settings_data: dict):
    """Maps frontend MasteringSettingsData to Matchering Config object"""
    if not settings_data:
        return None
    
    try:
        config = mg.Config()
        
        # Core settings
        if 'threshold' in settings_data:
            config.threshold = float(settings_data['threshold'])
        if 'epsilon' in settings_data:
            config.epsilon = float(settings_data['epsilon'])
        if 'maxPieceLength' in settings_data:
            config.max_piece_length = float(settings_data['maxPieceLength'])
        
        # Tempo settings
        if 'bpm' in settings_data and settings_data['bpm'] > 0:
            config.bpm = float(settings_data['bpm'])
        if 'timeSignatureNumerator' in settings_data:
            config.time_signature_numerator = int(settings_data['timeSignatureNumerator'])
        if 'timeSignatureDenominator' in settings_data:
            config.time_signature_denominator = int(settings_data['timeSignatureDenominator'])
        if 'pieceLengthBars' in settings_data:
            config.piece_length_bars = float(settings_data['pieceLengthBars'])
        
        # Spectrum settings
        if 'fftSize' in settings_data:
            config.fft_size = int(settings_data['fftSize'])
        if 'spectrumBands' in settings_data:
            config.spectrum_bands = int(settings_data['spectrumBands'])
        if 'spectrumSmoothingWidth' in settings_data:
            config.spectrum_smoothing_width = int(settings_data['spectrumSmoothingWidth'])
        if 'smoothingSteps' in settings_data:
            config.smoothing_steps = int(settings_data['smoothingSteps'])
        if 'spectrumCorrectionHops' in settings_data:
            config.spectrum_correction_hops = int(settings_data['spectrumCorrectionHops'])
        
        # Loudness settings
        if 'loudnessSteps' in settings_data:
            config.loudness_steps = int(settings_data['loudnessSteps'])
        
        # Limiter settings
        if 'limiterThreshold' in settings_data:
            config.limiter_threshold = float(settings_data['limiterThreshold'])
        
        # Boolean flags
        if 'analyzeFullSpectrum' in settings_data:
            config.analyze_full_spectrum = bool(settings_data['analyzeFullSpectrum'])
        if 'normalizeReference' in settings_data:
            config.normalize_reference = bool(settings_data['normalizeReference'])
        if 'normalize' in settings_data:
            config.normalize = bool(settings_data['normalize'])
        if 'loudnessCorrectionLimiting' in settings_data:
            config.loudness_correction_limiting = bool(settings_data['loudnessCorrectionLimiting'])
        if 'amplify' in settings_data:
            config.amplify = bool(settings_data['amplify'])
        if 'clipping' in settings_data:
            config.clipping = bool(settings_data['clipping'])
        
        print(f"[OK] Matchering config created with custom settings")
        return config
    except Exception as e:
        print(f"[WARN] Error creating Matchering config: {e}. Using defaults.")
        return None

# ---
# === TAREA EN SEGUNDO PLANO (EL "CARTERO") ===
# ---

def run_mastering_task(job_id: str, target_gcs_path: str, reference_gcs_path: str, settings: dict = None):
    """
    3. SOLUCIÓN AL MASTERING REAL (en 2do plano)
    Esta es la función de "cocina" que hace el trabajo pesado.
    """
    print(f"Iniciando trabajo en 2do plano para job: {job_id}")
    job_ref = db.collection('masteringJobs').document(job_id)
    job_ref.set({'status': 'processing', 'worker_started_at': firestore.SERVER_TIMESTAMP}, merge=True)

    with tempfile.TemporaryDirectory() as temp_dir:
        target_temp_path = os.path.join(temp_dir, "target_file")
        reference_temp_path = os.path.join(temp_dir, "reference_file")
        output_temp_path = os.path.join(temp_dir, f"mastered-{job_id}.wav")

        try:
            bucket = storage_client.bucket(BUCKET_NAME)
            
            bucket.blob(target_gcs_path).download_to_filename(target_temp_path)
            bucket.blob(reference_gcs_path).download_to_filename(reference_temp_path)
            
            print(f"Archivos descargados. Iniciando Matchering para job: {job_id}")
            
            # Map settings to Matchering config
            config = map_settings_to_matchering_config(settings) if settings else None
            
            # Run REAL Matchering processing
            if config:
                mg.process(
                    target=target_temp_path,
                    reference=reference_temp_path,
                    results=[mg.pcm24(output_temp_path)],
                    config=config
                )
            else:
                mg.process(
                    target=target_temp_path,
                    reference=reference_temp_path,
                    results=[mg.pcm24(output_temp_path)]
                )
            print(f"Matchering completado. Subiendo resultado para job: {job_id}")

            output_filename = f"results/mastered-{job_id}.wav"
            mastered_blob = bucket.blob(output_filename)
            mastered_blob.upload_from_filename(output_temp_path)
            
            download_url = mastered_blob.generate_signed_url(
                version="v4",
                expiration=datetime.timedelta(hours=24),
                method="GET"
            )

            job_ref.update({'status': 'completed', 'downloadUrl': download_url})
            print(f"Job {job_id} completado con éxito.")

        except Exception as e:
            print(f"Error en el trabajo {job_id}: {e}")
            job_ref.update({'status': 'failed', 'error': 'The mastering process failed.'})

# ---
# === ENDPOINTS DEL "RECEPCIONISTA" (Lo que llama tu app) ===
# ---

@app.get("/health", tags=["General"])
def health_check():
    """Verifica que el servicio esté vivo."""
    return {"status": "OK", "service": "spectrum-backend"}

@app.post("/api/generate-upload-url", tags=["Mastering"], dependencies=[Depends(verify_admin)])
async def generate_upload_url(request: Request):
    """Genera una URL segura para que el frontend suba un archivo directamente a GCS."""
    try:
        if not storage_client:
            raise HTTPException(status_code=503, detail="Storage service not available (credentials missing)")

        data = await request.json()
        if not data or 'fileName' not in data or 'fileType' not in data:
            raise HTTPException(status_code=400, detail="Missing fileName or fileType")

        file_name = f"uploads/{uuid.uuid4()}-{data['fileName']}"
        blob = storage_client.bucket(BUCKET_NAME).blob(file_name)
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="PUT",
            content_type=data['fileType']
        )
        return {"signedUrl": url, "gcsFileName": file_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/start-mastering-job", tags=["Mastering"], dependencies=[Depends(verify_admin)])
async def start_mastering_job(request: Request, background_tasks: BackgroundTasks):
    """Recibe el "ticket" y se lo da al "Asistente" (BackgroundTasks) para que lo procese."""
    try:
        if not db:
            raise HTTPException(status_code=503, detail="Database service not available (credentials missing)")

        data = await request.json()
        if not data or 'targetGcsPath' not in data or 'referenceGcsPath' not in data:
             raise HTTPException(status_code=400, detail="Missing targetGcsPath or referenceGcsPath")
             
        job_id = str(uuid.uuid4())
        
        # 1. Crea el ticket en Firestore
        db.collection('masteringJobs').document(job_id).set({
            'jobId': job_id,
            'status': 'queued',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'targetFile': data['targetGcsPath'],
            'referenceFile': data['referenceGcsPath']
        })
        
        # 2. Añade el trabajo pesado a la cola de segundo plano (con settings)
        background_tasks.add_task(
            run_mastering_task, 
            job_id, 
            data['targetGcsPath'], 
            data['referenceGcsPath'],
            data.get('settings', None)  # Pass settings to processing
        )
        
        # 3. Responde INMEDIATAMENTE con el número de ticket
        return {"message": "Job accepted", "jobId": job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get-job-status/{job_id}", tags=["Mastering"], dependencies=[Depends(verify_admin)])
async def get_job_status(job_id: str):
    """Consulta Firestore para ver el estado del "ticket"."""
    try:
        if not db:
            raise HTTPException(status_code=503, detail="Database service not available (credentials missing)")

        job_doc = db.collection('masteringJobs').document(job_id).get()
        if not job_doc.exists:
            return {"status": "pending", "message": "Job not yet started"}
        return job_doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/master-audio", tags=["Mastering"], dependencies=[Depends(verify_api_token)])
async def master_audio(request: Request):
    """
    Synchronous mastering endpoint for direct processing (Edge Function compatible).
    Accepts targetUrl/referenceUrl (GCS signed URLs) or targetGcsPath/referenceGcsPath.
    Returns mastered file URL immediately after processing.
    
    Authentication: Accepts either BACKEND_API_TOKEN or JWT token with admin email.
    """
    try:
        if not storage_client:
            raise HTTPException(status_code=503, detail="Storage service not available (credentials missing)")

        data = await request.json()
        
        # Extract GCS paths from URLs or use paths directly
        target_url = data.get('targetUrl') or data.get('targetGcsPath', '')
        reference_url = data.get('referenceUrl') or data.get('referenceGcsPath', '')
        settings = data.get('settings', None)
        
        # Parse GCS paths from URLs if needed
        def extract_gcs_path(url_or_path: str) -> str:
            """Extract GCS path from signed URL or return path as-is"""
            if not url_or_path:
                return ''
            # If it's a full URL, extract the path after bucket name
            if 'storage.googleapis.com' in url_or_path:
                # Extract path from URL like: https://storage.googleapis.com/bucket/path?signature
                path_part = url_or_path.split(f'{BUCKET_NAME}/')[-1].split('?')[0]
                return path_part
            # If it already looks like a GCS path, return as-is
            return url_or_path
        
        target_gcs_path = extract_gcs_path(target_url)
        reference_gcs_path = extract_gcs_path(reference_url)
        
        if not target_gcs_path or not reference_gcs_path:
            raise HTTPException(
                status_code=400, 
                detail="Missing targetUrl/targetGcsPath and referenceUrl/referenceGcsPath"
            )
        
        print(f"[MASTER-AUDIO] Processing: target={target_gcs_path}, reference={reference_gcs_path}")
        
        job_id = str(uuid.uuid4())
        
        with tempfile.TemporaryDirectory() as temp_dir:
            target_temp_path = os.path.join(temp_dir, "target_file")
            reference_temp_path = os.path.join(temp_dir, "reference_file")
            output_temp_path = os.path.join(temp_dir, f"mastered-{job_id}.wav")
            
            try:
                bucket = storage_client.bucket(BUCKET_NAME)
                
                # Download files from GCS
                print(f"[MASTER-AUDIO] Downloading files from GCS...")
                bucket.blob(target_gcs_path).download_to_filename(target_temp_path)
                bucket.blob(reference_gcs_path).download_to_filename(reference_temp_path)
                
                print(f"[MASTER-AUDIO] Files downloaded. Starting Matchering processing...")
                
                # Map settings to Matchering config
                config = map_settings_to_matchering_config(settings) if settings else None
                
                # Run REAL Matchering processing (synchronous)
                if config:
                    mg.process(
                        target=target_temp_path,
                        reference=reference_temp_path,
                        results=[mg.pcm24(output_temp_path)],
                        config=config
                    )
                else:
                    mg.process(
                        target=target_temp_path,
                        reference=reference_temp_path,
                        results=[mg.pcm24(output_temp_path)]
                    )
                
                print(f"[MASTER-AUDIO] Matchering completed. Uploading result...")
                
                # Upload result to GCS
                output_filename = f"results/mastered-{job_id}.wav"
                mastered_blob = bucket.blob(output_filename)
                mastered_blob.upload_from_filename(output_temp_path)
                
                # Generate signed URL for download (1 hour expiration)
                download_url = mastered_blob.generate_signed_url(
                    version="v4",
                    expiration=datetime.timedelta(hours=1),
                    method="GET"
                )
                
                print(f"[MASTER-AUDIO] Processing complete. Result URL: {download_url}")
                
                return {
                    "success": True,
                    "masteredUrl": download_url,
                    "jobId": job_id,
                    "status": "completed"
                }
                
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                print(f"[MASTER-AUDIO] Error during processing: {e}")
                print(f"[MASTER-AUDIO] Traceback: {error_details}")
                raise HTTPException(status_code=500, detail=f"Mastering process failed: {str(e)}")
                
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[MASTER-AUDIO] Error: {e}")
        print(f"[MASTER-AUDIO] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))