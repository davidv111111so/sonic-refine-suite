# Script para crear el secret de credenciales GCS en Google Cloud Secret Manager
# Uso: .\create-gcp-secret.ps1

Write-Host "=========================================="
Write-Host "Creando Secret en Google Cloud"
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

# Verificar que el archivo de credenciales existe
$credentialsPath = "..\..\CREDENTIALS_JSON_COMPLETE.json"
if (-not (Test-Path $credentialsPath)) {
    Write-Host "ERROR: No se encontro el archivo de credenciales"
    Write-Host "   Buscado en: $credentialsPath"
    Write-Host "   Asegurate de que CREDENTIALS_JSON_COMPLETE.json existe en la raiz del proyecto"
    exit 1
}

Write-Host "Leyendo credenciales desde: $credentialsPath"
$jsonContent = Get-Content $credentialsPath -Raw -Encoding UTF8

# Validar que el JSON es valido
try {
    $jsonObj = $jsonContent | ConvertFrom-Json
    Write-Host "OK: JSON valido"
    Write-Host "   Project ID: $($jsonObj.project_id)"
    Write-Host "   Client Email: $($jsonObj.client_email)"
} catch {
    Write-Host "ERROR: El JSON no es valido"
    exit 1
}

# Verificar si el secret ya existe
Write-Host ""
Write-Host "Verificando si el secret ya existe..."
$null = gcloud secrets describe GOOGLE_APPLICATION_CREDENTIALS_JSON --project=total-acumen-473702-j1 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "ADVERTENCIA: El secret GOOGLE_APPLICATION_CREDENTIALS_JSON ya existe"
    Write-Host ""
    $response = Read-Host "Deseas actualizarlo? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "Actualizando secret..."
        $jsonContent | gcloud secrets versions add GOOGLE_APPLICATION_CREDENTIALS_JSON --data-file=-
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Secret actualizado exitosamente"
        } else {
            Write-Host "ERROR: Error al actualizar el secret"
            exit 1
        }
    } else {
        Write-Host "INFO: Secret no actualizado. Usando version existente."
    }
} else {
    Write-Host "Creando nuevo secret..."
    $jsonContent | gcloud secrets create GOOGLE_APPLICATION_CREDENTIALS_JSON `
        --project=total-acumen-473702-j1 `
        --data-file=-
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Secret creado exitosamente"
        
        # Dar permisos a Cloud Run para acceder al secret
        Write-Host ""
        Write-Host "Configurando permisos para Cloud Run..."
        $serviceAccount = "857351913435-compute@developer.gserviceaccount.com"
        gcloud secrets add-iam-policy-binding GOOGLE_APPLICATION_CREDENTIALS_JSON `
            --member="serviceAccount:$serviceAccount" `
            --role="roles/secretmanager.secretAccessor" `
            --project=total-acumen-473702-j1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Permisos configurados correctamente"
        } else {
            Write-Host "ADVERTENCIA: No se pudieron configurar los permisos automaticamente"
            Write-Host "   Puedes hacerlo manualmente desde Google Cloud Console"
        }
    } else {
        Write-Host "ERROR: Error al crear el secret"
        exit 1
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "OK: Proceso completado"
Write-Host "=========================================="
