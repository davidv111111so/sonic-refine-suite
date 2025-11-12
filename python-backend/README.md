# AI Mastering Backend

Backend de Python (Flask) para procesamiento de audio con integración a Google Cloud Storage.

## 🚀 Deploy a Google Cloud Run

### Opción 1: Deploy directo desde código fuente

```bash
# Navegar a la carpeta del backend
cd python-backend

# Deploy
gcloud run deploy mastering-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT_ID=total-acumen-473702-j1,GOOGLE_CLOUD_BUCKET_NAME=spectrum-mastering-files-857351913435,ALLOWED_ORIGINS=https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com \
  --set-secrets GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest
```

### Opción 2: Build y deploy por separado

```bash
# Build la imagen
gcloud builds submit --tag gcr.io/total-acumen-473702-j1/mastering-backend

# Deploy la imagen
gcloud run deploy mastering-backend \
  --image gcr.io/total-acumen-473702-j1/mastering-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT_ID=total-acumen-473702-j1,GOOGLE_CLOUD_BUCKET_NAME=spectrum-mastering-files-857351913435,ALLOWED_ORIGINS=https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com \
  --set-secrets GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest
```

## 🔧 Variables de Entorno

- `GOOGLE_CLOUD_PROJECT_ID`: ID del proyecto de GCP
- `GOOGLE_CLOUD_BUCKET_NAME`: Nombre del bucket de GCS
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: JSON completo de las credenciales (como secret)
- `ALLOWED_ORIGINS`: Orígenes permitidos para CORS (separados por coma)
- `PORT`: Puerto (8080 por defecto, Cloud Run lo asigna automáticamente)

## 📡 Endpoints

### GET /health
Health check del servicio.

**Response:**
```json
{
  "status": "OK",
  "service": "AI Mastering Backend"
}
```

### POST /api/master-audio
Procesa un archivo de audio con AI mastering.

**Request:**
```json
{
  "inputUrl": "https://storage.googleapis.com/bucket/path/input.wav",
  "fileName": "input.wav",
  "settings": {
    "target": "streaming",
    "intensity": 0.5
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "masteredUrl": "https://storage.googleapis.com/bucket/mastered/job-id/output.wav",
  "jobId": "uuid",
  "processingTime": 1234
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "processingTime": 1234
}
```

## 🧪 Testing Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
export GOOGLE_CLOUD_PROJECT_ID=total-acumen-473702-j1
export GOOGLE_CLOUD_BUCKET_NAME=spectrum-mastering-files-857351913435
export GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
export ALLOWED_ORIGINS=http://localhost:5173

# Ejecutar
python main.py
```

## 🔍 Verificar Deploy

```bash
# Ver logs
gcloud run services logs read mastering-backend --region us-central1

# Test health check
curl https://mastering-backend-857351913435.us-central1.run.app/health

# Test endpoint (necesitas un inputUrl válido)
curl -X POST https://mastering-backend-857351913435.us-central1.run.app/api/master-audio \
  -H "Content-Type: application/json" \
  -d '{
    "inputUrl": "https://storage.googleapis.com/...",
    "fileName": "test.wav",
    "settings": {"target": "streaming"}
  }'
```

## 📝 Notas

1. **Procesamiento Simulado**: Actualmente el procesamiento de audio está simulado (solo copia el archivo). Necesitas integrar la librería Spectrum AI para procesamiento real.

2. **CORS**: Configurado para el dominio de Lovable. Puedes agregar más orígenes separándolos por coma en `ALLOWED_ORIGINS`.

3. **Secrets**: El JSON de credenciales debe guardarse como secret en Google Cloud Secret Manager y referenciarse en el deploy.

4. **Timeout**: Configurado con `--timeout 0` en gunicorn para permitir procesamientos largos.
