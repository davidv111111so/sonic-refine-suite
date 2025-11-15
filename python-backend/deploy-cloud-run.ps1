# Script para desplegar el backend en Google Cloud Run
# Uso: .\deploy-cloud-run.ps1

Write-Host "=========================================="
Write-Host "Desplegando Backend en Cloud Run"
Write-Host "=========================================="
Write-Host ""

# Verificar que gcloud este instalado
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "OK: gcloud encontrado: $gcloudVersion"
} catch {
    Write-Host "ERROR: gcloud no esta instalado"
    Write-Host "   Instalalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Verificar autenticacion
Write-Host "Verificando autenticacion..."
$authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1
if (-not $authStatus) {
    Write-Host "ADVERTENCIA: No estas autenticado. Ejecutando gcloud auth login..."
    gcloud auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Error en la autenticacion"
        exit 1
    }
} else {
    Write-Host "OK: Autenticado como: $authStatus"
}

# Configurar proyecto
Write-Host ""
Write-Host "Configurando proyecto..."
gcloud config set project total-acumen-473702-j1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error al configurar el proyecto"
    exit 1
}

# Habilitar APIs necesarias
Write-Host ""
Write-Host "Habilitando APIs necesarias..."
gcloud services enable run.googleapis.com --project=total-acumen-473702-j1
gcloud services enable cloudbuild.googleapis.com --project=total-acumen-473702-j1
gcloud services enable secretmanager.googleapis.com --project=total-acumen-473702-j1

Write-Host "OK: APIs habilitadas"

# Verificar que el secret existe
Write-Host ""
Write-Host "Verificando que el secret existe..."
$null = gcloud secrets describe GOOGLE_APPLICATION_CREDENTIALS_JSON --project=total-acumen-473702-j1 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: El secret GOOGLE_APPLICATION_CREDENTIALS_JSON no existe"
    Write-Host "   Ejecuta primero: .\create-gcp-secret.ps1"
    exit 1
}
Write-Host "OK: Secret encontrado"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "main.py")) {
    Write-Host "ERROR: main.py no encontrado"
    Write-Host "   Asegurate de ejecutar este script desde: sonic-refine-suite\python-backend\"
    exit 1
}

# Desplegar en Cloud Run
Write-Host ""
Write-Host "Desplegando en Cloud Run..."
Write-Host "   Esto puede tomar varios minutos..."
Write-Host ""

$serviceName = "mastering-backend"
$region = "us-central1"
$projectId = "total-acumen-473702-j1"
$bucketName = "spectrum-mastering-files-857351913435"
$allowedOrigins = "https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com,https://*.lovable.app"

gcloud run deploy $serviceName `
    --source . `
    --platform managed `
    --region $region `
    --project $projectId `
    --allow-unauthenticated `
    --set-env-vars "GOOGLE_CLOUD_PROJECT_ID=$projectId,GOOGLE_CLOUD_BUCKET_NAME=$bucketName,ALLOWED_ORIGINS=$allowedOrigins" `
    --set-secrets "GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest" `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "OK: Despliegue exitoso"
    Write-Host "=========================================="
    Write-Host ""
    
    # Obtener la URL del servicio
    $serviceUrl = gcloud run services describe $serviceName --region=$region --project=$projectId --format="value(status.url)" 2>&1
    
    if ($serviceUrl) {
        Write-Host "URL del servicio: $serviceUrl"
        Write-Host ""
        Write-Host "Probando health check..."
        try {
            $healthCheck = Invoke-WebRequest -Uri "$serviceUrl/health" -Method GET -UseBasicParsing
            if ($healthCheck.StatusCode -eq 200) {
                Write-Host "OK: Health check exitoso"
                Write-Host "   Respuesta: $($healthCheck.Content)"
            } else {
                Write-Host "ADVERTENCIA: Health check retorno codigo: $($healthCheck.StatusCode)"
            }
        } catch {
            Write-Host "ADVERTENCIA: No se pudo probar el health check: $_"
        }
    }
    
    Write-Host ""
    Write-Host "Proximos pasos:"
    Write-Host "   1. Actualiza la URL del backend en tu frontend"
    Write-Host "   2. Prueba el endpoint /api/master-audio"
    Write-Host "   3. Revisa los logs: gcloud run logs read $serviceName --region=$region"
} else {
    Write-Host ""
    Write-Host "ERROR: Error en el despliegue"
    Write-Host "   Revisa los logs para mas detalles"
    exit 1
}
