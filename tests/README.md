# 🧪 AI Mastering Testing Suite

Esta carpeta contiene herramientas de testing para validar la integración completa del sistema de AI Mastering con Google Cloud Storage.

## 📁 Archivos

### `ai-mastering-test.ts`
Contiene funciones de testing que pueden ejecutarse desde:
- Browser console
- Componente de debug UI
- Tests automatizados

### Tests Disponibles

#### 1. `testGenerateUploadUrl()`
Prueba la Edge Function `generate-upload-url`.

**Valida:**
- ✅ Autenticación del usuario
- ✅ Generación de signed URLs para upload y download
- ✅ Formato correcto de las URLs
- ✅ Metadata correcta (userId, timestamp, etc.)

**Uso en browser console:**
```javascript
await aiMasteringTests.testGenerateUploadUrl()
```

---

#### 2. `testUploadToGCS()`
Prueba subir un archivo de audio de prueba a Google Cloud Storage.

**Valida:**
- ✅ Generación de upload URL
- ✅ Creación de archivo WAV válido
- ✅ Upload exitoso a GCS
- ✅ Response 200 OK del storage

**Uso en browser console:**
```javascript
await aiMasteringTests.testUploadToGCS()
```

---

#### 3. `testBackendConnection(backendUrl?)`
Prueba la conexión con el backend Python.

**Valida:**
- ✅ Backend accesible
- ✅ Endpoint `/api/master-audio` existe
- ✅ Backend responde (aunque sea con error por datos de prueba)

**Uso en browser console:**
```javascript
// Con backend por defecto
await aiMasteringTests.testBackendConnection()

// Con backend custom
await aiMasteringTests.testBackendConnection('https://mi-backend.run.app')
```

---

#### 4. `testFullMasteringFlow()`
Prueba el flujo completo end-to-end.

**Valida:**
- ✅ Todos los pasos anteriores
- ✅ Llamada al backend con archivo real
- ✅ Recepción de URL de archivo masterizado
- ✅ Verificación de que el archivo masterizado es accesible

**Uso en browser console:**
```javascript
await aiMasteringTests.testFullMasteringFlow()
```

---

#### 5. `runAllTests()`
Ejecuta todos los tests en secuencia.

**Valida:**
- ✅ Todos los tests anteriores
- ✅ Genera un summary de resultados
- ✅ Skippea el test final si alguno anterior falla

**Uso en browser console:**
```javascript
await aiMasteringTests.runAllTests()
```

---

## 🎨 Componente de Debug UI

### `MasteringDebugPanel`

Panel visual para ejecutar tests y ver resultados en tiempo real.

**Ubicación:** `src/components/MasteringDebugPanel.tsx`

### Características:
- ✅ Solo se muestra en development mode
- ✅ Botones para ejecutar cada test individualmente
- ✅ Botón para ejecutar todos los tests
- ✅ Visualización de resultados en tiempo real
- ✅ Logs detallados con expand/collapse
- ✅ Summary de tests passed/failed
- ✅ Clear button para limpiar resultados

### Cómo usar:

**1. Importa el componente temporalmente**

En cualquier archivo de tu app (ej: `src/pages/Index.tsx`):

```typescript
import { MasteringDebugPanel } from '@/components/MasteringDebugPanel';
```

**2. Agrega el componente**

```tsx
function Index() {
  return (
    <div>
      {/* Tu código existente */}
      
      {/* Agregar temporalmente para debugging */}
      <MasteringDebugPanel />
    </div>
  );
}
```

**3. Ejecuta los tests**

El panel aparecerá en la esquina inferior derecha. Click en los botones para ejecutar tests.

**4. Remueve cuando termines**

Una vez que hayas terminado de debuggear, simplemente elimina el componente:

```tsx
// <MasteringDebugPanel /> ← Comentar o eliminar
```

---

## 📊 Interpretando Resultados

### ✅ Test Passed

```
✅ [Generate Upload URL] Generate Upload URL test passed
   Data: {
     uploadUrl: "https://storage.googleapis.com/...",
     downloadUrl: "https://storage.googleapis.com/...",
     fileName: "audio-uploads/user-id/...",
     bucket: "level-audio-mastering"
   }
```

**Significado:** El test se ejecutó correctamente y todas las validaciones pasaron.

