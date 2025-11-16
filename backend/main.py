"""
Level Audio - Backend de Masterización con AI
FastAPI + Matchering + Google Cloud Storage

Endpoints:
- POST /process/ai-mastering (upload directo de archivos)
- POST /api/master-audio (desde GCS URLs)
- GET /health (health check)
- GET /supported-formats (formatos soportados)
"""

import matchering as mg
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import uvicorn
import os
import shutil
import traceback
import subprocess
import hashlib
import json
import uuid
import time
import tempfile
import requests
from google.cloud import storage
from google.oauth2 import service_account
from datetime import datetime
from pathlib import Path

# Configura matchering para que nos muestre mensajes en la consola
mg.log(print)

app = FastAPI(
    title="Level Audio Mastering API",
    description="Professional audio mastering with AI",
    version="2.0.0"
)

# ===========================================
# CONFIGURACIÓN DE GOOGLE CLOUD STORAGE
# ===========================================

PROJECT_ID = os.getenv("PROJECT_ID", "total-acumen-473702-j1")
BUCKET_NAME = os.getenv("BUCKET_NAME", "spectrum-mastering-files-857351913435")


def get_storage_client():
    """Inicializa el cliente de Google Cloud Storage con credenciales desde variable de entorno"""
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if not credentials_json:
        print("⚠️  WARNING: GOOGLE_APPLICATION_CREDENTIALS_JSON no está configurada")
        print("⚠️  El upload a GCS no funcionará")
        return None
    
    try:
        # Parsear el JSON
        # json.loads() automáticamente convierte \n en el JSON a saltos de línea reales
        credentials_dict = json.loads(credentials_json)
        
        # Verificar que tenemos los campos necesarios
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        missing_fields = [field for field in required_fields if field not in credentials_dict]
        if missing_fields:
            print(f"❌ Error: Faltan campos requeridos en las credenciales: {missing_fields}")
            return None
        
        # Asegurarse de que la clave privada tenga el formato correcto
        if 'private_key' in credentials_dict:
            private_key = credentials_dict['private_key']
            if isinstance(private_key, str):
                # json.loads() ya debería haber convertido \n a saltos de línea reales
                # Pero por si acaso, verificar y corregir si es necesario
                if '\\n' in private_key and '\n' not in private_key:
                    # Si todavía tiene \\n como string literal, reemplazarlo
                    credentials_dict['private_key'] = private_key.replace('\\n', '\n')
                
                # Verificar que tenga el formato correcto de PEM
                if not credentials_dict['private_key'].startswith('-----BEGIN'):
                    print("⚠️  WARNING: La clave privada no tiene el formato PEM esperado")
                    print(f"   Primeros 50 caracteres: {credentials_dict['private_key'][:50]}")
        
        # Crear las credenciales
        credentials = service_account.Credentials.from_service_account_info(credentials_dict)
        client = storage.Client(credentials=credentials, project=PROJECT_ID)
        print(f"✅ Cliente de GCS inicializado para bucket: {BUCKET_NAME}")
        return client
    except json.JSONDecodeError as e:
        print(f"❌ Error: GOOGLE_APPLICATION_CREDENTIALS_JSON no es un JSON válido: {e}")
        print(f"   Primeros 200 caracteres: {credentials_json[:200] if credentials_json else 'None'}")
        return None
    except Exception as e:
        print(f"❌ Error al inicializar credenciales de GCS: {str(e)}")
        print(f"   Tipo de error: {type(e).__name__}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return None


# ===========================================
# CONFIGURACIÓN DE CORS
# ===========================================

origins = [
    # URLs locales para desarrollo
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    # Tu red local
    "http://192.168.1.164:8000",
    "http://192.168.1.164:8080",
    "http://192.168.1.164:5173",
    # Lovable Cloud - lovableproject.com domains
    "https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com",
    # Lovable Cloud - lovable.app domains (NEW - Fix for CORS)
    "https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovable.app",
    # Lovable dev
    "https://lovable.dev",
]

# Usar allow_origin_regex para permitir cualquier subdominio de lovable.app
from fastapi.middleware.cors import CORSMiddleware as _CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.lovable\.app",  # Permitir todos los subdominios de lovable.app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ===========================================
# CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
# ===========================================

# Obtener el directorio base del backend
BASE_DIR = Path(__file__).parent

# Directorio del frontend (LEVEL app)
# Buscar en el directorio padre (sonic-refine-suite-project)
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIST = PROJECT_ROOT / "sonic-refine-suite" / "dist"

# Montar archivos estáticos del frontend (assets, etc.)
if FRONTEND_DIST.exists():
    # Montar assets (JS, CSS, etc.)
    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")
    # Montar archivos estáticos de la raíz (favicon, robots.txt, etc.)
    # Usamos un catch-all para archivos estáticos en la raíz
    print(f"✅ Frontend dist encontrado en: {FRONTEND_DIST}")
else:
    print(f"⚠️  Frontend dist no encontrado en: {FRONTEND_DIST}")
    print(f"   Buscando en directorio alternativo...")
    # Intentar con el directorio frontend
    FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
    if FRONTEND_DIST.exists():
        if (FRONTEND_DIST / "assets").exists():
            app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")
        print(f"✅ Frontend dist encontrado en: {FRONTEND_DIST}")
    else:
        print(f"❌ Frontend dist no encontrado. La aplicación web no estará disponible.")

# ===========================================
# MODELOS PYDANTIC
# ===========================================


class MasteringSettings(BaseModel):
    """Configuración de masterización"""
    genre: Optional[str] = "Rock"
    intensity: Optional[str] = "medium"
    targetLoudness: Optional[float] = -14.0


class MasteringRequest(BaseModel):
    """Request para masterización desde GCS URL"""
    inputUrl: str
    fileName: str
    settings: Optional[MasteringSettings] = MasteringSettings()


class MasteringResponse(BaseModel):
    """Response de masterización exitosa"""
    success: bool
    masteredUrl: str
    jobId: str
    processingTime: float
    originalSize: Optional[int] = None
    masteredSize: Optional[int] = None


# ===========================================
# FUNCIONES AUXILIARES
# ===========================================


def get_file_hash(filepath: str) -> str:
    """Calcula MD5 hash del archivo para verificar si cambió"""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def get_audio_info(filepath: str) -> str:
    """Obtiene información detallada del audio con ffprobe"""
    try:
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            filepath,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        return f"Error getting info: {e}"


def convert_wav_to_mp3(wav_path: str, mp3_path: str) -> bool:
    """Convierte WAV a MP3 usando ffmpeg con calidad 320kbps"""
    try:
        print(f"🔄 Convirtiendo WAV a MP3...")
        command = [
            "ffmpeg",
            "-i", wav_path,
            "-codec:a", "libmp3lame",
            "-b:a", "320k",
            "-y",  # Sobrescribir sin preguntar
            mp3_path,
        ]

        result = subprocess.run(
            command, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True
        )

        if result.returncode != 0:
            print(f"❌ Error en ffmpeg: {result.stderr}")
            raise Exception(f"FFmpeg conversion failed: {result.stderr}")

        print("✅ Conversión a MP3 completada")
        return True
    except FileNotFoundError:
        raise Exception(
            "FFmpeg no está instalado. "
            "Instálalo con: apt-get install ffmpeg (Linux) o brew install ffmpeg (Mac)"
        )


def get_matchering_config(genre: str, intensity: str) -> mg.Config:
    """Genera configuración de matchering basada en genre e intensity"""
    # allow_equality=True es necesario para self-reference mastering
    config = mg.Config(allow_equality=True)
    
    # Ajustar threshold según intensity
    if intensity == "low":
        config.threshold = (2**15 - 200) / 2**15  # Más conservador
    elif intensity == "high":
        config.threshold = (2**15 - 20) / 2**15  # Más agresivo
    else:  # medium (default)
        config.threshold = (2**15 - 61) / 2**15
    
    return config


def download_file_from_url(url: str, local_path: str) -> int:
    """Descarga un archivo desde una URL a un path local"""
    try:
        print(f"📥 Descargando archivo desde: {url[:80]}...")
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        file_size = os.path.getsize(local_path)
        print(f"✅ Archivo descargado: {file_size:,} bytes")
        return file_size
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error al descargar archivo desde URL: {str(e)}"
        )


