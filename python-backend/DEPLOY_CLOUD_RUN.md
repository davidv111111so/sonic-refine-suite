# 🚀 Guía de Despliegue en Google Cloud Run

Esta guía te ayudará a desplegar el backend de AI Mastering en Google Cloud Run.

## 📋 Prerrequisitos

1. **Google Cloud SDK instalado**
   - Descarga desde: https://cloud.google.com/sdk/docs/install
   - Verifica instalación: `gcloud --version`

2. **Autenticación en Google Cloud**
   - Ejecuta: `gcloud auth login`
   - Selecciona tu cuenta de Google

3. **Proyecto configurado**
   - El proyecto debe ser: `total-acumen-473702-j1`
   - Verifica: `gcloud config get-value project`

4. **APIs habilitadas**
   - Cloud Run API
   - Cloud Build API
   - Secret Manager API

## 🔧 Pasos de Despliegue

### Paso 1: Preparar el entorno

Abre PowerShell y navega al directorio del backend:

```powershell
cd sonic-refine-suite\python-backend
```

### Paso 2: Crear el Secret en Secret Manager

Ejecuta el script para crear el secret con las credenciales de GCS:

```powershell
.\create-gcp-secret.ps1
```

Este script:
- ✅ Verifica que gcloud esté instalado
- ✅ Lee las credenciales desde `CREDENTIALS_JSON_COMPLETE.json`
- ✅ Crea o actualiza el secret `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- ✅ Configura los permisos para Cloud Run

**Si el secret ya existe**, el script te preguntará si deseas actualizarlo.

### Paso 3: Desplegar en Cloud Run

Ejecuta el script de despliegue:

```powershell
.\deploy-cloud-run.ps1
```

Este script:
- ✅ Verifica autenticación y configuración
- ✅ Habilita las APIs necesarias
- ✅ Construye la imagen Docker automáticamente
- ✅ Despliega el servicio en Cloud Run
- ✅ Configura variables de entorno y secrets
- ✅ Prueba el health check

**Tiempo estimado**: 5-10 minutos

### Paso 4: Verificar el despliegue

Después del despliegue, el script mostrará la URL del servicio. Prueba manualmente:

```powershell
# Health check
curl https://mastering-backend-[PROJECT-NUMBER].us-central1.run.app/health

# Debería retornar:
# {"status":"OK","service":"AI Mastering Backend"}
```

## 📝 Configuración del Servicio

El servicio se despliega con:

- **Nombre**: `mastering-backend`
- **Región**: `us-central1`
- **Memoria**: 2GB
- **CPU**: 2 vCPU
- **Timeout**: 300 segundos (5 minutos)
- **Máximo de instancias**: 10
- **Acceso**: Público (sin autenticación)

### Variables de Entorno

- `GOOGLE_CLOUD_PROJECT_ID`: `total-acumen-473702-j1`
- `GOOGLE_CLOUD_BUCKET_NAME`: `spectrum-mastering-files-857351913435`
- `ALLOWED_ORIGINS`: `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com`

### Secrets

- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Credenciales de GCS desde Secret Manager

## 🔍 Comandos Útiles

### Ver logs del servicio

```powershell
gcloud run logs read mastering-backend --region=us-central1 --project=total-acumen-473702-j1
```

### Ver detalles del servicio

```powershell
gcloud run services describe mastering-backend --region=us-central1 --project=total-acumen-473702-j1
```

### Actualizar el servicio

Si haces cambios en el código, simplemente ejecuta de nuevo:

```powershell
.\deploy-cloud-run.ps1
```

### Ver la URL del servicio

```powershell
gcloud run services describe mastering-backend --region=us-central1 --project=total-acumen-473702-j1 --format="value(status.url)"
```

### Eliminar el servicio

```powershell
gcloud run services delete mastering-backend --region=us-central1 --project=total-acumen-473702-j1
```

## 🐛 Troubleshooting

### Error: "gcloud no está instalado"

**Solución**: Instala Google Cloud SDK desde https://cloud.google.com/sdk/docs/install

### Error: "No estás autenticado"

**Solución**: Ejecuta `gcloud auth login` y selecciona tu cuenta

### Error: "El secret no existe"

**Solución**: Ejecuta primero `.\create-gcp-secret.ps1`

### Error: "API no habilitada"

**Solución**: El script intenta habilitarlas automáticamente. Si falla, habilítalas manualmente:

```powershell
gcloud services enable run.googleapis.com --project=total-acumen-473702-j1
gcloud services enable cloudbuild.googleapis.com --project=total-acumen-473702-j1
gcloud services enable secretmanager.googleapis.com --project=total-acumen-473702-j1
```

### Error: "Failed to build"

**Solución**: 
- Verifica que `Dockerfile` y `requirements.txt` estén presentes
- Revisa los logs de Cloud Build: `gcloud builds list --project=total-acumen-473702-j1`

### Error: "Health check failed"

**Solución**:
- Verifica los logs del servicio
- Asegúrate de que el secret esté configurado correctamente
- Verifica que las variables de entorno estén correctas

### Error: "Permission denied" al acceder al secret

**Solución**: El script intenta configurar permisos automáticamente. Si falla, hazlo manualmente:

```powershell
gcloud secrets add-iam-policy-binding GOOGLE_APPLICATION_CREDENTIALS_JSON `
    --member="serviceAccount:857351913435-compute@developer.gserviceaccount.com" `
    --role="roles/secretmanager.secretAccessor" `
    --project=total-acumen-473702-j1
```

## 📊 Monitoreo

### Ver métricas del servicio

1. Ve a Google Cloud Console
2. Navega a Cloud Run
3. Selecciona `mastering-backend`
4. Revisa la pestaña "Métricas"

### Ver logs en tiempo real

```powershell
gcloud run logs tail mastering-backend --region=us-central1 --project=total-acumen-473702-j1
```

## 🔄 Actualizar el Frontend

Después de desplegar, actualiza la URL del backend en tu frontend:

1. Obtén la URL del servicio:
   ```powershell
   gcloud run services describe mastering-backend --region=us-central1 --project=total-acumen-473702-j1 --format="value(status.url)"
   ```

2. Actualiza la variable de entorno en tu frontend:
   - Busca `VITE_BACKEND_URL` o similar
   - Actualiza con la nueva URL

## ✅ Checklist de Verificación

- [ ] gcloud instalado y autenticado
- [ ] Proyecto configurado: `total-acumen-473702-j1`
- [ ] Secret creado en Secret Manager
- [ ] Servicio desplegado en Cloud Run
- [ ] Health check exitoso
- [ ] Logs sin errores
- [ ] Frontend actualizado con la nueva URL

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del servicio
2. Verifica que todas las APIs estén habilitadas
3. Asegúrate de que el secret tenga los permisos correctos
4. Verifica que las variables de entorno estén configuradas

---

**Última actualización**: $(Get-Date -Format "yyyy-MM-dd")


