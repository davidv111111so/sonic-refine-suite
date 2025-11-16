# 📋 Resumen de Configuración - Level Audio

## ✅ Estado Actual

### Backend (FastAPI)

- **Estado**: ✅ Funcionando
- **URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`
- **Documentación**: `http://localhost:8000/docs`

### Frontend (React + Vite)

- **Estado**: ✅ Funcionando
- **URL**: `http://localhost:8080`
- **Configuración**: Conectado automáticamente a `http://localhost:8000` en desarrollo

### Credenciales GCS

- **Estado**: ✅ Configuradas y reiniciadas
- **Archivo**: `c:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json`
- **Project ID**: `total-acumen-473702-j1`
- **Bucket**: `spectrum-mastering-files-857351913435`

## 🚀 Cómo Iniciar la Aplicación

### Paso 1: Iniciar el Backend

```powershell
# Abre una terminal PowerShell
cd backend
.\start_with_credentials.ps1
```

**Espera a ver:**

```
✅ Cliente de GCS inicializado para bucket: spectrum-mastering-files-857351913435
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Paso 2: Iniciar el Frontend

```powershell
# Abre OTRA terminal PowerShell
cd sonic-refine-suite
npm run dev
```

**Espera a ver:**

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

## 🧪 Cómo Probar la Aplicación en el Navegador

### Paso 1: Verificar que Todo Esté Corriendo

1. **Backend**: Deberías ver en la terminal del backend:

   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ✅ Cliente de GCS inicializado...
   ```

2. **Frontend**: Deberías ver en la terminal del frontend:
   ```
   ➜  Local:   http://localhost:8080/
   ```

### Paso 2: Abrir la Aplicación

1. Abre tu navegador (Chrome, Edge, Firefox)
2. Ve a: **http://localhost:8080**
3. Deberías ver la pantalla de inicio de Level Audio

### Paso 3: Iniciar Sesión

**Para Admins (davidv111111@gmail.com o santiagov.t068@gmail.com):**

1. Haz clic en "Sign In" o "Log In"
2. Ingresa tu email y contraseña
3. O haz clic en "Google" para iniciar sesión con Google
4. **Tendrás acceso completo a todas las funciones premium automáticamente**

**Para Otros Usuarios:**

1. Haz clic en "Sign Up" para crear una cuenta
2. Completa el formulario (nombre, email, contraseña)
3. Verifica tu email (si está habilitado)
4. Inicia sesión
5. **Tendrás acceso solo a funciones básicas**

### Paso 4: Probar Funciones Básicas

1. **Subir Audio:**

   - Ve a la pestaña "Upload"
   - Arrastra archivos de audio (MP3, WAV) o haz clic para seleccionar
   - Máximo 20 archivos, 100MB cada uno

2. **Mejorar Audio:**

   - Ve a la pestaña "Enhancement"
   - Ajusta el EQ, compresión, reducción de ruido, etc.
   - Haz clic en "SPECTRUM" para procesar

3. **Descargar Resultados:**
   - Ve a la pestaña "Tracks"
   - Haz clic en el botón de descarga para cada archivo procesado

### Paso 5: Probar AI Mastering (Solo Premium/Admins)

**Solo disponible para admins y usuarios premium:**

1. Inicia sesión como admin (davidv111111@gmail.com o santiagov.t068@gmail.com)
2. Ve a la pestaña "AI Mastering"
3. **Subir Track de Referencia (Solo Admins):**
   - Verás botones "+" pequeños en cada preset de género
   - Haz clic en el "+" para subir un archivo de referencia para ese género
   - Esto estará disponible para todos los usuarios
4. **Masterizar Audio:**
   - Sube tu archivo de audio (target)
   - Selecciona un preset de género o sube tu propia referencia
   - Haz clic en "✨ Master My Track"
   - Espera a que se procese (puede tomar varios minutos)
   - El archivo masterizado se descargará automáticamente

## 🔧 Solución de Problemas

### Error: "Unable to load PEM file"

Si ves este error al iniciar el backend:

1. **Verifica el archivo de credenciales:**

   ```powershell
   # Verifica que el archivo existe
   Test-Path "c:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json"
   ```

2. **Verifica el formato del JSON:**

   - Abre el archivo en un editor de texto
   - Asegúrate de que la clave privada tenga `\n` (no saltos de línea reales)
   - Debería verse así: `"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"`

3. **Reinicia el backend:**
   ```powershell
   # Presiona CTRL+C para detener
   # Luego ejecuta de nuevo:
   .\start_with_credentials.ps1
   ```

### Puerto 8000 en Uso

Si el backend no inicia porque el puerto 8000 está ocupado:

1. **Usa el script automático**: El script `start_with_credentials.ps1` detecta el problema y te ofrece opciones
2. **Mata el proceso manualmente**: Ejecuta `.\kill_port_8000.ps1` en el directorio `backend`
3. **Usa otro puerto**: El script te permite elegir otro puerto (ej: 8001)

### Verificar que el Backend Está Corriendo

```powershell
# Verificar procesos en el puerto 8000
netstat -ano | findstr :8000

# Probar health check
Invoke-WebRequest -Uri http://localhost:8000/health
```

**Desde el navegador:**

- Health check: http://localhost:8000/health
- Documentación API: http://localhost:8000/docs
- Información de la API: http://localhost:8000/

## 📝 Endpoints Disponibles

### Backend

- `GET /` - Información de la API
- `GET /health` - Health check
- `GET /supported-formats` - Formatos soportados
- `POST /process/ai-mastering` - Masterización con upload directo
- `POST /api/master-audio` - Masterización desde GCS (para frontend)

### Frontend

- `http://localhost:8080` - Aplicación principal
- Se conecta automáticamente a `http://localhost:8000` en desarrollo

## ⚠️ Notas Importantes

1. **Credenciales GCS**: El backend necesita las credenciales para subir archivos a GCS. Usa el script `start_with_credentials.ps1` para iniciarlo correctamente.

2. **CORS**: El backend está configurado para permitir requests desde `http://localhost:8080` y otros orígenes de desarrollo.

3. **Procesamiento de Audio**: Todas las funciones de mejora de audio usan Web Audio API y aplican efectos reales. No son simulaciones.

4. **AI Mastering**: Usa la librería `matchering` para procesamiento profesional de audio.

5. **Acceso Premium**: Los admins (davidv111111@gmail.com y santiagov.t068@gmail.com) tienen acceso permanente a todas las funciones premium.

## 🔍 Verificación de Funciones

### Para verificar que los efectos funcionan:

1. **EQ**: Ajusta las bandas y escucha cambios en las frecuencias
2. **Compresión**: Aumenta el ratio y nota que el rango dinámico se reduce
3. **Normalización**: El volumen se ajusta al nivel objetivo
4. **Reducción de Ruido**: Reduce el ruido de fondo audiblemente
5. **Bass/Treble Boost**: Nota cambios en los graves/agudos

Todos estos efectos procesan el audio real y generan un nuevo archivo procesado.

## 📞 Soporte

Si encuentras problemas:

1. Verifica que ambos servidores estén corriendo
2. Revisa la consola del navegador (F12) para errores
3. Revisa los logs del backend en la terminal
4. Verifica que las credenciales de GCS estén correctamente configuradas
5. Si el puerto 8000 está en uso, usa `.\kill_port_8000.ps1` o elige otro puerto
