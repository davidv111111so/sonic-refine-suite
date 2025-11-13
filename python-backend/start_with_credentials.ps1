# Script para iniciar el python-backend con credenciales de GCS
# Uso: .\start_with_credentials.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=========================================="
Write-Host "Iniciando Python Backend con Credenciales GCS"
Write-Host "=========================================="

# Verificar que Python esté instalado
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python encontrado: $pythonVersion"
} catch {
    Write-Host "ERROR: Python no esta instalado o no esta en el PATH"
    Write-Host "Por favor instala Python 3.8 o superior"
    exit 1
}

# Cambiar al directorio del script
Set-Location $PSScriptRoot

# Verificar que existe requirements.txt y main.py
if (-not (Test-Path "requirements.txt")) {
    Write-Host "ERROR: No se encontro requirements.txt"
    exit 1
}

if (-not (Test-Path "main.py")) {
    Write-Host "ERROR: No se encontro main.py"
    exit 1
}

# Verificar si existe un entorno virtual
$venvPath = Join-Path $PSScriptRoot "venv"
if (Test-Path $venvPath) {
    Write-Host "Activando entorno virtual..."
    & "$venvPath\Scripts\Activate.ps1"
}

# Verificar/instalar dependencias
Write-Host "Verificando dependencias..."
try {
    python -c "import flask" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Instalando dependencias..."
        pip install -r requirements.txt
    } else {
        Write-Host "Dependencias ya instaladas"
    }
} catch {
    Write-Host "Instalando dependencias..."
    pip install -r requirements.txt
}

# Cargar credenciales desde el archivo JSON
$credentialsPath = "c:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json"

if (-not (Test-Path $credentialsPath)) {
    Write-Host "ERROR: No se encontro el archivo de credenciales en: $credentialsPath"
    exit 1
}

$credentialsJson = Get-Content $credentialsPath -Raw -Encoding UTF8

# Validar que el JSON sea válido
try {
    $null = $credentialsJson | ConvertFrom-Json
    Write-Host "Credenciales cargadas y validadas"
} catch {
    Write-Host "ERROR: El archivo de credenciales no es un JSON valido"
    exit 1
}

# Establecer variables de entorno
$env:GOOGLE_APPLICATION_CREDENTIALS_JSON = $credentialsJson
$env:GOOGLE_CLOUD_PROJECT_ID = "total-acumen-473702-j1"
$env:GOOGLE_CLOUD_BUCKET_NAME = "spectrum-mastering-files-857351913435"
$env:ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:8080,https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com"

Write-Host "Project ID: total-acumen-473702-j1"
Write-Host "Bucket: spectrum-mastering-files-857351913435"
Write-Host "Credenciales GCS configuradas y reiniciadas"
Write-Host "=========================================="
Write-Host ""

# Iniciar el servidor
Write-Host "Iniciando servidor Python en puerto 8080..."
Write-Host "Presiona CTRL+C para detener el servidor"
Write-Host ""
python main.py

