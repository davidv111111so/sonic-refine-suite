# 🚀 Prompt para Lovable Cloud - Configuración de AI Mastering

## Instrucciones para el Asistente de Lovable

Por favor, ejecuta los siguientes pasos para configurar completamente el sistema de AI Mastering:

---

## 📋 PASO 1: Verificar y Desplegar Edge Function

### 1.1 Verificar Estado de la Edge Function

1. **Revisa el estado actual de la Edge Function `generate-upload-url`:**
   - Ve a la sección de **Edge Functions** en Lovable Cloud
   - Verifica si `generate-upload-url` está desplegada y activa
   - Revisa los logs recientes para ver si hay errores

### 1.2 Desplegar Edge Function (si no está desplegada)

Si la Edge Function `generate-upload-url` no está desplegada o necesita actualizarse:

1. **Localiza el código fuente:**
   - Ruta del archivo: `sonic-refine-suite/supabase/functions/generate-upload-url/index.ts`
   - Este archivo contiene la implementación completa de la Edge Function

2. **Despliega la Edge Function:**
   - Usa el código desde `sonic-refine-suite/supabase/functions/generate-upload-url/index.ts`
   - Asegúrate de que la función esté configurada para:
     - Autenticación de usuarios mediante Supabase Auth
     - Generación de signed URLs para Google Cloud Storage
     - Manejo de errores robusto

3. **Verifica el despliegue:**
   - Confirma que la función esté activa y sin errores
   - Revisa que los logs muestren inicialización correcta

---

## 🔐 PASO 2: Configurar Secrets de Google Cloud

### 2.1 Agregar Secrets Requeridos

Por favor, agrega los siguientes secrets en la sección **Secrets** de Lovable Cloud:

#### Secret 1: `GOOGLE_CLOUD_PROJECT_ID`
- **Valor:** `total-acumen-473702-j1`
- **Descripción:** ID del proyecto de Google Cloud Platform
- **Uso:** Identifica el proyecto GCP para las operaciones de Storage

#### Secret 2: `GOOGLE_CLOUD_BUCKET_NAME`
- **Valor:** `spectrum-mastering-files-857351913435`
- **Descripción:** Nombre del bucket de Google Cloud Storage
- **Uso:** Bucket donde se almacenan los archivos de audio para mastering

#### Secret 3: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- **Valor:** [El JSON completo de las credenciales de la service account]
- **Descripción:** Credenciales completas de la service account de Google Cloud en formato JSON
- **Formato:** Debe ser un JSON válido con los siguientes campos:
  ```json
  {
    "type": "service_account",
    "project_id": "total-acumen-473702-j1",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "...",
    "client_id": "...",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "..."
  }
  ```
- **Importante:** 
  - El JSON debe estar completo y válido
  - Los saltos de línea en `private_key` deben estar como `\n` (no como saltos de línea reales)
  - No debe tener espacios extra o caracteres inválidos

### 2.2 Verificar Configuración de Secrets

Después de agregar los secrets:

1. **Verifica que todos los secrets estén presentes:**
   - `GOOGLE_CLOUD_PROJECT_ID` ✓
   - `GOOGLE_CLOUD_BUCKET_NAME` ✓
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` ✓

2. **Valida el formato del JSON:**
   - Asegúrate de que `GOOGLE_APPLICATION_CREDENTIALS_JSON` sea un JSON válido
   - Verifica que todos los campos requeridos estén presentes

3. **Confirma que los secrets estén disponibles para Edge Functions:**
   - Los secrets deben estar accesibles desde las Edge Functions
   - Verifica que la Edge Function `generate-upload-url` pueda leer estos secrets

---

## ✅ PASO 3: Verificación Final

### 3.1 Probar Edge Function

Después de configurar todo:

1. **Ejecuta una prueba de la Edge Function:**
   - Usa un usuario autenticado
   - Llama a `generate-upload-url` con parámetros de prueba:
     ```json
     {
       "fileName": "test.wav",
       "fileType": "audio/wav",
       "fileSize": 1024
     }
     ```

2. **Verifica la respuesta:**
   - Debe retornar `uploadUrl` y `downloadUrl` válidos
   - Las URLs deben apuntar a `storage.googleapis.com`
   - No debe haber errores en los logs

### 3.2 Revisar Logs

1. **Revisa los logs de la Edge Function:**
   - Busca mensajes de éxito: `✅ User authenticated`, `✅ Signed URLs generated successfully`
   - Verifica que no haya errores relacionados con credenciales o configuración

2. **Si hay errores:**
   - Revisa que los secrets estén correctamente configurados
   - Verifica que el formato del JSON de credenciales sea válido
   - Asegúrate de que la service account tenga los permisos necesarios en GCS

---

## 📝 Notas Importantes

1. **Seguridad:**
   - Los secrets son sensibles y no deben exponerse en el frontend
   - Solo deben estar disponibles en el backend (Edge Functions)

2. **Permisos de Service Account:**
   - La service account debe tener permisos de `Storage Object Admin` o `Storage Admin` en el bucket
   - Verifica los permisos en Google Cloud Console si hay errores de acceso

3. **Formato de Credenciales:**
   - El `private_key` en el JSON debe mantener los saltos de línea como `\n`
   - No debe tener espacios extra o caracteres inválidos

4. **Testing:**
   - Después de configurar, prueba desde el frontend usando el componente `AIMasteringSetupChecker`
   - Este componente verificará automáticamente que todo esté configurado correctamente

---

## 🆘 Troubleshooting

Si encuentras problemas:

1. **Edge Function no responde:**
   - Verifica que esté desplegada y activa
   - Revisa los logs para errores de inicialización
   - Asegúrate de que el código esté actualizado

2. **Error de credenciales:**
   - Verifica que `GOOGLE_APPLICATION_CREDENTIALS_JSON` sea un JSON válido
   - Asegúrate de que todos los campos requeridos estén presentes
   - Verifica que los saltos de línea en `private_key` estén como `\n`

3. **Error de permisos:**
   - Verifica que la service account tenga permisos en el bucket
   - Revisa los permisos en Google Cloud Console

4. **URLs no se generan:**
   - Verifica que `GOOGLE_CLOUD_BUCKET_NAME` sea correcto
   - Asegúrate de que el bucket exista en Google Cloud Storage
   - Revisa los logs de la Edge Function para errores específicos

---

**Por favor, confirma cuando hayas completado todos los pasos y comparte cualquier error o problema que encuentres durante el proceso.**





