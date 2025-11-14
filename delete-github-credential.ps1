# Script para eliminar credenciales de GitHub de MarlonRepos

# Intentar eliminar usando cmdkey con diferentes formatos
$target = "LegacyGeneric:target=GitHub - https://api.github.com/MarlonRepos"

# Método 1: Usar cmdkey directamente
try {
    cmdkey /delete:$target 2>&1 | Out-Null
    Write-Host "Credencial eliminada con cmdkey"
} catch {
    Write-Host "No se pudo eliminar con cmdkey, intentando método alternativo..."
}

# Método 2: Usar el Panel de Control de Windows
try {
    # Abrir el Panel de Control de Credenciales
    Start-Process "control.exe" -ArgumentList "/name Microsoft.CredentialManager" -Wait:$false
    Write-Host "Panel de Control abierto. Por favor elimina manualmente la credencial de 'GitHub - https://api.github.com/MarlonRepos'"
    Write-Host "Presiona Enter cuando hayas eliminado la credencial..."
    Read-Host
} catch {
    Write-Host "No se pudo abrir el Panel de Control"
}

# Método 3: Verificar si se eliminó
$remaining = cmdkey /list | Select-String -Pattern "MarlonRepos"
if ($remaining) {
    Write-Host "ADVERTENCIA: La credencial todavía existe. Elimínala manualmente desde el Panel de Control."
    Write-Host "Presiona Win+R y escribe: control /name Microsoft.CredentialManager"
} else {
    Write-Host "SUCCESS: La credencial fue eliminada correctamente."
}

