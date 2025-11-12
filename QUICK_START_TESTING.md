# 🚀 Quick Start - Testing AI Mastering

Guía rápida para probar el sistema de AI Mastering en 5 minutos.

---

## Método 1: Panel de Debug Visual (Recomendado) 🎨

### Paso 1: Agregar el componente

Abre `src/pages/Index.tsx` y agrega:

```typescript
import { MasteringDebugPanel } from '@/components/MasteringDebugPanel';

// ... dentro del return
<MasteringDebugPanel />
```

### Paso 2: Ejecutar tests

1. Refresca la app
2. Verás un panel flotante en la esquina inferior derecha
3. Click en **"Run All Tests"**
4. Observa los resultados en tiempo real

### Paso 3: Interpretar resultados

✅ **Verde con checkmark** = Test passed  
❌ **Rojo con X** = Test failed (expandir para ver detalles)

### Paso 4: Limpiar

Cuando termines, simplemente comenta o elimina:
```typescript
// <MasteringDebugPanel />
```

---

## Método 2: Browser Console 💻

### Paso 1: Abrir console

Presiona **F12** o **Cmd+Option+I** (Mac)

### Paso 2: Ejecutar tests

Los tests están disponibles globalmente:

```javascript
// Test individual
await aiMasteringTests.testGenerateUploadUrl()
await aiMasteringTests.testUploadToGCS()
await aiMasteringTests.testBackendConnection()
await aiMasteringTests.testFullMasteringFlow()

// Todos los tests
await aiMasteringTests.runAllTests()
```

### Paso 3: Ver resultados

Los logs aparecerán en la console con emojis:

```
🧪 Test: Generate Upload URL
🔐 Checking authentication...
✅ User authenticated
📡 Calling generate-upload-url Edge Function...
✅ Upload URL generated successfully
```

---

## Método 3: Test Manual en la UI 🎵

### Paso 1: Login

Asegúrate de estar logged in en la app.

### Paso 2: Ve a AI Mastering

Click en la pestaña **"AI Mastering"**

### Paso 3: Sube un archivo

1. Sube un archivo de audio (MP3, WAV, FLAC)
2. Click en **"Master My Track"**

### Paso 4: Observa el proceso

- ⏳ Progress bar debería ir de 0% a 100%
- 📥 Archivo masterizado se descargará automáticamente
- 🎉 Toast "Success!" al completar

---

## ⚠️ Troubleshooting Rápido

### ❌ "User not authenticated"
**Solución:** Login en la app primero

### ❌ "Missing Google Cloud credentials"
**Solución:** Verifica que los secrets estén configurados en Lovable Cloud

### ❌ "Failed to upload to cloud storage"
**Solución:** Verifica configuración CORS del bucket
```bash
gsutil cors get gs://level-audio-mastering
```

### ❌ "Backend error"
**Solución:** Verifica que el backend Python esté running
```bash
curl https://spectrum-backend-857351913435.us-central1.run.app/health
```

---

## 📊 ¿Qué hacer si un test falla?

### 1. Identifica qué test falló
- **Generate Upload URL** → Problema con Edge Function o secrets
- **Upload to GCS** → Problema con CORS o permisos
- **Backend Connection** → Backend no responde o URL incorrecta
- **Full Flow** → Cualquiera de los anteriores

### 2. Revisa los logs
```javascript
// En browser console
const { data: sessionData } = await supabase.auth.getSession();
console.log('User:', sessionData.session?.user);
```

### 3. Consulta la documentación
- `DEPLOY.md` - Guía completa de deploy
- `tests/README.md` - Documentación de testing detallada
- `SETUP_GCS.md` - Configuración de Google Cloud Storage

---

## ✅ Checklist Rápido

Antes de usar en producción, verifica:

- [ ] ✅ Todos los tests pasan
- [ ] ✅ Archivo real se masteriza correctamente
- [ ] ✅ Descarga automática funciona
- [ ] ✅ Logs no muestran errores
- [ ] ✅ Progress bar funciona

---

## 🆘 ¿Necesitas más ayuda?

1. **Logs detallados:** Ve a Cloud > Edge Functions > generate-upload-url
2. **Documentación completa:** Lee `DEPLOY.md`
3. **Testing avanzado:** Consulta `tests/README.md`

---

**💡 Tip:** Siempre ejecuta los tests después de hacer cambios en la configuración de GCS o secrets.
