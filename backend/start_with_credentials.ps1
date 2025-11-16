# Script para iniciar el backend con credenciales de GCS
# Uso: .\start_with_credentials.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=========================================="
Write-Host "Iniciando Backend con Credenciales GCS"
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

# Verificar que existe main.py
if (-not (Test-Path "main.py")) {
    Write-Host "ERROR: No se encontro main.py en el directorio actual"
    Write-Host "Directorio actual: $PWD"
    exit 1
}

# Verificar si existe un entorno virtual
$venvPath = Join-Path $PSScriptRoot "venv"
if (Test-Path $venvPath) {
    Write-Host "Activando entorno virtual..."
    & "$venvPath\Scripts\Activate.ps1"
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
# PowerShell preserva el contenido del archivo tal cual, incluyendo los \n en la clave privada
$env:GOOGLE_APPLICATION_CREDENTIALS_JSON = $credentialsJson
$env:GOOGLE_CLOUD_PROJECT_ID = "total-acumen-473702-j1"
$env:GOOGLE_CLOUD_BUCKET_NAME = "spectrum-mastering-files-857351913435"

Write-Host "Project ID: total-acumen-473702-j1"
Write-Host "Bucket: spectrum-mastering-files-857351913435"
Write-Host "Credenciales GCS configuradas y reiniciadas"
Write-Host "=========================================="
Write-Host ""

# Verificar si el puerto 8000 está en uso
$portInUse = netstat -ano | findstr :8000
if ($portInUse) {
    Write-Host "ADVERTENCIA: El puerto 8000 esta en uso"
    Write-Host ""
    Write-Host "Opciones:"
    Write-Host "1. Matar el proceso que usa el puerto 8000"
    Write-Host "2. Usar un puerto diferente (ej: 8001)"
    Write-Host ""
    $response = Read-Host "¿Deseas matar el proceso? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        $processId = (netstat -ano | findstr :8000 | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] })
        if ($processId) {
            Write-Host "Matando proceso $processId..."
            taskkill /F /PID $processId
            Start-Sleep -Seconds 2
            Write-Host "Proceso terminado"
        }
    } else {
        $customPort = Read-Host "Ingresa el numero de puerto (presiona Enter para usar 8001)"
        if ([string]::IsNullOrWhiteSpace($customPort)) {
            $customPort = "8001"
        }
        $env:PORT = $customPort
        Write-Host "Usando puerto $customPort"
    }
}

# Iniciar el servidor
Write-Host ""
Write-Host "Iniciando servidor Python..."
Write-Host "Presiona CTRL+C para detener el servidor"
Write-Host ""
python main.py


