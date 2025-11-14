# Script para eliminar credencial directamente usando Windows API
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class CredentialManager {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredDelete(string target, int type, int reserved);
    
    public const int CRED_TYPE_GENERIC = 1;
}
"@

$target = "LegacyGeneric:target=GitHub - https://api.github.com/MarlonRepos"

Write-Host "Intentando eliminar credencial: $target" -ForegroundColor Yellow

# Intentar eliminar usando la API de Windows
try {
    $result = [CredentialManager]::CredDelete($target, [CredentialManager]::CRED_TYPE_GENERIC, 0)
    
    if ($result) {
        Write-Host "✅ Credencial eliminada exitosamente usando Windows API" -ForegroundColor Green
    } else {
        $errorCode = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
        Write-Host "⚠️ No se pudo eliminar usando API (Error: $errorCode). Intentando método alternativo..." -ForegroundColor Yellow
        
        # Método alternativo: usar cmdkey con sintaxis correcta
        $targetEscaped = $target -replace ':', '`:' -replace ' ', '` '
        $process = Start-Process -FilePath "cmdkey" -ArgumentList "/delete:`"$target`"" -NoNewWindow -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ Credencial eliminada usando cmdkey" -ForegroundColor Green
        } else {
            Write-Host "❌ No se pudo eliminar automáticamente" -ForegroundColor Red
            Write-Host "Por favor, elimínala manualmente desde el Panel de Control" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Por favor, elimínala manualmente desde el Panel de Control" -ForegroundColor Yellow
}

# Verificar
Start-Sleep -Seconds 1
$remaining = cmdkey /list | Select-String -Pattern "MarlonRepos"
if ($remaining) {
    Write-Host "`n⚠️ La credencial todavía existe. Elimínala manualmente:" -ForegroundColor Yellow
    Write-Host "   Win+R -> control /name Microsoft.CredentialManager" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ Verificación: Credencial eliminada correctamente" -ForegroundColor Green
}

