# Script para desplegar en Cloud Run
# Uso: .\deploy-cloud-run.ps1

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "Desplegando en Cloud Run"
Write-Host "=========================================="
Write-Host ""

# Configuración
$PROJECT_ID = "total-acumen-473702-j1"
$SERVICE_NAME = "mastering-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Verificar gcloud
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "OK: gcloud encontrado: $gcloudVersion"
} catch {
    Write-Host "ERROR: gcloud no esta instalado"
    exit 1
}

# Configurar proyecto
Write-Host "Configurando proyecto $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Construir imagen
Write-Host ""
Write-Host "Construyendo imagen Docker en Cloud Build..."
gcloud builds submit --tag $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al construir la imagen"
    exit 1
}

# Leer variables de entorno del archivo .env
Write-Host ""
Write-Host "Leyendo variables de entorno..."
$envVars = Get-Content .env | Where-Object { $_ -match "=" -and -not ($_ -match "^#") }
$envString = $envVars -join ","

# Desplegar en Cloud Run
Write-Host ""
Write-Host "Desplegando servicio en Cloud Run..."
# Nota: --set-secrets podría ser necesario si usas Secret Manager, pero aquí usamos env vars directas para las keys de Supabase/PayU por simplicidad basada en tu .env
# Si prefieres usar el secreto creado anteriormente para credenciales de Google, añade: --set-secrets="GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest"
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars "$envString" `
    --memory 2Gi `
    --cpu 2

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "✅ Despliegue completado exitosamente"
    Write-Host "=========================================="
    
    # Obtener URL
    $url = gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'
    Write-Host "URL del servicio: $url"
} else {
    Write-Host ""
    Write-Host "❌ Error en el despliegue"
    exit 1
}