def upload_file_to_gcs(local_path: str, blob_name: str) -> str:
    """Sube un archivo local a GCS y retorna la URL pública"""
    client = get_storage_client()
    
    if not client:
        raise HTTPException(
            status_code=500,
            detail="GCS no está configurado. Verifica GOOGLE_APPLICATION_CREDENTIALS_JSON"
        )
    
    try:
        print(f"📤 Subiendo archivo a GCS: {blob_name}")
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(blob_name)
        
        # Detectar content type
        content_type = "audio/mpeg" if blob_name.endswith(".mp3") else "audio/wav"
        
        blob.upload_from_filename(local_path, content_type=content_type)
        
        # Hacer el blob público para obtener URL pública
        blob.make_public()
        
        # Obtener URL pública
        public_url = blob.public_url
        print(f"✅ Archivo subido: {public_url[:80]}...")
        return public_url
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al subir archivo a GCS: {str(e)}"
        )


# ===========================================
# ENDPOINTS
# ===========================================

# IMPORTANTE: Las rutas de API deben definirse ANTES del catch-all SPA
# FastAPI evalúa las rutas en orden, así que las rutas específicas deben ir primero


@app.get("/api/info")
async def api_info():
    """Endpoint de información de la API en formato JSON"""
    return {
        "service": "Level Audio Mastering API",
        "version": "2.0.0",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "mastering_direct": "POST /process/ai-mastering",
            "mastering_gcs": "POST /api/master-audio",
            "formats": "/supported-formats"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint para monitoreo"""
    gcs_status = "configured" if get_storage_client() else "not_configured"
    
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "matchering": "available",
                "ffmpeg": "available",  # Asumimos que está instalado
                "gcs": gcs_status
            },
            "config": {
                "project_id": PROJECT_ID,
                "bucket_name": BUCKET_NAME
            }
        }
    )


@app.get("/supported-formats")
async def supported_formats():
    """Retorna los formatos de audio soportados"""
    return {
        "input_formats": ["mp3", "wav", "flac", "m4a", "ogg"],
        "output_formats": ["mp3", "wav"],
        "recommended": {
            "input": "wav or flac for best quality",
            "output": "wav for archiving, mp3 for streaming"
        }
    }


# Servir archivos estáticos de la raíz del frontend (favicon, robots.txt, etc.)
@app.get("/favicon.ico")
async def favicon():
    """Sirve el favicon del frontend"""
    favicon_path = FRONTEND_DIST / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(path=str(favicon_path))
    raise HTTPException(status_code=404)


@app.get("/robots.txt")
async def robots():
    """Sirve robots.txt del frontend"""
    robots_path = FRONTEND_DIST / "robots.txt"
    if robots_path.exists():
        return FileResponse(path=str(robots_path))
    raise HTTPException(status_code=404)


@app.get("/placeholder.svg")
async def placeholder():
    """Sirve placeholder.svg del frontend"""
    placeholder_path = FRONTEND_DIST / "placeholder.svg"
    if placeholder_path.exists():
        return FileResponse(path=str(placeholder_path))
    raise HTTPException(status_code=404)


async def serve_frontend():
    """Función auxiliar para servir el index.html del frontend"""
    try:
        index_path = FRONTEND_DIST / "index.html"
        if index_path.exists():
            with open(index_path, "r", encoding="utf-8") as f:
                html_content = f.read()
                return HTMLResponse(content=html_content)
        else:
            print(f"⚠️  index.html no encontrado en: {index_path}")
            # Fallback si no existe index.html
            return HTMLResponse(content="""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Level Audio - Backend API</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #1a1a1a; color: #fff; }
                    h1 { color: #9333ea; }
                    .endpoint { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid #9333ea; }
                    .warning { background: #f59e0b; color: #000; padding: 15px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>🎵 Level Audio - Backend API</h1>
                <div class="warning">
                    ⚠️ Frontend no encontrado. Por favor, construye el frontend ejecutando:<br>
                    <code>cd sonic-refine-suite && npm run build</code>
                </div>
                <p>Version: 2.0.0</p>
                <p>Status: Online</p>
                <h2>Available API Endpoints:</h2>
                <div class="endpoint"><strong>GET</strong> /health - Health check</div>
                <div class="endpoint"><strong>POST</strong> /process/ai-mastering - Direct file upload mastering</div>
                <div class="endpoint"><strong>POST</strong> /api/master-audio - GCS URL mastering</div>
                <div class="endpoint"><strong>GET</strong> /supported-formats - Supported audio formats</div>
                <div class="endpoint"><strong>GET</strong> /api/info - API information (JSON)</div>
            </body>
            </html>
            """)
    except Exception as e:
        print(f"❌ Error al servir frontend: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading web interface: {str(e)}")


# Rutas SPA - deben ir AL FINAL después de todas las rutas de API
@app.get("/", response_class=HTMLResponse)
async def root():
    """Endpoint raíz - sirve la aplicación LEVEL"""
    return await serve_frontend()


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_spa(full_path: str):
    """
    SPA fallback - sirve index.html para todas las rutas que no sean API
    Esto permite que React Router funcione correctamente
    """
    # Si es una ruta de API o archivo estático, no servir el frontend
    # (aunque estas rutas ya deberían estar manejadas por rutas específicas arriba)
    if full_path.startswith(("api/", "process/", "health", "supported-formats", "docs", "openapi.json")):
        raise HTTPException(status_code=404, detail="Not found")
    
    return await serve_frontend()


@app.post("/process/ai-mastering")
async def process_audio_files(
    target: UploadFile = File(...), 
    reference: UploadFile = File(...)
):
    """
    Endpoint para masterización con upload directo de archivos
    
    Se suben dos archivos:
    - target: Archivo a masterizar
    - reference: Archivo de referencia para matchear el sonido
    
    Retorna: Archivo masterizado para descarga directa
    """
    print(f"\n{'='*70}")
    print(f"=== MASTERIZACIÓN DIRECTA - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    print(f"{'='*70}")
    
    # Validar que los archivos tengan nombre
    if not target.filename or not reference.filename:
        raise HTTPException(status_code=400, detail="Los archivos deben tener nombre válido")
    
    print(f"📁 Target: {target.filename}")
    print(f"📁 Reference: {reference.filename}")
    
    # Crear directorio temporal
    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)

    target_path = os.path.join(temp_dir, target.filename)
    reference_path = os.path.join(temp_dir, reference.filename)
    
    # Detectar formato del archivo target
    target_extension = target.filename.lower().split('.')[-1]
    print(f"🎵 Formato detectado: {target_extension.upper()}")
    
    # Paths de salida
    output_wav_filename = f"mastered_{target.filename.rsplit('.', 1)[0]}.wav"
    output_wav_path = os.path.join(temp_dir, output_wav_filename)

    # Determinar formato final: MISMO que el archivo de entrada
    output_final_filename = f"mastered_{target.filename}"
    output_final_path = os.path.join(temp_dir, output_final_filename)
    
    # Convertir solo si el input era MP3
    needs_mp3_conversion = (target_extension == "mp3")
    
    # Determinar media type según formato
    if target_extension == "mp3":
        media_type = "audio/mpeg"
    elif target_extension == "flac":
        media_type = "audio/flac"
    elif target_extension == "wav":
        media_type = "audio/wav"
    else:
        media_type = "audio/mpeg"  # fallback
    
    print(f"→ Formato de salida: {target_extension.upper()} (mismo que entrada)")

    try:
        print("\n📥 Guardando archivos...")

        # Guardar target
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(target.file, buffer)
        target_size = os.path.getsize(target_path)
        target_hash = get_file_hash(target_path)
        print(f"✅ Target guardado: {target_size:,} bytes (hash: {target_hash[:8]}...)")

        # Guardar reference
        with open(reference_path, "wb") as buffer:
            shutil.copyfileobj(reference.file, buffer)
        reference_size = os.path.getsize(reference_path)
        reference_hash = get_file_hash(reference_path)
        print(f"✅ Reference guardado: {reference_size:,} bytes (hash: {reference_hash[:8]}...)")

        print(f"\n{'='*70}")
        print("🎚️  PROCESANDO CON MATCHERING")
        print(f"{'='*70}")

        # Procesar con matchering
        mg.process(
            target=target_path,
            reference=reference_path,
            results=[mg.pcm24(output_wav_path)],
        )

        print(f"{'='*70}")
        print("✅ MATCHERING COMPLETADO")
        print(f"{'='*70}")

        # Verificar archivo de salida
        if not os.path.exists(output_wav_path):
            raise Exception("El archivo WAV masterizado no se creó")
        
        output_wav_size = os.path.getsize(output_wav_path)
        output_wav_hash = get_file_hash(output_wav_path)
        print(f"\n📊 WAV masterizado: {output_wav_size:,} bytes")
        
        # Verificación de cambios
        if output_wav_hash == target_hash:
            print("⚠️  WARNING: Hash idéntico - Matchering pudo no procesar correctamente")
        else:
            print(f"✅ Hash diferente - Procesamiento exitoso")

        # Convertir al formato de salida si es necesario
        if target_extension == "mp3":
            print(f"\n🔄 Convirtiendo a MP3...")
            convert_wav_to_mp3(output_wav_path, output_final_path)
            output_final_size = os.path.getsize(output_final_path)
            print(f"📊 MP3 final: {output_final_size:,} bytes")
            # Eliminar WAV temporal
            if os.path.exists(output_wav_path):
                os.remove(output_wav_path)
        elif target_extension == "flac":
            print(f"\n🔄 Convirtiendo a FLAC...")
            subprocess.run([
                "ffmpeg", "-i", output_wav_path,
                "-codec:a", "flac", "-compression_level", "8",
                "-y", output_final_path
            ], check=True, capture_output=True)
            output_final_size = os.path.getsize(output_final_path)
            print(f"📊 FLAC final: {output_final_size:,} bytes")
            # Eliminar WAV temporal
            if os.path.exists(output_wav_path):
                os.remove(output_wav_path)
        elif target_extension == "wav":
            # WAV ya está listo, solo renombrar
            output_final_path = output_wav_path
            output_final_size = os.path.getsize(output_final_path)
            print(f"📊 WAV final: {output_final_size:,} bytes")
        else:
            # Para otros formatos, usar ffmpeg genérico
            print(f"\n🔄 Convirtiendo a {target_extension.upper()}...")
            subprocess.run([
                "ffmpeg", "-i", output_wav_path,
                "-y", output_final_path
            ], check=True, capture_output=True)
            output_final_size = os.path.getsize(output_final_path)
            print(f"📊 {target_extension.upper()} final: {output_final_size:,} bytes")
            # Eliminar WAV temporal
            if os.path.exists(output_wav_path):
                os.remove(output_wav_path)

        # Verificar archivo final
        if not os.path.exists(output_final_path):
            raise Exception("El archivo final no se creó")
        
        final_size = os.path.getsize(output_final_path)
        print(f"\n{'='*70}")
        print(f"✅ MASTERIZACIÓN EXITOSA")
        print(f"{'='*70}")
        print(f"📁 Archivo: {output_final_filename}")
        print(f"📊 Tamaño: {final_size:,} bytes")
        print(f"📈 Diferencia: {final_size - target_size:+,} bytes")
        print(f"{'='*70}\n")

        return FileResponse(
            path=output_final_path,
            media_type=media_type,
            filename=output_final_filename,
        )

    except Exception as e:
        print(f"\n{'='*70}")
        print("❌ ERROR EN PROCESAMIENTO")
        print(f"{'='*70}")
        print(f"Tipo: {type(e).__name__}")
        print(f"Mensaje: {str(e)}")
        traceback.print_exc()
        print(f"{'='*70}\n")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpieza de archivos temporales
        try:
            for filepath in [target_path, reference_path]:
                if os.path.exists(filepath):
                    os.remove(filepath)
                    print(f"🗑️  Limpiado: {os.path.basename(filepath)}")
        except Exception as cleanup_error:
            print(f"⚠️  Error en limpieza: {cleanup_error}")


@app.post("/api/master-audio", response_model=MasteringResponse)
async def master_audio(request: MasteringRequest):
    """
    Endpoint para masterización desde Google Cloud Storage
    
    Input:
    {
      "inputUrl": "https://storage.googleapis.com/.../audio.mp3",
      "fileName": "song.mp3",
      "settings": {
        "genre": "Rock",
        "intensity": "medium",
        "targetLoudness": -14.0
      }
    }
    
    Output:
    {
      "success": true,
      "masteredUrl": "https://storage.googleapis.com/.../mastered.mp3",
      "jobId": "uuid-xxx",
      "processingTime": 45.3,
      "originalSize": 5242880,
      "masteredSize": 7864320
    }
    """
    job_id = str(uuid.uuid4())
    start_time = time.time()
    
    print(f"\n{'='*70}")
    print(f"=== MASTERIZACIÓN GCS - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    print(f"Job ID: {job_id}")
    print(f"Input URL: {request.inputUrl[:80]}...")
    print(f"File: {request.fileName}")
    print(f"Genre: {request.settings.genre if request.settings else 'N/A'}")
    print(f"Intensity: {request.settings.intensity if request.settings else 'N/A'}")
    print(f"{'='*70}")
    
    # Validar que la URL sea válida (no una URL de prueba)
    if 'test.url' in request.inputUrl or not request.inputUrl.startswith(('http://', 'https://')):
        raise HTTPException(
            status_code=400,
            detail="Invalid inputUrl. Must be a valid HTTP/HTTPS URL pointing to a file in Google Cloud Storage."
        )
    
    # Validar que el fileName tenga extensión válida
    valid_extensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg']
    if not any(request.fileName.lower().endswith(ext) for ext in valid_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Supported formats: {', '.join(valid_extensions)}"
        )
    
    # Crear directorio temporal
    temp_dir = tempfile.mkdtemp(prefix="mastering_")
    
    try:
        # 1. Descargar archivo desde GCS
        input_file_path = os.path.join(temp_dir, request.fileName)
        original_size = download_file_from_url(request.inputUrl, input_file_path)
        
        # 2. Detectar formato y preparar paths
        file_extension = request.fileName.lower().split('.')[-1]
        base_name = request.fileName.rsplit('.', 1)[0]
        
        output_wav_path = os.path.join(temp_dir, f"mastered_{base_name}.wav")
        output_final_path = os.path.join(temp_dir, f"mastered_{request.fileName}")
        needs_mp3_conversion = (file_extension == "mp3")
        
        # 3. Procesar con matchering
        print(f"\n🎚️  PROCESANDO CON MATCHERING")
        
        genre = request.settings.genre if request.settings and request.settings.genre else "Rock"
        intensity = request.settings.intensity if request.settings and request.settings.intensity else "medium"
        
        print(f"Configuración: {genre} / {intensity}")
        
        config = get_matchering_config(genre, intensity)
        
        # Self-reference mastering con config personalizada
        mg.process(
            target=input_file_path,
            reference=input_file_path,  # Self-reference
            results=[mg.pcm24(output_wav_path)],
            config=config,
        )
        
        print(f"✅ MATCHERING COMPLETADO")
        
        # Verificar WAV
        if not os.path.exists(output_wav_path):
            raise Exception("El archivo WAV masterizado no se creó")
        
        # 4. Convertir a MP3 si es necesario
        if needs_mp3_conversion:
            print(f"🔄 Convirtiendo a MP3...")
            convert_wav_to_mp3(output_wav_path, output_final_path)
            
            # Eliminar WAV temporal
            if os.path.exists(output_wav_path):
                os.remove(output_wav_path)
        else:
            output_final_path = output_wav_path
        
        # 5. Obtener tamaño del archivo masterizado
        mastered_size = os.path.getsize(output_final_path)
        
        # 6. Subir resultado a GCS
        mastered_blob_name = f"mastered/{job_id}/{os.path.basename(output_final_path)}"
        mastered_url = upload_file_to_gcs(output_final_path, mastered_blob_name)
        
        # 7. Calcular tiempo de procesamiento
        processing_time = round(time.time() - start_time, 2)
        
        print(f"\n{'='*70}")
        print(f"✅ MASTERIZACIÓN EXITOSA")
        print(f"Job ID: {job_id}")
        print(f"Tiempo: {processing_time}s")
        print(f"Tamaño original: {original_size:,} bytes")
        print(f"Tamaño masterizado: {mastered_size:,} bytes")
        print(f"URL: {mastered_url[:80]}...")
        print(f"{'='*70}\n")
        
        # 8. Retornar respuesta
        return MasteringResponse(
            success=True,
            masteredUrl=mastered_url,
            jobId=job_id,
            processingTime=processing_time,
            originalSize=original_size,
            masteredSize=mastered_size
        )
    
    except HTTPException:
        # Re-lanzar HTTPExceptions sin modificar
        raise
    except Exception as e:
        print(f"\n{'='*70}")
        print(f"❌ ERROR EN PROCESAMIENTO")
        print(f"{'='*70}")
        print(f"Tipo: {type(e).__name__}")
        print(f"Mensaje: {str(e)}")
        traceback.print_exc()
        print(f"{'='*70}\n")
        
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar audio: {str(e)}"
        )
    finally:
        # Limpieza de directorio temporal
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                print(f"🗑️  Directorio temporal eliminado")
        except Exception as cleanup_error:
            print(f"⚠️  Error en limpieza: {cleanup_error}")


# ===========================================
# PUNTO DE ENTRADA
# ===========================================

if __name__ == "__main__":
    # Obtener puerto desde variable de entorno o usar 8000 por defecto
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print("=" * 70)
    print("LEVEL AUDIO - BACKEND DE MASTERIZACIÓN")
    print("=" * 70)
    print(f"🚀 Servidor iniciando...")
    print(f"📍 Host: {host}")
    print(f"🔌 Puerto: {port}")
    print(f"🌐 URL local: http://127.0.0.1:{port}")
    print(f"🌐 URL red: http://192.168.1.164:{port}")
    print(f"📦 Project ID: {PROJECT_ID}")
    print(f"🪣 Bucket: {BUCKET_NAME}")
    print("=" * 70)
    
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info"
    )