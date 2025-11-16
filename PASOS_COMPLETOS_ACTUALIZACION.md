# 📋 Pasos Completos para Actualizar Credenciales

## ✅ Resumen

Has creado una nueva clave JSON en Google Cloud. Ahora necesitas:

1. **Actualizar el secret en Lovable Cloud** con el JSON completo
2. **Actualizar el archivo local** de credenciales (ya hecho)
3. **Verificar que todo funcione**

---

## 🔐 PASO 1: Actualizar Secret en Lovable Cloud

### Opción A: Usar el archivo `ACTUALIZAR_SECRET_LOVABLE.txt`

1. Abre el archivo: `ACTUALIZAR_SECRET_LOVABLE.txt`
2. Copia TODO el contenido
3. Pégalo en el chat de Lovable Cloud
4. Sigue las instrucciones paso a paso

### Opción B: Actualizar manualmente

1. Ve a **Lovable Cloud → Secrets**
2. Busca el secret **`GOOGLE_APPLICATION_CREDENTIALS_JSON`**
3. Haz clic en **"Edit"** o **"Update"**
4. Abre el archivo: `CREDENTIALS_JSON_COMPLETE.json` en este proyecto
5. Copia TODO el contenido del archivo (Ctrl+A, Ctrl+C)
6. Pégalo como valor del secret
7. **IMPORTANTE**: Asegúrate de que el JSON esté completo (la clave privada debe tener ~1620 caracteres)
8. Guarda los cambios

---

## 📁 PASO 2: Verificar Archivo Local (Ya Actualizado)

El archivo local ya ha sido actualizado:
- ✅ `c:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json`

El script `backend/start_with_credentials.ps1` usará automáticamente este archivo actualizado.

---

## ✅ PASO 3: Verificar en Lovable

Después de actualizar el secret en Lovable:

1. **Prueba la Edge Function:**
   - Ve a Lovable Cloud → Edge Functions → generate-upload-url
   - Haz una prueba con:
     ```json
     {
       "fileName": "test.wav",
       "fileType": "audio/wav",
       "fileSize": 1024
     }
     ```

2. **Revisa los logs:**
   - Debe mostrar: `✅ Credentials parsed successfully`
   - Debe mostrar: `✅ Signed URLs generated successfully`
   - **NO** debe mostrar: `Failed to decode base64` o `clave privada truncada`

3. **Verifica la respuesta:**
   - Debe retornar `uploadUrl` y `downloadUrl` válidos
   - Ambos deben apuntar a `storage.googleapis.com`

---

## 🧪 PASO 4: Probar en Local

Para verificar que el archivo local funciona:

1. **Inicia el backend:**
   ```powershell
   cd backend
   .\start_with_credentials.ps1
   ```

2. **Verifica que no haya errores:**
   - Debe mostrar: `✅ Cliente de GCS inicializado para bucket: spectrum-mastering-files-857351913435`
   - **NO** debe mostrar: `Unable to load PEM file` o errores de credenciales

3. **Prueba el health check:**
   - Abre: http://localhost:8000/health
   - Debe mostrar: `"gcs": "configured"`

---

## 📝 Archivos Creados/Actualizados

1. ✅ **`CREDENTIALS_JSON_COMPLETE.json`** - JSON completo para copiar
2. ✅ **`ACTUALIZAR_SECRET_LOVABLE.txt`** - Instrucciones específicas para Lovable
3. ✅ **`PROMPT_FINAL_LOVABLE.txt`** - Prompt completo actualizado con JSON
4. ✅ **`c:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json`** - Archivo local actualizado

---

## ⚠️ Verificación de Clave Privada

La clave privada debe tener:
- **~1620 caracteres** (sin contar los headers `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
- **Formato correcto**: Los saltos de línea deben ser `\n` (no saltos reales)

Para verificar:
```powershell
$json = Get-Content "CREDENTIALS_JSON_COMPLETE.json" -Raw
$obj = $json | ConvertFrom-Json
$privateKey = $obj.private_key -replace '-----BEGIN PRIVATE KEY-----', '' -replace '-----END PRIVATE KEY-----', '' -replace '\n', '' -replace ' ', ''
Write-Host "Longitud: $($privateKey.Length) caracteres"
```

Debe mostrar: `Longitud: 1620 caracteres`

---

## 🆘 Si Hay Problemas

### Error: "Failed to decode base64"
- **Causa**: La clave privada está truncada o mal formateada
- **Solución**: Asegúrate de copiar TODO el JSON completo, sin omitir ninguna parte

### Error: "Unable to load PEM file"
- **Causa**: Los saltos de línea no están correctos
- **Solución**: El JSON debe tener `\n` en la clave privada (no saltos reales)

### Error: "Invalid credentials"
- **Causa**: El JSON no es válido o falta algún campo
- **Solución**: Valida el JSON en jsonlint.com antes de pegarlo

---

## ✅ Checklist Final

- [ ] Secret actualizado en Lovable Cloud con JSON completo
- [ ] Archivo local actualizado
- [ ] Edge Function probada y funcionando
- [ ] Logs muestran éxito (no errores de credenciales)
- [ ] Backend local funciona correctamente
- [ ] Health check muestra GCS configurado

---

**Una vez completados todos los pasos, el sistema de AI Mastering debería funcionar correctamente tanto en Lovable Cloud como en local.**





