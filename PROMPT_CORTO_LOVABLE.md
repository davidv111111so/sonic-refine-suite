# 🔧 Fix Backend 404 Error - Prompt Corto para Lovable

## Problema

El frontend busca `/api/master-audio` que no existe. El backend real usa endpoints diferentes.

## Solución

### 1. Agregar Variable de Entorno

```
VITE_BACKEND_URL=https://mastering-backend-857351913435.us-central1.run.app
```

### 2. Los archivos correctos están en el repositorio

Los archivos necesarios YA EXISTEN en el repositorio GitHub:

- `frontend/src/services/masteringService.ts` ✅
- `frontend/src/utils/presetReferences.ts` ✅
- `frontend/src/components/ai-mastering/CustomReferenceMastering.tsx` ✅
- `frontend/src/components/ai-mastering/GenrePresetsMastering.tsx` ✅

### 3. Acción Requerida

**Sincroniza el código del repositorio GitHub con el proyecto en Lovable.**

Específicamente, asegúrate de que estos archivos tengan el código actualizado del repositorio:

1. **`src/services/masteringService.ts`** - Debe usar:
   - `/api/generate-upload-url`
   - `/api/start-mastering-job`
   - `/api/get-job-status/{jobId}`

2. **`src/utils/presetReferences.ts`** - Debe existir y cargar referencias de GCS

3. **`src/components/ai-mastering/CustomReferenceMastering.tsx`** - Debe importar y usar:
   ```typescript
   import { masteringService } from "@/services/masteringService";
   ```

4. **`src/components/ai-mastering/GenrePresetsMastering.tsx`** - Debe importar y usar:
   ```typescript
   import { masteringService } from "@/services/masteringService";
   import { loadPresetReferenceFile } from "@/utils/presetReferences";
   ```

### 4. Verificar

Después del sync y re-deploy:
- ✅ Setup Checker debe mostrar "Backend Python: OK"
- ✅ No más errores 404
- ✅ El mastering debe funcionar

---

**Repositorio:** https://github.com/davidv111111so/sonic-refine-suite

**Si necesitas el código completo de cada archivo, ver:** `PROMPT_COMPLETO_PARA_LOVABLE.md`

