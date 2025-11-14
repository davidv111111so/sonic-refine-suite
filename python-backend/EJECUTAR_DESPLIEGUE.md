# 🚀 Guía Rápida de Ejecución

## ⚠️ IMPORTANTE: Ubicación Correcta

Los scripts están en: `sonic-refine-suite/python-backend/`

**NO** en: `backend/`

## 📍 Paso 1: Navegar al Directorio Correcto

Abre PowerShell (normal, NO necesitas admin) y ejecuta:

```powershell
cd C:\Users\david\sonic-refine-suite-project\sonic-refine-suite\python-backend
```

O desde la raíz del proyecto:

```powershell
cd sonic-refine-suite\python-backend
```

## 🔐 Paso 2: Verificar que Estás en el Lugar Correcto

```powershell
Get-Location
# Debe mostrar: C:\Users\david\sonic-refine-suite-project\sonic-refine-suite\python-backend

# Verificar que el script existe
Test-Path .\create-gcp-secret.ps1
# Debe mostrar: True
```

## 🔧 Paso 3: Si PowerShell Bloquea la Ejecución

Si ves un error sobre "execution policy", ejecuta:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Luego confirma con `Y` cuando te lo pida.

## ✅ Paso 4: Ejecutar los Scripts

### Crear el Secret:
```powershell
.\create-gcp-secret.ps1
```

### Desplegar en Cloud Run:
```powershell
.\deploy-cloud-run.ps1
```

## 🐛 Si Aún No Funciona

1. **Verifica la ruta completa:**
   ```powershell
   Get-ChildItem -Path "C:\Users\david\sonic-refine-suite-project\sonic-refine-suite\python-backend" -Filter "*.ps1"
   ```

2. **Ejecuta con ruta completa:**
   ```powershell
   & "C:\Users\david\sonic-refine-suite-project\sonic-refine-suite\python-backend\create-gcp-secret.ps1"
   ```




