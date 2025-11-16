import os
import uuid
import json
import datetime
from functools import wraps
from flask import Flask, request, jsonify
# Si VS Code sigue marcando esto en rojo, es solo visual en tu PC local.
# En Google Cloud funcionará perfectamente porque está en requirements.txt.
from flask_cors import CORS
from google.cloud import pubsub_v1, storage, firestore
import jwt

# --- CONFIGURACIÓN ---
app = Flask(__name__)

# HABILITAR CORS: Permite conexiones desde tu app Lovable y localhost para pruebas
CORS(app, resources={r"/api/*": {"origins": "*"}})

PROJECT_ID = "total-acumen-473702-j1"
TOPIC_ID = "mastering-jobs-topic"
# Nombre del bucket para subir los archivos iniciales
BUCKET_NAME = "spectrum-mastering-files-857351913435"

# Clientes de Google Cloud
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)
storage_client = storage.Client()
db = firestore.Client()

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

# --- LISTA BLANCA DE ADMINS ---
ADMIN_EMAILS = [
    "davidv111111@gmail.com",
    "santiagov.t068@gmail.com"
]

# --- DECORADOR DE SEGURIDAD ROBUSTO ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            parts = auth_header.split(" ")
            if len(parts) == 2:
                token = parts[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        if not SUPABASE_JWT_SECRET:
            return jsonify({'message': 'Server misconfiguration: JWT Secret missing.'}), 500

        try:
            # Decodificamos y validamos el token
            data = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
            
            # Verificación de lista blanca
            user_email = data.get('email')
            if user_email not in ADMIN_EMAILS:
                 print(f"Acceso denegado para: {user_email}")
                 return jsonify({'message': 'Access denied: You are not authorized.'}), 403

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'message': f'Token is invalid! {str(e)}'}), 401
        except Exception as e:
             return jsonify({'message': f'Authentication error: {str(e)}'}), 500
        
        return f(*args, **kwargs)
    return decorated

# --- ENDPOINTS DE LA API ---

@app.route("/api/generate-upload-url", methods=['POST'])
@token_required
def generate_upload_url():
    try:
        # Uso seguro de get_json()
        data = request.get_json(silent=True)
        if not data or 'fileName' not in data or 'fileType' not in data:
            return jsonify({"error": "Missing fileName or fileType in request body"}), 400

        file_name = f"uploads/{uuid.uuid4()}-{data['fileName']}"
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(file_name)
        
        # Generamos URL firmada V4 (más segura y moderna)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="PUT",
            content_type=data['fileType']
        )
        return jsonify({"signedUrl": url, "gcsFileName": file_name})
    except Exception as e:
        print(f"Error generating upload URL: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/start-mastering-job", methods=['POST'])
@token_required
def start_mastering_job():
    try:
        data = request.get_json(silent=True)
        if not data or 'targetGcsPath' not in data:
             return jsonify({"error": "Missing targetGcsPath"}), 400
             
        job_id = str(uuid.uuid4())
        
        # Mensaje para Pub/Sub
        message_data = {
            "jobId": job_id,
            "targetGcsPath": data['targetGcsPath'],
            "referenceGcsPath": data.get('referenceGcsPath'),
            "presetId": data.get('presetId')
        }
        
        # Publicar mensaje
        future = publisher.publish(topic_path, json.dumps(message_data).encode("utf-8"))
        future.result()
        
        return jsonify({"message": "Job accepted", "jobId": job_id}), 202
    except Exception as e:
        print(f"Error publishing message: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/get-job-status/<job_id>", methods=['GET'])
@token_required
def get_job_status(job_id):
    try:
        # Buscamos el trabajo en Firestore
        job_ref = db.collection('masteringJobs').document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            return jsonify({"error": "Job not found"}), 404
            
        return jsonify(job_doc.to_dict()), 200
    except Exception as e:
        print(f"Error getting job status: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return "OK", 200

if __name__ == "__main__":
    # Configuración para ejecución local y en Cloud Run
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)