# 🔥 PROMPT DEFINITIVO - ARREGLAR BACKEND MASTERING

## ⚠️ PROBLEMA ACTUAL

El código en Lovable está usando:
- ❌ Backend INCORRECTO: `spectrum-backend-857351913435.us-central1.run.app`
- ❌ Endpoint INEXISTENTE: `/api/master-audio`
- ❌ Archivo OBSOLETO: `useAIMastering.ts`

## ✅ SOLUCIÓN

### PASO 1: Agregar/Actualizar Variable de Entorno

```
VITE_BACKEND_URL=https://mastering-backend-857351913435.us-central1.run.app
```

**IMPORTANTE:** Asegúrate de que sea `mastering-backend` NO `spectrum-backend`

---

### PASO 2: Eliminar Archivo Obsoleto

**Acción:** ELIMINAR completamente el archivo `src/hooks/useAIMastering.ts` si existe.

Este archivo está causando el error porque usa la URL y endpoints antiguos.

---

### PASO 3: Verificar que Existen Estos Archivos

Asegúrate de que estos archivos existen y están correctos:

1. **`src/services/masteringService.ts`** - Debe existir con la clase `MasteringService`
2. **`src/utils/presetReferences.ts`** - Debe existir con la función `loadPresetReferenceFile`
3. **`src/components/ai-mastering/CustomReferenceMastering.tsx`** - Debe importar:
   ```typescript
   import { masteringService } from "@/services/masteringService";
   ```
4. **`src/components/ai-mastering/GenrePresetsMastering.tsx`** - Debe importar:
   ```typescript
   import { masteringService } from "@/services/masteringService";
   import { loadPresetReferenceFile } from "@/utils/presetReferences";
   ```

---

### PASO 4: Si los Archivos NO Existen, Sincronizar con GitHub

El código correcto está en el repositorio GitHub:
```
https://github.com/davidv111111so/sonic-refine-suite
```

**Acción:** Sincroniza estos archivos del repositorio:
- `frontend/src/services/masteringService.ts`
- `frontend/src/utils/presetReferences.ts`
- `frontend/src/components/ai-mastering/CustomReferenceMastering.tsx`
- `frontend/src/components/ai-mastering/GenrePresetsMastering.tsx`

---

### PASO 5: Verificar `AIMasteringTab.tsx`

El archivo `src/components/ai-mastering/AIMasteringTab.tsx` NO debe:
- ❌ Importar `useAIMastering`
- ❌ Llamar a ningún endpoint de backend directamente

Solo debe renderizar los componentes:
- `<CustomReferenceMastering />` (línea 117)
- `<GenrePresetsMastering />` (línea 121)

---

## 🔍 CÓDIGO QUE DEBE ESTAR EN masteringService.ts

Si el archivo no existe o está incompleto, este es el contenido completo:

```typescript
import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

interface UploadResult {
  gcsPath: string;
  signedUrl: string;
}

interface JobResult {
  jobId: string;
}

interface JobStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

export class MasteringService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 
                     'https://mastering-backend-857351913435.us-central1.run.app';
  }

  private async getAuthToken(): Promise<string> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication token available. Please log in.');
    }
    
    return session.access_token;
  }

  async uploadFileToGCS(file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
    const authToken = await this.getAuthToken();

    const urlResponse = await fetch(`${this.backendUrl}/api/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'audio/wav',
        fileSize: file.size
      })
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.text();
      throw new Error(`Failed to get upload URL: ${error}`);
    }

    const { signedUrl, gcsFileName } = await urlResponse.json();

    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'audio/wav',
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    if (onProgress) {
      onProgress(100);
    }

    return {
      gcsPath: gcsFileName,
      signedUrl
    };
  }

  async startMasteringJob(
    targetGcsPath: string,
    referenceGcsPath: string,
    settings?: MasteringSettingsData
  ): Promise<JobResult> {
    const authToken = await this.getAuthToken();

    const response = await fetch(`${this.backendUrl}/api/start-mastering-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        targetGcsPath,
        referenceGcsPath,
        settings: settings || {}
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start mastering job: ${error}`);
    }

    const result = await response.json();
    return { jobId: result.jobId };
  }

  async pollJobStatus(
    jobId: string,
    onProgress?: (status: string, progress: number) => void
  ): Promise<string> {
    const authToken = await this.getAuthToken();
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.backendUrl}/api/get-job-status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.statusText}`);
      }

      const status: JobStatus = await response.json();

      if (status.status === 'completed' && status.downloadUrl) {
        if (onProgress) {
          onProgress('completed', 100);
        }
        return status.downloadUrl;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Mastering job failed');
      }

      if (onProgress) {
        const progress = status.status === 'processing' ? 50 : 30;
        onProgress(status.status, progress);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Mastering job timed out');
  }

  private async downloadFile(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download result: ${response.statusText}`);
    }
    return await response.blob();
  }

  async masterAudio(
    targetFile: File,
    referenceFile: File,
    settings?: MasteringSettingsData,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<Blob> {
    try {
      if (onProgress) onProgress('Uploading target file...', 0);
      const targetUpload = await this.uploadFileToGCS(targetFile, (p) => {
        if (onProgress) onProgress('Uploading target file...', p * 0.2);
      });

      if (onProgress) onProgress('Uploading reference file...', 20);
      const referenceUpload = await this.uploadFileToGCS(referenceFile, (p) => {
        if (onProgress) onProgress('Uploading reference file...', 20 + p * 0.2);
      });

      if (onProgress) onProgress('Starting mastering process...', 40);
      const { jobId } = await this.startMasteringJob(
        targetUpload.gcsPath,
        referenceUpload.gcsPath,
        settings
      );

      if (onProgress) onProgress('Processing with Matchering AI...', 45);
      const downloadUrl = await this.pollJobStatus(jobId, (status, progress) => {
        if (onProgress) {
          const statusText = status === 'processing' 
            ? 'Mastering in progress...' 
            : 'Waiting for processing...';
          onProgress(statusText, 40 + progress * 0.4);
        }
      });

      if (onProgress) onProgress('Downloading mastered file...', 80);
      const resultBlob = await this.downloadFile(downloadUrl);
      if (onProgress) onProgress('Complete!', 100);

      return resultBlob;
    } catch (error) {
      console.error('Mastering service error:', error);
      throw error;
    }
  }
}

export const masteringService = new MasteringService();
```

---

## ✅ VERIFICACIÓN POST-DEPLOY

Después del re-deploy, verifica:

1. **Setup Checker:**
   - ✅ Environment Variables: OK
   - ✅ Backend Python: OK (NO debe decir "404")
   - ✅ Google Cloud Storage: OK

2. **Consola del navegador NO debe mostrar:**
   - ❌ `spectrum-backend` (backend viejo)
   - ❌ `/api/master-audio` (endpoint viejo)
   - ❌ CORS error

3. **Consola del navegador DEBE mostrar:**
   - ✅ `🚀 Starting real Matchering mastering...`
   - ✅ `Progress: Uploading target file...`
   - ✅ URLs con `mastering-backend` (backend correcto)

---

## 📝 RESUMEN DE ACCIONES

1. ✅ Agregar variable: `VITE_BACKEND_URL=https://mastering-backend-857351913435.us-central1.run.app`
2. ✅ Eliminar: `src/hooks/useAIMastering.ts` (si existe)
3. ✅ Verificar/Sincronizar archivos del repositorio GitHub
4. ✅ Re-deploy
5. ✅ Probar mastering

---

**Backend correcto:** `https://mastering-backend-857351913435.us-central1.run.app`

**Repositorio:** `https://github.com/davidv111111so/sonic-refine-suite`

