# 🚀 ACTUALIZACIÓN COMPLETA DEL FRONTEND - MATCHERING REAL

## 📋 RESUMEN

El backend está desplegado en Google Cloud Run con **Matchering real** (versión 2.0.6). El frontend necesita actualizarse para usar el nuevo flujo job-based con estos endpoints:

**Backend URL:** `https://mastering-backend-857351913435.us-central1.run.app`

**Endpoints disponibles:**
- ✅ `POST /api/generate-upload-url` - Genera URL firmada para subir archivos
- ✅ `POST /api/start-mastering-job` - Inicia job de mastering
- ✅ `GET /api/get-job-status/{jobId}` - Obtiene estado del job
- ❌ `/api/master-audio` - **NO EXISTE** (endpoint antiguo)

---

## 🔧 CAMBIOS REQUERIDOS

### 1. Variable de Entorno

Agrega esta variable de entorno:

```
VITE_BACKEND_URL=https://mastering-backend-857351913435.us-central1.run.app
```

---

### 2. Archivo: `src/services/masteringService.ts`

**Acción:** REEMPLAZAR COMPLETAMENTE el archivo con este contenido:

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
    // Use environment variable or fallback to Cloud Run URL
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 
                     'https://mastering-backend-857351913435.us-central1.run.app';
  }

  /**
   * Get auth token from Supabase session
   */
  private async getAuthToken(): Promise<string> {
    // Get token from Supabase client
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

  /**
   * Step 1: Upload file to Google Cloud Storage
   */
  async uploadFileToGCS(
    file: File, 
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    const authToken = await this.getAuthToken();

    // 1. Get signed upload URL from backend
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

    // 2. Upload file directly to GCS using signed URL
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

  /**
   * Step 2: Start mastering job
   */
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

  /**
   * Step 3: Poll job status until complete
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (status: string, progress: number) => void
  ): Promise<string> {
    const authToken = await this.getAuthToken();
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
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

      // Update progress based on status
      if (onProgress) {
        const progress = status.status === 'processing' ? 50 : 30;
        onProgress(status.status, progress);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Mastering job timed out');
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download result: ${response.statusText}`);
    }
    return await response.blob();
  }

  /**
   * Complete mastering flow: Upload -> Process -> Download
   */
  async masterAudio(
    targetFile: File,
    referenceFile: File,
    settings?: MasteringSettingsData,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<Blob> {
    try {
      // Stage 1: Upload target file (0-20%)
      if (onProgress) onProgress('Uploading target file...', 0);
      const targetUpload = await this.uploadFileToGCS(targetFile, (p) => {
        if (onProgress) onProgress('Uploading target file...', p * 0.2);
      });

      // Stage 2: Upload reference file (20-40%)
      if (onProgress) onProgress('Uploading reference file...', 20);
      const referenceUpload = await this.uploadFileToGCS(referenceFile, (p) => {
        if (onProgress) onProgress('Uploading reference file...', 20 + p * 0.2);
      });

      // Stage 3: Start mastering job (40%)
      if (onProgress) onProgress('Starting mastering process...', 40);
      const { jobId } = await this.startMasteringJob(
        targetUpload.gcsPath,
        referenceUpload.gcsPath,
        settings
      );

      // Stage 4: Poll job status (40-80%)
      if (onProgress) onProgress('Processing with Matchering AI...', 45);
      const downloadUrl = await this.pollJobStatus(jobId, (status, progress) => {
        if (onProgress) {
          const statusText = status === 'processing' 
            ? 'Mastering in progress...' 
            : 'Waiting for processing...';
          onProgress(statusText, 40 + progress * 0.4);
        }
      });

      // Stage 5: Download result (80-100%)
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

// Export singleton instance
export const masteringService = new MasteringService();
```

---

### 3. Archivo: `src/utils/presetReferences.ts`

**Acción:** CREAR este archivo nuevo (si no existe):

```typescript
/**
 * Genre Preset Reference File Loader
 * 
 * This module handles loading reference audio files for genre-based presets
 * from Google Cloud Storage.
 */

const BUCKET_NAME = 'level-audio-mastering';
const REFERENCES_PATH = 'references';

// Mapping of preset IDs to their reference file names
const PRESET_REFERENCES: Record<string, string> = {
  'flat': 'flat-reference.wav',
  'bass-boost': 'bass-boost-reference.wav',
  'treble-boost': 'treble-boost-reference.wav',
  'jazz': 'jazz-reference.wav',
  'classical': 'classical-reference.wav',
  'electronic': 'electronic-reference.wav',
  'v-shape': 'v-shape-reference.wav',
  'vocal': 'vocal-reference.wav',
  'rock': 'rock-reference.wav',
  'hip-hop': 'hip-hop-reference.wav',
  'podcast': 'podcast-reference.wav',
  'live': 'live-reference.wav',
};

// Cache for downloaded reference files
const referenceCache = new Map<string, File>();

/**
 * Load a preset reference file from Google Cloud Storage
 * @param presetId The preset identifier (e.g., 'rock', 'jazz')
 * @returns Promise<File> The reference audio file
 */
export async function loadPresetReferenceFile(presetId: string): Promise<File> {
  // Check cache first
  if (referenceCache.has(presetId)) {
    console.log(`✅ Using cached reference for preset: ${presetId}`);
    return referenceCache.get(presetId)!;
  }

  // Get reference file name
  const fileName = PRESET_REFERENCES[presetId];
  if (!fileName) {
    throw new Error(`Unknown preset: ${presetId}. Please select a valid genre preset.`);
  }

  try {
    // Construct GCS public URL
    const gcsUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${REFERENCES_PATH}/${fileName}`;
    
    console.log(`📥 Downloading reference for preset: ${presetId}`);
    console.log(`   URL: ${gcsUrl}`);

    // Download reference file
    const response = await fetch(gcsUrl);
    
    if (!response.ok) {
      // If public access fails, provide helpful error
      if (response.status === 404) {
        throw new Error(
          `Reference file not found: ${fileName}\n\n` +
          `The genre preset reference files need to be uploaded to Google Cloud Storage.\n` +
          `Please see PRESET_REFERENCE_UPLOAD_GUIDE.md for instructions.`
        );
      } else if (response.status === 403) {
        throw new Error(
          `Access denied to reference file: ${fileName}\n\n` +
          `The reference files may need to be made public or use signed URLs.\n` +
          `Please see PRESET_REFERENCE_UPLOAD_GUIDE.md for instructions.`
        );
      }
      throw new Error(`Failed to download reference: ${response.statusText}`);
    }

    // Convert to blob then File
    const blob = await response.blob();
    const file = new File([blob], fileName, { 
      type: 'audio/wav',
      lastModified: Date.now()
    });

    // Cache for future use
    referenceCache.set(presetId, file);
    console.log(`✅ Reference loaded and cached: ${presetId}`);

    return file;
  } catch (error) {
    console.error(`❌ Error loading preset reference:`, error);
    throw error;
  }
}

/**
 * Preload all reference files for faster access
 * (Optional - call this on app initialization)
 */
export async function preloadAllReferences(): Promise<void> {
  const presetIds = Object.keys(PRESET_REFERENCES);
  console.log(`🔄 Preloading ${presetIds.length} reference files...`);

  const promises = presetIds.map(async (presetId) => {
    try {
      await loadPresetReferenceFile(presetId);
    } catch (error) {
      console.warn(`⚠️ Could not preload reference: ${presetId}`, error);
    }
  });

  await Promise.allSettled(promises);
  console.log(`✅ Reference preloading complete`);
}

/**
 * Clear the reference cache
 */
export function clearReferenceCache(): void {
  referenceCache.clear();
  console.log('🗑️ Reference cache cleared');
}

/**
 * Get list of available presets
 */
export function getAvailablePresets(): string[] {
  return Object.keys(PRESET_REFERENCES);
}

/**
 * Check if a preset exists
 */
export function isValidPreset(presetId: string): boolean {
  return presetId in PRESET_REFERENCES;
}
```

---

### 4. Actualizar: `src/components/ai-mastering/CustomReferenceMastering.tsx`

**Acción:** Asegúrate de que el componente use `masteringService`. La parte clave es:

```typescript
import { masteringService } from "@/services/masteringService";

// En el handleMaster:
const handleMaster = async () => {
  // ... validaciones ...
  
  try {
    // Use the new mastering service with job-based flow
    const resultBlob = await masteringService.masterAudio(
      targetFile,
      referenceFile,
      settings,
      (stage, percent) => {
        setProgressMessage(stage);
        setProgressPercent(percent);
        console.log(`Progress: ${stage} - ${percent.toFixed(0)}%`);
      }
    );

    // Create download URL
    const url = URL.createObjectURL(resultBlob);
    setMasteredUrl(url);
    
    // ... toast de éxito ...
  } catch (error: any) {
    // ... manejo de errores ...
  }
};
```

---

### 5. Actualizar: `src/components/ai-mastering/GenrePresetsMastering.tsx`

**Acción:** Asegúrate de que use `masteringService` y `loadPresetReferenceFile`:

```typescript
import { masteringService } from "@/services/masteringService";
import { loadPresetReferenceFile } from "@/utils/presetReferences";

// En el handleMaster:
const handleMaster = async () => {
  // ... validaciones ...
  
  try {
    // Load the preset reference file
    setProgressMessage(`Loading ${selectedPreset} reference...`);
    const referenceFile = await loadPresetReferenceFile(selectedPreset);
    
    setProgressMessage("Starting mastering...");
    setProgressPercent(10);
    
    // Use the mastering service with job-based flow
    const resultBlob = await masteringService.masterAudio(
      targetFile,
      referenceFile,
      settings,
      (stage, percent) => {
        setProgressMessage(stage);
        setProgressPercent(10 + percent * 0.9); // Reserve first 10% for reference loading
      }
    );

    // Create download URL
    const url = URL.createObjectURL(resultBlob);
    setMasteredUrl(url);
    
    // ... toast de éxito ...
  } catch (error: any) {
    // ... manejo de errores ...
  }
};
```

---

## ✅ VERIFICACIÓN

Después de implementar estos cambios:

1. **Setup Checker debe mostrar:**
   - ✅ Environment Variables: OK
   - ✅ Backend Python: OK (endpoint `/api/start-mastering-job` existe)
   - ✅ Google Cloud Storage: OK

2. **Consola debe mostrar:**
   - `🚀 Starting real Matchering mastering...`
   - `Progress: Uploading target file... - X%`
   - `Progress: Processing with Matchering AI... - X%`
   - `✅ Mastering complete!`

3. **NO debe mostrar:**
   - ❌ 404 error
   - ❌ `/api/master-audio endpoint does not exist`
   - ❌ `Matchering backend unavailable`

---

## 📝 NOTAS IMPORTANTES

1. **Backend URL:** El backend está en producción 24/7, no necesitas iniciar nada localmente.

2. **Procesamiento:** El mastering puede tomar varios minutos (hasta 15 minutos). El progreso se muestra en tiempo real.

3. **Autenticación:** Los endpoints requieren que el usuario esté autenticado con Supabase.

4. **Referencias de Presets:** Los archivos de referencia para presets (rock, jazz, etc.) deben subirse a GCS. Si no existen, Genre Presets mostrará un error claro.

5. **Matchering Real:** El backend usa Matchering 2.0.6 (librería profesional de mastering), no es simulación.

---

## 🚀 DESPUÉS DE IMPLEMENTAR

1. Guarda todos los cambios
2. Haz re-deploy de la aplicación
3. Prueba el flujo completo:
   - Custom Reference Mastering
   - Genre Presets Mastering
4. Verifica que el Setup Checker muestre todo en OK

---

**¿Preguntas? Revisa la documentación en:**
- `BACKEND_URL_PARA_LOVABLE.md`
- `REAL_MATCHERING_IMPLEMENTATION_SUMMARY.md`
- `DEPLOYMENT_COMPLETO_FINAL.md`

