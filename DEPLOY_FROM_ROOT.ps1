# Script helper para ejecutar el despliegue desde la raíz del proyecto
# Uso: .\DEPLOY_FROM_ROOT.ps1

$scriptPath = Join-Path $PSScriptRoot "sonic-refine-suite\python-backend"

Write-Host "=========================================="
Write-Host "🚀 Helper de Despliegue"
Write-Host "=========================================="
Write-Host ""

# Verificar que el directorio existe
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Error: No se encontró el directorio del backend"
    Write-Host "   Buscado en: $scriptPath"
    exit 1
}

Write-Host "📁 Directorio del backend: $scriptPath"
Write-Host ""

# Cambiar al directorio correcto
Push-Location $scriptPath

Write-Host "✅ Cambiado a: $(Get-Location)"
Write-Host ""

# Mostrar opciones
Write-Host "¿Qué deseas hacer?"
Write-Host "1. Crear secret en Google Cloud Secret Manager"
Write-Host "2. Desplegar en Cloud Run"
Write-Host "3. Ambos (crear secret y luego desplegar)"
Write-Host ""
$choice = Read-Host "Selecciona una opción (1, 2, o 3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔐 Creando secret..."
        & ".\create-gcp-secret.ps1"
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Desplegando en Cloud Run..."
        & ".\deploy-cloud-run.ps1"
    }
    "3" {
        Write-Host ""
        Write-Host "🔐 Paso 1: Creando secret..."
        & ".\create-gcp-secret.ps1"
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "🚀 Paso 2: Desplegando en Cloud Run..."
            & ".\deploy-cloud-run.ps1"
        } else {
            Write-Host ""
            Write-Host "❌ Error al crear el secret. Abortando despliegue."
        }
    }
    default {
        Write-Host "❌ Opción inválida"
    }
}

# Volver al directorio original
Pop-Location

Write-Host ""
Write-Host "=========================================="




