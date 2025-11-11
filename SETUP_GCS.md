# Configuración de Google Cloud Storage para Level

## Información del Proyecto

- **Project ID**: `total-acumen-473702-j1`
- **Bucket Name**: `level-audio-mastering`
- **Región Recomendada**: `us-central1` (para mejor rendimiento con Cloud Run)

---

## PARTE 1: Configuración en Google Cloud Console

### 1.1 Crear el Bucket

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona el proyecto: `total-acumen-473702-j1`
3. Navega a **Cloud Storage > Buckets**
4. Haz clic en **"CREATE BUCKET"**
5. Configura el bucket:
   ```
   Nombre: level-audio-mastering
   Tipo de ubicación: Region
   Región: us-central1
   Clase de almacenamiento: Standard
   Control de acceso: Uniform (recomendado)
   Protección: Ninguna (puedes habilitar versionado después)
   ```
6. Haz clic en **"CREATE"**

### 1.2 Configurar CORS del Bucket

Para permitir que tu frontend acceda al bucket, necesitas configurar CORS.

**Método 1: Usando Cloud Shell (Recomendado)**

1. Abre Cloud Shell en Google Cloud Console (icono de terminal arriba a la derecha)
2. Crea un archivo `cors.json`:
   ```bash
   cat > cors.json << 'EOF'
   [
     {
       "origin": ["http://localhost:8080", "https://tu-dominio-de-produccion.app"],
       "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
       "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   EOF
   ```

3. Aplica la configuración CORS:
   ```bash
   gcloud storage buckets update gs://level-audio-mastering --cors-file=cors.json
   ```

**Método 2: Usando gsutil local**

Si tienes gcloud CLI instalado localmente:

```bash
# Crear archivo cors.json con el contenido de arriba
gsutil cors set cors.json gs://level-audio-mastering
```

### 1.3 Verificar Configuración CORS

```bash
gcloud storage buckets describe gs://level-audio-mastering --format="default(cors_config)"
```

---

## PARTE 2: Configurar Service Account y Credenciales

### 2.1 Tu Service Account Actual

Ya tienes el archivo de credenciales:
```
C:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json
```

### 2.2 Verificar Permisos del Service Account

1. Ve a **IAM & Admin > Service Accounts** en Google Cloud Console
2. Busca el service account asociado a tus credenciales
3. Asegúrate que tenga estos roles:
   - `Storage Object Admin` (para crear/leer/eliminar objetos)
   - O `Storage Admin` (permisos completos)

**Para agregar permisos:**
1. Ve a **Cloud Storage > Buckets > level-audio-mastering**
2. Click en la pestaña **"PERMISSIONS"**
3. Click **"GRANT ACCESS"**
4. Agrega el email del service account
5. Asigna el rol: **Storage Object Admin**

---

## PARTE 3: Configurar Secrets en Lovable Cloud

### 3.1 Secrets Requeridos para Edge Functions

Necesitas configurar estos secrets en Lovable Cloud (no en .env):

| Secret Name | Descripción | Valor |
|------------|-------------|-------|
| `GCS_PROJECT_ID` | ID del proyecto GCS | `total-acumen-473702-j1` |
| `GCS_BUCKET_NAME` | Nombre del bucket | `level-audio-mastering` |
| `GCS_SERVICE_ACCOUNT_EMAIL` | Email del service account | (obtenerlo del JSON) |
| `GCS_PRIVATE_KEY` | Private key del service account | (obtenerlo del JSON) |
| `PYTHON_BACKEND_URL` | URL del backend Python | `https://spectrum-backend-857351913435.us-central1.run.app` |

### 3.2 Extraer Información del JSON de Credenciales

Abre tu archivo de credenciales (`total-acumen-473702-j1-c638565cae0d.json`) y extrae:

```json
{
  "type": "service_account",
  "project_id": "total-acumen-473702-j1",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "ESTE_ES_EL_SERVICE_ACCOUNT_EMAIL@...",
  "client_id": "...",
  ...
}
```

**Valores a copiar:**
- `GCS_SERVICE_ACCOUNT_EMAIL` = campo `client_email`
- `GCS_PRIVATE_KEY` = campo `private_key` (incluye todo, con `-----BEGIN PRIVATE KEY-----` y saltos de línea)

### 3.3 Agregar Secrets en Lovable

**IMPORTANTE**: Los secrets deben agregarse a través de Lovable, no directamente en archivos.

Pídele a tu asistente de Lovable que ejecute:
```
Por favor agrega estos secrets a Lovable Cloud:
- GCS_PROJECT_ID
- GCS_BUCKET_NAME
- GCS_SERVICE_ACCOUNT_EMAIL
- GCS_PRIVATE_KEY
- PYTHON_BACKEND_URL
```

Luego ingresarás los valores manualmente en el formulario seguro.

---

## PARTE 4: Variables de Entorno Frontend

### 4.1 Variables Públicas (VITE_*)

**NOTA IMPORTANTE**: El archivo `.env` en Lovable es de solo lectura y se genera automáticamente.

Para variables públicas del frontend, necesitas agregarlas manualmente o pedirle al asistente que las configure. Las variables públicas que pueden exponerse en el frontend son:

```env
# Backend URL (se configura después del deploy del backend)
VITE_PYTHON_BACKEND_URL=https://tu-backend-url.run.app

# Info del bucket (solo si necesitas acceso directo desde frontend)
VITE_GCS_BUCKET_NAME=level-audio-mastering
VITE_GCS_PROJECT_ID=total-acumen-473702-j1
```

