# 🚀 Guía de Deploy - AI Mastering con Google Cloud Storage

Esta guía te llevará paso a paso para desplegar completamente la funcionalidad de AI Mastering usando Google Cloud Storage y Supabase Edge Functions.

**Información del Proyecto:**
- **Project ID**: `total-acumen-473702-j1`
- **Bucket Name**: `level-audio-mastering`
- **Región**: `us-central1` (recomendado)

---

## 📋 Índice

1. [Pre-requisitos](#pre-requisitos)
2. [Configurar Google Cloud Storage](#1-configurar-google-cloud-storage)
3. [Configurar Supabase Secrets](#2-configurar-supabase-secrets)
4. [Deploy de Edge Functions](#3-deploy-de-edge-functions)
5. [Configurar Backend Python](#4-configurar-backend-python)
6. [Verificación y Testing](#5-verificación-y-testing)
7. [Troubleshooting](#6-troubleshooting)

---

## Pre-requisitos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta de Google Cloud con proyecto creado
- ✅ Service Account con credenciales JSON
- ✅ Acceso a Lovable Cloud (proyecto conectado)
- ✅ gcloud CLI instalado (opcional, pero recomendado)
- ✅ Backend Python deployado o listo para deploy

### Instalar gcloud CLI (opcional)

```bash
# macOS (con Homebrew)
brew install --cask google-cloud-sdk

# Windows (con Chocolatey)
choco install gcloudsdk

# Linux
curl https://sdk.cloud.google.com | bash

# Inicializar y autenticar
gcloud init
gcloud auth login
```

---

## 1. Configurar Google Cloud Storage

### 1.1 Crear el Bucket

**Opción A: Usando Google Cloud Console (Recomendado para principiantes)**

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona el proyecto: `total-acumen-473702-j1`
3. Navega a **Cloud Storage > Buckets**
4. Click en **"CREATE BUCKET"**

5. Configura el bucket:
   ```
   Nombre: level-audio-mastering
   Tipo de ubicación: Region
   Región: us-central1
   Clase de almacenamiento: Standard
   Control de acceso: Uniform (recomendado)
   Protección: Ninguna (puedes habilitar versionado después)
   ```

6. Click en **"CREATE"**

**Opción B: Usando gcloud CLI**

```bash
# Autenticar y seleccionar proyecto
gcloud auth login
gcloud config set project total-acumen-473702-j1

# Crear el bucket
gsutil mb -p total-acumen-473702-j1 -c STANDARD -l us-central1 gs://level-audio-mastering/

# Verificar que se creó
gsutil ls
```

### 1.2 Configurar CORS del Bucket

Para permitir que tu frontend acceda al bucket, necesitas configurar CORS.

**Paso 1: Crear archivo cors.json**

Crea un archivo llamado `cors.json` con el siguiente contenido:

```json
[
  {
    "origin": [
      "http://localhost:8080",
      "https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com",
      "https://tu-dominio-personalizado.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

**⚠️ IMPORTANTE**: Reemplaza los dominios con:
- Tu URL de Lovable preview
- Tu dominio de producción (si lo tienes)
- Mantén `http://localhost:8080` para desarrollo local

**Paso 2: Aplicar configuración CORS**

```bash
# Usando gsutil
gsutil cors set cors.json gs://level-audio-mastering

# Verificar configuración CORS
gsutil cors get gs://level-audio-mastering
```

**Paso 3: Verificar configuración**

```bash
# Ver detalles del bucket
gcloud storage buckets describe gs://level-audio-mastering --format="default(cors_config)"
```

Deberías ver la configuración CORS que acabas de aplicar.

### 1.3 Configurar Permisos de Service Account

**Paso 1: Identificar tu Service Account**

Tu service account debería verse algo así:
```
SERVICE_ACCOUNT_EMAIL@total-acumen-473702-j1.iam.gserviceaccount.com
```

Puedes encontrar el email en tu archivo JSON de credenciales (campo `client_email`).

**Paso 2: Otorgar permisos usando Google Cloud Console**

1. Ve a **Cloud Storage > Buckets > level-audio-mastering**
2. Click en la pestaña **"PERMISSIONS"**
3. Click **"GRANT ACCESS"**
4. En "New principals", pega el email de tu service account
5. En "Select a role", busca y selecciona: **Storage Object Admin**
6. Click **"SAVE"**

**Paso 3: Otorgar permisos usando gcloud CLI**

```bash
# Reemplaza SERVICE_ACCOUNT_EMAIL con tu email real
SERVICE_ACCOUNT_EMAIL="tu-service-account@total-acumen-473702-j1.iam.gserviceaccount.com"

# Otorgar rol de Storage Object Admin
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT_EMAIL}:roles/storage.objectAdmin gs://level-audio-mastering
```

**Paso 4: Verificar permisos**

```bash
# Listar todos los permisos del bucket
gsutil iam get gs://level-audio-mastering
```

Deberías ver tu service account con el rol `roles/storage.objectAdmin`.

### 1.4 Test Manual del Bucket

```bash
# Crear archivo de prueba
echo "Hello from Level AI Mastering" > test.txt

# Subir archivo
gsutil cp test.txt gs://level-audio-mastering/test.txt

# Verificar que se subió
gsutil ls gs://level-audio-mastering/

# Descargar archivo
gsutil cp gs://level-audio-mastering/test.txt test-download.txt

# Limpiar
gsutil rm gs://level-audio-mastering/test.txt
```

Si todos estos comandos funcionan, ¡tu bucket está configurado correctamente! ✅

---

## 2. Configurar Supabase Secrets

Los secrets en Lovable Cloud se configuran a través de la interfaz de Lovable, **NO** directamente en archivos `.env`.

### 2.1 Preparar los Valores de los Secrets

Antes de agregar los secrets, necesitas tener listos estos valores:

#### Secret 1: `GOOGLE_CLOUD_PROJECT_ID`
```
total-acumen-473702-j1
```

#### Secret 2: `GOOGLE_CLOUD_BUCKET_NAME`
```
level-audio-mastering
```

#### Secret 3: `GOOGLE_APPLICATION_CREDENTIALS_JSON`

Abre tu archivo JSON de credenciales (`total-acumen-473702-j1-c638565cae0d.json`) y copia **TODO EL CONTENIDO** del archivo.

Debería verse así:
```json
{
  "type": "service_account",
  "project_id": "total-acumen-473702-j1",
  "private_key_id": "c638565cae0d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "level-mastering@total-acumen-473702-j1.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**⚠️ IMPORTANTE**: 
- Copia TODO el JSON, incluyendo las llaves `{ }`
- NO modifiques nada, cópialo tal cual
- Asegúrate de que la `private_key` incluya los saltos de línea (`\n`)

### 2.2 Agregar Secrets en Lovable

**Los secrets ya fueron agregados durante el setup inicial**, pero si necesitas verificarlos o actualizarlos:

1. Pídele a Lovable AI que liste los secrets:
   ```
   "Muéstrame los secrets configurados en este proyecto"
   ```

2. Para actualizar un secret:
   ```
   "Actualiza el secret GOOGLE_CLOUD_PROJECT_ID"
   ```

3. Lovable mostrará un formulario seguro donde puedes ingresar los valores.

### 2.3 Verificar Secrets (desde Edge Function logs)

Los secrets estarán disponibles como variables de entorno en las Edge Functions:

```typescript
const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')
const bucketName = Deno.env.get('GOOGLE_CLOUD_BUCKET_NAME')
const credentialsJSON = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
```

Para verificar, puedes agregar logs temporales en tu Edge Function:

```typescript
console.log('✅ Project ID configured:', !!projectId)
console.log('✅ Bucket Name configured:', !!bucketName)
console.log('✅ Credentials JSON configured:', !!credentialsJSON)
```

---

## 3. Deploy de Edge Functions

Las Edge Functions se despliegan **automáticamente** cuando haces cambios en el código en Lovable.

### 3.1 Verificar que la Edge Function está desplegada

1. En Lovable, ve a **Cloud** (icono de nube en la barra superior)
2. Click en **Edge Functions**
3. Deberías ver `generate-upload-url` en la lista

### 3.2 Ver Logs de Edge Functions

**Opción A: Desde Lovable**

1. Ve a **Cloud > Edge Functions**
2. Click en `generate-upload-url`
3. Verás los logs en tiempo real

**Opción B: Desde tu código**

Pídele a Lovable AI:
```
"Muéstrame los logs de la Edge Function generate-upload-url"
```

### 3.3 Testear Edge Function con curl

**Paso 1: Obtener tu JWT token**

1. Abre DevTools en tu app (F12)
2. Ve a la pestaña Application > Local Storage
3. Busca la clave relacionada con Supabase auth
4. Copia el valor del `access_token`

**Paso 2: Testear con curl**

```bash
# Reemplaza con tus valores
SUPABASE_URL="https://lyymcpiujrnlwsbyrseh.supabase.co"
JWT_TOKEN="tu-access-token-aqui"

# Test de la Edge Function
curl -X POST \
  "${SUPABASE_URL}/functions/v1/generate-upload-url" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-audio.wav",
    "fileType": "audio/wav",
    "fileSize": 1024000
  }'
```

**Respuesta esperada (exitosa):**
```json
{
  "uploadUrl": "https://storage.googleapis.com/level-audio-mastering/...",
  "downloadUrl": "https://storage.googleapis.com/level-audio-mastering/...",
  "fileName": "audio-uploads/user-id/timestamp-test-audio.wav",
  "bucket": "level-audio-mastering",
  "expiresIn": {
    "upload": "1 hour",
    "download": "24 hours"
  },
  "metadata": {
    "originalFileName": "test-audio.wav",
    "fileType": "audio/wav",
    "fileSize": 1024000,
    "userId": "...",
    "timestamp": 1234567890
  }
}
```

**Respuesta esperada (error de autenticación):**
```json
{
  "error": "Unauthorized: Invalid user token"
}
```

### 3.4 Testear Upload a GCS

Una vez que tengas la `uploadUrl`, puedes probar subir un archivo:

```bash
# Usando la uploadUrl obtenida
UPLOAD_URL="https://storage.googleapis.com/level-audio-mastering/..."

# Subir un archivo de prueba
curl -X PUT \
  "${UPLOAD_URL}" \
  -H "Content-Type: audio/wav" \
  --data-binary @test-audio.wav
```

Si el upload es exitoso, recibirás un status `200 OK` sin body.

---

## 4. Configurar Backend Python

Tu backend Python debe estar configurado para recibir archivos desde GCS, procesarlos, y retornar la URL del archivo masterizado.

### 4.1 Variables de Entorno del Backend Python

El backend Python necesita estas variables de entorno:

```bash
# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=total-acumen-473702-j1
GOOGLE_CLOUD_BUCKET_NAME=level-audio-mastering
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# O usar archivo de credenciales
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Puerto (si es necesario)
PORT=8080
```

### 4.2 Endpoint Requerido: `/api/master-audio`

Tu backend debe implementar este endpoint:

**Request:**
```http
POST /api/master-audio
Content-Type: application/json

{
  "inputUrl": "https://storage.googleapis.com/level-audio-mastering/audio-uploads/...",
  "fileName": "audio-uploads/user-id/timestamp-file.wav",
  "settings": {
    "targetLoudness": -14,
    "compressionRatio": 4,
    "eqProfile": "neutral",
    "stereoWidth": 100
  }
}
```

**Response (exitosa):**
```json
{
  "success": true,
  "masteredUrl": "https://storage.googleapis.com/level-audio-mastering/mastered/...",
  "jobId": "uuid-job-id",
  "processingTime": 45.3
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Failed to download input file from GCS"
}
```

### 4.3 Estructura Básica del Backend Python

```python
from flask import Flask, request, jsonify
from google.cloud import storage
import os
import tempfile

app = Flask(__name__)

# Inicializar cliente GCS
storage_client = storage.Client(
    project=os.getenv('GOOGLE_CLOUD_PROJECT_ID')
)
bucket = storage_client.bucket(os.getenv('GOOGLE_CLOUD_BUCKET_NAME'))

@app.route('/api/master-audio', methods=['POST'])
def master_audio():
    try:
        data = request.json
        input_url = data['inputUrl']
        file_name = data['fileName']
        settings = data.get('settings', {})
        
        # 1. Extraer path de GCS desde la URL
        gcs_path = input_url.split(f"{os.getenv('GOOGLE_CLOUD_BUCKET_NAME')}/")[1]
        
        # 2. Descargar desde GCS
        blob = bucket.blob(gcs_path)
        temp_input = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        blob.download_to_filename(temp_input.name)
        
        # 3. Procesar audio (tu lógica de mastering aquí)
        temp_output = process_audio_mastering(
            temp_input.name,
            target_loudness=settings.get('targetLoudness', -14),
            compression_ratio=settings.get('compressionRatio', 4),
            eq_profile=settings.get('eqProfile', 'neutral'),
            stereo_width=settings.get('stereoWidth', 100)
        )
        
        # 4. Subir resultado a GCS
        output_blob = bucket.blob(f"mastered/{file_name}")
        output_blob.upload_from_filename(temp_output)
        
        # 5. Generar signed URL (válida por 24 horas)
        mastered_url = output_blob.generate_signed_url(
            version='v4',
            expiration=86400,  # 24 horas
            method='GET'
        )
        
        # 6. Limpiar archivos temporales
        os.unlink(temp_input.name)
        os.unlink(temp_output)
        
        return jsonify({
            'success': True,
            'masteredUrl': mastered_url,
            'jobId': str(uuid.uuid4()),
            'processingTime': 45.3
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

### 4.4 Deploy del Backend Python

**Opción A: Google Cloud Run**

```bash
# Autenticar
gcloud auth login
gcloud config set project total-acumen-473702-j1

# Deploy
gcloud run deploy level-mastering-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT_ID=total-acumen-473702-j1,GOOGLE_CLOUD_BUCKET_NAME=level-audio-mastering
```

**Opción B: Usar backend existente de Spectrum**

Si ya tienes el backend de Spectrum deployado, puedes usar su URL:
```
https://spectrum-backend-857351913435.us-central1.run.app
```

### 4.5 Configurar VITE_PYTHON_BACKEND_URL

Una vez que tengas la URL del backend, configúrala en tu app:

El hook `useAIMastering.ts` ya tiene un fallback al backend de Spectrum, pero si quieres usar uno personalizado:

```typescript
// En useAIMastering.ts, línea ~134
const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'TU_BACKEND_URL_AQUI';
```

---

## 5. Verificación y Testing

### 5.1 Checklist de Verificación

- [ ] Bucket `level-audio-mastering` creado en GCS
- [ ] CORS configurado en el bucket
- [ ] Service Account tiene permisos de Storage Object Admin
- [ ] Secrets configurados en Lovable Cloud:
  - [ ] `GOOGLE_CLOUD_PROJECT_ID`
  - [ ] `GOOGLE_CLOUD_BUCKET_NAME`
  - [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- [ ] Edge Function `generate-upload-url` desplegada
- [ ] Backend Python deployado y accesible
- [ ] `VITE_PYTHON_BACKEND_URL` configurada (o usando fallback)

### 5.2 Test End-to-End desde la UI

1. **Login** en la aplicación
2. Ve a la pestaña **"AI Mastering"**
3. **Sube un archivo** de audio (MP3, WAV, FLAC)
4. Click en **"Master My Track"**
5. Observa el **progress bar** (debería ir de 0% a 100%)
6. El archivo masterizado debería **descargarse automáticamente**

### 5.3 Verificar Logs

**Edge Function logs:**
```
"Muéstrame los logs de generate-upload-url"
```

Deberías ver logs como:
```
🚀 Starting generate-upload-url function
✅ User authenticated: user-id
📝 Request parameters: {...}
🔧 GCS Configuration: {...}
✅ Credentials parsed successfully
✅ Google Cloud Storage client initialized
📁 Generated unique filename: audio-uploads/...
✅ Upload URL generated (valid for 1 hour)
✅ Download URL generated (valid for 24 hours)
🎉 Signed URLs generated successfully
```

**Backend Python logs:**
Revisa los logs de tu servicio (Google Cloud Run, Heroku, etc.)

**Browser console:**
Abre DevTools (F12) y revisa los logs del frontend.

---

## 6. Troubleshooting

### ❌ Error: "Missing Authorization header"

**Causa:** El usuario no está autenticado o el token expiró.

**Solución:**
1. Asegúrate de estar logged in en la aplicación
2. Cierra sesión y vuelve a iniciar
3. Verifica que Supabase auth esté funcionando

### ❌ Error: "Server configuration error: Missing Google Cloud credentials"

**Causa:** Los secrets no están configurados correctamente en Lovable Cloud.

**Solución:**
1. Verifica que los 3 secrets estén agregados
2. Revisa que `GOOGLE_APPLICATION_CREDENTIALS_JSON` contenga el JSON completo
3. Re-deploy la Edge Function si es necesario

### ❌ Error: "Failed to upload to cloud storage"

**Causa:** Problema con CORS o permisos del bucket.

**Solución:**
1. Verifica configuración CORS:
   ```bash
   gsutil cors get gs://level-audio-mastering
   ```
2. Verifica que tu dominio esté en la lista de origins permitidos
3. Verifica permisos de la service account:
   ```bash
   gsutil iam get gs://level-audio-mastering
   ```

### ❌ Error: "Signature verification failed" o "Token is invalid"

**Causa:** Problema con las credenciales del service account.

**Solución:**
1. Verifica que el JSON de credenciales esté completo
2. Verifica que la `private_key` tenga los saltos de línea (`\n`)
3. Re-descarga el archivo JSON desde Google Cloud y vuelve a configurarlo

### ❌ Error: "Failed to parse credentials JSON"

**Causa:** El JSON está malformado o incompleto.

**Solución:**
1. Abre el archivo JSON en un editor
2. Copia TODO el contenido (incluyendo `{ }`)
3. Valida el JSON en https://jsonlint.com/
4. Vuelve a configurar el secret con el JSON validado

### ❌ Error: "Mastering failed" desde el backend

**Causa:** Problema en el backend Python.

**Solución:**
1. Verifica los logs del backend Python
2. Asegúrate de que el backend tenga acceso a GCS
3. Verifica que el endpoint `/api/master-audio` exista
4. Testea el backend directamente con curl

### ❌ Error: "VITE_PYTHON_BACKEND_URL is not configured"

**Causa:** La variable de entorno no está configurada.

**Solución:**
El hook usa un fallback automático al backend de Spectrum. Si ves este error:
1. Verifica que el fallback esté en el código:
   ```typescript
   const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 
     'https://spectrum-backend-857351913435.us-central1.run.app';
   ```
2. O configura tu propio backend URL

### 🔍 Cómo ver logs en cada servicio

**Google Cloud Storage:**
```bash
# Listar archivos recientes
gsutil ls -lh gs://level-audio-mastering/audio-uploads/

# Ver logs de acceso (requiere habilitar logging)
gcloud logging read "resource.type=gcs_bucket"
```

**Supabase Edge Functions:**
Desde Lovable AI:
```
"Muéstrame los logs más recientes de generate-upload-url"
```

**Backend Python (Google Cloud Run):**
```bash
# Ver logs en tiempo real
gcloud run services logs read level-mastering-backend --region us-central1 --limit 50
```

**Browser Console:**
- Abre DevTools (F12)
- Pestaña "Console"
- Busca logs que empiecen con emojis: 🚀 🎵 ✅ ❌

### 🧪 Testear componentes individuales

**1. Test de autenticación:**
```javascript
// En browser console
const { data } = await supabase.auth.getSession();
console.log('User authenticated:', !!data.session);
```

**2. Test de Edge Function:**
```javascript
// En browser console
const { data, error } = await supabase.functions.invoke('generate-upload-url', {
  body: {
    fileName: 'test.wav',
    fileType: 'audio/wav'
  }
});
console.log('Result:', { data, error });
```

**3. Test de GCS upload:**
```bash
# Crear archivo de prueba
echo "test" > test.txt

# Obtener una uploadUrl de la Edge Function primero
# Luego:
curl -X PUT "UPLOAD_URL_AQUI" \
  -H "Content-Type: text/plain" \
  --data-binary @test.txt
```

**4. Test del backend Python:**
```bash
curl -X POST "https://tu-backend.run.app/api/master-audio" \
  -H "Content-Type: application/json" \
  -d '{
    "inputUrl": "https://storage.googleapis.com/level-audio-mastering/test.wav",
    "fileName": "test.wav",
    "settings": {
      "targetLoudness": -14,
      "compressionRatio": 4,
      "eqProfile": "neutral",
      "stereoWidth": 100
    }
  }'
```

---

## 📚 Recursos Adicionales

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [CORS Configuration for GCS](https://cloud.google.com/storage/docs/configuring-cors)
- [Service Account Credentials](https://cloud.google.com/iam/docs/service-accounts)

---

## ✅ Deploy Completado

Si has seguido todos los pasos y todos los tests pasan, ¡tu sistema de AI Mastering está completamente deployado y funcionando! 🎉

**Próximos pasos sugeridos:**
1. Monitorear logs en producción
2. Configurar alertas para errores
3. Optimizar tiempos de procesamiento
4. Implementar rate limiting si es necesario
5. Agregar analytics para tracking de uso

---

**¿Necesitas ayuda?**
- Revisa la sección de [Troubleshooting](#6-troubleshooting)
- Consulta los logs de cada servicio
- Usa el panel de debugging (ver `tests/ai-mastering-test.ts`)
