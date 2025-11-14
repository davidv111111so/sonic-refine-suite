# 🧪 URLs para Probar el Backend

## Backend URL Principal
```
https://mastering-backend-azkp62xtaq-uc.a.run.app
```

## Endpoints Disponibles

### 1. Health Check
```
GET https://mastering-backend-azkp62xtaq-uc.a.run.app/health
```
**Respuesta esperada:**
```json
{
  "status": "OK",
  "service": "AI Mastering Backend"
}
```

### 2. AI Mastering Endpoint
```
POST https://mastering-backend-azkp62xtaq-uc.a.run.app/api/master-audio
Content-Type: application/json

{
  "inputUrl": "https://storage.googleapis.com/.../file.wav",
  "fileName": "file.wav",
  "settings": {
    "targetLoudness": -14,
    "compressionRatio": 4,
    "eqProfile": "neutral",
    "stereoWidth": 100
  }
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "masteredUrl": "https://storage.googleapis.com/.../mastered_file.wav",
  "jobId": "uuid-here",
  "processingTime": 1234
}
```

## Configuración Actual

### CORS Configurado
- ✅ Bucket GCS: `spectrum-mastering-files-857351913435`
- ✅ Orígenes permitidos: 
  - `http://localhost:8080`
  - `http://localhost:5173`
  - `http://localhost:3000`
  - `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com`
  - `https://*.lovableproject.com`

### Backend Flask CORS
- ✅ Métodos: GET, POST, PUT, DELETE, OPTIONS, HEAD
- ✅ Headers permitidos: Content-Type, Authorization, x-goog-resumable
- ✅ Supports credentials: true

## Pruebas Rápidas

### Desde PowerShell
```powershell
# Health check
Invoke-WebRequest -Uri "https://mastering-backend-azkp62xtaq-uc.a.run.app/health" -Method GET

# Test CORS preflight
Invoke-WebRequest -Uri "https://mastering-backend-azkp62xtaq-uc.a.run.app/api/master-audio" -Method OPTIONS
```

### Desde Navegador
Abre la consola del navegador y ejecuta:
```javascript
fetch('https://mastering-backend-azkp62xtaq-uc.a.run.app/health')
  .then(r => r.json())
  .then(console.log)
```

## Verificar Logs

```powershell
gcloud run services logs read mastering-backend --region=us-central1 --project=total-acumen-473702-j1 --limit=50
```

## Troubleshooting

Si ves errores de CORS:
1. Verifica que el bucket tenga CORS configurado: `gcloud storage buckets describe gs://spectrum-mastering-files-857351913435 --format="default(cors_config)"`
2. Verifica que el backend esté desplegado: `gcloud run services describe mastering-backend --region=us-central1`
3. Revisa los logs del backend para ver errores específicos