**⚠️ NUNCA expongas credenciales privadas (private_key) en variables VITE_** - Esas deben ir solo en Secrets de backend.

---

## PARTE 5: Configuración del Backend Python

### 5.1 Actualizar Backend para Usar GCS

Tu backend Python debe actualizarse para:

1. **Leer credenciales de variables de entorno**:
   ```python
   import os
   from google.cloud import storage
   
   # Credenciales desde env vars (secrets de Supabase)
   project_id = os.getenv('GCS_PROJECT_ID')
   bucket_name = os.getenv('GCS_BUCKET_NAME')
   
   # Crear cliente GCS
   storage_client = storage.Client(project=project_id)
   bucket = storage_client.bucket(bucket_name)
   ```

2. **Configurar credenciales JSON dinámicamente**:
   ```python
   import json
   from google.oauth2 import service_account
   
   credentials_dict = {
       "type": "service_account",
       "project_id": os.getenv('GCS_PROJECT_ID'),
       "private_key": os.getenv('GCS_PRIVATE_KEY'),
       "client_email": os.getenv('GCS_SERVICE_ACCOUNT_EMAIL'),
       "token_uri": "https://oauth2.googleapis.com/token",
   }
   
   credentials = service_account.Credentials.from_service_account_info(
       credentials_dict
   )
   
   storage_client = storage.Client(
       credentials=credentials,
       project=credentials_dict['project_id']
   )
   ```

### 5.2 Ejemplo de Uso en Backend

```python
def upload_to_gcs(file_path: str, destination_blob_name: str) -> str:
    """Sube un archivo a GCS y retorna la URL pública"""
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(file_path)
    
    # Hacer el blob público (opcional)
    blob.make_public()
    
    return blob.public_url

def generate_signed_url(blob_name: str, expiration_minutes: int = 60) -> str:
    """Genera una URL firmada temporal para descargar"""
    from datetime import timedelta
    
    blob = bucket.blob(blob_name)
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expiration_minutes),
        method="GET"
    )
    return url
```

---

## PARTE 6: Flujo de Trabajo Recomendado

### 6.1 Arquitectura de Procesamiento

```
Frontend (Lovable)
    ↓
Edge Function (Supabase)
    ↓
Python Backend (Cloud Run)
    ↓
Google Cloud Storage
```

### 6.2 Flujo de Upload/Processing

1. **Frontend** solicita URL de upload firmada
2. **Edge Function** autentica usuario y llama al backend
3. **Backend Python** genera signed URL de GCS
4. **Frontend** sube archivo directamente a GCS usando signed URL
5. **Frontend** notifica al backend que el archivo está listo
6. **Backend** procesa el audio desde GCS
7. **Backend** guarda resultado procesado en GCS
8. **Backend** retorna URL firmada del archivo procesado

---

## PARTE 7: Testing y Verificación

### 7.1 Test Manual del Bucket

```bash
# Listar buckets
gcloud storage buckets list --project=total-acumen-473702-j1

# Ver configuración del bucket
gcloud storage buckets describe gs://level-audio-mastering

# Subir archivo de prueba
echo "test" > test.txt
gcloud storage cp test.txt gs://level-audio-mastering/test.txt

# Verificar que se subió
gcloud storage ls gs://level-audio-mastering/

# Limpiar
gcloud storage rm gs://level-audio-mastering/test.txt
```

### 7.2 Test de Credenciales

```bash
# Autenticarse con el service account
gcloud auth activate-service-account --key-file=C:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json

# Verificar acceso
gcloud storage ls gs://level-audio-mastering/
```

---

## PARTE 8: Seguridad y Buenas Prácticas

### 8.1 Lifecycle Rules (Opcional)

Para eliminar archivos temporales automáticamente:

1. Ve al bucket en Google Cloud Console
2. Click en **"LIFECYCLE"**
3. Agrega regla:
   ```
   Condición: Age > 7 days
   Acción: Delete object
   ```

### 8.2 Monitoring

1. Habilita **Cloud Monitoring** para el bucket
2. Configura alertas para:
   - Almacenamiento > X GB
   - Costos > X USD/mes
   - Errores de acceso

### 8.3 Backups

- Considera habilitar **Object Versioning** para archivos importantes
- Configura **Cross-region replication** si necesitas alta disponibilidad

---

## CHECKLIST DE CONFIGURACIÓN

- [ ] Bucket `level-audio-mastering` creado en GCS
- [ ] CORS configurado en el bucket
- [ ] Service account tiene permisos de Storage Object Admin
- [ ] Secrets agregados en Lovable Cloud:
  - [ ] GCS_PROJECT_ID
  - [ ] GCS_BUCKET_NAME
  - [ ] GCS_SERVICE_ACCOUNT_EMAIL
  - [ ] GCS_PRIVATE_KEY
  - [ ] PYTHON_BACKEND_URL
- [ ] Backend Python actualizado para usar GCS
- [ ] Backend Python deployado con las nuevas variables de entorno
- [ ] Edge Functions actualizadas (si es necesario)
- [ ] Tests de upload/download funcionando
- [ ] Monitoring configurado

---

## SOPORTE Y RECURSOS

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Python Client Library](https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-python)
- [CORS Configuration](https://cloud.google.com/storage/docs/configuring-cors)
- [Signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls)

---

## SIGUIENTE PASO

Una vez completada esta configuración, el siguiente paso sería:

1. **Actualizar el backend Python** para integrar GCS
2. **Actualizar las Edge Functions** si necesitan cambios
3. **Actualizar el frontend** para usar las nuevas URLs

¿Quieres que proceda con la implementación del código ahora?
