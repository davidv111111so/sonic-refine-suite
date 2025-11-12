# 🔧 CORS Fix & Optimization Guide

## 1. CORS Configuration

### ✅ Edge Function (Already Configured)
La Edge Function `generate-upload-url` ya tiene CORS correcto:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders })
}
```

### 🔧 Backend Python - Flask Example
```python
from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)

# Configurar CORS
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
CORS(app, 
     resources={r"/api/*": {"origins": allowed_origins}},
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

@app.route('/api/master-audio', methods=['POST', 'OPTIONS'])
def master_audio():
    if request.method == 'OPTIONS':
        return '', 204
    # ... resto del código
```

### 🔧 Backend Python - FastAPI Example
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 2. Optimizaciones Priority List

### 🚀 Quick Wins (Implementar primero)

**1. Validación de tamaño:**
```typescript
// En useAIMastering.ts
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large. Maximum size is 100MB');
}
```

**2. Cleanup de recursos:**
```typescript
// Revocar blob URLs después de descargar
URL.revokeObjectURL(url);
```

**3. Retry logic simple:**
```typescript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### 📊 Medium Priority

**4. Progress tracking mejorado:**
```typescript
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    setProgress(Math.round(percentComplete));
  }
});
```

**5. Cancelación de requests:**
```typescript
const controller = new AbortController();
fetch(url, { signal: controller.signal });
// Para cancelar: controller.abort();
```

### 🎯 Advanced Features

**6. Chunked upload (>50MB):**
- Usar multipart upload de GCS
- Dividir archivo en chunks de 5-10MB
- Upload paralelo de chunks

**7. Queue system:**
- Implementar cola con estado persistente
- Procesar archivos uno a uno
- Mostrar lista de archivos en cola

---

## 3. Implementación Sugerida

### Fase 1: CORS & Validación Básica
1. ✅ Verificar CORS en Edge Function (ya está)
2. ⏳ Configurar CORS en Backend Python
3. ⏳ Agregar validación de tamaño en frontend

### Fase 2: Error Handling
1. ⏳ Implementar retry logic
2. ⏳ Mejorar mensajes de error
3. ⏳ Cleanup de recursos

### Fase 3: UX Improvements
1. ⏳ Progress tracking mejorado
2. ⏳ Permitir cancelación
3. ⏳ Guardar settings en localStorage

### Fase 4: Advanced
1. ⏳ Chunked upload para archivos grandes
2. ⏳ Queue system
3. ⏳ Estimación de tiempo

---

**Siguiente paso recomendado:** Configura CORS en el backend Python siguiendo los ejemplos arriba.
