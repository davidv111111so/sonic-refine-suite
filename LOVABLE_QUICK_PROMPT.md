# 🚀 Prompt Rápido para Lovable Cloud

## Configuración de AI Mastering - Edge Function y Secrets

Por favor, ejecuta estos pasos:

### 1. Verificar y Desplegar Edge Function `generate-upload-url`

- Ve a **Edge Functions** en Lovable Cloud
- Verifica si `generate-upload-url` está desplegada
- Si no está desplegada, despliégala desde: `sonic-refine-suite/supabase/functions/generate-upload-url/index.ts`
- Confirma que esté activa y sin errores

### 2. Configurar Secrets de Google Cloud

Agrega estos 3 secrets en **Secrets** de Lovable Cloud:

1. **`GOOGLE_CLOUD_PROJECT_ID`**
   - Valor: `total-acumen-473702-j1`

2. **`GOOGLE_CLOUD_BUCKET_NAME`**
   - Valor: `spectrum-mastering-files-857351913435`

3. **`GOOGLE_APPLICATION_CREDENTIALS_JSON`**
   - Valor: [JSON completo de las credenciales de service account]
   - Formato: JSON válido con `type`, `project_id`, `private_key`, `client_email`, etc.
   - Importante: Los saltos de línea en `private_key` deben ser `\n` (no saltos reales)

### 3. Verificar

- Confirma que los 3 secrets estén presentes
- Prueba la Edge Function con un request de prueba
- Revisa los logs para asegurar que no hay errores

**Nota:** Si necesitas el JSON completo de credenciales, puedo proporcionarlo. Los secrets deben estar disponibles para las Edge Functions.





