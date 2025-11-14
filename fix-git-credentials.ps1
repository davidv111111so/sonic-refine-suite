# Script para arreglar credenciales de Git
# Uso: .\fix-git-credentials.ps1

Write-Host "=========================================="
Write-Host "Arreglando Credenciales de Git"
Write-Host "=========================================="
Write-Host ""

# Verificar credenciales actuales
Write-Host "Credenciales actuales de GitHub:"
cmdkey /list | Select-String -Pattern "git|github"
Write-Host ""

# Intentar eliminar credenciales de MarlonRepos
Write-Host "Intentando eliminar credenciales de MarlonRepos..."
$targets = @(
    "LegacyGeneric:target=GitHub - https://api.github.com/MarlonRepos",
    "git:https://github.com",
    "github.com"
)

foreach ($target in $targets) {
    $result = cmdkey /delete:$target 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: Eliminado: $target"
    }
}

Write-Host "  Si aun aparecen, eliminarlas manualmente desde:"
Write-Host "  Panel de Control > Credenciales de Windows > Credenciales genericas"
Write-Host ""

# Configurar Git Credential Manager
Write-Host "Configurando Git Credential Manager..."
git config --global credential.helper manager
Write-Host "  OK: Configurado"
Write-Host ""
Write-Host "=========================================="
Write-Host "Siguiente Paso:"
Write-Host "=========================================="
Write-Host ""
Write-Host "1. Crea un Personal Access Token en GitHub:"
Write-Host "   https://github.com/settings/tokens"
Write-Host ""
Write-Host "2. Ejecuta: git push origin main"
Write-Host ""
Write-Host "3. Cuando pida credenciales:"
Write-Host "   Username: davidv111111so"
Write-Host "   Password: (pega el Personal Access Token)"
Write-Host ""
Write-Host "=========================================="