---

### ❌ Test Failed

```
❌ [Upload to GCS] Upload to GCS test failed
   Error: Failed to upload to cloud storage
```

**Significado:** El test falló. Revisa el mensaje de error para identificar el problema.

**Acciones comunes:**
1. Verifica que los secrets de Google Cloud estén configurados
2. Revisa los logs de la Edge Function
3. Verifica la configuración CORS del bucket
4. Confirma que la service account tenga permisos

---

## 🔍 Debugging Tips

### Si testGenerateUploadUrl() falla:

1. **Verifica autenticación:**
   ```javascript
   const { data } = await supabase.auth.getSession();
   console.log('Authenticated:', !!data.session);
   ```

2. **Revisa secrets:**
   - Ve a Cloud > Edge Functions > generate-upload-url
   - Revisa los logs para ver si hay errores de credenciales

3. **Verifica que la Edge Function esté desplegada:**
   - Busca `generate-upload-url` en Cloud > Edge Functions

---

### Si testUploadToGCS() falla:

1. **Verifica CORS:**
   ```bash
   gsutil cors get gs://level-audio-mastering
   ```

2. **Verifica permisos de la service account:**
   ```bash
   gsutil iam get gs://level-audio-mastering
   ```

3. **Prueba upload manual:**
   ```bash
   echo "test" > test.txt
   gsutil cp test.txt gs://level-audio-mastering/test.txt
   ```

---

### Si testBackendConnection() falla:

1. **Verifica que el backend esté running:**
   ```bash
   curl https://tu-backend.run.app/health
   ```

2. **Verifica la URL del backend:**
   ```javascript
   console.log('Backend URL:', import.meta.env.VITE_PYTHON_BACKEND_URL);
   ```

3. **Revisa logs del backend:**
   - Google Cloud Run: `gcloud run services logs read ...`
   - Heroku: `heroku logs --tail`

---

### Si testFullMasteringFlow() falla:

Este test ejecuta todos los anteriores + la llamada al backend con archivo real.

1. **Ejecuta los tests individuales primero:**
   - Si alguno falla, arregla ese primero
   - El test completo solo funciona si todos los anteriores pasan

2. **Revisa los logs del backend Python:**
   - Puede haber errores en el procesamiento del audio
   - Verifica que el backend tenga acceso a GCS

3. **Verifica que el archivo se suba correctamente:**
   ```bash
   gsutil ls gs://level-audio-mastering/audio-uploads/
   ```

---

## 🚀 Testing en Producción

**⚠️ IMPORTANTE:** Los tests están diseñados para development.

Para testing en producción:

1. **Usa archivos reales**, no los de prueba generados
2. **Monitorea los logs** de todos los servicios
3. **Configura alertas** para errores críticos
4. **Usa rate limiting** para evitar abusos
5. **Implementa analytics** para tracking de uso

---

## 📝 Checklist de Testing

Antes de considerar el sistema "listo para producción", verifica:

- [ ] ✅ `testGenerateUploadUrl()` pasa
- [ ] ✅ `testUploadToGCS()` pasa
- [ ] ✅ `testBackendConnection()` pasa
- [ ] ✅ `testFullMasteringFlow()` pasa
- [ ] ✅ Test manual con archivo de audio real
- [ ] ✅ Descarga automática funciona en la UI
- [ ] ✅ Progress bar muestra avance correcto
- [ ] ✅ Manejo de errores funciona correctamente
- [ ] ✅ Logs están configurados en todos los servicios
- [ ] ✅ Monitoring y alertas configurados

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa los logs:**
   - Browser console (F12)
   - Edge Function logs (Cloud > Edge Functions)
   - Backend Python logs

2. **Consulta la documentación:**
   - `DEPLOY.md` - Guía completa de deploy
   - `SETUP_GCS.md` - Setup de Google Cloud Storage
   - `PYTHON_BACKEND_SETUP.md` - Setup del backend Python

3. **Usa el Debug Panel:**
   - Agrega `<MasteringDebugPanel />` temporalmente
   - Ejecuta los tests y revisa los resultados
   - Expande los detalles de los errores

---

## 📚 Recursos Adicionales

- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Testing Best Practices](https://docs.lovable.dev/tips-tricks/troubleshooting)
