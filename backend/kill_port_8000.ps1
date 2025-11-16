# Script para matar el proceso que usa el puerto 8000
# Uso: .\kill_port_8000.ps1

Write-Host "Buscando proceso en puerto 8000..."

$portInfo = netstat -ano | findstr :8000 | Select-String "LISTENING"
if ($portInfo) {
    $processId = ($portInfo -split '\s+')[-1]
    Write-Host "Proceso encontrado: PID $processId"
    Write-Host "Matando proceso..."
    taskkill /F /PID $processId
    Write-Host "Proceso terminado"
} else {
    Write-Host "No se encontro ningun proceso usando el puerto 8000"
}









