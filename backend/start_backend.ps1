# Script para iniciar el backend con credenciales de GCS
# Uso: .\start_backend.ps1

# Cargar credenciales desde el archivo JSON
$credentialsPath = "c:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json"
$credentialsJson = Get-Content $credentialsPath -Raw

# Establecer variable de entorno
$env:GOOGLE_APPLICATION_CREDENTIALS_JSON = $credentialsJson

Write-Host "=========================================="
Write-Host "🚀 Iniciando Backend con Credenciales GCS"
Write-Host "=========================================="
Write-Host "✅ Credenciales cargadas desde: $credentialsPath"
Write-Host "📦 Project ID: total-acumen-473702-j1"
Write-Host "🪣 Bucket: spectrum-mastering-files-857351913435"
Write-Host "=========================================="
Write-Host ""

# Iniciar el servidor
python main.py













